import { withSourceMetadata } from './sourceBuilder.js';
import { ratioFor } from './colour.js';

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
export function checkCssRule({ css = '', target_level = 'AA', context = '' } = {}) {
  const issues=[]; const decls=declarations(css);
  for (const d of decls) {
    if (d.property === 'text-align' && d.value.includes('justify')) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'high', message:'Fully justified paragraph text conflicts with AAA visual presentation guidance.', criteria:['1.4.8'], suggested_fix:'Use text-align: left.' });
    if (d.property === 'line-height' && parseFloat(d.value) && parseFloat(d.value) < 1.5) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', message:'Line height is below the expected 1.5 build rule.', criteria:['1.4.8','1.4.12'], suggested_fix:'Use line-height: 1.5 or greater.' });
    if (d.property === 'max-width' && d.value.endsWith('ch') && parseFloat(d.value) > 80) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'medium', message:'Body text measure is wider than the AAA visual presentation 80-character rule.', criteria:['1.4.8'], suggested_fix:'Use max-width: 80ch or less for body text.' });
    if (d.property === 'outline' && d.value.includes('none')) issues.push({ selector:d.selector, property:d.property, value:d.value, severity:'high', message:'Removing outlines can fail visible focus unless an equivalent replacement is present.', criteria:['2.4.7','2.4.11'], suggested_fix:'Provide a visible :focus-visible outline or box-shadow.' });
  }
  return withSourceMetadata({ decision: issues.length?'fail':'pass', status: issues.length?'fail':'pass', criteria:[...new Set(issues.flatMap(i=>i.criteria))], issues, corrected_css: issues.length ? 'p { line-height: 1.5; text-align: left; max-width: 80ch; }\n:focus-visible { outline: 3px solid #ffdd00; outline-offset: 2px; }' : css, context, target_level }, { tool:'accessibility_check_css_rule', criteria_used:[...new Set(issues.flatMap(i=>i.criteria))] });
}

export function adviseColourContrast({ foreground, background, text_size='normal', target_level='AA' } = {}) {
  const ratio = ratioFor(foreground, background);
  const required = target_level === 'AAA' ? (text_size === 'large' ? 4.5 : 7) : (text_size === 'large' ? 3 : 4.5);
  const pass = ratio >= required;
  return withSourceMetadata({ answer: pass ? `Contrast ratio ${ratio.toFixed(2)}:1 meets ${target_level}.` : `Contrast ratio ${ratio.toFixed(2)}:1 is below the required ${required}:1 for ${target_level}.`, decision: pass?'pass':'fail', criteria:[{id: target_level==='AAA'?'1.4.6':'1.4.3', title: target_level==='AAA'?'Contrast (Enhanced)':'Contrast (Minimum)', level: target_level}], implementation:{ ratio: Number(ratio.toFixed(2)), required_ratio: required }, automated_checks:['Contrast ratio is calculated deterministically from the supplied colors.'], human_review:['Confirm text size/weight and whether the content is text, UI component, or graphical object.'], limitations:[], confidence:'high', sources:[`https://www.w3.org/TR/WCAG22/#${target_level==='AAA'?'contrast-enhanced':'contrast-minimum'}`], answer_markdown:`Contrast ratio: ${ratio.toFixed(2)}:1` }, { tool:'accessibility_advise_colour_contrast', criteria_used:[target_level==='AAA'?'1.4.6':'1.4.3'] });
}
