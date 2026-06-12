export const topicIndex = [
  { topic: 'paragraph formatting', aliases: ['paragraph spacing','line spacing','justified text','text layout','visual presentation'], criteria: [
    { id: '1.4.8', relationship: 'direct', reason: 'AAA visual presentation includes line width, justification and spacing requirements.' },
    { id: '1.4.12', relationship: 'related', reason: 'AA text spacing requires content not to break when users override spacing.' }
  ]},
  { topic: 'focus indicator', aliases: ['focus visible','keyboard focus','focus appearance'], criteria: [
    { id: '2.4.7', relationship: 'direct', reason: 'Keyboard focus indicators must be visible.' },
    { id: '2.4.11', relationship: 'related', reason: 'WCAG 2.2 adds minimum focus appearance requirements.' },
    { id: '2.4.12', relationship: 'related', reason: 'Focused components must not be hidden by authored content.' },
    { id: '2.4.13', relationship: 'enhanced', reason: 'Enhanced focus visibility is an AAA consideration.' }
  ]},
  { topic: 'form errors', aliases: ['error message','error summary','validation','labels','instructions'], criteria: [
    { id: '3.3.1', relationship: 'direct', reason: 'Detected input errors must be identified and described in text.' },
    { id: '3.3.2', relationship: 'direct', reason: 'Inputs need labels or instructions.' },
    { id: '3.3.3', relationship: 'related', reason: 'Known correction suggestions should be provided.' },
    { id: '3.3.4', relationship: 'related', reason: 'Important submissions need prevention, checking, or confirmation.' }
  ]},
  { topic: 'colour contrast', aliases: ['color contrast','contrast','links colour','normal text contrast'], criteria: [
    { id: '1.4.3', relationship: 'direct', reason: 'Minimum contrast for text is required at AA.' },
    { id: '1.4.6', relationship: 'enhanced', reason: 'Enhanced text contrast is required at AAA.' },
    { id: '1.4.11', relationship: 'related', reason: 'UI component and graphical object contrast is required at AA.' }
  ]},
  { topic: 'keyboard', aliases: ['keyboard access'], criteria: [
    { id: '2.1.1', relationship: 'direct', reason: 'Functionality must be keyboard operable.' },
    { id: '2.1.2', relationship: 'direct', reason: 'Keyboard focus must not be trapped.' },
    { id: '2.1.4', relationship: 'related', reason: 'Character key shortcuts must be controllable.' }
  ]},
  { topic: 'target size', aliases: ['touch target','click target','tap target','pointer target','minimum size','control size'], criteria: [
    { id: '2.5.8', relationship: 'direct', reason: 'Interactive targets must meet a 24 × 24 CSS pixel minimum at AA.' },
    { id: '2.5.5', relationship: 'enhanced', reason: 'Enhanced target size requires 44 × 44 CSS pixels at AAA.' }
  ]},
  { topic: 'reduced motion', aliases: ['prefers-reduced-motion','animations','motion','transitions','animation from interactions'], criteria: [
    { id: '2.3.3', relationship: 'direct', reason: 'Motion animation triggered by interaction can be disabled at AAA.' }
  ]}
];

export function resolveTopic(input = '') {
  const text = String(input).toLowerCase();
  return topicIndex.find(entry => [entry.topic, ...(entry.aliases || [])].some(alias => text.includes(alias))) || null;
}
