import { tools } from '../mcp/registry.js';
import { stats } from '../services/wcagStore.js';
export async function handler(){ return { status:200, jsonBody:{ name:'accessibility-advisor-mcp', status:'healthy', protocol:'MCP JSON-RPC 2.0', tools:tools.length, data:stats() } }; }
export default handler;
