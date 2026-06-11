function hexToRgb(hex) {
  const clean = String(hex || '').replace('#','').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error(`Invalid hex colour: ${hex}`);
  return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)];
}
function channel(v) { const s=v/255; return s <= 0.04045 ? s/12.92 : ((s+0.055)/1.055) ** 2.4; }
function luminance(hex) { const [r,g,b]=hexToRgb(hex).map(channel); return 0.2126*r + 0.7152*g + 0.0722*b; }
export function ratioFor(foreground, background) { const a=luminance(foreground), b=luminance(background); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); }
