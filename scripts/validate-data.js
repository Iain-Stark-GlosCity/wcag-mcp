#!/usr/bin/env node
import assert from 'node:assert/strict';
import { stats, findCriterion, glossary, criteria } from '../src/services/wcagStore.js';
const s=stats();
assert.equal(s.principles,4,'4 principles loaded');
assert.equal(s.guidelines,13,'13 guidelines loaded');
assert.equal(s.criteria,87,'87 success criteria loaded');
assert.ok(glossary.length > 0,'glossary terms loaded');
assert.ok(s.techniques > 0,'techniques loaded');
assert.equal(findCriterion('1.4.8')?.level,'AAA','1.4.8 is AAA');
assert.equal(findCriterion('1.4.12')?.level,'AA','1.4.12 is AA');
for (const c of criteria) assert.ok(c.sources?.spec && c.sources?.understanding && c.sources?.quickref, `source URLs generated for ${c.id}`);
console.log('Data validation passed.');
