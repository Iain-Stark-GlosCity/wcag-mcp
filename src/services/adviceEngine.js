import { findCriterion } from './wcagStore.js';
import { resolveTopic } from './topicResolver.js';
import { withSourceMetadata } from './sourceBuilder.js';
import { confidenceFor } from './confidence.js';
import { matchAriaPattern, candidatePatterns } from './patternLibrary.js';
import { applyOutputMode } from './buildContract.js';

function criterionSummary(mapping) {
  const criterion = findCriterion(mapping.id);
  if (!criterion) return null;
  return { id: criterion.id, title: criterion.title, level: criterion.level, relevance: mapping.relationship || 'related', reason: mapping.reason, confidence_score: mapping.confidence_score, pattern: mapping.pattern, sources: criterion.sources };
}

function noMapping(tool, candidates = []) {
  const criteria = candidates.flatMap(candidate => candidate.pattern.criteria.map(mapping => ({ ...mapping, confidence_score: candidate.score, pattern: candidate.pattern.name }))).map(criterionSummary).filter(Boolean);
  const sources = criteria.flatMap(c => Object.values(c.sources));
  const candidateCriteria = criteria.map(c => ({ ...c, confidence: 'low' }));
  const reducedImplementation = candidates.length ? {
    status: 'reduced',
    note: 'Full implementation guidance is suppressed until the pattern is confirmed. The candidate ARIA pattern references below are safe starting points.',
    candidate_patterns: candidates.map(c => ({ name: c.pattern.name, apg: c.pattern.apg, reference: c.pattern.source }))
  } : {};
  return withSourceMetadata({
    answer: candidateCriteria.length ? 'No direct WCAG success criterion was confidently identified. Candidate criteria are provided for human review; full implementation advice is suppressed until the pattern is confirmed.' : 'No direct WCAG success criterion was confidently identified. Human accessibility review required.',
    decision: 'human_review',
    criterion_identification: { status: 'low_confidence', criteria: candidateCriteria, candidate_patterns: candidates.map(c => ({ id: c.pattern.id, name: c.pattern.name, confidence_score: c.score, evidence: c.evidence })) },
    criteria: candidateCriteria,
    implementation: reducedImplementation,
    automated_checks: [],
    human_review: ['Ask a qualified accessibility reviewer to confirm the pattern and criterion mapping before treating advice as WCAG-backed.'],
    limitations: ['Low-confidence criterion identification suppresses full implementation advice.'],
    confidence: 'low',
    sources,
    answer_markdown: candidateCriteria.length ? `### Candidate criteria for human review\n${candidateCriteria.map(c => `- ${c.id} ${c.title} (low confidence)`).join('\n')}` : 'No direct WCAG success criterion was confidently identified. Human accessibility review required.'
  }, { tool, criteria_used: candidateCriteria.map(c => c.id) });
}

function buildAdvice(tool, answer, criteriaMappings, implementation, automated_checks, human_review, limitations = [], extras = {}) {
  const criteria = criteriaMappings.map(criterionSummary).filter(Boolean);
  if (!criteria.length) return noMapping(tool);
  const confidence = confidenceFor(criteria);
  const sources = [...criteria.flatMap(c => Object.values(c.sources)), ...(extras.sources || [])];
  const implementationAdvice = confidence === 'low' ? {} : implementation;
  return withSourceMetadata({
    answer,
    decision: human_review?.length ? 'caution' : 'pass',
    criterion_identification: { status: 'identified', confidence, criteria },
    criteria,
    implementation: implementationAdvice,
    automated_checks,
    human_review,
    limitations: confidence === 'low' ? [...limitations, 'Implementation advice suppressed because criterion identification is low confidence.'] : limitations,
    confidence,
    sources,
    pattern: extras.pattern,
    answer_markdown: `### Applicable criteria\n${criteria.map(c => `- ${c.id} ${c.title} (Level ${c.level})`).join('\n')}\n\n### Implementation guidance\n${confidence === 'low' ? 'Suppressed pending human review.' : answer}`
  }, { tool, criteria_used: criteria.map(c => c.id), pattern: extras.pattern?.id });
}

export function adviseTextLayout({ question = '', target_level = 'AA', context = '', output_mode } = {}) {
  const topic = resolveTopic(`${question} ${context} paragraph formatting text layout`);
  if (!topic) return applyOutputMode(noMapping('accessibility_advise_text_layout'), output_mode);
  return applyOutputMode(buildAdvice('accessibility_advise_text_layout',
    'Use left-aligned text, avoid full justification, keep body measure to about 80 characters, use at least 1.5 line spacing, and ensure user text-spacing overrides do not break the page.',
    topic.criteria,
    { css_hint: 'p { max-width: 80ch; line-height: 1.5; text-align: left; margin-block-end: 1.5em; }', target_level, context },
    ['Check CSS for text-align: justify.', 'Check body text max-width values above 80ch.', 'Check line-height below 1.5.', 'Test text-spacing override values from WCAG 1.4.12.'],
    ['Confirm reading order, meaningful headings, and whether user color/spacing preferences are supported in the actual design.'],
    ['AAA visual presentation contains user preference requirements that cannot be fully guaranteed by static CSS alone.']), output_mode);
}

export function adviseFocusVisible({ target_level = 'AA', context = '', output_mode } = {}) {
  const topic = resolveTopic('focus indicator');
  return applyOutputMode(buildAdvice('accessibility_advise_focus_visible',
    'Provide a visible keyboard focus indicator for every interactive component, do not remove outlines unless an equally visible replacement is supplied, and make sure sticky headers, dialogs, or overlays do not obscure focus.',
    topic.criteria,
    { css_hint: ':focus-visible { outline: 3px solid #ffdd00; outline-offset: 2px; }', target_level, context },
    ['Detect outline: none without replacement.', 'Check :focus-visible or :focus rules exist for interactive controls.'],
    ['Keyboard test all interactive states and ensure the indicator is visible in context.']), output_mode);
}

export function adviseFormErrors({ target_level = 'AA', context = '', output_mode } = {}) {
  const topic = resolveTopic('form errors');
  return applyOutputMode(buildAdvice('accessibility_advise_form_errors',
    'Identify each field in error, describe the problem in text, keep labels visible, provide useful correction suggestions when known, and link summaries to the invalid fields.',
    topic.criteria,
    { pattern: 'Error summary with links plus inline field error text associated with the input.', target_level, context },
    ['Check required labels.', 'Check aria-describedby/id association for error text.', 'Check error summary links target fields.'],
    ['Review whether suggestions are accurate, plain English, and do not compromise security.']), output_mode);
}

export function adviseComponent({ component = '', target_level = 'AA', context = '', html = '', output_mode } = {}) {
  const patternMatch = matchAriaPattern({ component, context, html });
  if (patternMatch && patternMatch.score >= 0.5) {
    const { pattern, score, evidence } = patternMatch;
    return applyOutputMode(buildAdvice('accessibility_advise_component',
      `${pattern.name} matches the ${pattern.apg}. First apply the identified WCAG criteria, then use the implementation guidance for this pattern.`,
      pattern.criteria,
      { ...pattern.implementation, target_level, context, html_snippet_received: Boolean(html) },
      ['Check keyboard operation against the named ARIA pattern.', 'Check required role/name/value states and relationships.', 'Run accessibility_validate_aria_attributes on the HTML snippet when available.'],
      ['Confirm the component behaviour in a browser with keyboard and assistive technology smoke testing.'],
      ['ARIA pattern matching is based on supplied prose and/or HTML; it does not execute JavaScript.'],
      { pattern: { id: pattern.id, name: pattern.name, apg: pattern.apg, confidence_score: score, evidence }, sources: [pattern.source] }), output_mode);
  }

  const lower = `${component} ${context} ${html}`.toLowerCase();
  if (lower.includes('error')) return adviseFormErrors({ target_level, context: `${context} ${component}`, output_mode });
  if (lower.includes('body') || lower.includes('content')) return adviseTextLayout({ target_level, context: `${context} ${component}`, output_mode });
  return applyOutputMode(noMapping('accessibility_advise_component', candidatePatterns({ component, context, html })), output_mode);
}
