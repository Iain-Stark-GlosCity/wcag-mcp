import { withSourceMetadata } from './sourceBuilder.js';
import { contrastDetails } from './colour.js';
import { FAILURE, WARNING, summariseIssues, decisionFor } from './issueClassification.js';
import { applyOutputMode } from './buildContract.js';

function declarations(css) {
  const out = [];
  const re = /([^{}]+)\{([^}]+)\}/g; let m;
  while ((m = re.exec(css || ''))) {
    const selector = m[1].trim();
    for (const part of m[2].split(';')) {
      const [prop, ...rest] = part.split(':');
      if (!prop || !rest.length) continue;
      out.push({ selector, property: prop.trim().toLowerCase(), value: rest.join(':').trim().toLowerCase() });
    }
  }
  return out;
}
// Selectors that are likely to be interactive controls (heuristic; CSS alone
// cannot be certain). Intentionally conservative to avoid false-positives on
// decorative elements such as .icon-image or .illustration.
function looksInteractive(selector) {
  return /\bbutton\b|\binput\b|\bselect\b|\btextarea\b|\ba\b|\[type=|\[role=|\.btn(?:\b|[-_])|\.cta\b/i.test(selector);
}

export function checkCssRule({ css = '', target_level = 'AA', context = '', output_mode } = {}) {
  const issues=[]; const decls=declarations(css);
  let reducedMotionFlagged = false;
  const hasReducedMotionQuery = /prefers-reduced-motion/.test(css);
  for (const d of decls) {
    if (d.property === 'text-align' && d.value.includes('justify')) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'high', classification:FAILURE, message:'Fully justified paragraph text conflicts with AAA visual presentation guidance.', criteria:['1.4.8'], suggested_fix:'Use text-align: left.' });
    if (d.property === 'line-height' && parseFloat(d.value) && parseFloat(d.value) < 1.5) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', classification:WARNING, message:'Line height is below the expected 1.5 build rule.', criteria:['1.4.8','1.4.12'], suggested_fix:'Use line-height: 1.5 or greater.' });
    if (d.property === 'max-width' && d.value.endsWith('ch') && parseFloat(d.value) > 80) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', classification:WARNING, message:'Body text measure is wider than the AAA visual presentation 80-character rule.', criteria:['1.4.8'], suggested_fix:'Use max-width: 80ch or less for body text.' });
    if (d.property === 'outline' && d.value.includes('none')) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'high', classification:WARNING, message:'Removing outlines can fail visible focus unless an equivalent replacement is present.', criteria:['2.4.7','2.4.11'], suggested_fix:'Provide a visible :focus-visible outline or box-shadow.' });
    // Target size: warn when a likely-interactive selector constrains width or height
    // below the WCAG 2.5.8 AA minimum of 24 CSS pixels.
    // Exceptions (inline links, user-agent defaults, essential constraints) must be
    // confirmed manually.
    if ((d.property === 'width' || d.property === 'height' || d.property === 'min-width' || d.property === 'min-height') && d.value.endsWith('px') && parseFloat(d.value) > 0 && parseFloat(d.value) < 24 && looksInteractive(d.selector)) {
      issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', classification:WARNING, message:`${d.property}: ${d.value} may place this control below the WCAG 2.5.8 minimum target size of 24 × 24 CSS pixels.`, criteria:['2.5.8'], suggested_fix:`Increase the ${d.property} to at least 24px, or ensure the target spacing offset brings the total to 24px. Exception: inline text links and controls sized by the browser default are exempt.` });
    }
    // Reduced motion: flag the first transition or animation rule when the
    // stylesheet contains no @media (prefers-reduced-motion) query.
    if (!reducedMotionFlagged && !hasReducedMotionQuery && (d.property === 'transition' || d.property === 'animation' || d.property.startsWith('animation-'))) {
      reducedMotionFlagged = true;
      issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', classification:WARNING, message:'Animated transitions are present but the stylesheet contains no @media (prefers-reduced-motion: reduce) query.', criteria:['2.3.3'], suggested_fix:`@media (prefers-reduced-motion: reduce) {\n  ${d.selector} { ${d.property}: none; }\n}` });
    }
  }
  const decision = decisionFor(issues);
  const result = withSourceMetadata({ decision, status: decision, summary: summariseIssues(issues), criteria:[...new Set(issues.flatMap(i=>i.criteria))], issues, corrected_css: issues.length ? 'p { line-height: 1.5; text-align: left; max-width: 80ch; }\n:focus-visible { outline: 3px solid #ffdd00; outline-offset: 2px; }' : css, context, target_level }, { tool:'accessibility_check_css_rule', criteria_used:[...new Set(issues.flatMap(i=>i.criteria))], scope: 'css_static' });
  return applyOutputMode(result, output_mode);
}

export function adviseColourContrast({ foreground, background, text_size='normal', target_level='AA', tokens={}, page_background='#ffffff', output_mode } = {}) {
  const criterionId = target_level==='AAA' ? '1.4.6' : '1.4.3';
  const criterionTitle = target_level==='AAA' ? 'Contrast (Enhanced)' : 'Contrast (Minimum)';
  let computed;
  try {
    computed = contrastDetails(foreground, background, { tokens, page_background });
  } catch (err) {
    return applyOutputMode(withSourceMetadata({
      answer: `The supplied colours could not be resolved to computed values: ${err.message} Provide hex/rgb/hsl values or a token map entry for each CSS variable.`,
      decision: 'human_review',
      criteria: [{ id: criterionId, title: criterionTitle, level: target_level }],
      implementation: {},
      automated_checks: [],
      human_review: ['Resolve the colour values (including CSS variables and design tokens) and re-run the contrast check.'],
      limitations: [`Unresolved colour input: ${err.message}`],
      confidence: 'low',
      sources: [`https://www.w3.org/TR/WCAG22/#${target_level==='AAA'?'contrast-enhanced':'contrast-minimum'}`],
      answer_markdown: `Could not compute contrast: ${err.message}`
    }, { tool:'accessibility_advise_colour_contrast', criteria_used:[criterionId], scope: 'contrast_calculation' }), output_mode);
  }
  const { ratio, foreground_resolved, background_resolved, composited } = computed;
  const required = target_level === 'AAA' ? (text_size === 'large' ? 4.5 : 7) : (text_size === 'large' ? 3 : 4.5);
  const pass = ratio >= required;
  const result = withSourceMetadata({
    answer: pass ? `Contrast ratio ${ratio.toFixed(2)}:1 meets ${target_level}.` : `Contrast ratio ${ratio.toFixed(2)}:1 is below the required ${required}:1 for ${target_level}.`,
    decision: pass?'pass':'fail',
    criteria:[{id: criterionId, title: criterionTitle, level: target_level}],
    implementation:{ ratio: Number(ratio.toFixed(2)), required_ratio: required, foreground_resolved, background_resolved, composited },
    automated_checks:['Contrast ratio is calculated deterministically from the computed colors (hex, rgb[a], hsl[a], named colours, and token-resolved CSS variables; translucent colours are composited over the effective background).'],
    human_review:[
      'Confirm text size/weight and whether the content is text, UI component, or graphical object.',
      ...(composited ? ['Translucent colours were composited over the supplied background; confirm the real stacking context matches.'] : [])
    ],
    limitations: composited ? ['Alpha compositing assumes the supplied background/page colour is directly behind the text.'] : [],
    confidence:'high',
    sources:[`https://www.w3.org/TR/WCAG22/#${target_level==='AAA'?'contrast-enhanced':'contrast-minimum'}`],
    answer_markdown:`Contrast ratio: ${ratio.toFixed(2)}:1 (foreground ${foreground_resolved} on background ${background_resolved})`
  }, { tool:'accessibility_advise_colour_contrast', criteria_used:[criterionId], scope: 'contrast_calculation' });
  return applyOutputMode(result, output_mode);
}
