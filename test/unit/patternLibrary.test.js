import test from 'node:test';
import assert from 'node:assert/strict';
import { matchAriaPattern, htmlSignals, ariaPatterns } from '../../src/services/patternLibrary.js';
import { adviseComponent } from '../../src/services/adviceEngine.js';

test('every pattern carries criteria, implementation guidance, and an example fix', () => {
  for (const pattern of ariaPatterns) {
    assert.ok(pattern.criteria.length, `${pattern.id} has criteria`);
    assert.ok(pattern.implementation.pattern, `${pattern.id} has implementation`);
    assert.ok(pattern.implementation.example, `${pattern.id} has an example`);
    assert.ok(pattern.source.startsWith('https://www.w3.org/'), `${pattern.id} cites W3C`);
  }
});

test('explicit component names resolve to their patterns', () => {
  const expectations = {
    tabs: 'tabs',
    accordion: 'accordion',
    menubar: 'menubar',
    'modal dialog': 'dialog-modal',
    breadcrumbs: 'breadcrumb',
    pagination: 'pagination',
    'search box': 'site-search',
    'contact form': 'form',
    'card grid': 'card',
    'data table': 'data-table',
    'error banner': 'alert',
    'status message': 'status-message'
  };
  for (const [component, expected] of Object.entries(expectations)) {
    const match = matchAriaPattern({ component });
    assert.equal(match?.pattern.id, expected, `${component} should match ${expected}`);
    assert.ok(match.score >= 0.5, `${component} should match confidently (got ${match.score})`);
  }
});

test('HTML markup signals identify the new patterns', () => {
  const cases = [
    ['<h3><button aria-expanded="false" aria-controls="s1">A</button></h3><h3><button aria-expanded="true" aria-controls="s2">B</button></h3>', 'accordion'],
    ['<ul role="menubar"><li role="menuitem">File</li></ul>', 'menubar'],
    ['<nav aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li></ol></nav>', 'breadcrumb'],
    ['<nav class="pagination"><a href="?page=2" rel="next">Next</a></nav>', 'pagination'],
    ['<form role="search"><input type="search"></form>', 'site-search'],
    ['<form action="/signup"><label for="e">Email</label><input id="e"></form>', 'form'],
    ['<div class="card"><h3><a href="/x">Story</a></h3></div>', 'card'],
    ['<table><tr><th scope="col">Day</th></tr></table>', 'data-table'],
    ['<div role="alert">Session expired</div>', 'alert'],
    ['<div role="status">Saved</div>', 'status-message'],
    ['<div role="tablist"><button role="tab">One</button></div>', 'tabs'],
    ['<div role="dialog" aria-modal="true">Hi</div>', 'dialog-modal']
  ];
  for (const [html, expected] of cases) {
    assert.ok(htmlSignals(html).includes(expected), `expected ${expected} signal for: ${html}`);
  }
});

test('component advice returns full guidance for explicitly named patterns', () => {
  const result = adviseComponent({ component: 'accordion' });
  assert.equal(result.pattern.id, 'accordion');
  assert.notEqual(result.confidence, 'low');
  assert.ok(result.criteria.some(c => c.id === '4.1.2'));
  assert.ok(result.implementation.keyboard.length > 0);
});

test('status message advice maps to WCAG 4.1.3', () => {
  const result = adviseComponent({ html: '<div role="status">12 results</div>' });
  assert.equal(result.pattern.id, 'status-message');
  assert.ok(result.criteria.some(c => c.id === '4.1.3'));
});

test('flyout navigation still outranks the generic patterns', () => {
  const result = matchAriaPattern({ component: 'dropdown nav with flyout submenu' });
  assert.equal(result.pattern.id, 'navigation-flyout');
});
