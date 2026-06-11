import test from 'node:test';
import assert from 'node:assert/strict';
import { handleJsonRpcBody } from '../../src/mcp/handler.js';

test('MCP initialize negotiates the current Streamable HTTP protocol', async () => {
  const initialized = await handleJsonRpcBody({ jsonrpc:'2.0', id:0, method:'initialize', params:{ protocolVersion:'2025-06-18' } });

  assert.equal(initialized.result.protocolVersion, '2025-06-18');
  assert.equal(initialized.result.capabilities.tools.listChanged, false);
});

test('MCP notifications produce no JSON-RPC response', async () => {
  const initialized = await handleJsonRpcBody({ jsonrpc:'2.0', method:'notifications/initialized' });

  assert.equal(initialized, null);
});

test('MCP tools/list and call work', async () => {
  const listed = await handleJsonRpcBody({ jsonrpc:'2.0', id:1, method:'tools/list' });
  assert.ok(listed.result.tools.some(t => t.name === 'accessibility_advise_text_layout'));
  assert.ok(listed.result.tools.some(t => t.name === 'search'));
  assert.ok(listed.result.tools.some(t => t.name === 'fetch'));
  assert.ok(listed.result.tools.find(t => t.name === 'search').outputSchema);
  const called = await handleJsonRpcBody({ jsonrpc:'2.0', id:2, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'1.4.8' } } });
  assert.equal(called.result.structuredContent.criterion.level, 'AAA');
  assert.deepEqual(called.result.content.map(item => item.type), ['text']);
});

test('MCP returns useful structured errors', async () => {
  const res = await handleJsonRpcBody({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'9.9.9' } } });
  assert.equal(res.error.data.error_code, 'CRITERION_NOT_FOUND');
});
