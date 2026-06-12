import test from 'node:test';
import assert from 'node:assert/strict';
import { parseColour, resolveColour, ratioFor, contrastDetails } from '../../src/services/colour.js';

test('parses hex colours in 3, 4, 6, and 8 digit forms', () => {
  assert.deepEqual(parseColour('#fff'), { rgb: [255, 255, 255], alpha: 1 });
  assert.deepEqual(parseColour('#1d70b8'), { rgb: [29, 112, 184], alpha: 1 });
  assert.equal(parseColour('#0008').alpha.toFixed(2), '0.53');
  assert.equal(parseColour('#00000080').alpha.toFixed(2), '0.50');
});

test('parses rgb and rgba in legacy and modern syntax', () => {
  assert.deepEqual(parseColour('rgb(29, 112, 184)').rgb, [29, 112, 184]);
  assert.deepEqual(parseColour('rgb(100% 0% 0%)').rgb, [255, 0, 0]);
  assert.equal(parseColour('rgba(0, 0, 0, 0.5)').alpha, 0.5);
  assert.equal(parseColour('rgb(0 0 0 / 40%)').alpha, 0.4);
});

test('parses hsl and hsla', () => {
  assert.deepEqual(parseColour('hsl(0, 0%, 100%)').rgb, [255, 255, 255]);
  assert.deepEqual(parseColour('hsl(120deg 100% 25%)').rgb, [0, 128, 0]);
  assert.equal(parseColour('hsla(0, 0%, 0%, 0.8)').alpha, 0.8);
});

test('parses named colours and transparent', () => {
  assert.deepEqual(parseColour('rebeccapurple').rgb, [102, 51, 153]);
  assert.deepEqual(parseColour('White').rgb, [255, 255, 255]);
  assert.equal(parseColour('transparent').alpha, 0);
});

test('resolves CSS variables through a token map, including fallbacks and chains', () => {
  const tokens = { '--brand-primary': '#1d70b8', '--ink': 'var(--brand-primary)' };
  assert.deepEqual(parseColour('var(--brand-primary)', tokens).rgb, [29, 112, 184]);
  assert.deepEqual(parseColour('var(--ink)', tokens).rgb, [29, 112, 184]);
  assert.deepEqual(parseColour('var(--missing, #000)', {}).rgb, [0, 0, 0]);
  assert.throws(() => parseColour('var(--missing)', {}), /not in the supplied token map/);
});

test('resolves bare token names from simple token maps', () => {
  assert.deepEqual(parseColour('brand.primary', { 'brand.primary': '#1d70b8' }).rgb, [29, 112, 184]);
  assert.deepEqual(parseColour('$accent', { accent: 'hotpink' }).rgb, [255, 105, 180]);
});

test('composites translucent foregrounds over the background', () => {
  assert.deepEqual(resolveColour('rgba(0, 0, 0, 0.5)', { background: '#ffffff' }), [128, 128, 128]);
  const details = contrastDetails('rgba(0,0,0,.5)', 'white');
  assert.ok(details.composited);
  assert.equal(details.foreground_resolved, '#808080');
  assert.ok(details.ratio < 4.5 && details.ratio > 3.5);
});

test('composites translucent backgrounds over the page colour', () => {
  const details = contrastDetails('#000', 'rgba(255, 255, 255, 0)', { page_background: '#000000' });
  assert.equal(details.background_resolved, '#000000');
  assert.equal(details.ratio, 1);
});

test('ratioFor stays backward compatible with plain hex input', () => {
  assert.ok(ratioFor('#000000', '#ffffff') > 20.9);
  assert.equal(ratioFor('#1d70b8', '#ffffff'), ratioFor('rgb(29 112 184)', 'white'));
});

test('rejects unparseable colours', () => {
  assert.throws(() => parseColour('not-a-colour'), /Unsupported or invalid colour/);
  assert.throws(() => parseColour(''), /Empty colour/);
});
