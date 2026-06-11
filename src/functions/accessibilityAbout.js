import { SOURCE_BASIS, LICENCE_NOTE } from '../services/sourceBuilder.js';
import { stats } from '../services/wcagStore.js';
export async function handler(){ return { status:200, jsonBody:{ name:'accessibility-advisor-mcp', source_basis:SOURCE_BASIS, licence_note:LICENCE_NOTE, attribution:'See ATTRIBUTION.md', data:stats() } }; }
export default handler;
