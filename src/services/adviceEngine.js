import { findCriterion } from './wcagStore.js';
import { resolveTopic } from './topicResolver.js';
import { withSourceMetadata } from './sourceBuilder.js';
import { confidenceFor } from './confidence.js';

function criterionSummary(mapping) {
  const criterion = findCriterion(mapping.id);
  if (!criterion) return null;
  return { id: criterion.id, title: criterion.title, level: criterion.level, relevance: mapping.relationship || 'related', reason: mapping.reason, sources: criterion.sources };
}

function noMapping(tool) {
  return withSourceMetadata({
    answer: 'No direct WCAG success criterion was confidently identified. Human accessibility review required.',
    decision: 'human_review', criteria: [], implementation: {}, automated_checks: [], human_review: ['Ask a qualified accessibility reviewer to map the question before treating advice as WCAG-backed.'], limitations: ['No source-backed criterion means no authoritative WCAG answer.'], confidence: 'low', sources: [], answer_markdown: 'No direct WCAG success criterion was confidently identified. Human accessibility review required.'
  }, { tool, criteria_used: [] });
}

function buildAdvice(tool, answer, criteriaMappings, implementation, automated_checks, human_review, limitations = []) {
  const criteria = criteriaMappings.map(criterionSummary).filter(Boolean);
  if (!criteria.length) return noMapping(tool);
  const sources = criteria.flatMap(c => Object.values(c.sources));
  return withSourceMetadata({
    answer,
    decision: human_review?.length ? 'caution' : 'pass',
    criteria,
    implementation,
    automated_checks,
    human_review,
    limitations,
    confidence: confidenceFor(criteria),
    sources,
    answer_markdown: `### Answer\n${answer}\n\n### WCAG criteria\n${criteria.map(c => `- ${c.id} ${c.title} (Level ${c.level})`).join('\n')}`
  }, { tool, criteria_used: criteria.map(c => c.id) });
}

export function adviseTextLayout({ question = '', target_level = 'AA', context = '' } = {}) {
  const topic = resolveTopic(`${question} ${context} paragraph formatting text layout`);
  if (!topic) return noMapping('accessibility_advise_text_layout');
  return buildAdvice('accessibility_advise_text_layout',
    'Use left-aligned text, avoid full justification, keep body measure to about 80 characters, use at least 1.5 line spacing, and ensure user text-spacing overrides do not break the page.',
    topic.criteria,
    { css_hint: 'p { max-width: 80ch; line-height: 1.5; text-align: left; margin-block-end: 1.5em; }', target_level, context },
    ['Check CSS for text-align: justify.', 'Check body text max-width values above 80ch.', 'Check line-height below 1.5.', 'Test text-spacing override values from WCAG 1.4.12.'],
    ['Confirm reading order, meaningful headings, and whether user color/spacing preferences are supported in the actual design.'],
    ['AAA visual presentation contains user preference requirements that cannot be fully guaranteed by static CSS alone.']);
}

export function adviseFocusVisible({ target_level = 'AA', context = '' } = {}) {
  const topic = resolveTopic('focus indicator');
  return buildAdvice('accessibility_advise_focus_visible',
    'Provide a visible keyboard focus indicator for every interactive component, do not remove outlines unless an equally visible replacement is supplied, and make sure sticky headers, dialogs, or overlays do not obscure focus.',
    topic.criteria,
    { css_hint: ':focus-visible { outline: 3px solid #ffdd00; outline-offset: 2px; }', target_level, context },
    ['Detect outline: none without replacement.', 'Check :focus-visible or :focus rules exist for interactive controls.'],
    ['Keyboard test all interactive states and ensure the indicator is visible in context.']);
}

export function adviseFormErrors({ target_level = 'AA', context = '' } = {}) {
  const topic = resolveTopic('form errors');
  return buildAdvice('accessibility_advise_form_errors',
    'Identify each field in error, describe the problem in text, keep labels visible, provide useful correction suggestions when known, and link summaries to the invalid fields.',
    topic.criteria,
    { pattern: 'Error summary with links plus inline field error text associated with the input.', target_level, context },
    ['Check required labels.', 'Check aria-describedby/id association for error text.', 'Check error summary links target fields.'],
    ['Review whether suggestions are accurate, plain English, and do not compromise security.']);
}

export function adviseComponent({ component = '', target_level = 'AA', context = '' } = {}) {
  const lower = component.toLowerCase();
  if (lower.includes('error')) return adviseFormErrors({ target_level, context: `${context} ${component}` });
  if (lower.includes('body') || lower.includes('content')) return adviseTextLayout({ target_level, context: `${context} ${component}` });
  if (lower.includes('button') || lower.includes('accordion') || lower.includes('modal') || lower.includes('link')) return adviseFocusVisible({ target_level, context: `${context} ${component}` });
  return noMapping('accessibility_advise_component');
}
