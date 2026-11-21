/*
 * PRO fluid-gradient wallpaper renderer.
 *
 * A single, parameterized engine that produces deep, heavy, grainy gradient
 * artwork. Every pixel is computed from scratch; the PNG is encoded by hand
 * (zlib + CRC32). No external libraries, no network calls.
 *
 * Usage:
 *   node render-pro.js <theme> <width> <height> <output.png>
 *
 * Example:
 *   node render-pro.js aurora 3840 2160 images/01-aurora-night.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ============================================================
   1. THEMES - each is a complete, independent art direction
   ============================================================ */
const THEMES = {
  aurora: {
    title: 'Aurora Night',
    description: 'Deep indigo and violet with a luminous mint-teal current. Cold, cosmic, clean.',
    sources: [
      {x:0.50,y:-0.10,sx:0.82,sy:0.44,w:1.1,c:[26,32,86],g:[0.008,0.006,-0.010]},
      {x:0.00,y:0.02,sx:0.52,sy:0.36,w:0.8,c:[40,28,104],g:[-0.008,0.010,0.008]},
      {x:1.00,y:0.04,sx:0.52,sy:0.36,w:0.8,c:[30,46,110],g:[0.010,-0.008,0.010]},
      {x:0.50,y:0.33,sx:0.62,sy:0.13,w:0.9,c:[70,190,180],g:[0.016,0.004,-0.016]},
      {x:0.02,y:0.37,sx:0.34,sy:0.20,w:0.5,c:[120,220,190],g:[-0.010,0.010,0.010]},
      {x:0.98,y:0.39,sx:0.34,sy:0.22,w:0.7,c:[40,150,175],g:[0.012,-0.010,0.008]},
      {x:0.88,y:0.60,sx:0.42,sy:0.32,w:0.9,c:[86,40,150],g:[0.012,-0.012,0.014]},
      {x:0.10,y:0.74,sx:0.46,sy:0.36,w:1.0,c:[22,70,130],g:[-0.010,0.014,0.012]},
      {x:0.00,y:0.98,sx:0.52,sy:0.44,w:1.0,c:[12,26,72],g:[0.010,0.012,0.014]},
      {x:0.42,y:1.05,sx:0.52,sy:0.44,w:0.9,c:[26,50,120],g:[0.008,0.010,0.012]},
      {x:1.02,y:0.96,sx:0.46,sy:0.44,w:1.0,c:[20,120,140],g:[0.016,-0.012,-0.012]},
      {x:1.04,y:0.70,sx:0.32,sy:0.32,w:0.5,c:[50,80,160],g:[0.012,0.010,-0.010]},
      {x:0.5,y:0.5,sx:1.8,sy:1.8,w:0.10,c:[40,50,110],g:[0,0,0]}
    ],
    warp: 1.00, blur: 0.40, blurX: 0.020, blurY: 0.016,
    grain: 56, glass: 0.16, mist: 0.11, oil: 0.025, specks: 0.055
  },

  ember: {
    title: 'Ember Silk',
    description: 'Molten crimson, burnt orange and gold over a deep plum base. Warm and luxurious.',
    sources: [
      {x:0.50,y:-0.10,sx:0.82,sy:0.44,w:1.1,c:[92,14,34],g:[0.010,0.008,-0.010]},
      {x:0.00,y:0.02,sx:0.52,sy:0.36,w:0.8,c:[122,22,44],g:[-0.008,0.010,0.008]},
      {x:1.00,y:0.04,sx:0.52,sy:0.36,w:0.8,c:[72,10,38],g:[0.010,-0.008,0.010]},
      {x:0.50,y:0.33,sx:0.62,sy:0.13,w:0.9,c:[255,124,26],g:[0.016,0.004,-0.016]},
      {x:0.02,y:0.37,sx:0.34,sy:0.20,w:0.5,c:[255,182,60],g:[-0.010,0.010,0.010]},
      {x:0.98,y:0.39,sx:0.34,sy:0.22,w:0.7,c:[240,86,24],g:[0.012,-0.010,0.008]},
      {x:0.88,y:0.60,sx:0.42,sy:0.32,w:0.9,c:[168,26,40],g:[0.012,-0.012,0.014]},
      {x:0.10,y:0.74,sx:0.46,sy:0.36,w:1.0,c:[96,18,56],g:[-0.010,0.014,0.012]},
      {x:0.00,y:0.98,sx:0.52,sy:0.44,w:1.0,c:[44,8,30],g:[0.010,0.012,0.014]},
      {x:0.42,y:1.05,sx:0.52,sy:0.44,w:0.9,c:[74,12,40],g:[0.008,0.010,0.012]},
      {x:1.02,y:0.96,sx:0.46,sy:0.44,w:1.0,c:[255,102,20],g:[0.016,-0.012,-0.012]},
      {x:1.04,y:0.70,sx:0.32,sy:0.32,w:0.5,c:[210,48,30],g:[0.012,0.010,-0.010]},
      {x:0.5,y:0.5,sx:1.8,sy:1.8,w:0.10,c:[110,24,44],g:[0,0,0]}
    ],
    warp: 1.15, blur: 0.44, blurX: 0.024, blurY: 0.018,
    grain: 60, glass: 0.18, mist: 0.09, oil: 0.030, specks: 0.050
  },

  ocean: {
    title: 'Ocean Glass',
    description: 'Deep navy, cerulean and aqua with a frosted foam haze. Cool, wet, transparent.',
    sources: [
      {x:0.50,y:-0.10,sx:0.82,sy:0.44,w:1.1,c:[12,42,92],g:[0.008,0.006,-0.010]},
      {x:0.00,y:0.02,sx:0.52,sy:0.36,w:0.8,c:[18,62,120],g:[-0.008,0.010,0.008]},
      {x:1.00,y:0.04,sx:0.52,sy:0.36,w:0.8,c:[10,78,130],g:[0.010,-0.008,0.010]},
      {x:0.50,y:0.33,sx:0.62,sy:0.13,w:0.9,c:[70,190,210],g:[0.016,0.004,-0.016]},
      {x:0.02,y:0.37,sx:0.34,sy:0.20,w:0.5,c:[170,230,228],g:[-0.010,0.010,0.010]},
      {x:0.98,y:0.39,sx:0.34,sy:0.22,w:0.7,c:[40,160,190],g:[0.012,-0.010,0.008]},
      {x:0.88,y:0.60,sx:0.42,sy:0.32,w:0.9,c:[24,110,160],g:[0.012,-0.012,0.014]},
      {x:0.10,y:0.74,sx:0.46,sy:0.36,w:1.0,c:[16,70,124],g:[-0.010,0.014,0.012]},
      {x:0.00,y:0.98,sx:0.52,sy:0.44,w:1.0,c:[8,30,80],g:[0.010,0.012,0.014]},
      {x:0.42,y:1.05,sx:0.52,sy:0.44,w:0.9,c:[14,52,110],g:[0.008,0.010,0.012]},
      {x:1.02,y:0.96,sx:0.46,sy:0.44,w:1.0,c:[30,150,175],g:[0.016,-0.012,-0.012]},
      {x:1.04,y:0.70,sx:0.32,sy:0.32,w:0.5,c:[20,96,150],g:[0.012,0.010,-0.010]},
      {x:0.5,y:0.5,sx:1.8,sy:1.8,w:0.10,c:[20,70,120],g:[0,0,0]}
    ],
    warp: 0.92, blur: 0.48, blurX: 0.026, blurY: 0.020,
    grain: 52, glass: 0.22, mist: 0.16, oil: 0.035, specks: 0.060
  },

  neon: {
    title: 'Neon Dusk',
    description: 'Electric magenta, violet and blue at maximum saturation. Pulsing and artificial.',
    sources: [
      {x:0.50,y:-0.10,sx:0.82,sy:0.44,w:1.1,c:[96,8,102],g:[0.010,0.008,-0.010]},
      {x:0.00,y:0.02,sx:0.52,sy:0.36,w:0.8,c:[132,10,128],g:[-0.008,0.010,0.008]},
      {x:1.00,y:0.04,sx:0.52,sy:0.36,w:0.8,c:[70,12,150],g:[0.010,-0.008,0.010]},
      {x:0.50,y:0.33,sx:0.62,sy:0.13,w:0.9,c:[255,44,150],g:[0.016,0.004,-0.016]},
      {x:0.02,y:0.37,sx:0.34,sy:0.20,w:0.5,c:[255,110,200],g:[-0.010,0.010,0.010]},
      {x:0.98,y:0.39,sx:0.34,sy:0.22,w:0.7,c:[210,30,220],g:[0.012,-0.010,0.008]},
      {x:0.88,y:0.60,sx:0.42,sy:0.32,w:0.9,c:[150,20,190],g:[0.012,-0.012,0.014]},
      {x:0.10,y:0.74,sx:0.46,sy:0.36,w:1.0,c:[60,20,170],g:[-0.010,0.014,0.012]},
      {x:0.00,y:0.98,sx:0.52,sy:0.44,w:1.0,c:[20,10,90],g:[0.010,0.012,0.014]},
      {x:0.42,y:1.05,sx:0.52,sy:0.44,w:0.9,c:[50,16,140],g:[0.008,0.010,0.012]},
      {x:1.02,y:0.96,sx:0.46,sy:0.44,w:1.0,c:[40,90,240],g:[0.016,-0.012,-0.012]},
      {x:1.04,y:0.70,sx:0.32,sy:0.32,w:0.5,c:[190,30,230],g:[0.012,0.010,-0.010]},
      {x:0.5,y:0.5,sx:1.8,sy:1.8,w:0.10,c:[110,20,150],g:[0,0,0]}
    ],
    warp: 1.25, blur: 0.36, blurX: 0.018, blurY: 0.014,
    grain: 64, glass: 0.20, mist: 0.08, oil: 0.040, specks: 0.070
  },

  sage: {
    title: 'Sage Mist',
    description: 'Soft sage, cream and muted teal. Low-contrast, calm, heavy blur.',
    sources: [
      {x:0.50,y:-0.10,sx:0.82,sy:0.44,w:1.1,c:[150,166,150],g:[0.008,0.006,-0.010]},
      {x:0.00,y:0.02,sx:0.52,sy:0.36,w:0.8,c:[168,178,158],g:[-0.008,0.010,0.008]},
      {x:1.00,y:0.04,sx:0.52,sy:0.36,w:0.8,c:[206,204,182],g:[0.010,-0.008,0.010]},
      {x:0.50,y:0.33,sx:0.62,sy:0.13,w:0.9,c:[224,214,186],g:[0.016,0.004,-0.016]},
      {x:0.02,y:0.37,sx:0.34,sy:0.20,w:0.5,c:[200,210,188],g:[-0.010,0.010,0.010]},
      {x:0.98,y:0.39,sx:0.34,sy:0.22,w:0.7,c:[172,190,172],g:[0.012,-0.010,0.008]},
      {x:0.88,y:0.60,sx:0.42,sy:0.32,w:0.9,c:[132,158,142],g:[0.012,-0.012,0.014]},
      {x:0.10,y:0.74,sx:0.46,sy:0.36,w:1.0,c:[112,140,134],g:[-0.010,0.014,0.012]},
      {x:0.00,y:0.98,sx:0.52,sy:0.44,w:1.0,c:[86,116,112],g:[0.010,0.012,0.014]},
      {x:0.42,y:1.05,sx:0.52,sy:0.44,w:0.9,c:[104,134,126],g:[0.008,0.010,0.012]},
      {x:1.02,y:0.96,sx:0.46,sy:0.44,w:1.0,c:[190,196,170],g:[0.016,-0.012,-0.012]},
      {x:1.04,y:0.70,sx:0.32,sy:0.32,w:0.5,c:[154,178,158],g:[0.012,0.010,-0.010]},
      {x:0.5,y:0.5,sx:1.8,sy:1.8,w:0.10,c:[150,168,152],g:[0,0,0]}
    ],
    warp: 0.80, blur: 0.55, blurX: 0.030, blurY: 0.024,
    grain: 44, glass: 0.14, mist: 0.18, oil: 0.020, specks: 0.040
  }
};

/* ============================================================
   2. ARGUMENTS
   ============================================================ */
const themeKey = (process.argv[2] || 'aurora').toLowerCase();
const W = parseInt(process.argv[3] || '3840', 10);
const H = parseInt(process.argv[4] || '2160', 10);
const OUT = process.argv[5] || path.join('images', themeKey + '.png');
const T = THEMES[themeKey];
if (!T) {
  console.error(`Unknown theme "${themeKey}". Available: ${Object.keys(THEMES).join(', ')}`);
  process.exit(1);
}
if (!Number.isFinite(W) || !Number.isFinite(H) || W < 16 || H < 16) {
  console.error('Invalid dimensions.');
  process.exit(1);
}

/* ============================================================
   3. DETERMINISTIC RANDOM
   ============================================================ */
let seed = 0x1234abcd;
function rnd() {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ============================================================
   4. PNG ENCODER (hand rolled)
   ============================================================ */
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])), 0);
  return Buffer.concat([len, tag, data, crc]);
}
function writePNG(file, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const stride = W * 3;
  const raw = Buffer.alloc(H * (stride + 1));
  for (let y = 0; y < H; y++) {
    const row = y * (stride + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < W; x++) {
      const s = row + 1 + x * 3, p = (y * W + x) * 3;
      raw[s] = rgb[p]; raw[s + 1] = rgb[p + 1]; raw[s + 2] = rgb[p + 2];
    }
  }
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([
    sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 8 })), chunk('IEND', Buffer.alloc(0))
  ]));
}

/* ============================================================
   5. COLOR SPACE - OKLab
   ============================================================ */
function s2l(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function l2s(c) { return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
function rgb2lab(r, g, b) {
  r = s2l(r); g = s2l(g); b = s2l(b);
  const l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
  const m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
  const s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
    1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
    0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
  ];
}
function lab2rgb(L, a, b) {
  const l_ = L + 0.3963377774*a + 0.2158037573*b;
  const m_ = L - 0.1055613458*a - 0.0638541728*b;
  const s_ = L - 0.0894841775*a - 1.2914855480*b;
  const l = l_*l_*l_, m = m_*m_*m_, s = s_*s_*s_;
  return [
    l2s( 4.0767416621*l - 3.3077115913*m + 0.2309699292*s),
    l2s(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s),
    l2s(-0.0041960863*l - 0.7034186147*m + 1.7076147010*s)
  ];
}

/* ============================================================
   6. NOISE - hash, value noise, fbm
   ============================================================ */
function hash21(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy);
  const a = hash21(xi, yi), b = hash21(xi+1, yi);
  const c = hash21(xi, yi+1), d = hash21(xi+1, yi+1);
  return (a + (b-a)*ux)*(1-uy) + (c + (d-c)*ux)*uy;
}
function fbm(x, y, oct) {
  let v = 0, a = 0.5;
  for (let i = 0; i < oct; i++) {
    v += a*vnoise(x, y);
    const nx = 1.6*x + 1.2*y + 11.7, ny = -1.2*x + 1.6*y + 5.3;
    x = nx; y = ny; a *= 0.5;
  }
  return v;
}

/* ============================================================
   7. LOW-RES DOMAIN-WARP FIELDS
   ============================================================ */
const LW = Math.ceil(W/4), LH = Math.ceil(H/4), CH = 8;
const fields = new Float32Array(LW*LH*CH);
const aspect = W/H;
const D0 = -0.20, DS = 1.40;
for (let j = 0; j < LH; j++) {
  const v = D0 + DS*j/(LH-1);
  for (let i = 0; i < LW; i++) {
    const u = D0 + DS*i/(LW-1);
    const px = (u-0.5)*aspect*1.7, py = (v-0.5)*1.7;
    // three-stage domain warp: q bends p, r bends p+q, f samples p+r
    const qx = fbm(px, py, 4), qy = fbm(px+5.2, py+1.3, 4);
    const rx = fbm(px+2.2*qx+1.7, py+2.2*qy+9.2, 4);
    const ry = fbm(px+2.2*qx+8.3, py+2.2*qy+2.8, 4);
    const f  = fbm(px+2.4*rx, py+2.4*ry, 4);
    const wa = T.warp;
    const warpX = wa*(0.055*(qx-0.5)+0.045*(rx-0.5)+0.030*(f-0.5)) + 0.014*Math.sin(v*9.1+u*3.3);
    const warpY = wa*(0.055*(qy-0.5)+0.045*(ry-0.5)+0.026*(f-0.5)) + 0.012*Math.sin(u*7.7-v*4.1);
    const mist = fbm(px*0.55+qx*1.4, py*0.55+qy*1.4, 3);
    const oilT = fbm(px*1.3+rx*2.2, py*1.3+ry*2.2, 4);
    const o = (j*LW+i)*CH;
    fields[o]=warpX; fields[o+1]=warpY; fields[o+2]=f;
    fields[o+3]=qx; fields[o+4]=qy; fields[o+5]=rx;
    fields[o+6]=mist; fields[o+7]=oilT;
  }
}
const fsample = new Float32Array(CH);
function sampleFields(u, v) {
  const x = ((u-D0)/DS)*(LW-1), y = ((v-D0)/DS)*(LH-1);
  const x0 = Math.max(0, Math.min(LW-1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(LH-1, Math.floor(y)));
  const x1 = Math.min(LW-1, x0+1), y1 = Math.min(LH-1, y0+1);
  const fx = x-x0, fy = y-y0;
  const sx = fx*fx*(3-2*fx), sy = fy*fy*(3-2*fy);
  const a00=(y0*LW+x0)*CH, a10=(y0*LW+x1)*CH, a01=(y1*LW+x0)*CH, a11=(y1*LW+x1)*CH;
  for (let k=0;k<CH;k++) {
    const a = fields[a00+k]+(fields[a10+k]-fields[a00+k])*sx;
    const b = fields[a01+k]+(fields[a11+k]-fields[a01+k])*sx;
    fsample[k] = a+(b-a)*sy;
  }
}

/* ============================================================
   8. SOURCES in OKLab (with internal per-blob gradient)
   ============================================================ */
const SRC = T.sources.map(s => {
  const lab = rgb2lab(s.c[0]/255, s.c[1]/255, s.c[2]/255);
  return {x:s.x,y:s.y,sx:s.sx,sy:s.sy,w:s.w,L:lab[0],A:lab[1],B:lab[2],g:s.g};
});
const outLab = [0, 0, 0];
function blendLab(u, v, out) {
  let L=0, A=0, B=0, ws=0;
  for (let i=0;i<SRC.length;i++) {
    const s = SRC[i];
    const dx = (u-s.x)/s.sx, dy = (v-s.y)/s.sy;
    const w = s.w*Math.exp(-1.5*(dx*dx+dy*dy));
    L += w*(s.L + dx*s.g[0] + dy*s.g[0]*0.4);
    A += w*(s.A + dx*s.g[1] + dy*s.g[1]*0.4);
    B += w*(s.B + dx*s.g[2] + dy*s.g[2]*0.4);
    ws += w;
  }
  out[0]=L/ws; out[1]=A/ws; out[2]=B/ws;
}

/* ============================================================
   9. GRAIN GRIDS
   ============================================================ */
function makeGrid(n){ const g=new Float32Array(n*n); for(let i=0;i<g.length;i++)g[i]=rnd(); return g; }
const G1024=makeGrid(1024), G2048=makeGrid(2048), G4096=makeGrid(4096);
const GF8=makeGrid(8), GF16=makeGrid(16), GF32=makeGrid(32);
function gn(g,n,u,v){
  const x=u*(n-1), y=v*(n-1);
  const x0=Math.max(0,Math.min(n-1,Math.floor(x))), y0=Math.max(0,Math.min(n-1,Math.floor(y)));
  const x1=Math.min(n-1,x0+1), y1=Math.min(n-1,y0+1);
  const fx=x-x0, fy=y-y0;
  const sx=fx*fx*(3-2*fx), sy=fy*fy*(3-2*fy);
  const a=g[y0*n+x0]+(g[y0*n+x1]-g[y0*n+x0])*sx;
  const b=g[y1*n+x0]+(g[y1*n+x1]-g[y1*n+x0])*sx;
  return a+(b-a)*sy;
}

/* ============================================================
   10. RENDER
   ============================================================ */
const rgb = Buffer.alloc(W*H*3);
const TAU = Math.PI*2;
const lamR=650, lamG=532, lamB=450, nFilm=1.47;
const labA=[0,0,0], labB=[0,0,0];

for (let y=0; y<H; y++) {
  const v = y/(H-1);
  for (let x=0; x<W; x++) {
    const u = x/(W-1);
    sampleFields(u, v);
    const wu = u+fsample[0], wv = v+fsample[1];
    const fv = fsample[2], qx = fsample[3];
    const mist = fsample[6], oilT = fsample[7];

    // A. OKLab mesh field + soft-focus blur (second offset sample)
    blendLab(wu, wv, labA);
    blendLab(wu+T.blurX, wv+T.blurY, labB);
    const b = T.blur;
    const L = (1-b)*labA[0] + b*labB[0];
    const A = (1-b)*labA[1] + b*labB[1];
    const B = (1-b)*labA[2] + b*labB[2];

    // B. asymmetric side glows (left slightly narrower than right)
    let LL=L, AA=A, BB=B;
    const glowL=0.50*Math.exp(-Math.pow((wu-0.01)/0.255,2));
    const glowR=0.55*Math.exp(-Math.pow((wu-1.01)/0.282,2));
    LL += glowL*0.055+glowR*0.052;
    AA += glowL*0.010+glowR*0.006;
    BB -= glowL*0.004+glowR*0.008;

    let [r,g,bl] = lab2rgb(LL,AA,BB);
    r*=255; g*=255; bl*=255;

    // C. misty haze veil
    const m = Math.max(0, Math.min(1, (mist-0.32)/0.62));
    const mw = T.mist*m;
    r=r*(1-mw)+245*mw; g=g*(1-mw)+232*mw; bl=bl*(1-mw)+242*mw;

    // D. ultra-thin iridescent oil film (thin-film interference)
    {
      const d = 180+900*oilT;
      const sr=0.5-0.5*Math.cos(TAU*2*nFilm*d/lamR);
      const sg=0.5-0.5*Math.cos(TAU*2*nFilm*d/lamG);
      const sb=0.5-0.5*Math.cos(TAU*2*nFilm*d/lamB);
      const sheen=0.5*(sr+sg+sb);
      const edge=0.35+0.65*Math.max(0,Math.min(1,(oilT-0.30)/0.5));
      const amt=T.oil*edge;
      r=r*(1-amt)+(r*0.55+sr*255*0.45)*amt;
      g=g*(1-amt)+(g*0.55+sg*255*0.45)*amt;
      bl=bl*(1-amt)+(bl*0.55+sb*255*0.45)*amt;
      const glow=(sheen-0.5)*4*edge; r+=glow; g+=glow; bl+=glow;
    }

    // E. grainy substance - super-fine, super-dense, multi-scale
    {
      const gA=gn(G1024,1024,u,v)-0.5;
      const gB=gn(G2048,2048,u,v)-0.5;
      const gC=gn(G4096,4096,u,v)-0.5;
      const pix=(rnd()-0.5);
      const lum=0.299*r+0.587*g+0.114*bl;
      const strength=T.grain*(0.70+0.30*(1-lum/255));
      const grain=(gA*0.24+gB*0.22+gC*0.18+pix*0.36)*strength;
      const grain2=(gn(G2048,2048,1-u,1-v)-0.5)*strength*0.18;
      r+=grain+grain2+1.5; g+=grain+grain2+1.5; bl+=grain+grain2+1.5;
    }

    // F. grainy glass layer - frost + blur smudge + bright specks
    {
      const glass=0.44*gn(GF8,8,u,v)+0.34*gn(GF16,16,u,v)+0.22*gn(GF32,32,u,v);
      const f=1+(glass-0.5)*T.glass;
      r=r*f+2; g=g*f+2; bl=bl*f+2;
      const smear=(gn(GF8,8,1-u,v)-0.5)*14+(gn(GF16,16,u,1-v)-0.5)*8;
      r+=smear; g+=smear; bl+=smear;
      const cross=(Math.sin((u+v)*2200)*Math.sin((u-v)*2200))*4;
      r+=cross; g+=cross; bl+=cross;
      const sp=(rnd()-0.5)*2*10;
      r+=sp; g+=sp; bl+=sp;
      const rr=rnd();
      if(rr<T.specks){const h=10+rnd()*30;r+=h;g+=h;bl+=h;}
    }

    const p=(y*W+x)*3;
    rgb[p]   = Math.max(0,Math.min(255,r))|0;
    rgb[p+1] = Math.max(0,Math.min(255,g))|0;
    rgb[p+2] = Math.max(0,Math.min(255,bl))|0;
  }
}

writePNG(OUT, rgb);
console.log(`OK  ${T.title}  ->  ${OUT}  ${W}x${H}`);
