#!/usr/bin/env node
import { handleJsonRpcBody } from './mcp/handler.js';
let input='';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => { if(!input.trim()) { console.log('accessibility-advisor-mcp ready'); return; } console.log(JSON.stringify(await handleJsonRpcBody(input))); });
