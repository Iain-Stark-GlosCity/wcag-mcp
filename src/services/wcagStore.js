import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { criterionSources } from './sourceBuilder.js';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = require(join(__dirname, '..', '..', 'data', 'wcag.json'));

function stripHtml(value = '') { return String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
function normalizeTerm(value = '') { return stripHtml(value).toLowerCase().replace(/^dfn-/, '').replace(/[\s_-]+/g, ' ').trim(); }

function buildGlossary() {
  const seen = new Set();
  return (raw.terms || [])
    .map(t => {
      const term = stripHtml(t.term || t.name || String(t.id || '').replace(/^dfn-/, '').replace(/-/g, ' '));
      const definition = stripHtml(t.definition || t.content || '');
      return { term, definition, id: t.id };
    })
    .filter(t => t.term && t.definition)
    .filter(t => {
      const key = normalizeTerm(t.term);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ term, definition }) => ({ term, definition }));
}

function buildCriteria() {
  const out = [];
  for (const principle of raw.principles || []) {
    for (const guideline of principle.guidelines || []) {
      for (const sc of guideline.successcriteria || []) {
        const criterion = {
          id: sc.num,
          slug: sc.id,
          title: sc.handle,
          level: sc.level,
          principle: { id: principle.num, title: principle.handle },
          guideline: { id: guideline.num, title: guideline.handle },
          versions: sc.versions || ['2.2'],
          normative_text: stripHtml(sc.title || sc.content || ''),
          details: sc.details || [],
          understanding: sc.understanding || { brief: {}, intent: '', benefits: [], examples: [], resources: [] },
          techniques: sc.techniques || { sufficient: [], advisory: [], failures: [] }
        };
        criterion.sources = criterionSources(criterion);
        out.push(criterion);
      }
    }
  }
  return out;
}

export const wcagRaw = raw;
export const criteria = buildCriteria();
export const glossary = buildGlossary();

export function stats() {
  return {
    principles: raw.principles?.length || 0,
    guidelines: raw.principles?.reduce((sum, p) => sum + (p.guidelines?.length || 0), 0) || 0,
    criteria: criteria.length,
    glossary_terms: glossary.length,
    techniques: criteria.reduce((sum, c) => sum + Object.values(c.techniques || {}).flat().length, 0)
  };
}

export function findCriterion(ref) {
  if (!ref) return null;
  const needle = String(ref).toLowerCase();
  return criteria.find(c => c.id === needle || c.slug === needle || `${c.id} ${c.title}`.toLowerCase() === needle) || null;
}

export function searchCriteria(query = '', filters = {}) {
  const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  return criteria
    .filter(c => !filters.level || c.level === filters.level)
    .map(c => {
      const haystack = `${c.id} ${c.slug} ${c.title} ${c.normative_text} ${c.guideline.title}`.toLowerCase();
      const score = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0) + (haystack.includes(String(query).toLowerCase()) ? 2 : 0);
      return { criterion: c, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ criterion }) => criterion);
}

export function getTechniques(ref, type) {
  const criterion = findCriterion(ref);
  if (!criterion) return null;
  if (type) return criterion.techniques?.[type] || [];
  return criterion.techniques || { sufficient: [], advisory: [], failures: [] };
}

export function findGlossaryTerm(term) {
  const needle = normalizeTerm(term);
  if (!needle) return null;
  return glossary.find(t => {
    const candidate = normalizeTerm(t.term);
    return candidate === needle || candidate.includes(needle);
  }) || null;
}
