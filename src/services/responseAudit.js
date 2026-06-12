import { withSourceMetadata } from './sourceBuilder.js';

// Response audit: deterministically checks a drafted assistant summary against
// the governance block of the finding it summarises, and reports drift —
// upgraded, downgraded, or broadened claims relative to what the tool found.

// Claims that assert page/site-level or compliance conclusions. Prohibited
// unless the audited finding's scope is a full rendered audit (no current
// tool produces that scope).
const BROADENED_CLAIMS = [
  /page (is|was) (fully )?accessible/i,
  /site (is|was) (fully )?accessible/i,
  /website (is|was) (fully )?accessible/i,
  /page (passes|fails)/i,
  /site (passes|fails)/i,
  /fully (wcag[- ])?(compliant|accessible)/i,
  /wcag (2\.\d )?compliant/i,
  /complies with wcag/i,
  /meets wcag(?! \d\.\d\.\d)/i,
  /accessibility audit (is |was )?(complete|passed)/i,
  /full(y| ) audited/i,
  /no (accessibility )?issues exist/i,
  /free of accessibility issues/i
];

// Claims that assert a failure. Prohibited when the classification is anything
// other than failure (upgrade drift).
const FAILURE_CLAIMS = [
  /fails wcag/i,
  /wcag failure/i,
  /is inaccessible/i,
  /not accessible/i,
  /violates wcag/i,
  /accessibility failure/i
];

// Claims that assert cleanliness. Prohibited when the classification is
// failure or warning (downgrade drift).
const CLEAN_CLAIMS = [
  /\bno issues\b/i,
  /nothing to fix/i,
  /all (checks|tests) passed/i,
  /fully passes/i,
  /\bis accessible\b/i,
  /passes accessibility/i
];

// The summary must report the classification the tool returned.
const CLASSIFICATION_TERMS = {
  failure: /fail/i,
  warning: /warn/i,
  note: /note|manual/i,
  pass: /pass/i,
  caution: /caution|needs? check/i,
  human_review: /review/i
};

// Returns the matched phrase unless it is locally negated ("not a WCAG
// failure", "this is not inaccessible").
function findClaim(text, pattern) {
  const match = text.match(pattern);
  if (!match) return null;
  const preceding = text.slice(Math.max(0, match.index - 24), match.index);
  if (/\b(not|no|never|isn'?t|aren'?t|wasn'?t|without|rather than)\b[^.;!?]*$/i.test(preceding)) return null;
  return match[0];
}

export function auditResponseSummary({ summary = '', governance = {} } = {}) {
  const text = String(summary);
  const classification = governance.finding_classification || 'not_tested';
  const scope = governance.scope || 'unknown';
  const violations = [];

  const renderedAudit = scope === 'rendered_audit';

  if (!renderedAudit) {
    for (const pattern of BROADENED_CLAIMS) {
      const evidence = findClaim(text, pattern);
      if (evidence) violations.push({ type: 'broadened_claim', classification: 'failure', evidence, rule: `The audited finding's scope is ${scope}; page/site-level or compliance claims exceed it.`, suggested_fix: 'Restate the claim using the finding\'s claim_boundary.can_claim sentence and its stated scope.' });
    }
  }

  if (classification !== 'failure') {
    for (const pattern of FAILURE_CLAIMS) {
      const evidence = findClaim(text, pattern);
      if (evidence) violations.push({ type: 'upgraded_claim', classification: 'failure', evidence, rule: `The audited finding is classified ${classification}; it must not be reported as a failure.`, suggested_fix: `Report the finding as a ${classification}, exactly as classified by the tool.` });
    }
  }

  if (classification === 'failure' || classification === 'warning') {
    for (const pattern of CLEAN_CLAIMS) {
      const evidence = findClaim(text, pattern);
      if (evidence) violations.push({ type: 'downgraded_claim', classification: 'failure', evidence, rule: `The audited finding is classified ${classification}; it must not be reported as clean.`, suggested_fix: `Report the ${classification} explicitly, including the affected criteria.` });
    }
  }

  const expectedTerm = CLASSIFICATION_TERMS[classification];
  if (expectedTerm && !expectedTerm.test(text)) {
    violations.push({ type: 'classification_omitted', classification: 'warning', evidence: null, rule: `The summary does not state the finding's classification (${classification}).`, suggested_fix: `State that the tool classified this finding as: ${classification}.` });
  }

  const hardDrift = violations.some(v => v.classification === 'failure');
  const decision = hardDrift ? 'fail' : violations.length ? 'warn' : 'pass';

  return withSourceMetadata({
    answer: decision === 'pass'
      ? 'The drafted summary is consistent with the audited finding\'s governance contract.'
      : decision === 'fail'
        ? `The drafted summary drifts beyond the audited finding: ${violations.filter(v => v.classification === 'failure').map(v => v.type).join(', ')}.`
        : 'The drafted summary has consistency concerns that should be revised before use.',
    decision,
    status: decision,
    audited_classification: classification,
    audited_scope: scope,
    violations,
    automated_checks: [
      'Detect page/site-level or compliance claims beyond the audited scope.',
      'Detect failure language when the finding is not classified as a failure.',
      'Detect clean/pass language when the finding is a failure or warning.',
      'Check the summary states the finding\'s classification.'
    ],
    human_review: decision === 'pass' ? [] : ['Revise the flagged statements and re-run this audit before publishing the summary.'],
    limitations: [
      'This is a deterministic phrase-based audit of the supplied summary text; it does not understand paraphrase or verify the underlying finding.',
      'Locally negated phrases ("not a WCAG failure") are excluded, but complex negation may not be detected.'
    ]
  }, { tool: 'accessibility_audit_summary', criteria_used: [], scope: 'response_audit' });
}
