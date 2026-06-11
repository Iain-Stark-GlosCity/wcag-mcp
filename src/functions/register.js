import { app } from '@azure/functions';
import { handler as accessibilityMcp } from './accessibilityMcp.js';
import { handler as accessibilityHealth } from './accessibilityHealth.js';
import { handler as accessibilityAbout } from './accessibilityAbout.js';

app.http('accessibility-mcp', {
  route: 'accessibility-mcp',
  authLevel: 'anonymous',
  methods: ['GET', 'POST', 'OPTIONS'],
  handler: accessibilityMcp
});

app.http('accessibility-health', {
  route: 'accessibility-health',
  authLevel: 'anonymous',
  methods: ['GET', 'OPTIONS'],
  handler: accessibilityHealth
});

app.http('accessibility-about', {
  route: 'accessibility-about',
  authLevel: 'anonymous',
  methods: ['GET', 'OPTIONS'],
  handler: accessibilityAbout
});
