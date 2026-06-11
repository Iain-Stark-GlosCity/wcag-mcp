import { handleJsonRpcBody } from '../mcp/handler.js';
import { jsonRpcResponse, methodFor, readRequestBody } from './http.js';

export async function handler(requestOrContext, maybeRequest) {
  const request = maybeRequest || requestOrContext;

  if (methodFor(request) !== 'POST') {
    return jsonRpcResponse(405, {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Method not allowed. MCP JSON-RPC is available on POST only.' }
    });
  }

  try {
    const body = await readRequestBody(request);
    const jsonBody = await handleJsonRpcBody(body);
    return jsonRpcResponse(200, jsonBody);
  } catch(error) {
    return jsonRpcResponse(400, { jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } });
  }
}
export default handler;
