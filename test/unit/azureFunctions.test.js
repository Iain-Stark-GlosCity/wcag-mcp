import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { handler as mcpHandler } from '../../src/functions/accessibilityMcp.js';
import { handler as healthHandler } from '../../src/functions/accessibilityHealth.js';

test('Azure Functions app is configured for the v4 Node programming model on Node 22', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(JSON.parse(readFileSync('host.json', 'utf8')).version, '2.0');
  assert.equal(pkg.main, 'src/functions/register.js');
  assert.equal(pkg.engines.node, '>=22 <23');
  assert.ok(pkg.dependencies['@azure/functions'].startsWith('^4.'));
});

test('v4 entry point loads and registers without throwing', async () => {
  // Azure discovers functions by executing package.json "main"; if this
  // import throws (e.g. a missing transitive dependency), the deployed app
  // silently has zero functions.
  await assert.doesNotReject(() => import('../../src/functions/register.js'));
});

test('no v3 function.json files exist alongside the v4 model', () => {
  for (const path of ['accessibility-mcp/function.json', 'accessibility-health/function.json', 'accessibility-about/function.json']) {
    assert.ok(!existsSync(path), `${path} must not exist — mixing function.json with app.http() registration breaks the worker`);
  }
});

test('MCP Azure Function handler handles CORS preflight requests', async () => {
  const response = await mcpHandler({ method: 'OPTIONS' });

  assert.equal(response.status, 204);
  assert.match(response.headers['Access-Control-Allow-Methods'], /POST/);
  assert.match(response.headers['Access-Control-Allow-Headers'], /MCP-Protocol-Version/);
});

test('MCP Azure Function handler rejects GET with Streamable HTTP fallback status', async () => {
  const response = await mcpHandler({ method: 'GET' });

  assert.equal(response.status, 405);
  assert.equal(response.headers.Allow, 'POST, OPTIONS');
});

test('MCP Azure Function handler accepts v4 request body shape', async () => {
  const response = await mcpHandler({
    method: 'POST',
    text: async () => JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  });

  assert.equal(response.status, 200);
  assert.equal(response.jsonBody.id, 1);
  assert.ok(response.jsonBody.result.tools.length > 0);
  assert.ok(response.headers['Access-Control-Allow-Origin']);
  assert.equal(response.headers['Content-Type'], 'application/json');
});

test('health endpoint reports the deployed runtime target', async () => {
  const response = await healthHandler({ method: 'GET' });

  assert.equal(response.status, 200);
  assert.equal(response.jsonBody.runtime, 'Azure Functions v4 / Node.js 22');
  assert.equal(response.jsonBody.protocolVersion, '2025-06-18');
});
