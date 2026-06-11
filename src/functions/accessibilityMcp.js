import { handleJsonRpcBody } from '../mcp/handler.js';
import { protocolVersion, serverInfo } from '../mcp/protocol.js';
import { tools } from '../mcp/registry.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'MCP-Protocol-Version'
};

function response(status, jsonBody, headers = {}) {
  return { status, headers: { ...corsHeaders, 'MCP-Protocol-Version': protocolVersion, ...headers }, jsonBody };
}

function methodFor(request) {
  return String(request?.method || request?.httpMethod || 'POST').toUpperCase();
}

async function readRequestBody(request) {
  if (request && typeof request.text === 'function') return request.text();
  if (typeof request?.rawBody === 'string') return request.rawBody;
  if (typeof request?.body === 'string') return request.body;
  if (request?.body !== undefined) return JSON.stringify(request.body);
  return '';
}

export async function handler(requestOrContext, maybeRequest) {
  const request = maybeRequest || requestOrContext;
  const method = methodFor(request);

  if (method === 'OPTIONS') return { status: 204, headers: corsHeaders };
  if (method === 'GET') {
    return response(200, {
      ...serverInfo,
      protocolVersion,
      transport: 'streamable-http',
      message: 'POST JSON-RPC 2.0 MCP requests to this endpoint.',
      tools: tools.map(({ name, description }) => ({ name, description }))
    });
  }
  if (method !== 'POST') return response(405, { error: 'Method not allowed. Use POST for MCP JSON-RPC requests.' }, { Allow: 'GET,POST,OPTIONS' });

  try {
    const body = await readRequestBody(request);
    const jsonBody = await handleJsonRpcBody(body);
    return response(jsonBody ? 200 : 202, jsonBody || undefined);
  } catch(error) {
    return response(400, { jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } });
  }
}
export default handler;
