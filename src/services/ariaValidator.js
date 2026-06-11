import { JSDOM } from 'jsdom';
import { withSourceMetadata } from './sourceBuilder.js';

const GLOBAL_ARIA = new Set(['aria-atomic','aria-busy','aria-controls','aria-current','aria-describedby','aria-description','aria-details','aria-disabled','aria-dropeffect','aria-errormessage','aria-flowto','aria-grabbed','aria-haspopup','aria-hidden','aria-invalid','aria-keyshortcuts','aria-label','aria-labelledby','aria-live','aria-owns','aria-relevant','aria-roledescription']);
const STATE_ARIA = new Set(['aria-checked','aria-expanded','aria-pressed','aria-selected']);
const KNOWN_ARIA = new Set([...GLOBAL_ARIA, ...STATE_ARIA, 'aria-activedescendant','aria-autocomplete','aria-colcount','aria-colindex','aria-colindextext','aria-colspan','aria-level','aria-modal','aria-multiline','aria-multiselectable','aria-orientation','aria-placeholder','aria-posinset','aria-readonly','aria-required','aria-rowcount','aria-rowindex','aria-rowindextext','aria-rowspan','aria-setsize','aria-sort','aria-valuemax','aria-valuemin','aria-valuenow','aria-valuetext']);
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, summary, [tabindex], [role="button"], [role="link"], [role="tab"], [role="combobox"], [role="menuitem"]';

function parseFragment(html) {
  const dom = new JSDOM(`<main id="__root">${html || ''}</main>`);
  return dom.window.document.querySelector('#__root');
}

function selectorFor(el) {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const role = el.getAttribute('role');
  if (role) return `${tag}[role="${role}"]`;
  const label = el.getAttribute('aria-label');
  if (label) return `${tag}[aria-label="${label.slice(0, 32)}"]`;
  return tag;
}

function visibleText(el) {
  return Array.from(el.childNodes)
    .filter(node => node.nodeType === 3 || (node.nodeType === 1 && !node.hasAttribute?.('aria-hidden')))
    .map(node => node.textContent || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasStateChangeHook(el) {
  const hookAttrs = ['onclick','onkeydown','onkeyup','data-action','data-controller','data-toggle','data-state-target','x-on:click','@click','v-on:click'];
  if (hookAttrs.some(attr => el.hasAttribute(attr))) return true;
  if (el.closest('[data-controller],[x-data],[v-scope]')) return true;
  return false;
}

function addIssue(issues, issue) {
  issues.push({ severity: 'medium', criteria: ['4.1.2'], ...issue });
}

function elementWithId(root, id) {
  return Array.from(root.querySelectorAll('[id]')).find(el => el.id === id) || null;
}

export function validateAriaAttributes({ html = '', target_level = 'AA', context = '' } = {}) {
  const issues = [];
  const root = parseFragment(html);

  for (const el of root.querySelectorAll('*')) {
    for (const attr of el.getAttributeNames()) {
      if (attr.startsWith('aria-') && !KNOWN_ARIA.has(attr)) {
        addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: attr, message: `${attr} is not a recognised ARIA attribute.`, suggested_fix: 'Remove the attribute or replace it with the correct ARIA attribute name.' });
      }
    }

    if (el.hasAttribute('aria-expanded')) {
      const value = el.getAttribute('aria-expanded');
      if (!['true', 'false'].includes(value)) {
        addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: 'aria-expanded', message: 'aria-expanded must be true or false when present.', suggested_fix: 'Set aria-expanded="false" when collapsed and "true" when expanded.' });
      }
      if (!el.matches(INTERACTIVE_SELECTOR)) {
        addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: 'aria-expanded', message: 'aria-expanded is on an element that is not natively interactive and has no recognised interactive role.', suggested_fix: 'Put aria-expanded on the button or interactive trigger that opens the content.' });
      }
      if (!el.hasAttribute('aria-controls')) {
        addIssue(issues, { selector: selectorFor(el), attribute: 'aria-expanded', message: 'Disclosure-style controls with aria-expanded should identify the controlled content.', suggested_fix: 'Add aria-controls pointing to the id of the disclosed region when that relationship is useful to expose.' });
      } else if (!elementWithId(root, el.getAttribute('aria-controls'))) {
        addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: 'aria-controls', message: 'aria-controls points to an id that was not found in the snippet.', suggested_fix: 'Ensure aria-controls exactly matches the controlled region id.' });
      }
      if (!hasStateChangeHook(el)) {
        addIssue(issues, { selector: selectorFor(el), attribute: 'aria-expanded', message: 'aria-expanded is present but no state-change handler or framework hook is visible in the snippet.', suggested_fix: 'Wire the trigger so activation toggles both the visual state and aria-expanded.' });
      }
    }

    if (el.hasAttribute('aria-label') && visibleText(el)) {
      addIssue(issues, { selector: selectorFor(el), attribute: 'aria-label', message: 'aria-label overrides or duplicates visible text on this element.', suggested_fix: 'Prefer visible text as the accessible name, or use aria-labelledby if the visible label is elsewhere.' });
    }

    if (el.tagName.toLowerCase() === 'img' && el.hasAttribute('alt') && el.hasAttribute('aria-label')) {
      addIssue(issues, { selector: selectorFor(el), attribute: 'aria-label', message: 'Image has both alt and aria-label, which can create redundant or conflicting accessible names.', suggested_fix: 'Use alt for the image accessible name; remove aria-label unless there is a specific tested reason.' });
    }

    const role = el.getAttribute('role');
    if (role === 'combobox' && !el.hasAttribute('aria-expanded')) {
      addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: 'aria-expanded', message: 'Comboboxes need an aria-expanded state.', suggested_fix: 'Expose aria-expanded and update it when the popup opens or closes.' });
    }
    if (role === 'tab' && !el.hasAttribute('aria-selected')) {
      addIssue(issues, { severity: 'high', selector: selectorFor(el), attribute: 'aria-selected', message: 'Tabs need aria-selected to expose the active tab.', suggested_fix: 'Set aria-selected="true" on the active tab and "false" on inactive tabs.' });
    }
    if (role === 'tabpanel' && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
      addIssue(issues, { selector: selectorFor(el), attribute: 'aria-labelledby', message: 'Tab panels need an accessible name, normally from the associated tab.', suggested_fix: 'Add aria-labelledby pointing to the owning tab id.' });
    }
  }

  const criteria = issues.length ? ['4.1.2'] : [];
  return withSourceMetadata({
    decision: issues.length ? 'fail' : 'pass',
    status: issues.length ? 'fail' : 'pass',
    criteria,
    issues,
    automated_checks: ['Validate known aria-* attribute names.', 'Check common state/relationship requirements for disclosure, combobox, and tabs patterns.', 'Flag accessible-name anti-patterns such as redundant visible text plus aria-label and img alt plus aria-label.'],
    human_review: ['Confirm dynamic state changes in the running component; static snippets can only detect visible hooks.'],
    limitations: ['This is a deterministic snippet validator, not a full browser accessibility-tree audit.', 'Event listeners attached only from external JavaScript may not be visible in the HTML snippet.'],
    context,
    target_level
  }, { tool: 'accessibility_validate_aria_attributes', criteria_used: criteria });
}
