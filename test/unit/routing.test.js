import test from 'node:test';
import assert from 'node:assert/strict';
import { adviseComponent } from '../../src/services/adviceEngine.js';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';
import { checkCssRule } from '../../src/services/ruleEngine.js';

// ── 1. Component routing ──────────────────────────────────────────────────────

test('tabs component routes to the tabs pattern, never to text layout', () => {
  const result = adviseComponent({ component: 'tabs' });
  assert.equal(result.pattern?.id, 'tabs');
  assert.equal(result.criterion_identification?.status, 'identified');
});

test('tabs with contextual words like "content" still route to the tabs pattern', () => {
  const result = adviseComponent({ component: 'tabs', context: 'tab content areas' });
  assert.equal(result.pattern?.id, 'tabs');
});

test('"body content" no longer silently reroutes to text layout advice', () => {
  const result = adviseComponent({ component: 'body content' });
  // Should return human_review, not text layout (1.4.8) criteria
  assert.equal(result.decision, 'human_review');
  assert.ok(!result.criteria?.some(c => c.id === '1.4.8'));
});

test('form error query still routes to form errors advice', () => {
  const result = adviseComponent({ component: 'form error messages' });
  assert.ok(result.criteria?.some(c => c.id === '3.3.1'), 'should map to form error criteria');
});

test('"error banner" routes to the alert pattern, not form errors', () => {
  const result = adviseComponent({ component: 'error banner' });
  assert.equal(result.pattern?.id, 'alert');
  assert.ok(result.criteria?.some(c => c.id === '4.1.3'));
});

test('zero-candidate noMapping includes a hint about the component requirements tool', () => {
  // Uses a component description that contains no words that trigger broad candidates
  // ('menu', 'button', 'link', 'interactive', 'widget', 'navigation', 'input', 'select').
  const result = adviseComponent({ component: 'data visualisation chart' });
  assert.equal(result.decision, 'human_review');
  assert.match(result.answer, /accessibility_get_component_requirements/);
});

// ── 2. Both tools use the same pattern engine ─────────────────────────────────

test('accessibility_advise_component and accessibility_get_component_requirements agree on tabs', () => {
  const full = adviseComponent({ component: 'tabs' });
  const contract = adviseComponent({ component: 'tabs', output_mode: 'build_agent' });
  assert.equal(full.pattern?.id, 'tabs');
  assert.equal(contract.output_mode, 'build_agent');
  // Same pattern, different format — both include the 4.1.2 criterion
  assert.ok(full.criteria.some(c => c.id === '4.1.2'));
  assert.ok(contract.wcag.some(item => item.startsWith('4.1.2')));
});

// ── 3. ARIA label warnings: containers should not warn ────────────────────────

test('nav[aria-label] does not produce a redundant-name warning', () => {
  const result = validateAriaAttributes({ html: '<nav aria-label="Main navigation"><ul><li><a href="/">Home</a></li></ul></nav>' });
  assert.ok(!result.issues.some(i => i.attribute === 'aria-label' && i.message.includes('visible text')));
});

test('role="tablist"[aria-label] does not produce a redundant-name warning', () => {
  const result = validateAriaAttributes({ html: '<div role="tablist" aria-label="Account settings"><button role="tab" aria-selected="true">Profile</button></div>' });
  assert.ok(!result.issues.some(i => i.attribute === 'aria-label' && i.message.includes('visible text')));
});

test('a[aria-label] with visible text still produces a warning', () => {
  const result = validateAriaAttributes({ html: '<a href="/account" aria-label="Go to your account">Account</a>' });
  assert.ok(result.issues.some(i => i.attribute === 'aria-label' && i.message.includes('visible text')));
});

test('button[aria-label] with visible text still produces a warning', () => {
  const result = validateAriaAttributes({ html: '<button aria-label="Submit the form">Submit</button>' });
  assert.ok(result.issues.some(i => i.attribute === 'aria-label' && i.message.includes('visible text')));
});

// ── 4. Target-size checks ─────────────────────────────────────────────────────

test('button with width below 24px triggers a target-size warning', () => {
  const result = checkCssRule({ css: 'button { width: 20px; height: 20px; }' });
  assert.ok(result.issues.some(i => i.criteria?.includes('2.5.8')), 'should flag 2.5.8');
  assert.ok(result.issues.every(i => i.classification !== 'failure'), 'target size is a warning, not a failure');
});

test('button above 24px does not trigger a target-size warning', () => {
  const result = checkCssRule({ css: 'button { width: 44px; height: 44px; }' });
  assert.ok(!result.issues.some(i => i.criteria?.includes('2.5.8')));
});

test('non-interactive selectors with small dimensions do not trigger the warning', () => {
  const result = checkCssRule({ css: 'p { width: 16px; } .hero-image { width: 16px; } .icon-image { height: 12px; }' });
  assert.ok(!result.issues.some(i => i.criteria?.includes('2.5.8')));
});

// ── 5. Reduced-motion checks ──────────────────────────────────────────────────

test('transition without prefers-reduced-motion triggers a warning', () => {
  const result = checkCssRule({ css: '.menu { transition: transform 0.3s ease; }' });
  assert.ok(result.issues.some(i => i.criteria?.includes('2.3.3')));
  assert.ok(result.issues.find(i => i.criteria?.includes('2.3.3'))?.suggested_fix.includes('prefers-reduced-motion'));
});

test('animation without prefers-reduced-motion triggers a warning', () => {
  const result = checkCssRule({ css: '.spinner { animation: spin 1s linear infinite; }' });
  assert.ok(result.issues.some(i => i.criteria?.includes('2.3.3')));
});

test('transition with an existing prefers-reduced-motion query does not warn', () => {
  const css = '.panel { transition: opacity 0.2s; }\n@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }';
  const result = checkCssRule({ css });
  assert.ok(!result.issues.some(i => i.criteria?.includes('2.3.3')));
});

test('reduced-motion warning is only emitted once per stylesheet, not once per rule', () => {
  const result = checkCssRule({ css: '.a { transition: opacity 0.2s; } .b { animation: fade 0.5s; }' });
  const motionIssues = result.issues.filter(i => i.criteria?.includes('2.3.3'));
  assert.equal(motionIssues.length, 1);
});
