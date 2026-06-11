import { handleJsonRpcBody } from '../mcp/handler.js';
import { corsPreflightResponse, jsonRpcResponse, methodFor, notificationResponse, readRequestBody } from './http.js';

export async function handler(requestOrContext, maybeRequest) {
  const request = maybeRequest || requestOrContext;
  const method = methodFor(request);

  if (method === 'OPTIONS') return corsPreflightResponse();

  if (method !== 'POST') {
    return jsonRpcResponse(405, {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Method not allowed. MCP JSON-RPC is available on POST only.' }
    });
  }

  try {
    const body = await readRequestBody(request);
    const jsonBody = await handleJsonRpcBody(body);
    if (jsonBody === null) return notificationResponse();
    return jsonRpcResponse(200, jsonBody);
  } catch(error) {
    return jsonRpcResponse(400, { jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } });
  }
}
export default handler;
