import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handler as mcpHandler } from '../../src/functions/accessibilityMcp.js';

test('Azure Functions app is configured for the v4 Node programming model on Node 22', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(JSON.parse(readFileSync('host.json', 'utf8')).version, '2.0');
  assert.equal(pkg.main, 'src/functions/register.js');
  assert.equal(pkg.engines.node, '>=22 <23');
  assert.ok(pkg.dependencies['@azure/functions'].startsWith('^4.'));
});

test('MCP Azure Function handler rejects non-POST requests with a JSON-RPC error', async () => {
  const response = await mcpHandler({ method: 'GET' });

  assert.equal(response.status, 405);
  assert.equal(response.headers['Content-Type'], 'application/json');
  assert.equal(response.jsonBody.jsonrpc, '2.0');
  assert.equal(response.jsonBody.error.code, -32600);
});

test('MCP Azure Function handler accepts v4 POST request body shape', async () => {
  const response = await mcpHandler({
    method: 'POST',
    text: async () => JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers['Content-Type'], 'application/json');
  assert.equal(response.jsonBody.id, 1);
  assert.ok(response.jsonBody.result.tools.length > 0);
});

test('MCP Azure Function handler accepts legacy rawBody POST shape', async () => {
  const response = await mcpHandler({}, {
    method: 'POST',
    rawBody: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.jsonBody.result, {});
});
