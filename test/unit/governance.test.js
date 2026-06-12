import test from 'node:test';
import assert from 'node:assert/strict';
import { adviseComponent, adviseFocusVisible, adviseTextLayout } from '../../src/services/adviceEngine.js';
import { adviseColourContrast, checkCssRule } from '../../src/services/ruleEngine.js';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';
import { handleJsonRpcBody } from '../../src/mcp/handler.js';

function assertGovernanceShape(gov, label = '') {
  const prefix = label ? `${label}: ` : '';
  assert.ok(gov, `${prefix}governance block must be present`);
  assert.ok(typeof gov.finding_classification === 'string', `${prefix}finding_classification must be a string`);
  assert.ok(typeof gov.scope === 'string', `${prefix}scope must be a string`);
  assert.ok(typeof gov.confidence === 'string', `${prefix}confidence must be a string`);
  assert.ok(typeof gov.claim_boundary?.can_claim === 'string' && gov.claim_boundary.can_claim.length > 0, `${prefix}can_claim must be a non-empty string`);
  assert.ok(Array.isArray(gov.claim_boundary?.cannot_claim) && gov.claim_boundary.cannot_claim.length > 0, `${prefix}cannot_claim must be a non-empty array`);
  assert.ok(typeof gov.release_gate?.gate_status === 'string', `${prefix}release_gate.gate_status must be a string`);
  assert.ok(typeof gov.release_gate?.blocks_release === 'boolean', `${prefix}release_gate.blocks_release must be a boolean`);
  assert.ok(Array.isArray(gov.next_evidence_required), `${prefix}next_evidence_required must be an array`);
  assert.ok(Array.isArray(gov.assistant_handling_instruction?.must), `${prefix}assistant_handling_instruction.must must be an array`);
  assert.ok(Array.isArray(gov.assistant_handling_instruction?.must_not), `${prefix}assistant_handling_instruction.must_not must be an array`);
}

// ── Governance shape is present on every tool type ────────────────────────────

test('ARIA validator result carries governance', () => {
  const r = validateAriaAttributes({ html: '<button aria-expanded="false" onclick="t()">Open</button><div id="x"></div>' });
  assertGovernanceShape(r.governance, 'ariaValidator');
  assert.equal(r.governance.scope, 'static_snippet');
});

test('CSS rule check result carries governance', () => {
  const r = checkCssRule({ css: 'p { line-height: 1.2; }' });
  assertGovernanceShape(r.governance, 'checkCssRule');
  assert.equal(r.governance.scope, 'css_static');
});

test('Colour contrast result carries governance', () => {
  const r = adviseColourContrast({ foreground: '#000000', background: '#ffffff' });
  assertGovernanceShape(r.governance, 'adviseColourContrast');
  assert.equal(r.governance.scope, 'contrast_calculation');
});

test('Component adviser result carries governance', () => {
  const r = adviseComponent({ component: 'tabs' });
  assertGovernanceShape(r.governance, 'adviseComponent');
  assert.equal(r.governance.scope, 'component_guidance');
});

test('Focus visible adviser result carries governance', () => {
  const r = adviseFocusVisible();
  assertGovernanceShape(r.governance, 'adviseFocusVisible');
  assert.equal(r.governance.scope, 'component_guidance');
});

test('Text layout adviser result carries governance', () => {
  const r = adviseTextLayout({ question: 'line spacing' });
  assertGovernanceShape(r.governance, 'adviseTextLayout');
  assert.equal(r.governance.scope, 'component_guidance');
});

// ── Decision → finding_classification and release_gate.gate_status ─────────────

test('fail decision maps to failure classification and block gate', () => {
  const r = validateAriaAttributes({ html: '<button aria-expandd="true">Bad</button>' });
  assert.equal(r.decision, 'fail');
  assert.equal(r.governance.finding_classification, 'failure');
  assert.equal(r.governance.release_gate.gate_status, 'block');
  assert.equal(r.governance.release_gate.blocks_release, true);
});

test('warn decision maps to warning classification and allow_with_warning gate', () => {
  const r = checkCssRule({ css: 'p { line-height: 1.2; }' });
  assert.equal(r.decision, 'warn');
  assert.equal(r.governance.finding_classification, 'warning');
  assert.equal(r.governance.release_gate.gate_status, 'allow_with_warning');
  assert.equal(r.governance.release_gate.blocks_release, false);
});

test('pass decision maps to pass classification and allow gate', () => {
  const r = adviseColourContrast({ foreground: '#000000', background: '#ffffff' });
  assert.equal(r.decision, 'pass');
  assert.equal(r.governance.finding_classification, 'pass');
  assert.equal(r.governance.release_gate.gate_status, 'allow');
  assert.equal(r.governance.release_gate.blocks_release, false);
});

test('human_review decision maps to manual_review_required gate', () => {
  const r = adviseComponent({ component: 'data visualisation chart' });
  assert.equal(r.decision, 'human_review');
  assert.equal(r.governance.finding_classification, 'human_review');
  assert.equal(r.governance.release_gate.gate_status, 'manual_review_required');
});

test('caution decision maps to manual_review_required gate', () => {
  const r = adviseFocusVisible();
  assert.equal(r.decision, 'caution');
  assert.equal(r.governance.finding_classification, 'caution');
  assert.equal(r.governance.release_gate.gate_status, 'manual_review_required');
});

// ── release_gate.blocking_findings is populated for failures ──────────────────

test('blocking_findings is populated when decision is fail', () => {
  const r = validateAriaAttributes({ html: '<button aria-expandd="true">x</button>' });
  assert.equal(r.governance.release_gate.gate_status, 'block');
  assert.ok(r.governance.release_gate.blocking_findings.length >= 1);
  const finding = r.governance.release_gate.blocking_findings[0];
  assert.ok(typeof finding.criterion === 'string');
  assert.ok(typeof finding.reason === 'string' && finding.reason.length > 0);
});

test('blocking_findings is empty for warnings', () => {
  const r = checkCssRule({ css: 'p { line-height: 1.2; }' });
  assert.deepEqual(r.governance.release_gate.blocking_findings, []);
});

// ── claim_boundary content is meaningful and scope-specific ───────────────────

test('contrast claim_boundary references the actual ratio', () => {
  const r = adviseColourContrast({ foreground: '#1d70b8', background: '#ffffff' });
  assert.match(r.governance.claim_boundary.can_claim, /contrast ratio/i);
  assert.match(r.governance.claim_boundary.can_claim, /1d70b8/);
});

test('static_snippet claim_boundary references failure and warning counts', () => {
  const r = validateAriaAttributes({ html: '<button aria-expandd="true" aria-controls="x">x</button>' });
  assert.match(r.governance.claim_boundary.can_claim, /failure/);
});

test('claim_boundary cannot_claim prohibits false page-level assertions', () => {
  const r = validateAriaAttributes({ html: '<button>x</button>' });
  assert.ok(r.governance.claim_boundary.cannot_claim.some(s => s.includes('page')));
});

test('component_guidance claim_boundary mentions the pattern name when known', () => {
  const r = adviseComponent({ component: 'tabs' });
  assert.match(r.governance.claim_boundary.can_claim, /Tab panel|tabs/i);
  assert.match(r.governance.claim_boundary.can_claim, /guidance/i);
});

// ── assistant_handling_instruction is non-empty and stable ────────────────────

test('assistant_handling_instruction has at least 3 must and must_not items', () => {
  const r = validateAriaAttributes({ html: '<button>x</button>' });
  assert.ok(r.governance.assistant_handling_instruction.must.length >= 3);
  assert.ok(r.governance.assistant_handling_instruction.must_not.length >= 3);
  assert.ok(r.governance.assistant_handling_instruction.must.some(s => s.includes('finding_classification')));
  assert.ok(r.governance.assistant_handling_instruction.must_not.some(s => s.includes('warning')));
});

// ── next_evidence_required is populated for all scopes ───────────────────────

test('next_evidence_required is non-empty for all advisory and validation scopes', () => {
  for (const [label, result] of [
    ['static_snippet', validateAriaAttributes({ html: '<button>x</button>' })],
    ['css_static', checkCssRule({ css: 'p {}' })],
    ['contrast_calculation', adviseColourContrast({ foreground: '#000', background: '#fff' })],
    ['component_guidance', adviseComponent({ component: 'accordion' })]
  ]) {
    assert.ok(result.governance.next_evidence_required.length >= 2, `${label} should have next evidence`);
  }
});

// ── Governance survives build_agent mode ──────────────────────────────────────

test('governance block is preserved in build_agent output mode', () => {
  const r = validateAriaAttributes({ html: '<button aria-expandd="true">x</button>', output_mode: 'build_agent' });
  assertGovernanceShape(r.governance, 'build_agent ariaValidator');
  assert.equal(r.output_mode, 'build_agent');
  assert.equal(r.governance.finding_classification, 'failure');
  assert.equal(r.governance.release_gate.blocks_release, true);
});

test('governance block is preserved in build_agent component advice', () => {
  const r = adviseComponent({ component: 'accordion', output_mode: 'build_agent' });
  assertGovernanceShape(r.governance, 'build_agent adviseComponent');
  assert.equal(r.output_mode, 'build_agent');
  assert.ok(r.must.length > 0);
  assert.ok(r.governance.scope === 'component_guidance');
});

// ── Reference tools carry governance through the MCP handler ─────────────────

test('wcag_get_criterion MCP response carries governance with not_applicable classification', async () => {
  const res = await handleJsonRpcBody({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'wcag_get_criterion', arguments: { ref_id: '1.4.3' } } });
  const gov = res.result.structuredContent.governance;
  assertGovernanceShape(gov, 'wcag_get_criterion');
  assert.equal(gov.finding_classification, 'not_applicable');
  assert.equal(gov.scope, 'wcag_reference');
  assert.equal(gov.release_gate.gate_status, 'not_applicable');
  assert.match(gov.claim_boundary.can_claim, /normative reference/i);
});

test('search MCP response carries governance', async () => {
  const res = await handleJsonRpcBody({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'search', arguments: { query: 'contrast' } } });
  const gov = res.result.structuredContent.governance;
  assertGovernanceShape(gov, 'search');
  assert.equal(gov.scope, 'wcag_reference');
  assert.equal(gov.finding_classification, 'not_applicable');
});

test('fetch MCP response carries governance', async () => {
  const res = await handleJsonRpcBody({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'fetch', arguments: { id: '1.4.3' } } });
  const gov = res.result.structuredContent.governance;
  assertGovernanceShape(gov, 'fetch');
  assert.equal(gov.scope, 'wcag_reference');
});
