import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCssRule, adviseColourContrast } from '../../src/services/ruleEngine.js';

test('CSS rule checks catch unsafe text layout', () => {
  const result = checkCssRule({ css:'p { line-height: 1.2; text-align: justify; max-width: 95ch; }', target_level:'AAA' });
  assert.equal(result.decision, 'fail');
  assert.ok(result.issues.some(i => i.criteria.includes('1.4.8')));
});

test('contrast check calculates ratios', () => {
  const result = adviseColourContrast({ foreground:'#1d70b8', background:'#ffffff', target_level:'AA' });
  assert.equal(result.decision, 'pass');
  assert.ok(result.implementation.ratio >= 4.5);
});
