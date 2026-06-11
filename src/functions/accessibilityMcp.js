import { handleJsonRpcBody } from '../mcp/handler.js';
export async function handler(request, context) {
  try { const body = await request.text(); const response = await handleJsonRpcBody(body); return { status: response ? 200 : 202, jsonBody: response || undefined }; }
  catch(error){ return { status:400, jsonBody:{ jsonrpc:'2.0', id:null, error:{ code:-32700, message:`Parse error: ${error.message}` } } }; }
}
export default handler;
