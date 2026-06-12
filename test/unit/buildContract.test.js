import test from 'node:test';
import assert from 'node:assert/strict';
import { adviseComponent } from '../../src/services/adviceEngine.js';
import { adviseColourContrast, checkCssRule } from '../../src/services/ruleEngine.js';
import { validateAriaAttributes } from '../../src/services/ariaValidator.js';

const CONTRACT_KEYS = ['must', 'should', 'tests', 'wcag', 'example_fix'];

test('build_agent mode returns an implementation contract for component advice', () => {
  const result = adviseComponent({ component: 'tabs', output_mode: 'build_agent' });
  for (const key of CONTRACT_KEYS) assert.ok(key in result, `contract has ${key}`);
  assert.equal(result.output_mode, 'build_agent');
  assert.ok(result.must.some(item => item.includes('2.1.1') || item.toLowerCase().includes('keyboard')));
  assert.ok(result.wcag.some(item => item.startsWith('4.1.2')));
  assert.ok(result.example_fix.includes('tablist'));
  assert.ok(result.sources.length > 0);
});

test('build_agent mode keeps low-confidence advice suppressed', () => {
  const result = adviseComponent({ component: 'interactive widget', output_mode: 'build_agent' });
  assert.equal(result.confidence, 'low');
  assert.ok(result.must.some(item => item.includes('human accessibility reviewer')));
  assert.equal(result.example_fix, '');
  assert.ok(result.should.some(item => item.startsWith('Candidate pattern:')));
});

test('build_agent mode maps validator failures to must and smells to should/tests', () => {
  const result = validateAriaAttributes({
    html: '<button aria-expanded="false" aria-controls="missing" aria-label="Menu">Menu</button>',
    output_mode: 'build_agent'
  });
  assert.ok(result.must.some(item => item.includes('aria-controls')));
  assert.ok(result.should.some(item => item.includes('visible text')));
  assert.ok(result.tests.some(item => item.startsWith('Manually verify:')));
  assert.ok(result.wcag.some(item => item.startsWith('4.1.2')));
});

test('build_agent mode works for CSS checks and contrast advice', () => {
  const css = checkCssRule({ css: 'p { text-align: justify; }', output_mode: 'build_agent' });
  assert.ok(css.must.some(item => item.includes('text-align: left')));
  assert.ok(css.example_fix.includes('line-height'));

  const contrast = adviseColourContrast({ foreground: '#777777', background: '#ffffff', output_mode: 'build_agent' });
  assert.ok(contrast.must.some(item => item.includes('below the required')));
  assert.ok(contrast.wcag.some(item => item.startsWith('1.4.3')));
});

test('default output mode is unchanged', () => {
  const result = adviseComponent({ component: 'tabs' });
  assert.ok(result.criteria);
  assert.ok(result.answer_markdown);
  assert.ok(!('must' in result));
});
