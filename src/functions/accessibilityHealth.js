import { tools } from '../mcp/registry.js';
import { protocolVersion } from '../mcp/protocol.js';
import { stats } from '../services/wcagStore.js';
import { emptyResponse, jsonResponse, methodFor } from './http.js';

export async function handler(request = {}) {
  if (methodFor(request) === 'OPTIONS') return emptyResponse(204);

  return jsonResponse(200, {
    name: 'accessibility-advisor-mcp',
    status: 'healthy',
    runtime: 'Azure Functions v4 / Node.js 22',
    protocol: 'MCP Streamable HTTP JSON-RPC 2.0',
    protocolVersion,
    tools: tools.length,
    data: stats()
  });
}
export default handler;
