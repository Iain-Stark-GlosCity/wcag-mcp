import { handleJsonRpcBody } from '../mcp/handler.js';

async function readRequestBody(request) {
  if (request && typeof request.text === 'function') return request.text();
  if (typeof request?.rawBody === 'string') return request.rawBody;
  if (typeof request?.body === 'string') return request.body;
  if (request?.body !== undefined) return JSON.stringify(request.body);
  return '';
}

export async function handler(requestOrContext, maybeRequest) {
  const request = maybeRequest || requestOrContext;
  try {
    const body = await readRequestBody(request);
    const response = await handleJsonRpcBody(body);
    return { status: response ? 200 : 202, jsonBody: response || undefined };
  } catch(error) {
    return { status:400, jsonBody:{ jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } } };
  }
}
export default handler;
