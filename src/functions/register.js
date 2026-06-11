import { app } from '@azure/functions';
import { handler as accessibilityMcp } from './accessibilityMcp.js';

app.http('accessibility-mcp', {
  route: 'accessibility-mcp',
  authLevel: 'anonymous',
  methods: ['POST'],
  handler: accessibilityMcp
});
