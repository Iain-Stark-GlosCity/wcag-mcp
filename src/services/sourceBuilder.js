export const SOURCE_BASIS = 'W3C WCAG 2.2 and Understanding WCAG 2.2';
export const LICENCE_NOTE = 'WCAG material copied from or derived from W3C material. See ATTRIBUTION.md.';

export function criterionSources(criterion) {
  if (!criterion) return {};
  return {
    spec: `https://www.w3.org/TR/WCAG22/#${criterion.slug || criterion.id}`,
    understanding: `https://www.w3.org/WAI/WCAG22/Understanding/${criterion.slug || criterion.id}.html`,
    quickref: `https://www.w3.org/WAI/WCAG22/quickref/#${criterion.slug || criterion.id}`
  };
}

export function withSourceMetadata(payload, trace = {}) {
  return {
    ...payload,
    source_basis: SOURCE_BASIS,
    licence_note: LICENCE_NOTE,
    trace: {
      wcag_data_version: '2.2',
      data_build_date: '2026-06-11',
      rule_version: '0.2.0',
      ...trace
    }
  };
}
