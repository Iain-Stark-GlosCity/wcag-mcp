import test from 'node:test';
import assert from 'node:assert/strict';
import { adviseTextLayout, adviseFocusVisible, adviseFormErrors, adviseComponent } from '../../src/services/adviceEngine.js';
import { adviseColourContrast } from '../../src/services/ruleEngine.js';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';

function assertSourceBacked(result, ids) {
  for (const id of ids) assert.ok(result.criteria.some(c => c.id === id), `expected ${id}`);
  assert.ok(result.sources.length > 0);
  assert.notEqual(result.confidence, 'low');
}

test('What paragraph formatting should we use for AAA?', () => {
  const result = adviseTextLayout({ question:'What paragraph formatting should we use for AAA?', target_level:'AAA' });
  assertSourceBacked(result, ['1.4.8','1.4.12']);
  assert.ok(result.human_review.length > 0);
});

test('What are the rules for focus indicators?', () => {
  const result = adviseFocusVisible({ target_level:'AA' });
  assertSourceBacked(result, ['2.4.7']);
});

test('What should form error messages include?', () => {
  const result = adviseFormErrors({ target_level:'AA' });
  assertSourceBacked(result, ['3.3.1','3.3.2','3.3.3']);
});

test('What colour contrast do normal text links need?', () => {
  const result = adviseColourContrast({ foreground:'#000000', background:'#ffffff', target_level:'AA' });
  assertSourceBacked(result, ['1.4.3']);
});


test('Dropdown navigation maps to disclosure navigation pattern before focus advice', () => {
  const result = adviseComponent({ component: 'dropdown nav with flyout submenu' });
  assert.equal(result.pattern.id, 'navigation-flyout');
  assert.ok(result.criteria.some(c => c.id === '2.1.1'));
  assert.ok(result.criteria.some(c => c.id === '4.1.2'));
  assert.equal(result.criterion_identification.status, 'identified');
  assert.ok(result.implementation.pattern.includes('disclosure'));
});

test('Component advice accepts HTML snippets for pattern matching', () => {
  const result = adviseComponent({ html: '<nav><button aria-expanded="false" aria-controls="products">Products</button><ul id="products"><li><a href="/a">A</a></li></ul></nav>' });
  assert.equal(result.pattern.id, 'navigation-flyout');
  assert.ok(result.implementation.html_snippet_received);
});

test('Low-confidence component results include candidates and reduce implementation to pattern references', () => {
  const result = adviseComponent({ component: 'interactive widget' });
  assert.equal(result.decision, 'human_review');
  assert.equal(result.confidence, 'low');
  assert.ok(result.criteria.some(c => c.id === '2.1.1'));
  assert.equal(result.implementation.status, 'reduced');
  assert.ok(result.implementation.candidate_patterns.every(p => p.name && p.reference));
  assert.ok(!result.implementation.keyboard, 'full guidance stays suppressed at low confidence');
});

test('Broken disclosure navigation HTML still identifies the flyout pattern with high confidence', () => {
  const result = adviseComponent({
    component: 'disclosure navigation',
    html: '<li class="has-children"><a href="/early-careers">Early Careers</a><ul class="sub-nav"><li><a href="/early-careers/apprenticeships">Apprenticeships</a></li></ul></li>',
    target_level: 'AA'
  });
  assert.equal(result.pattern.id, 'navigation-flyout');
  assert.notEqual(result.decision, 'human_review');
  assert.notEqual(result.confidence, 'low');
  assert.ok(result.criteria.find(c => c.id === '2.1.1')?.relevance === 'direct');
  assert.ok(result.criteria.find(c => c.id === '4.1.2')?.relevance === 'direct');
  assert.ok(result.implementation.pattern, 'implementation guidance must be populated');
  assert.ok(result.implementation.keyboard.length > 0);
});

test('ARIA validator flags redundant names and missing state hooks', () => {
  const result = validateAriaAttributes({ html: '<button aria-expanded="false" aria-controls="missing" aria-label="Menu">Menu</button><img src="/logo.svg" alt="Acme" aria-label="Acme logo">' });
  assert.equal(result.status, 'fail');
  assert.ok(result.issues.some(i => i.attribute === 'aria-expanded' && i.message.includes('state-change handler')));
  assert.ok(result.issues.some(i => i.attribute === 'aria-controls'));
  assert.ok(result.issues.some(i => i.message.includes('visible text')));
  assert.ok(result.issues.some(i => i.message.includes('both alt and aria-label')));
});
