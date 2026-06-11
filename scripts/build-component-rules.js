#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
const rules=[
 {component:'content-page-body',criteria:['1.4.8','1.4.12'],rules:['left align text','line-height >= 1.5','max-width <= 80ch']},
 {component:'error-summary',criteria:['3.3.1','3.3.2','3.3.3'],rules:['summarise errors in text','link to invalid fields','provide suggestions when known']},
 {component:'accordion',criteria:['2.1.1','2.4.7','4.1.2'],rules:['keyboard operable','visible focus','correct name role value']}
];
mkdirSync('data/normalised',{recursive:true});
writeFileSync('data/normalised/component-rules.json', JSON.stringify(rules,null,2));
console.log(`Wrote ${rules.length} component rule groups.`);
