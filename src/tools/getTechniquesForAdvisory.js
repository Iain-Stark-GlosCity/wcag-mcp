import { findCriterion } from '../services/wcagStore.js';

const TECHNOLOGY_PATHS = new Map([
  ['aria', 'aria'],
  ['css', 'css'],
  ['failures', 'failures'],
  ['general', 'general'],
  ['html', 'html'],
  ['pdf', 'pdf'],
  ['client side script', 'client-side-script'],
  ['client-side-script', 'client-side-script'],
  ['client-side-scripting', 'client-side-script'],
  ['client side scripting', 'client-side-script']
]);

function normalizeTechnology(value = '') {
  const key = String(value).trim().toLowerCase().replace(/_/g, '-');
  return TECHNOLOGY_PATHS.get(key) || TECHNOLOGY_PATHS.get(key.replace(/-/g, ' ')) || key;
}

function techniqueUrl(technique) {
  return `https://www.w3.org/WAI/WCAG22/Techniques/${normalizeTechnology(technique.technology)}/${technique.id}`;
}

function explicitTechniqueUrl(item) {
  return item?.url || item?.uri || item?.href || item?.source || null;
}

function isGeneratedPlaceholderTechnique(item, criterion) {
  if (!criterion || !item?.id) return false;
  const criterionDigits = String(criterion.id || '').replace(/\D/g, '');
  const idDigits = String(item.id || '').replace(/\D/g, '');
  const placeholderTitle = /^(sufficient|advisory|failure) technique for /i.test(item.title || '');

  return placeholderTitle && criterionDigits && idDigits === criterionDigits;
}

function techniqueLink(item, tech, criterion) {
  const explicitUrl = explicitTechniqueUrl(item);
  if (explicitUrl) return { url: explicitUrl, verified: true };
  if (isGeneratedPlaceholderTechnique(item, criterion)) return { url: null, verified: false };
  return { url: techniqueUrl(tech), verified: true };
}

function extractTechniques(items, { technology, criterion } = {}, seen = new Set()) {
  const out = [];
  if (!Array.isArray(items)) return out;

  for (const item of items) {
    if (item?.id) {
      const tech = {
        id: item.id,
        title: item.title || `Technique ${item.id}`,
        technology: normalizeTechnology(item.technology || technologyFromId(item.id))
      };
      const key = `${tech.id}:${tech.technology}`;
      if (!seen.has(key) && (!technology || tech.technology === technology)) {
        seen.add(key);
        out.push({ ...tech, ...techniqueLink(item, tech, criterion) });
      }
    }

    out.push(...extractTechniques(item?.techniques, { technology, criterion }, seen));
    out.push(...extractTechniques(item?.using, { technology, criterion }, seen));
    out.push(...extractTechniques(item?.and, { technology, criterion }, seen));

    if (Array.isArray(item?.groups)) {
      for (const group of item.groups) {
        out.push(...extractTechniques(group?.techniques, { technology, criterion }, seen));
      }
    }
  }

  return out;
}

function technologyFromId(id = '') {
  if (/^ARIA/i.test(id)) return 'aria';
  if (/^C\d+/i.test(id)) return 'css';
  if (/^F\d+/i.test(id)) return 'failures';
  if (/^G\d+/i.test(id)) return 'general';
  if (/^H\d+/i.test(id)) return 'html';
  if (/^PDF/i.test(id)) return 'pdf';
  if (/^SCR/i.test(id)) return 'client-side-script';
  return 'general';
}

function typeKey(type) {
  if (type === 'failure') return 'failures';
  return type;
}

function typeHeading(type) {
  if (type === 'failures') return 'Failure';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function textResponse(text, structuredContent = {}) {
  return {
    structuredContent,
    content: [{ type: 'text', text }]
  };
}

export const getTechniquesForAdvisory = {
  name: 'get-techniques-for-advisory',
  description: 'Returns sufficient, advisory, and failure technique IDs for one or more WCAG criteria, optionally filtered by technology. Includes W3C links only when the technique reference is verified rather than bundled placeholder data. Use this after accessibility_advise_component to enrich implementation guidance with concrete technique references.',
  inputSchema: {
    type: 'object',
    properties: {
      criteria: {
        type: 'array',
        description: 'One or more criterion reference IDs (for example: ["2.1.1", "4.1.2"]).',
        items: { type: 'string' }
      },
      technology: {
        type: 'string',
        description: 'Optional: filter by technology to get the most relevant techniques.',
        enum: ['html', 'aria', 'css', 'pdf', 'general', 'client-side-script', 'failures']
      },
      type: {
        type: 'string',
        description: 'Optional: limit to sufficient, advisory, or failure techniques.',
        enum: ['sufficient', 'advisory', 'failure']
      }
    },
    required: ['criteria']
  },
  async handler(args = {}) {
    const technology = args.technology ? normalizeTechnology(args.technology) : undefined;
    const sections = [];
    const structuredCriteria = [];

    for (const refId of args.criteria || []) {
      const criterion = findCriterion(refId);
      if (!criterion) {
        sections.push(`**${refId}** — not found\n`);
        structuredCriteria.push({ id: refId, found: false, techniques: {} });
        continue;
      }

      const techniques = criterion.techniques || {};
      const typesToInclude = args.type ? [typeKey(args.type)] : ['sufficient', 'advisory', 'failures'];
      const criterionTechniques = {};
      let section = `## ${criterion.id} ${criterion.title} (Level ${criterion.level})\n\n`;

      for (const type of typesToInclude) {
        const techs = extractTechniques(techniques[type], { technology, criterion });
        criterionTechniques[type] = techs;
        if (techs.length === 0) continue;

        section += `### ${typeHeading(type)}\n\n`;
        for (const technique of techs) {
          const linkLine = technique.url
            ? `\n  ${technique.url}`
            : '\n  No verified W3C technique URL is available for this bundled placeholder reference.';
          section += `- **${technique.id}** (${technique.technology}): ${technique.title}${linkLine}\n`;
        }
        section += '\n';
      }

      if (Object.values(criterionTechniques).every(techs => techs.length === 0)) {
        section += '_No matching techniques found for the selected filters._\n';
      }

      sections.push(section);
      structuredCriteria.push({
        id: criterion.id,
        title: criterion.title,
        level: criterion.level,
        found: true,
        techniques: criterionTechniques
      });
    }

    const techFilter = technology ? ` [${technology} only]` : '';
    return textResponse(
      `# Techniques for Advisory${techFilter}\n\n${sections.join('\n---\n\n')}`,
      { criteria: structuredCriteria, technology: technology || null, type: args.type || null }
    );
  }
};
