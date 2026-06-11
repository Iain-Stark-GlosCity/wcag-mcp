import { protocolVersion } from '../mcp/protocol.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version'
};

export function jsonRpcResponse(status, jsonBody) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': protocolVersion,
      ...corsHeaders
    },
    jsonBody
  };
}

export function corsPreflightResponse() {
  return {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400'
    }
  };
}

export function notificationResponse() {
  return { status: 202, headers: corsHeaders };
}

export function methodFor(request) {
  return String(request?.method || request?.httpMethod || 'POST').toUpperCase();
}

export async function readRequestBody(request) {
  if (request && typeof request.text === 'function') return request.text();
  if (typeof request?.rawBody === 'string') return request.rawBody;
  if (typeof request?.body === 'string') return request.body;
  if (request?.body !== undefined) return JSON.stringify(request.body);
  return '';
}
