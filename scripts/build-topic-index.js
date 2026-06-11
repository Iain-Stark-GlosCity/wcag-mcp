#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { topicIndex } from '../src/services/topicResolver.js';
mkdirSync('data/normalised',{recursive:true});
writeFileSync('data/normalised/topic-index.json', JSON.stringify(topicIndex,null,2));
console.log(`Wrote ${topicIndex.length} topic mappings.`);
