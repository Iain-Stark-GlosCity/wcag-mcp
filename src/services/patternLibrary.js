export const ariaPatterns = [
  {
    id: 'disclosure-button',
    name: 'Disclosure button',
    apg: 'Disclosure Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    keywords: ['disclosure', 'show hide', 'expand collapse', 'dropdown', 'flyout', 'show more'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Disclosure controls must be operable with a keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'The control must expose its accessible name, role, and expanded/collapsed state.' },
      { id: '2.4.7', relationship: 'related', reason: 'Keyboard users need a visible focus indicator on the trigger.' }
    ],
    implementation: {
      pattern: 'Use a native button as the trigger, point aria-controls at the disclosed region, and update aria-expanded when the region opens or closes.',
      keyboard: ['Enter and Space toggle the disclosure.', 'Tab moves to the next focusable element in DOM order.'],
      attributes: ['button[aria-expanded]', 'button[aria-controls]', 'id on the controlled region'],
      example: '<button aria-expanded="false" aria-controls="details">More details</button>\n<div id="details" hidden>…</div>'
    }
  },
  {
    id: 'navigation-flyout',
    name: 'Navigation with flyout disclosure',
    apg: 'Disclosure Pattern for navigation menus',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
    htmlWeight: 0.85,
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
      attributes: ['nav with an accessible label when needed', 'button[aria-expanded][aria-controls] for submenus', 'aria-current on the current page link when applicable'],
      example: '<nav aria-label="Main">\n  <button aria-expanded="false" aria-controls="products-menu">Products</button>\n  <ul id="products-menu" hidden>…</ul>\n</nav>'
    }
  },
  {
    id: 'tabs',
    name: 'Tab panel',
    apg: 'Tabs Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    keywords: ['tab panel', 'tabs', 'tabpanel', 'tabbed interface', 'tab list'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Tabs must be operable from the keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Tabs expose tab, tablist, tabpanel roles, selected state, names, and relationships.' },
      { id: '2.4.3', relationship: 'related', reason: 'Focus movement between tabs and panels must be meaningful.' }
    ],
    implementation: {
      pattern: 'Use tablist, tab, and tabpanel roles only when the component behaves as tabs.',
      keyboard: ['Arrow keys move between tabs.', 'Tab moves from the active tab into the active panel or next focusable element.'],
      attributes: ['role="tablist"', 'role="tab" with aria-selected', 'role="tabpanel" labelled by the active tab'],
      example: '<div role="tablist">\n  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Overview</button>\n</div>\n<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">…</div>'
    }
  },
  {
    id: 'accordion',
    name: 'Accordion',
    apg: 'Accordion Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    keywords: ['accordion', 'expandable sections', 'collapsible sections', 'faq sections'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Accordion headers must be keyboard operable.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Each header button must expose its name and expanded/collapsed state.' },
      { id: '1.3.1', relationship: 'related', reason: 'Headers should be real headings so the section structure is programmatic.' },
      { id: '2.4.7', relationship: 'related', reason: 'The focused header needs a visible focus indicator.' }
    ],
    implementation: {
      pattern: 'Wrap each accordion trigger in a heading and use a native button that toggles aria-expanded on its panel.',
      keyboard: ['Enter and Space toggle the focused section.', 'Tab moves between header buttons in DOM order.'],
      attributes: ['h2/h3 wrapping each trigger button', 'button[aria-expanded][aria-controls]', 'id on each panel'],
      example: '<h3><button aria-expanded="false" aria-controls="sect-1">Delivery</button></h3>\n<div id="sect-1" hidden>…</div>'
    }
  },
  {
    id: 'menubar',
    name: 'Menu / menubar',
    apg: 'Menu and Menubar Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    keywords: ['menu', 'menubar', 'menu bar', 'context menu', 'application menu', 'right click menu', 'actions menu'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Menu items must be reachable and activatable from the keyboard.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Menu, menuitem roles and expanded states must be exposed correctly.' },
      { id: '2.4.3', relationship: 'related', reason: 'Roving focus through menu items must follow a meaningful order.' },
      { id: '2.4.7', relationship: 'related', reason: 'The focused menu item needs visible focus.' }
    ],
    implementation: {
      pattern: 'Reserve role="menu"/"menubar" for desktop-application-style menus of actions; use disclosure navigation for site links.',
      keyboard: ['Arrow keys move between menu items (roving tabindex).', 'Enter activates the focused item.', 'Escape closes an open submenu and returns focus to its parent.'],
      attributes: ['role="menubar" or role="menu"', 'role="menuitem" on each option', 'aria-expanded and aria-haspopup on submenu parents'],
      example: '<div role="menubar" aria-label="Editor">\n  <button role="menuitem" aria-haspopup="true" aria-expanded="false">File</button>\n</div>'
    }
  },
  {
    id: 'dialog-modal',
    name: 'Modal dialog',
    apg: 'Dialog Modal Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    keywords: ['modal', 'dialog', 'popup dialog', 'lightbox', 'overlay window'],
    criteria: [
      { id: '2.1.1', relationship: 'direct', reason: 'Dialog controls and close actions must be keyboard operable.' },
      { id: '2.1.2', relationship: 'direct', reason: 'Keyboard focus must not be trapped without a way to close or leave the dialog.' },
      { id: '4.1.2', relationship: 'direct', reason: 'Dialog role, modal state, and accessible name must be exposed.' }
    ],
    implementation: {
      pattern: 'Use the native dialog element where suitable or role="dialog" with aria-modal="true".',
      keyboard: ['Move focus into the dialog when it opens.', 'Keep tab focus within the modal while open.', 'Escape closes the dialog unless there is a documented exception.'],
      attributes: ['role="dialog" or dialog element', 'aria-modal="true" for modal dialogs', 'aria-labelledby or aria-label'],
      example: '<dialog aria-labelledby="dlg-title">\n  <h2 id="dlg-title">Confirm order</h2>\n  <button autofocus>Close</button>\n</dialog>'
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
      attributes: ['role="combobox"', 'aria-expanded', 'aria-controls', 'aria-activedescendant when focus remains on the input'],
      example: '<label for="dest">Destination</label>\n<input id="dest" role="combobox" aria-expanded="false" aria-controls="dest-list" aria-autocomplete="list">\n<ul id="dest-list" role="listbox" hidden>…</ul>'
    }
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb trail',
    apg: 'Breadcrumb Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    keywords: ['breadcrumb', 'breadcrumbs', 'breadcrumb trail', 'you are here'],
    criteria: [
      { id: '2.4.8', relationship: 'direct', reason: 'Breadcrumbs communicate the user’s location within a set of pages.' },
      { id: '1.3.1', relationship: 'related', reason: 'The trail should be a labelled nav landmark containing an ordered list.' },
      { id: '4.1.2', relationship: 'related', reason: 'The current page should be marked with aria-current="page".' }
    ],
    implementation: {
      pattern: 'Use a nav landmark labelled "Breadcrumb" containing an ordered list of links, with aria-current="page" on the last item.',
      keyboard: ['Each breadcrumb link is reachable with Tab in order.'],
      attributes: ['nav[aria-label="Breadcrumb"]', 'ol of links', 'aria-current="page" on the current page entry'],
      example: '<nav aria-label="Breadcrumb">\n  <ol>\n    <li><a href="/">Home</a></li>\n    <li><a href="/news" aria-current="page">News</a></li>\n  </ol>\n</nav>'
    }
  },
  {
    id: 'pagination',
    name: 'Pagination',
    apg: 'Navigation landmark with paging links',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
    htmlWeight: 0.7,
    keywords: ['pagination', 'pager', 'page numbers', 'next previous links', 'paging'],
    criteria: [
      { id: '2.4.4', relationship: 'direct', reason: 'Each paging link needs a purpose that is clear in context, e.g. "Page 2", not just "2".' },
      { id: '1.3.1', relationship: 'related', reason: 'Pagination should be a labelled nav landmark containing a list of links.' },
      { id: '4.1.2', relationship: 'related', reason: 'The current page should be marked with aria-current="page".' }
    ],
    implementation: {
      pattern: 'Use a nav landmark labelled "Pagination" with a list of links; give numeric links accessible names like "Page 2" and mark the current page.',
      keyboard: ['Each page link is reachable with Tab.', 'Disabled previous/next controls are removed from the tab order rather than faked.'],
      attributes: ['nav[aria-label="Pagination"]', 'aria-current="page" on the active page link', 'aria-label="Page N" on numeric links'],
      example: '<nav aria-label="Pagination">\n  <ul>\n    <li><a href="?page=1" aria-label="Page 1" aria-current="page">1</a></li>\n    <li><a href="?page=2" aria-label="Page 2">2</a></li>\n  </ul>\n</nav>'
    }
  },
  {
    id: 'site-search',
    name: 'Site search',
    apg: 'Search landmark',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html',
    htmlWeight: 0.7,
    keywords: ['search', 'site search', 'search box', 'search field', 'search form', 'search bar'],
    criteria: [
      { id: '3.3.2', relationship: 'direct', reason: 'The search input needs a visible or programmatic label, not just placeholder text.' },
      { id: '2.4.5', relationship: 'related', reason: 'Site search is one of the standard "multiple ways" to find pages.' },
      { id: '1.3.1', relationship: 'related', reason: 'Expose the search region as a search landmark.' }
    ],
    implementation: {
      pattern: 'Wrap the form in a search landmark, label the input, and provide a submit button with an accessible name.',
      keyboard: ['Tab reaches the input and submit button.', 'Enter submits the search from the input.'],
      attributes: ['form[role="search"] or the search element', 'label associated with the input', 'input[type="search"]'],
      example: '<form role="search">\n  <label for="q">Search this site</label>\n  <input id="q" type="search" name="q">\n  <button type="submit">Search</button>\n</form>'
    }
  },
  {
    id: 'form',
    name: 'Form',
    apg: 'W3C WAI Forms Tutorial',
    source: 'https://www.w3.org/WAI/tutorials/forms/',
    htmlWeight: 0.7,
    keywords: ['form', 'form fields', 'input form', 'signup form', 'sign up form', 'contact form', 'checkout form', 'registration form', 'login form'],
    criteria: [
      { id: '3.3.2', relationship: 'direct', reason: 'Every input needs a label or instructions.' },
      { id: '3.3.1', relationship: 'direct', reason: 'Detected input errors must be identified and described in text.' },
      { id: '1.3.1', relationship: 'related', reason: 'Group related fields with fieldset/legend and associate labels programmatically.' },
      { id: '3.3.3', relationship: 'related', reason: 'Provide correction suggestions when they are known.' },
      { id: '3.3.4', relationship: 'related', reason: 'Legal or financial submissions need prevention, checking, or confirmation.' }
    ],
    implementation: {
      pattern: 'Use visible label elements bound with for/id, group radios and checkboxes with fieldset/legend, and link error text to fields with aria-describedby.',
      keyboard: ['Every field and the submit control are reachable and operable with Tab and Enter/Space.'],
      attributes: ['label[for] on every input', 'fieldset/legend for groups', 'aria-describedby linking hint and error text', 'autocomplete on personal-data fields'],
      example: '<label for="email">Email address</label>\n<input id="email" type="email" name="email" autocomplete="email" aria-describedby="email-error">\n<p id="email-error">Enter an email address in the correct format, like name@example.com</p>'
    }
  },
  {
    id: 'card',
    name: 'Card / teaser',
    apg: 'W3C WAI Page Structure Tutorial',
    source: 'https://www.w3.org/WAI/tutorials/page-structure/',
    htmlWeight: 0.7,
    keywords: ['card', 'cards', 'card grid', 'teaser', 'tile', 'tiles'],
    criteria: [
      { id: '2.4.4', relationship: 'direct', reason: 'The card link purpose must be clear; avoid duplicate "Read more" names.' },
      { id: '1.3.1', relationship: 'related', reason: 'Each card heading should be a real heading at the correct level.' },
      { id: '2.4.7', relationship: 'related', reason: 'A whole-card click target still needs a single, visibly focusable link.' }
    ],
    implementation: {
      pattern: 'Use one real heading per card containing the single link; extend the click target with CSS rather than nesting interactive elements or duplicating links.',
      keyboard: ['One Tab stop per card; the link name describes the destination.'],
      attributes: ['h2/h3 heading per card', 'single anchor whose text names the destination', 'no nested interactive controls inside the link'],
      example: '<article class="card">\n  <h3><a href="/news/road-closures">Road closures this weekend</a></h3>\n  <p>Summary text…</p>\n</article>'
    }
  },
  {
    id: 'data-table',
    name: 'Data table',
    apg: 'Table Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/',
    htmlWeight: 0.7,
    keywords: ['table', 'data table', 'data grid', 'table of results', 'sortable table', 'results table'],
    criteria: [
      { id: '1.3.1', relationship: 'direct', reason: 'Header/data cell relationships must be programmatic via th and scope or headers.' },
      { id: '2.4.6', relationship: 'related', reason: 'A caption or accessible name should describe the table.' },
      { id: '4.1.2', relationship: 'related', reason: 'Sort controls must expose name, role, and aria-sort state.' }
    ],
    implementation: {
      pattern: 'Use a native table with caption, th[scope] headers, and aria-sort on sortable column header buttons.',
      keyboard: ['Sort buttons in headers are real buttons operable with Enter/Space.'],
      attributes: ['caption', 'th[scope="col"|"row"]', 'aria-sort on the sorted column header'],
      example: '<table>\n  <caption>Bin collection days</caption>\n  <tr><th scope="col">Area</th><th scope="col">Day</th></tr>\n  <tr><td>Barton</td><td>Tuesday</td></tr>\n</table>'
    }
  },
  {
    id: 'alert',
    name: 'Alert',
    apg: 'Alert Pattern',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    keywords: ['alert', 'error banner', 'warning banner', 'toast', 'notification banner'],
    criteria: [
      { id: '4.1.3', relationship: 'direct', reason: 'Important time-sensitive messages must be announced without moving focus.' },
      { id: '3.3.1', relationship: 'related', reason: 'Error alerts must identify and describe the problem in text.' },
      { id: '1.4.1', relationship: 'related', reason: 'The alert meaning must not rely on colour alone.' }
    ],
    implementation: {
      pattern: 'Render the message into a container with role="alert" (or an existing aria-live="assertive" region) without stealing focus.',
      keyboard: ['Focus stays where it was; the alert is announced automatically.', 'A dismiss control, if present, is a real button.'],
      attributes: ['role="alert" on the message container', 'text plus icon, not colour alone', 'container present in the DOM before injecting the message when possible'],
      example: '<div role="alert">\n  <strong>Error:</strong> Your session has expired. Sign in again to continue.\n</div>'
    }
  },
  {
    id: 'status-message',
    name: 'Status message',
    apg: 'Understanding Status Messages (WCAG 4.1.3)',
    source: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
    keywords: ['status message', 'live region', 'loading indicator', 'results count', 'progress update', 'saved indicator'],
    criteria: [
      { id: '4.1.3', relationship: 'direct', reason: 'Status updates must be programmatically announced without receiving focus.' },
      { id: '4.1.2', relationship: 'related', reason: 'The live region role and properties must be exposed correctly.' }
    ],
    implementation: {
      pattern: 'Use role="status" (polite live region) that exists in the DOM before the update; inject concise text when state changes.',
      keyboard: ['No keyboard interaction; the update must not move focus.'],
      attributes: ['role="status" or aria-live="polite"', 'region present before content changes', 'short, plain-text updates'],
      example: '<div role="status">12 results found</div>'
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
  if (/class=["'][^"']*accordion[^"']*["']/.test(text) || (/<h[1-6][^>]*>\s*<button\b/.test(text) && /aria-expanded/.test(text)) || (text.match(/aria-expanded/g) || []).length >= 2) signals.push('accordion');
  if (/role=["']menubar["']|role=["']menuitem["']|role=["']menu["']/.test(text)) signals.push('menubar');
  if (/role=["']combobox["']|<input[^>]+list=|aria-autocomplete/.test(text)) signals.push('combobox');
  if (/<dialog\b|role=["']dialog["']|aria-modal=["']true["']/.test(text)) signals.push('dialog-modal');
  if (/aria-label=["'][^"']*breadcrumb|class=["'][^"']*breadcrumb/.test(text)) signals.push('breadcrumb');
  if (/aria-label=["'][^"']*(pagination|pager)|class=["'][^"']*(pagination|pager)\b|rel=["'](next|prev)["']/.test(text)) signals.push('pagination');
  if (/role=["']search["']|<search\b|type=["']search["']/.test(text)) signals.push('site-search');
  if (/<form\b/.test(text) && /<(input|select|textarea)\b/.test(text)) signals.push('form');
  if (/class=["'][^"']*\bcard[s]?\b[^"']*["']/.test(text) && /<a\b/.test(text)) signals.push('card');
  if (/<table\b|role=["'](table|grid)["']/.test(text)) signals.push('data-table');
  if (/role=["']alert["']|aria-live=["']assertive["']/.test(text)) signals.push('alert');
  if (/role=["']status["']|aria-live=["']polite["']|<output\b/.test(text)) signals.push('status-message');
  return signals;
}

export function matchAriaPattern({ component = '', context = '', html = '' } = {}) {
  const haystack = textOf(`${component} ${context}`);
  const exact = textOf(component).trim();
  const byHtml = htmlSignals(html);
  const matches = ariaPatterns.map(pattern => {
    let score = 0;
    const evidence = [];
    if (byHtml.includes(pattern.id)) { score += pattern.htmlWeight ?? 0.75; evidence.push('html'); }
    for (const keyword of pattern.keywords) {
      if (!haystack.includes(keyword)) continue;
      // Naming the pattern outright ("tabs", "accordion") is stronger evidence
      // than the keyword appearing somewhere inside a longer description.
      score += exact === keyword ? 0.6 : keyword.split(' ').length > 1 ? 0.55 : 0.35;
      evidence.push(`keyword:${keyword}`);
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
