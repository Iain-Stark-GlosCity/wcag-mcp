import { tools, findTool } from './registry.js';
import { jsonRpcError } from './errors.js';
import { protocolVersion, serverInfo, supportedProtocolVersions } from './protocol.js';

const instructions = 'Use search to find relevant WCAG criteria, then fetch to retrieve full citation-ready guidance. All tools are read-only accessibility guidance helpers.';

function toolDescriptor(tool) {
  const { name, description, inputSchema, outputSchema, annotations } = tool;
  return Object.fromEntries(Object.entries({ name, description, inputSchema, outputSchema, annotations }).filter(([, value]) => value !== undefined));
}

function toolResult(payload) {
  if (payload && payload.structuredContent && Array.isArray(payload.content)) return payload;
  const structuredContent = payload ?? {};
  return {
    structuredContent,
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }]
  };
}

function hasResponseId(request) {
  return Object.hasOwn(request || {}, 'id');
}

function negotiatedProtocolVersion(params = {}) {
  const clientVersion = params.protocolVersion;
  if (supportedProtocolVersions.includes(clientVersion)) return clientVersion;
  return protocolVersion;
}

export async function handleJsonRpcRequest(request) {
  const { method, params={}, id } = request || {};

  if (!method || method.startsWith('notifications/')) return null;

  try {
    let result;
    if (method === 'initialize') {
      result = {
        protocolVersion: negotiatedProtocolVersion(params),
        capabilities:{ tools:{ listChanged:false } },
        serverInfo,
        instructions
      };
    }
    else if (method === 'ping') result = {};
    else if (method === 'tools/list') result = { tools: tools.map(toolDescriptor) };
    else if (method === 'tools/call') {
      const tool=findTool(params.name);
      if(!tool){ const e=new Error(`Unknown tool: ${params.name}`); e.code='TOOL_NOT_FOUND'; throw e;}
      result = toolResult(await tool.handler(params.arguments || {}));
    }
    else { const e=new Error(`Unknown method: ${method}`); e.code=-32601; throw e; }

    if (!hasResponseId(request)) return null;
    return { jsonrpc:'2.0', id, result };
  } catch(error) {
    if (!hasResponseId(request)) return null;
    return { jsonrpc:'2.0', id, error: jsonRpcError(error) };
  }
}
export async function handleJsonRpcBody(body) {
  const request=typeof body==='string'?JSON.parse(body):body;
  if(Array.isArray(request)){
    const responses=[];
    for(const item of request){ const res=await handleJsonRpcRequest(item); if(res) responses.push(res);}
    return responses.length ? responses : null;
  }
  return handleJsonRpcRequest(request);
}
