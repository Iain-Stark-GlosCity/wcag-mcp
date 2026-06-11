import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTopic } from '../../src/services/topicResolver.js';

test('paragraph formatting maps to text criteria', () => {
  assert.deepEqual(resolveTopic('paragraph spacing').criteria.map(c => c.id), ['1.4.8','1.4.12']);
});
