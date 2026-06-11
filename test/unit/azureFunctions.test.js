import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handler as mcpHandler } from '../../src/functions/accessibilityMcp.js';
import { handler as healthHandler } from '../../src/functions/accessibilityHealth.js';

const expectedFunctions = [
  ['accessibility-mcp/function.json', 'accessibility-mcp', ['get', 'post', 'options'], '../src/functions/accessibilityMcp.js'],
  ['accessibility-health/function.json', 'accessibility-health', ['get', 'options'], '../src/functions/accessibilityHealth.js'],
  ['accessibility-about/function.json', 'accessibility-about', ['get', 'options'], '../src/functions/accessibilityAbout.js']
];

test('Azure Functions app is configured for the v4 Node programming model on Node 22', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.equal(JSON.parse(readFileSync('host.json', 'utf8')).version, '2.0');
  assert.equal(pkg.main, 'src/functions/register.js');
  assert.equal(pkg.engines.node, '>=22 <23');
  assert.ok(pkg.dependencies['@azure/functions'].startsWith('^4.'));
});

test('legacy Azure Functions metadata remains compatible with HTTP fallback discovery', () => {
  for (const [path, route, methods, scriptFile] of expectedFunctions) {
    const metadata = JSON.parse(readFileSync(path, 'utf8'));
    const trigger = metadata.bindings.find(binding => binding.type === 'httpTrigger');
    const output = metadata.bindings.find(binding => binding.type === 'http');

    assert.equal(metadata.scriptFile, scriptFile);
    assert.equal(metadata.entryPoint, 'handler');
    assert.equal(trigger.authLevel, 'anonymous');
    assert.equal(trigger.route, route);
    assert.deepEqual(trigger.methods, methods);
    assert.equal(output.name, '$return');
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
