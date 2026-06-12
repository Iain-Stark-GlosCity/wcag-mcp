// Computed colour handling: hex (3/4/6/8 digit), rgb()/rgba(), hsl()/hsla(),
// named colours, CSS variables resolved through a caller-supplied token map,
// and alpha compositing over the effective background.

const NAMED_COLOURS = {
  black: '#000000', silver: '#c0c0c0', gray: '#808080', grey: '#808080', white: '#ffffff',
  maroon: '#800000', red: '#ff0000', purple: '#800080', fuchsia: '#ff00ff', magenta: '#ff00ff',
  green: '#008000', lime: '#00ff00', olive: '#808000', yellow: '#ffff00', navy: '#000080',
  blue: '#0000ff', teal: '#008080', aqua: '#00ffff', cyan: '#00ffff', orange: '#ffa500',
  rebeccapurple: '#663399', pink: '#ffc0cb', hotpink: '#ff69b4', brown: '#a52a2a',
  gold: '#ffd700', indigo: '#4b0082', violet: '#ee82ee', crimson: '#dc143c', coral: '#ff7f50',
  salmon: '#fa8072', khaki: '#f0e68c', plum: '#dda0dd', orchid: '#da70d6', tan: '#d2b48c',
  beige: '#f5f5dc', ivory: '#fffff0', snow: '#fffafa', tomato: '#ff6347', turquoise: '#40e0d0',
  slategray: '#708090', slategrey: '#708090', lightgray: '#d3d3d3', lightgrey: '#d3d3d3',
  darkgray: '#a9a9a9', darkgrey: '#a9a9a9', dimgray: '#696969', dimgrey: '#696969',
  gainsboro: '#dcdcdc', whitesmoke: '#f5f5f5', midnightblue: '#191970', royalblue: '#4169e1',
  steelblue: '#4682b4', skyblue: '#87ceeb', lightblue: '#add8e6', darkblue: '#00008b',
  darkgreen: '#006400', forestgreen: '#228b22', seagreen: '#2e8b57', darkred: '#8b0000',
  firebrick: '#b22222', goldenrod: '#daa520'
};

function normaliseTokenKey(key) {
  return String(key).trim().toLowerCase().replace(/^(--|\$)/, '');
}

function lookupToken(name, tokens = {}) {
  const needle = normaliseTokenKey(name);
  if (!needle) return null;
  for (const [key, value] of Object.entries(tokens)) {
    if (normaliseTokenKey(key) === needle) return value;
  }
  return null;
}

function substituteVars(value, tokens, depth = 0) {
  if (depth > 8) throw new Error(`CSS variable chain is too deep or circular in: ${value}`);
  const idx = value.indexOf('var(');
  if (idx === -1) return value;
  let i = idx + 4;
  let parens = 1;
  while (i < value.length && parens) {
    if (value[i] === '(') parens += 1;
    else if (value[i] === ')') parens -= 1;
    i += 1;
  }
  if (parens) throw new Error(`Unbalanced var() in colour value: ${value}`);
  const inner = value.slice(idx + 4, i - 1);
  const comma = inner.indexOf(',');
  const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
  const fallback = comma === -1 ? null : inner.slice(comma + 1).trim();
  const token = lookupToken(name, tokens);
  let replacement;
  if (token != null) replacement = String(token);
  else if (fallback != null && fallback !== '') replacement = fallback;
  else throw new Error(`CSS variable ${name} is not in the supplied token map and has no fallback.`);
  return substituteVars(value.slice(0, idx) + replacement + value.slice(i), tokens, depth + 1);
}

function parseHex(value) {
  const m = /^#([0-9a-f]{3,8})$/.exec(value);
  if (!m) return null;
  const hex = m[1];
  if (![3, 4, 6, 8].includes(hex.length)) throw new Error(`Invalid hex colour: ${value}`);
  const expand = hex.length <= 4 ? hex.split('').map(c => c + c).join('') : hex;
  const rgb = [expand.slice(0, 2), expand.slice(2, 4), expand.slice(4, 6)].map(pair => parseInt(pair, 16));
  const alpha = expand.length === 8 ? parseInt(expand.slice(6, 8), 16) / 255 : 1;
  return { rgb, alpha };
}

function parseAlpha(raw) {
  const value = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid alpha value: ${raw}`);
  return Math.min(Math.max(value, 0), 1);
}

function parseRgbChannel(raw) {
  const value = raw.endsWith('%') ? (parseFloat(raw) * 255) / 100 : parseFloat(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid rgb channel: ${raw}`);
  return Math.round(Math.min(Math.max(value, 0), 255));
}

function parseHue(raw) {
  if (raw.endsWith('turn')) return parseFloat(raw) * 360;
  if (raw.endsWith('grad')) return parseFloat(raw) * 0.9;
  if (raw.endsWith('rad')) return (parseFloat(raw) * 180) / Math.PI;
  const value = parseFloat(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid hue value: ${raw}`);
  return value;
}

function parsePercentFraction(raw) {
  const value = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid percentage value: ${raw}`);
  return Math.min(Math.max(value, 0), 1);
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(hue / 60);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][sector] || [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255));
}

function parseFunctional(value) {
  const m = /^(rgba?|hsla?)\(([^)]+)\)$/.exec(value);
  if (!m) return null;
  const fn = m[1];
  let body = m[2].trim();
  let alpha = 1;
  if (body.includes('/')) {
    const [main, alphaPart] = body.split('/');
    body = main.trim();
    alpha = parseAlpha(alphaPart.trim());
  }
  const parts = body.split(/[,\s]+/).filter(Boolean);
  if (parts.length === 4) alpha = parseAlpha(parts.pop());
  if (parts.length !== 3) throw new Error(`Invalid ${fn}() colour: ${value}`);
  if (fn.startsWith('rgb')) return { rgb: parts.map(parseRgbChannel), alpha };
  return { rgb: hslToRgb(parseHue(parts[0]), parsePercentFraction(parts[1]), parsePercentFraction(parts[2])), alpha };
}

export function parseColour(value, tokens = {}) {
  const original = value;
  let v = String(value ?? '').trim();
  if (!v) throw new Error('Empty colour value.');
  v = substituteVars(v, tokens).trim();
  const tokenValue = lookupToken(v, tokens);
  if (tokenValue != null && String(tokenValue).trim().toLowerCase() !== v.toLowerCase()) {
    return parseColour(tokenValue, tokens);
  }
  v = v.toLowerCase();
  if (v === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };
  if (NAMED_COLOURS[v]) v = NAMED_COLOURS[v];
  const hex = parseHex(v);
  if (hex) return hex;
  const fn = parseFunctional(v);
  if (fn) return fn;
  throw new Error(`Unsupported or invalid colour value: ${original}`);
}

export function compositeOver({ rgb, alpha }, backgroundRgb) {
  if (alpha >= 1) return rgb;
  return rgb.map((channel, i) => Math.round(channel * alpha + backgroundRgb[i] * (1 - alpha)));
}

function channel(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminanceOf(rgb) {
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function hexOf(rgb) {
  return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export function resolveColour(value, { tokens = {}, background = '#ffffff' } = {}) {
  const parsed = parseColour(value, tokens);
  if (parsed.alpha >= 1) return parsed.rgb;
  return compositeOver(parsed, resolveColour(background, { tokens }));
}

// Resolves both colours (compositing any translucency: background over the
// page base, foreground over the effective background) and returns the
// computed contrast detail for reporting.
export function contrastDetails(foreground, background, { tokens = {}, page_background = '#ffffff' } = {}) {
  const base = parseColour(page_background, tokens);
  const baseRgb = compositeOver(base, [255, 255, 255]);
  const bg = parseColour(background ?? '#ffffff', tokens);
  const bgRgb = compositeOver(bg, baseRgb);
  const fg = parseColour(foreground, tokens);
  const fgRgb = compositeOver(fg, bgRgb);
  const a = luminanceOf(fgRgb);
  const b = luminanceOf(bgRgb);
  return {
    ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    foreground_resolved: hexOf(fgRgb),
    background_resolved: hexOf(bgRgb),
    composited: fg.alpha < 1 || bg.alpha < 1
  };
}

export function ratioFor(foreground, background, options = {}) {
  return contrastDetails(foreground, background, options).ratio;
}
