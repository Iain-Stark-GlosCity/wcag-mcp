import { auditResponseSummary } from '../services/responseAudit.js';

export const accessibility_audit_summary = {
  name: 'accessibility_audit_summary',
  description: 'Audit a drafted assistant summary against the governance block of the MCP finding it summarises. Deterministically detects governance drift: upgraded claims (warning reported as failure), downgraded claims (failure reported as clean), broadened claims (snippet finding reported as page/site compliance), and omitted classifications. Use this before publishing any summary of an accessibility finding.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'The drafted summary text to audit.' },
      governance: {
        type: 'object',
        description: 'The governance block from the MCP response being summarised (at minimum finding_classification and scope).',
        properties: {
          finding_classification: { type: 'string' },
          scope: { type: 'string' }
        },
        required: ['finding_classification', 'scope']
      }
    },
    required: ['summary', 'governance']
  },
  handler: auditResponseSummary
};
