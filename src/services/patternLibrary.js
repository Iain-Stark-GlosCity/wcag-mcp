export const ariaPatterns = [
  {
    id: 'disclosure-button',
    name: 'Disclosure button',
    apg: 'Disclosure Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    keywords: ['disclosure', 'show hide', 'expand collapse', 'accordion', 'dropdown', 'flyout'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Disclosure controls must be operable with a keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'The control must expose its accessible name, role, and expanded/collapsed state.' },
      { id: '2.4.7', relationship: 'related', reason: 'Keyboard users need a visible focus indicator on the trigger.' }
    ],
    implementation: {
      pattern: 'Use a native button as the trigger, point aria-controls at the disclosed region, and update aria-expanded when the region opens or closes.',
      keyboard: ['Enter and Space toggle the disclosure.', 'Tab moves to the next focusable element in DOM order.'],
      attributes: ['button[aria-expanded]', 'button[aria-controls]', 'id on the controlled region']
    }
  },
  {
    id: 'navigation-flyout',
    name: 'Navigation with flyout disclosure',
    apg: 'Disclosure Pattern for navigation menus',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
    keywords: ['dropdown nav', 'dropdown navigation', 'flyout nav', 'flyout navigation', 'submenu', 'nav dropdown', 'navigation dropdown', 'mega menu'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Users must be able to open, close, and traverse flyout navigation with a keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Flyout triggers need a programmatic role, name, and expanded/collapsed state.' },
      { id: '2.4.3', relationship: 'related', reason: 'Focus order through top-level and flyout links must remain meaningful.' },
      { id: '2.4.7', relationship: 'related', reason: 'The focused navigation item or trigger must have visible focus.' }
    ],
    implementation: {
      pattern: 'Model each flyout as a disclosure in a nav element rather than a desktop-application menu unless it behaves like one.',
      keyboard: ['Tab reaches each top-level link or disclosure button.', 'Enter or Space toggles the flyout button.', 'Escape closes an open flyout and returns focus to its trigger.'],
      attributes: ['nav with an accessible label when needed', 'button[aria-expanded][aria-controls] for submenus', 'aria-current on the current page link when applicable']
    }
  },
  {
    id: 'tabs',
    name: 'Tab panel',
    apg: 'Tabs Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    keywords: ['tab panel', 'tabs', 'tabpanel'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Tabs must be operable from the keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Tabs expose tab, tablist, tabpanel roles, selected state, names, and relationships.' },
      { id: '2.4.3', relationship: 'related', reason: 'Focus movement between tabs and panels must be meaningful.' }
    ],
    implementation: {
      pattern: 'Use tablist, tab, and tabpanel roles only when the component behaves as tabs.',
      keyboard: ['Arrow keys move between tabs.', 'Tab moves from the active tab into the active panel or next focusable element.'],
      attributes: ['role="tablist"', 'role="tab" with aria-selected', 'role="tabpanel" labelled by the active tab']
    }
  },
  {
    id: 'combobox',
    name: 'Combobox',
    apg: 'Combobox Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    keywords: ['combobox', 'autocomplete', 'typeahead', 'select search'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Combobox input, popup, and options must be keyboard operable.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Combobox role, name, expanded state, active descendant, and option state must be exposed correctly.' },
      { id: '3.3.2', relationship: 'related', reason: 'Inputs need labels or instructions.' }
    ],
    implementation: {
      pattern: 'Use a native select where possible; otherwise follow the ARIA combobox pattern completely.',
      keyboard: ['Typing filters or changes the value as designed.', 'Arrow keys move through options.', 'Enter accepts an option.', 'Escape closes the popup.'],
      attributes: ['role="combobox"', 'aria-expanded', 'aria-controls', 'aria-activedescendant when focus remains on the input']
    }
  },
  {
    id: 'dialog-modal',
    name: 'Modal dialog',
    apg: 'Dialog Modal Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    keywords: ['modal', 'dialog', 'popup dialog'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Dialog controls and close actions must be keyboard operable.' },
      { id: '2.1.2', relationship: 'direct', reason: 'Keyboard focus must not be trapped without a way to close or leave the dialog.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Dialog role, modal state, and accessible name must be exposed.' }
    ],
    implementation: {
      pattern: 'Use the native dialog element where suitable or role="dialog" with aria-modal="true".',
      keyboard: ['Move focus into the dialog when it opens.', 'Keep tab focus within the modal while open.', 'Escape closes the dialog unless there is a documented exception.'],
      attributes: ['role="dialog" or dialog element', 'aria-modal="true" for modal dialogs', 'aria-labelledby or aria-label']
    }
  }
];

function textOf(input = '') {
  return String(input).toLowerCase().replace(/[-_]+/g, ' ');
}

export function htmlSignals(html = '') {
  const text = String(html).toLowerCase();
  const signals = [];
  if (!text.trim()) return signals;
  if (/<nav\b/.test(text) && /(aria-expanded|submenu|dropdown|flyout)/.test(text)) signals.push('navigation-flyout');
  // Inaccessible markup is still diagnostic: a nested link list inside a list
  // item, or flyout-style class names, identify a navigation disclosure that
  // has not been augmented with ARIA yet.
  if (/<li\b[^>]*>[\s\S]*?<ul\b/.test(text) && /<a\b/.test(text)) signals.push('navigation-flyout');
  if (/class=["'][^"']*(sub-?nav|submenu|drop-?down|flyout|mega-?menu|has-children)[^"']*["']/.test(text) && /<(ul|li|a|button)\b/.test(text)) signals.push('navigation-flyout');
  if (/(aria-expanded|aria-controls)/.test(text) && /<button\b/.test(text)) signals.push('disclosure-button');
  if (/role=["']tablist["']|role=["']tab["']|role=["']tabpanel["']/.test(text)) signals.push('tabs');
  if (/role=["']combobox["']|<input[^>]+list=|autocomplete/.test(text)) signals.push('combobox');
  if (/<dialog\b|role=["']dialog["']|aria-modal=["']true["']/.test(text)) signals.push('dialog-modal');
  return signals;
}

export function matchAriaPattern({ component = '', context = '', html = '' } = {}) {
  const haystack = textOf(`${component} ${context}`);
  const byHtml = htmlSignals(html);
  const matches = ariaPatterns.map(pattern => {
    let score = 0;
    const evidence = [];
    if (byHtml.includes(pattern.id)) { score += pattern.id === 'navigation-flyout' ? 0.85 : 0.75; evidence.push('html'); }
    for (const keyword of pattern.keywords) {
      if (haystack.includes(keyword)) { score += keyword.split(' ').length > 1 ? 0.55 : 0.35; evidence.push(`keyword:${keyword}`); }
    }
    return { pattern, score: Math.min(score, 1), evidence };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score);

  return matches[0] || null;
}

export function candidatePatterns({ component = '', context = '', html = '' } = {}) {
  const direct = matchAriaPattern({ component, context, html });
  if (direct) return [direct];
  const haystack = textOf(`${component} ${context} ${html}`);
  if (/(menu|button|link|interactive|widget|navigation|input|select)/.test(haystack)) {
    return ariaPatterns
      .filter(pattern => pattern.id === 'navigation-flyout' || pattern.id === 'disclosure-button' || pattern.id === 'combobox')
      .map(pattern => ({ pattern, score: 0.25, evidence: ['broad interactive component clue'] }));
  }
  return [];
}
