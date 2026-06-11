import test from 'node:test';
import assert from 'node:assert/strict';
import { handleJsonRpcBody } from '../../src/mcp/handler.js';

test('MCP tools/list and call work', async () => {
  const listed = await handleJsonRpcBody({ jsonrpc:'2.0', id:1, method:'tools/list' });
  assert.ok(listed.result.tools.some(t => t.name === 'accessibility_advise_text_layout'));
  const called = await handleJsonRpcBody({ jsonrpc:'2.0', id:2, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'1.4.8' } } });
  assert.equal(called.result.criterion.level, 'AAA');
});

test('MCP returns useful structured errors', async () => {
  const res = await handleJsonRpcBody({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'9.9.9' } } });
  assert.equal(res.error.data.error_code, 'CRITERION_NOT_FOUND');
});
