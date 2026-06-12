import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';
import { checkCssRule, adviseColourContrast } from '../../src/services/ruleEngine.js';

test('invalid ARIA attributes are hard failures', () => {
  const result = validateAriaAttributes({ html: '<button aria-expandd="true">Open</button>' });
  assert.equal(result.decision, 'fail');
  const issue = result.issues.find(i => i.attribute === 'aria-expandd');
  assert.equal(issue.classification, 'failure');
  assert.ok(result.summary.failures >= 1);
});

test('redundant accessible names are warnings, not failures', () => {
  const result = validateAriaAttributes({ html: '<a href="/" aria-label="Home">Home</a>' });
  assert.equal(result.decision, 'warn');
  assert.equal(result.summary.failures, 0);
  assert.ok(result.warnings.every(i => i.classification === 'warning'));
});

test('legitimate markup needing a manual check is a note and still passes', () => {
  const result = validateAriaAttributes({ html: '<button aria-expanded="false" aria-controls="panel" onclick="toggle()">Open</button><div id="panel"></div>' });
  assert.equal(result.decision, 'pass');
  assert.equal(result.summary.failures, 0);
  assert.equal(result.summary.warnings, 0);
});

test('issues are grouped by classification alongside the flat list', () => {
  const result = validateAriaAttributes({ html: '<button aria-expanded="false" aria-controls="missing" aria-label="Menu">Menu</button>' });
  assert.equal(result.decision, 'fail');
  assert.ok(result.failures.length >= 1);
  assert.ok(result.warnings.length >= 1);
  assert.ok(result.notes.length >= 1);
  assert.equal(result.issues.length, result.failures.length + result.warnings.length + result.notes.length);
});

test('CSS smells produce warn, not fail', () => {
  const result = checkCssRule({ css: 'p { line-height: 1.2; }' });
  assert.equal(result.decision, 'warn');
  assert.equal(result.summary.failures, 0);
  const hard = checkCssRule({ css: 'p { text-align: justify; }' });
  assert.equal(hard.decision, 'fail');
});

test('contrast advice resolves tokens and computed colours', () => {
  const tokens = { '--ink': '#1d70b8', '--paper': 'white' };
  const result = adviseColourContrast({ foreground: 'var(--ink)', background: 'var(--paper)', tokens });
  assert.equal(result.decision, 'pass');
  assert.equal(result.implementation.foreground_resolved, '#1d70b8');
});

test('contrast advice composites alpha over the background', () => {
  const result = adviseColourContrast({ foreground: 'rgba(0, 0, 0, 0.5)', background: '#ffffff' });
  assert.equal(result.decision, 'fail');
  assert.ok(result.implementation.composited);
  assert.ok(result.implementation.ratio < 4.5);
});

test('unresolvable colour input defers to human review instead of guessing', () => {
  const result = adviseColourContrast({ foreground: 'var(--unknown-token)', background: '#ffffff' });
  assert.equal(result.decision, 'human_review');
  assert.equal(result.confidence, 'low');
  assert.ok(result.limitations.some(l => l.includes('--unknown-token')));
});
