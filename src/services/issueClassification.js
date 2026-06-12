// Issue classifications separate hard failures from smells:
//  - failure: deterministic WCAG/ARIA violation; must be fixed
//  - warning: likely problem or anti-pattern that may be legitimate
//  - note: legitimate-looking markup that still needs a manual check

export const FAILURE = 'failure';
export const WARNING = 'warning';
export const NOTE = 'note';

export function summariseIssues(issues = []) {
  const counts = { failures: 0, warnings: 0, notes: 0 };
  for (const issue of issues) {
    if (issue.classification === FAILURE) counts.failures += 1;
    else if (issue.classification === NOTE) counts.notes += 1;
    else counts.warnings += 1;
  }
  return counts;
}

export function decisionFor(issues = []) {
  const { failures, warnings } = summariseIssues(issues);
  if (failures) return 'fail';
  if (warnings) return 'warn';
  return 'pass';
}
