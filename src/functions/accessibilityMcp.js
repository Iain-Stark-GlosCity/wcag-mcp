import { handleJsonRpcBody } from '../mcp/handler.js';
import { emptyResponse, jsonResponse, methodFor, readRequestBody } from './http.js';

export async function handler(request = {}) {
  const method = methodFor(request);

  if (method === 'OPTIONS') return emptyResponse(204);

  if (method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST for MCP JSON-RPC requests.' }, { Allow: 'POST, OPTIONS' });
  }

  try {
    const body = await readRequestBody(request);
    const jsonBody = await handleJsonRpcBody(body);
    return jsonResponse(jsonBody ? 200 : 202, jsonBody || undefined);
  } catch(error) {
    return jsonResponse(400, { jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } });
  }
}
export default handler;
