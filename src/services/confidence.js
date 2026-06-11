export function confidenceFor(criteria = []) {
  if (criteria.some(c => c.relevance === 'direct' || c.relationship === 'direct')) return 'high';
  return criteria.length ? 'medium' : 'low';
}
