import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handler as mcpHandler } from '../../src/functions/accessibilityMcp.js';

const expectedFunctions = [
  ['accessibility-mcp/function.json', 'accessibility-mcp', ['get', 'post', 'options'], '../src/functions/accessibilityMcp.js'],
  ['accessibility-health/function.json', 'accessibility-health', ['get'], '../src/functions/accessibilityHealth.js'],
  ['accessibility-about/function.json', 'accessibility-about', ['get'], '../src/functions/accessibilityAbout.js']
];

test('Azure Functions metadata declares HTTP functions', () => {
  assert.equal(JSON.parse(readFileSync('host.json', 'utf8')).version, '2.0');

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

test('MCP Azure Function handler responds to ChatGPT connection probes', async () => {
  const response = await mcpHandler({ method: 'GET' });

  assert.equal(response.status, 200);
  assert.equal(response.jsonBody.transport, 'streamable-http');
  assert.ok(response.jsonBody.tools.some(tool => tool.name === 'search'));
  assert.equal(response.headers['MCP-Protocol-Version'], response.jsonBody.protocolVersion);
});

test('MCP Azure Function handler supports CORS preflight', async () => {
  const response = await mcpHandler({ method: 'OPTIONS' });

  assert.equal(response.status, 204);
  assert.match(response.headers['Access-Control-Allow-Methods'], /POST/);
});

test('MCP Azure Function handler accepts v3 request body shape', async () => {
  const response = await mcpHandler({}, {
    rawBody: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  });

  assert.equal(response.status, 200);
  assert.equal(response.jsonBody.id, 1);
  assert.ok(response.jsonBody.result.tools.length > 0);
  assert.ok(response.headers['Access-Control-Allow-Origin']);
});
