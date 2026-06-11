import { handleJsonRpcBody } from '../mcp/handler.js';
import { protocolVersion } from '../mcp/protocol.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
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

  if (method !== 'POST') return response(405, { error: 'Method not allowed. Use POST for MCP JSON-RPC requests.' }, { Allow: 'POST' });

  try {
    const body = await readRequestBody(request);
    const jsonBody = await handleJsonRpcBody(body);
    return response(jsonBody ? 200 : 202, jsonBody || undefined);
  } catch(error) {
    return response(400, { jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } });
  }
}
export default handler;
