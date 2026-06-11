import { protocolVersion } from '../mcp/protocol.js';
import { SOURCE_BASIS, LICENCE_NOTE } from '../services/sourceBuilder.js';
import { stats } from '../services/wcagStore.js';
import { emptyResponse, jsonResponse, methodFor } from './http.js';

export async function handler(request = {}) {
  if (methodFor(request) === 'OPTIONS') return emptyResponse(204);

  return jsonResponse(200, {
    name: 'accessibility-advisor-mcp',
    runtime: 'Azure Functions v4 / Node.js 22',
    protocolVersion,
    source_basis: SOURCE_BASIS,
    licence_note: LICENCE_NOTE,
    attribution: 'See ATTRIBUTION.md',
    data: stats()
  });
}
export default handler;
