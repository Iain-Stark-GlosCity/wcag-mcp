import { findCriterion, searchCriteria } from '../services/wcagStore.js';

function criterionUrl(criterion) {
  return criterion?.sources?.spec || `https://www.w3.org/TR/WCAG22/#${criterion?.slug || ''}`;
}

function criterionToSearchResult(criterion) {
  return {
    id: criterion.id,
    title: `${criterion.id} ${criterion.title}`,
    url: criterionUrl(criterion)
  };
}

export const search = {
  name: 'search',
  description: 'Search WCAG success criteria and return citation-ready result IDs for ChatGPT.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'Search query.' } },
    required: ['query']
  },
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            url: { type: 'string' }
          },
          required: ['id', 'title', 'url']
        }
      }
    },
    required: ['results']
  },
  async handler(args) {
    const results = searchCriteria(args.query || '').slice(0, args.limit || 10).map(criterionToSearchResult);
    return { results };
  }
};

export const fetch = {
  name: 'fetch',
  description: 'Fetch full WCAG success criterion text for a result ID returned by search.',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'WCAG success criterion ID, for example 1.4.8.' } },
    required: ['id']
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      text: { type: 'string' },
      url: { type: 'string' },
      metadata: { type: 'object' }
    },
    required: ['id', 'title', 'text', 'url']
  },
  async handler(args) {
    const criterion = findCriterion(args.id);
    if (!criterion) {
      const e = new Error(`No WCAG criterion found for id ${args.id}.`);
      e.code = 'CRITERION_NOT_FOUND';
      e.hint = 'Use an id returned by the search tool, such as 1.4.8.';
      throw e;
    }

    const text = [
      `WCAG ${criterion.id}: ${criterion.title} (${criterion.level})`,
      criterion.normative_text,
      criterion.understanding?.intent ? `Intent: ${criterion.understanding.intent}` : '',
      criterion.understanding?.benefits?.length ? `Benefits: ${criterion.understanding.benefits.join(' ')}` : ''
    ].filter(Boolean).join('\n\n');

    return {
      id: criterion.id,
      title: `${criterion.id} ${criterion.title}`,
      text,
      url: criterionUrl(criterion),
      metadata: {
        level: criterion.level,
        guideline: criterion.guideline,
        principle: criterion.principle,
        sources: criterion.sources
      }
    };
  }
};
