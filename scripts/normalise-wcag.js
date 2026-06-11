#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
import { criteria, glossary } from '../src/services/wcagStore.js';
import { topicIndex } from '../src/services/topicResolver.js';
mkdirSync('data/normalised',{recursive:true});
writeFileSync('data/normalised/criteria.json', JSON.stringify(criteria,null,2));
writeFileSync('data/normalised/glossary.json', JSON.stringify(glossary,null,2));
writeFileSync('data/normalised/topic-index.json', JSON.stringify(topicIndex,null,2));
const techniques=[]; for(const c of criteria) for(const [type,items] of Object.entries(c.techniques||{})) for(const item of items||[]) techniques.push({...item,type,criterion:c.id});
writeFileSync('data/normalised/techniques.json', JSON.stringify(techniques,null,2));
console.log(`Normalised ${criteria.length} criteria, ${techniques.length} techniques, ${glossary.length} glossary terms.`);
