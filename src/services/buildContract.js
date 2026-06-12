import { LICENCE_NOTE } from './sourceBuilder.js';
import { findCriterion } from './wcagStore.js';
import { FAILURE, NOTE } from './issueClassification.js';

// Build-agent output mode: collapse a full advisory/validator response into a
// concise implementation contract a coding agent can act on directly.

function wcagLabel(entry) {
  if (typeof entry === 'string') {
    const criterion = findCriterion(entry);
    return criterion ? `${criterion.id} ${criterion.title} (Level ${criterion.level})` : entry;
  }
  return `${entry.id} ${entry.title} (Level ${entry.level})`;
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean).map(item => String(item).trim()).filter(Boolean))];
}

function issueLine(issue) {
  const where = issue.selector ? `${issue.selector}: ` : '';
  return `${where}${issue.suggested_fix || issue.message}`;
}

function contractFromIssues(result) {
  const issues = result.issues || [];
  const failures = issues.filter(i => i.classification === FAILURE);
  const warnings = issues.filter(i => i.classification !== FAILURE && i.classification !== NOTE);
  const notes = issues.filter(i => i.classification === NOTE);
  return {
    must: dedupe(failures.map(issueLine)),
    should: dedupe(warnings.map(issueLine)),
    tests: dedupe([
      ...(result.automated_checks || []),
      ...notes.map(issue => `Manually verify: ${issue.message}`),
      ...(result.human_review || []).map(item => `Manually verify: ${item}`)
    ]),
    wcag: dedupe((result.criteria || []).map(wcagLabel)),
    example_fix: result.corrected_css || failures[0]?.suggested_fix || warnings[0]?.suggested_fix || ''
  };
}

function contractFromAdvice(result) {
  const criteria = result.criteria || [];
  const direct = criteria.filter(c => (c.relevance || c.relationship) === 'direct');
  const supporting = criteria.filter(c => (c.relevance || c.relationship) !== 'direct');
  const implementation = result.implementation || {};
  const suppressed = result.confidence === 'low' || implementation.status === 'reduced';
  const must = suppressed
    ? ['Confirm the component pattern with a human accessibility reviewer before implementing; full guidance is suppressed at low confidence.']
    : dedupe([
        result.decision === 'fail' ? result.answer : null,
        ...direct.map(c => `${c.id} ${c.title}: ${c.reason || 'Meet this criterion.'}`),
        implementation.pattern,
        ...(implementation.keyboard || []),
        ...(implementation.attributes || []).map(attr => `Expose ${attr}.`)
      ]);
  const should = dedupe([
    ...supporting.map(c => `${c.id} ${c.title}: ${c.reason || 'Consider this criterion.'}`),
    ...(suppressed ? (implementation.candidate_patterns || []).map(p => `Candidate pattern: ${p.name} (${p.reference})`) : [])
  ]);
  return {
    must,
    should,
    tests: dedupe([
      ...(result.automated_checks || []),
      ...(result.human_review || []).map(item => `Manually verify: ${item}`)
    ]),
    wcag: dedupe(criteria.map(wcagLabel)),
    example_fix: suppressed ? '' : (implementation.example || implementation.css_hint || implementation.pattern || '')
  };
}

export function toBuildContract(result) {
  const contract = Array.isArray(result?.issues) ? contractFromIssues(result) : contractFromAdvice(result);
  return {
    output_mode: 'build_agent',
    ...contract,
    confidence: result.confidence || 'high',
    sources: dedupe(result.sources || []),
    licence_note: LICENCE_NOTE,
    trace: result.trace
  };
}

export function applyOutputMode(result, output_mode) {
  return output_mode === 'build_agent' ? toBuildContract(result) : result;
}
