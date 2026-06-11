import test from 'node:test';
import assert from 'node:assert/strict';
import { stats, findCriterion, findGlossaryTerm, searchCriteria } from '../../src/services/wcagStore.js';

test('wcagStore loads expected WCAG data', () => {
  assert.equal(stats().principles, 4);
  assert.equal(stats().guidelines, 13);
  assert.equal(stats().criteria, 87);
  assert.equal(findCriterion('1.4.8').level, 'AAA');
  assert.equal(findCriterion('1.4.12').level, 'AA');
  assert.ok(findCriterion('1.4.8').sources.spec.includes('#visual-presentation'));
});

test('search and glossary lookup work', () => {
  assert.ok(searchCriteria('visual presentation').some(c => c.id === '1.4.8'));
  assert.ok(findGlossaryTerm('programmatically determined').definition);
});
