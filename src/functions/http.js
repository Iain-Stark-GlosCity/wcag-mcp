import { protocolVersion } from '../mcp/protocol.js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'MCP-Protocol-Version',
  Vary: 'Origin'
};

export function jsonResponse(status, jsonBody, headers = {}) {
  const baseHeaders = {
    ...corsHeaders,
    'MCP-Protocol-Version': protocolVersion,
    ...headers
  };

  if (jsonBody === undefined) return { status, headers: baseHeaders };

  return {
    status,
    headers: { 'Content-Type': 'application/json', ...baseHeaders },
    jsonBody
  };
}

export function emptyResponse(status = 204, headers = {}) {
  return { status, headers: { ...corsHeaders, 'MCP-Protocol-Version': protocolVersion, ...headers } };
}

export function methodFor(request) {
  return String(request?.method || request?.httpMethod || 'GET').toUpperCase();
}

export async function readRequestBody(request) {
  if (request && typeof request.text === 'function') return request.text();
  if (typeof request?.rawBody === 'string') return request.rawBody;
  if (typeof request?.body === 'string') return request.body;
  if (request?.body !== undefined) return JSON.stringify(request.body);
  return '';
}
