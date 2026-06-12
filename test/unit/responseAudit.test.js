import test from 'node:test';
import assert from 'node:assert/strict';
import { auditResponseSummary } from '../../src/services/responseAudit.js';
import { adviseColourContrast, checkCssRule } from '../../src/services/ruleEngine.js';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';
import { accessibility_get_component_requirements } from '../../src/tools/advisorTools.js';
import { handleJsonRpcBody } from '../../src/mcp/handler.js';

// ── Fix 1: blocking_findings populated for issue-less failures ────────────────

test('contrast failure populates blocking_findings with the criterion and reason', () => {
  const r = adviseColourContrast({ foreground: '#777777', background: '#ffffff' });
  assert.equal(r.decision, 'fail');
  assert.equal(r.governance.release_gate.gate_status, 'block');
  assert.ok(r.governance.release_gate.blocking_findings.length >= 1, 'block gate must carry blocking findings');
  const finding = r.governance.release_gate.blocking_findings[0];
  assert.equal(finding.criterion, '1.4.3');
  assert.match(finding.reason, /below the required/);
});

// ── Fix 2: corrected_css covers every finding with a safe automated fix ──────

test('corrected_css includes reduced-motion and target-size fixes when flagged', () => {
  const r = checkCssRule({ css: '.menu { transition: transform 0.3s; } button { width: 18px; height: 18px; }' });
  assert.match(r.corrected_css, /prefers-reduced-motion/);
  assert.match(r.corrected_css, /min-width: 24px/);
  assert.match(r.corrected_css, /min-height: 24px/);
});

test('corrected_css only includes blocks for issues that were actually found', () => {
  const r = checkCssRule({ css: 'button { width: 18px; }' });
  assert.match(r.corrected_css, /min-width: 24px/);
  assert.ok(!r.corrected_css.includes('line-height'), 'no text-layout fix when no text-layout issue');
  assert.ok(!r.corrected_css.includes('prefers-reduced-motion'), 'no motion fix when no motion issue');
});

test('corrected_css still covers the text-layout and focus fixes', () => {
  const r = checkCssRule({ css: 'p { text-align: justify; } a:focus { outline: none; }' });
  assert.match(r.corrected_css, /line-height: 1\.5/);
  assert.match(r.corrected_css, /:focus-visible/);
});

// ── Fix 3: pass results carry the extra claim prohibitions ────────────────────

test('pass claim boundary explicitly prohibits compliance and rendered-behaviour claims', () => {
  const r = validateAriaAttributes({ html: '<button aria-expanded="false" aria-controls="p" onclick="t()">Open</button><div id="p"></div>' });
  assert.equal(r.decision, 'pass');
  const cannot = r.governance.claim_boundary.cannot_claim;
  assert.ok(cannot.includes('Do not say the component is WCAG compliant.'));
  assert.ok(cannot.includes('Do not say the page passes accessibility.'));
  assert.ok(cannot.includes('Do not say rendered behaviour has been tested.'));
});

test('non-pass results do not get the pass-specific prohibitions', () => {
  const r = validateAriaAttributes({ html: '<button aria-expandd="true">x</button>' });
  assert.equal(r.decision, 'fail');
  assert.ok(!r.governance.claim_boundary.cannot_claim.includes('Do not say the page passes accessibility.'));
});

// ── Fix 4: trace tool names are accurate ──────────────────────────────────────

test('accessibility_get_component_requirements reports its own name in trace', async () => {
  const r = await accessibility_get_component_requirements.handler({ component: 'tabs' });
  assert.equal(r.trace.tool, 'accessibility_get_component_requirements');
});

test('accessibility_advise_component still reports its own name in trace', async () => {
  const res = await handleJsonRpcBody({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'accessibility_advise_component', arguments: { component: 'tabs' } } });
  assert.equal(res.result.structuredContent.trace.tool, 'accessibility_advise_component');
});

// ── Fix 5: response-audit tool ────────────────────────────────────────────────

test('consistent summary passes the audit', () => {
  const r = auditResponseSummary({
    summary: 'The static check found one warning related to 4.1.2. Manual browser testing is recommended before release.',
    governance: { finding_classification: 'warning', scope: 'static_snippet' }
  });
  assert.equal(r.decision, 'pass');
  assert.deepEqual(r.violations, []);
  assert.equal(r.governance.scope, 'response_audit');
});

test('upgrading a warning to a failure is detected', () => {
  const r = auditResponseSummary({
    summary: 'This component fails WCAG and is inaccessible.',
    governance: { finding_classification: 'warning', scope: 'static_snippet' }
  });
  assert.equal(r.decision, 'fail');
  assert.ok(r.violations.some(v => v.type === 'upgraded_claim'));
  assert.equal(r.governance.release_gate.gate_status, 'block');
});

test('broadening a snippet pass to page-level compliance is detected', () => {
  const r = auditResponseSummary({
    summary: 'The contrast pair passes, so the page is accessible and the site is WCAG compliant.',
    governance: { finding_classification: 'pass', scope: 'contrast_calculation' }
  });
  assert.equal(r.decision, 'fail');
  assert.ok(r.violations.some(v => v.type === 'broadened_claim'));
});

test('downgrading a failure to clean is detected', () => {
  const r = auditResponseSummary({
    summary: 'No issues found — everything looks fine.',
    governance: { finding_classification: 'failure', scope: 'static_snippet' }
  });
  assert.equal(r.decision, 'fail');
  assert.ok(r.violations.some(v => v.type === 'downgraded_claim'));
});

test('omitting the classification is a warning-level finding', () => {
  const r = auditResponseSummary({
    summary: 'There were some problems with the ARIA markup that need attention.',
    governance: { finding_classification: 'failure', scope: 'static_snippet' }
  });
  assert.ok(r.violations.some(v => v.type === 'classification_omitted'));
});

test('negated phrases are not flagged as drift', () => {
  const r = auditResponseSummary({
    summary: 'This is a warning, not a WCAG failure. The snippet check found one warning.',
    governance: { finding_classification: 'warning', scope: 'static_snippet' }
  });
  assert.equal(r.decision, 'pass');
});

test('audit tool result itself carries a governance block', () => {
  const r = auditResponseSummary({
    summary: 'The check found a warning.',
    governance: { finding_classification: 'warning', scope: 'static_snippet' }
  });
  assert.ok(r.governance);
  assert.equal(r.governance.scope, 'response_audit');
  assert.ok(r.governance.claim_boundary.cannot_claim.some(s => s.includes('clean audit')));
});

test('audit tool is callable through the MCP handler', async () => {
  const res = await handleJsonRpcBody({
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: {
      name: 'accessibility_audit_summary',
      arguments: { summary: 'The page is fully accessible.', governance: { finding_classification: 'pass', scope: 'contrast_calculation' } }
    }
  });
  assert.equal(res.result.structuredContent.decision, 'fail');
  assert.ok(res.result.structuredContent.violations.length >= 1);
});

test('end-to-end: governance block from a real finding feeds the audit', () => {
  const finding = validateAriaAttributes({ html: '<button aria-expandd="true">x</button>' });
  const drifted = auditResponseSummary({ summary: 'All checks passed; the component is fine.', governance: finding.governance });
  assert.equal(drifted.decision, 'fail');
  const faithful = auditResponseSummary({ summary: finding.governance.claim_boundary.can_claim, governance: finding.governance });
  assert.equal(faithful.decision, 'pass', 'the can_claim sentence itself must always pass the audit');
});
