import { protocolVersion } from '../mcp/protocol.js';

export function jsonRpcResponse(status, jsonBody) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'MCP-Protocol-Version': protocolVersion
    },
    jsonBody
  };
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
