// Governance contract: every MCP response carries a machine-readable
// interpretation contract so that downstream agents and human reviewers
// cannot inadvertently upgrade, downgrade, or broaden findings.

export const SCOPE = {
  STATIC_SNIPPET: 'static_snippet',
  CSS_STATIC: 'css_static',
  CONTRAST_CALCULATION: 'contrast_calculation',
  COMPONENT_GUIDANCE: 'component_guidance',
  WCAG_REFERENCE: 'wcag_reference'
};

// Stable decision taxonomy — the complete set of valid values across all tools.
export const DECISION = {
  PASS: 'pass',
  FAIL: 'fail',
  WARN: 'warn',
  CAUTION: 'caution',
  HUMAN_REVIEW: 'human_review',
  NOT_APPLICABLE: 'not_applicable',
  NOT_TESTED: 'not_tested'
};

const FINDING_CLASSIFICATION = {
  pass: 'pass',
  fail: 'failure',
  warn: 'warning',
  caution: 'caution',
  human_review: 'human_review',
  not_applicable: 'not_applicable',
  not_tested: 'not_tested'
};

// What the assistant must / must not do when summarising any response from this MCP.
// This is static across all tools; the claim_boundary below is finding-specific.
const ASSISTANT_INSTRUCTION = {
  must: [
    'Report the finding_classification exactly as returned in this governance block.',
    'Preserve the stated scope and limitations when summarising to stakeholders.',
    'Distinguish the MCP finding from your own interpretation in any summary.',
    'Use release_gate.gate_status when advising whether to block a release.',
    'Cite the specific criteria IDs and scope when quoting a finding.'
  ],
  must_not: [
    'Upgrade a warning to a failure.',
    'Upgrade caution or human_review to pass or fail.',
    'Treat a pass for one specific check as evidence of broader compliance.',
    'Omit scope or limitations when summarising findings to stakeholders.',
    'Claim WCAG compliance unless the scope is a complete rendered audit.'
  ]
};

const SCOPE_NEXT_EVIDENCE = {
  static_snippet: [
    'Rendered browser test with assistive technology',
    'Keyboard navigation test',
    'Focus order verification',
    'Screen reader smoke test (NVDA, VoiceOver, or JAWS)'
  ],
  css_static: [
    'Computed CSS check in a browser at all target breakpoints',
    'Visual rendering test for focus indicators and spacing',
    'Keyboard operability and focus indicator test'
  ],
  contrast_calculation: [
    'Verify text size and weight in the rendered component',
    'Test all interactive states (hover, focus, active, disabled)',
    'Check graphical objects and UI component boundaries against 1.4.11 if relevant'
  ],
  component_guidance: [
    'Keyboard navigation test against the named ARIA pattern',
    'Assistive technology smoke test (NVDA+Chrome, VoiceOver+Safari)',
    'Focus order and focus indicator verification',
    'Visual and rendered-DOM review'
  ],
  wcag_reference: [
    'Implement the guidance and run a technical audit',
    'Keyboard operability and AT smoke test in the implemented component'
  ]
};

const SCOPE_CANNOT_CLAIM = {
  static_snippet: [
    'Do not say this page fails WCAG.',
    'Do not say this component is inaccessible.',
    'Do not say this constitutes a full accessibility audit.',
    'Do not say no issues exist beyond this static check.'
  ],
  css_static: [
    'Do not say the stylesheet is WCAG compliant.',
    'Do not say the rendered page has no accessibility issues.',
    'Do not say this constitutes a full accessibility audit.',
    'Do not say no issues exist beyond these specific CSS properties.'
  ],
  contrast_calculation: [
    'Do not say the component is accessible.',
    'Do not say all colour states have been tested.',
    'Do not say the page is accessible.',
    'Do not say all text in this component meets this ratio.'
  ],
  component_guidance: [
    'Do not say the component is implemented correctly.',
    'Do not say the implementation is WCAG compliant.',
    'Do not say this constitutes a full accessibility audit.',
    'Do not say the site is accessible.'
  ],
  wcag_reference: [
    'Do not say the implementation meets this criterion.',
    'Do not say the site is WCAG compliant.',
    'Do not treat this as a technical audit finding.',
    'Do not say no action is required.'
  ]
};

function criteriaLabel(result) {
  const ids = (result.criteria || []).map(c => (typeof c === 'string' ? c : c.id)).filter(Boolean);
  if (!ids.length) return null;
  return ids.length <= 3 ? ids.join(', ') : `${ids.slice(0, 3).join(', ')} and others`;
}

function buildCanClaim(result, scope) {
  const decision = result.decision || 'not_applicable';
  const crit = criteriaLabel(result);

  if (scope === 'contrast_calculation') {
    const ratio = result.implementation?.ratio;
    const fg = result.implementation?.foreground_resolved;
    const bg = result.implementation?.background_resolved;
    const pair = fg && bg ? ` (${fg} on ${bg})` : '';
    const ref = crit ? ` for ${crit}` : '';
    if (decision === 'pass') return `The computed contrast ratio of ${ratio}:1${pair} passes${ref} for this specific colour pair.`;
    if (decision === 'fail') return `The computed contrast ratio of ${ratio}:1${pair} does not meet the required ratio${ref} for this specific colour pair.`;
    return `The colour values could not be resolved to a computed ratio; no contrast determination was made${ref}.`;
  }

  if (scope === 'static_snippet') {
    const f = result.summary?.failures ?? 0;
    const w = result.summary?.warnings ?? 0;
    const n = result.summary?.notes ?? 0;
    const ref = crit ? ` related to ${crit}` : '';
    if (decision === 'pass') return `The static HTML snippet check found no issues${ref} in the supplied fragment.`;
    if (decision === 'fail') return `The static HTML snippet check found ${f} failure(s)${w ? `, ${w} warning(s)` : ''}${n ? `, ${n} note(s)` : ''}${ref} in the supplied fragment.`;
    if (decision === 'warn') return `The static HTML snippet check found ${w} warning(s)${ref} in the supplied fragment. These are not confirmed WCAG failures.`;
    return `The static HTML snippet check did not produce a definitive finding${ref}.`;
  }

  if (scope === 'css_static') {
    const f = result.summary?.failures ?? 0;
    const w = result.summary?.warnings ?? 0;
    const ref = crit ? ` related to ${crit}` : '';
    if (decision === 'pass') return 'The static CSS check found no issues with the supplied rules.';
    if (decision === 'fail') return `The static CSS check found ${f} failure(s) in the supplied rules${ref}.`;
    if (decision === 'warn') return `The static CSS check found ${w} warning(s)${ref}. These require human review to confirm.`;
    return `The static CSS check did not produce a definitive finding.`;
  }

  if (scope === 'component_guidance') {
    const pattern = result.pattern?.name;
    if (decision === 'human_review') return `No component pattern was identified with sufficient confidence${crit ? ` for ${crit}` : ''}. Human review is required.`;
    const subject = pattern ? `the ${pattern} pattern` : 'this component';
    const against = crit ? ` against ${crit}` : '';
    return `Implementation guidance for ${subject} has been provided${against}. This is guidance, not a test result.`;
  }

  // wcag_reference — try to surface what was actually returned
  const subjectId = result.criterion?.id
    || result.results?.slice(0, 3).map(r => r.id).join(', ')
    || result.term?.term
    || crit;
  const subject = subjectId ? `criterion ${subjectId}` : 'the requested criteria';
  return `WCAG 2.2 normative reference data has been returned for ${subject}. This is not a test finding.`;
}

function buildReleaseGate(result) {
  const decision = result.decision || 'not_applicable';
  const failures = result.failures || (result.issues || []).filter(i => i.classification === 'failure');
  const blockingFindings = failures.map(issue => ({
    criterion: (issue.criteria || ['unknown'])[0],
    reason: issue.message || issue.suggested_fix || 'Deterministic failure detected.'
  }));

  if (decision === 'fail') return { gate_status: 'block', blocks_release: true, blocking_findings: blockingFindings };
  if (decision === 'warn') return { gate_status: 'allow_with_warning', blocks_release: false, blocking_findings: [] };
  if (decision === 'caution' || decision === 'human_review') return { gate_status: 'manual_review_required', blocks_release: false, blocking_findings: [] };
  if (decision === 'pass') return { gate_status: 'allow', blocks_release: false, blocking_findings: [] };
  return { gate_status: 'not_applicable', blocks_release: false, blocking_findings: [] };
}

export function buildGovernance(result, scope) {
  const decision = result.decision || 'not_applicable';
  return {
    finding_classification: FINDING_CLASSIFICATION[decision] || decision,
    scope,
    confidence: result.confidence || 'high',
    claim_boundary: {
      can_claim: buildCanClaim(result, scope),
      cannot_claim: SCOPE_CANNOT_CLAIM[scope] || SCOPE_CANNOT_CLAIM.wcag_reference
    },
    release_gate: buildReleaseGate(result),
    next_evidence_required: SCOPE_NEXT_EVIDENCE[scope] || [],
    assistant_handling_instruction: ASSISTANT_INSTRUCTION
  };
}
