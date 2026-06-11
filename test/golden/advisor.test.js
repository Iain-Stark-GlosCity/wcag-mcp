import test from 'node:test';
import assert from 'node:assert/strict';
import { adviseTextLayout, adviseFocusVisible, adviseFormErrors } from '../../src/services/adviceEngine.js';
import { adviseColourContrast } from '../../src/services/ruleEngine.js';

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
