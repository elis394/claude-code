// Motion engine — shared by every reel. Scene code lives in scenes.js; don't edit this file per video.
// Contract (scenes.js must define): IMPACTS, SCENES, draw(t). Optional: init(), hudLight(t).
// Everything here is global so scenes.js can use it directly. See references/engine-api.md.
'use strict';
const REEL = Object.assign({ width: 1920, height: 1080, fps: 60, dur: 15, title: 'CLAUDE', subtitle: 'MOTION REEL', hud: true, audio: 'out/reel.wav' }, window.REEL || {});
window.REEL = REEL;
const W = REEL.width, H = REEL.height, CX = W / 2, CY = H / 2, FPS = REEL.fps, DUR = REEL.dur;
const TAU = Math.PI * 2, PI = Math.PI;
const C = { ink: '#0E0E13', cream: '#F3EEE3', coral: '#FF4F2E', cobalt: '#2F4BFF', lime: '#D7FF3B', pink: '#FF9BD6', blue: '#7D8BFF' };
const PAL = [C.coral, C.cobalt, C.lime, C.pink, C.cream];
const F = {
  black: (s) => `900 ${s}px Inter`,
  mono: (s) => `500 ${s}px JB`,
  monoB: (s) => `800 ${s}px JB`,
  serif: (s) => `italic 400 ${s}px Serif`,
};

const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const RENDER = new URLSearchParams(location.search).has('render');
if (RENDER) { document.body.style.cssText = 'margin:0;display:block'; canvas.style.cssText = `width:${W}px;height:${H}px`; }

// ─── math ────────────────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a)); // normalised progress of t through [a, b]
const E = {
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  outBack: (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
  inBack: (x) => 2.70158 * x * x * x - 1.70158 * x * x,
};
// damped spring 0 → 1 (overshoots), dt = seconds since release
const spring = (dt, f = 1.6, d = 6) => (dt <= 0 ? 0 : 1 - Math.exp(-d * dt) * Math.cos(TAU * f * dt));
// decaying wobble 0 → ±1 → 0, used for squash & stretch hits
const pulse = (dt, k = 9, f = 3) => (dt <= 0 ? 0 : Math.exp(-k * dt) * Math.sin(TAU * f * dt));
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',')})`;
};

// ─── drawing helpers ─────────────────────────────────────────────────────
const bg = (c) => { ctx.fillStyle = c; ctx.fillRect(-300, -300, W + 600, H + 600); };
const circle = (x, y, r, c) => { if (r <= 0) return; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const ring = (x, y, r, lw, c) => { if (r <= 0 || lw <= 0.05) return; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); };
function rrect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function text(str, x, y, font, color, o = {}) {
  ctx.save();
  ctx.font = font; ctx.fillStyle = color;
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.fillText(str, x, y);
  ctx.restore();
}
function textWidth(str, font, ls = 0) {
  ctx.save(); ctx.font = font; ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(str).width; ctx.restore(); return w;
}
// per-glyph layout, so letters can be animated individually
const LC = new Map();
function layout(str, font, sp = 0) {
  const key = str + '|' + font + '|' + sp;
  if (LC.has(key)) return LC.get(key);
  ctx.save(); ctx.font = font; ctx.letterSpacing = '0px';
  const xs = [], ws = []; let x = 0;
  for (const ch of str) { const w = ctx.measureText(ch).width; xs.push(x); ws.push(w); x += w + sp; }
  ctx.restore();
  const L = { xs, ws, width: x - sp };
  LC.set(key, L); return L;
}
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+<>';
function scramble(str, p, t) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const k = p * (str.length + 6) - i;
    if (k >= 6 || str[i] === ' ') out += str[i];
    else if (k > 0) out += GLYPHS[(Math.floor(t * 40) + i * 7) % GLYPHS.length];
    else out += ' ';
  }
  return out;
}

// ─── camera: IMPACTS [[time, strength], …] drive shake, punch-zoom and chromatic aberration ───
function impact(t, k = 8) {
  let s = 0;
  for (const [ti, a] of IMPACTS) { const d = t - ti; if (d >= 0 && d < 1.5) s += a * Math.exp(-k * d); }
  return s;
}
function shake(t) {
  let x = 0, y = 0;
  for (const [ti, a] of IMPACTS) {
    const d = t - ti;
    if (d >= 0 && d < 1) { const e = a * Math.exp(-9 * d) * 16; x += e * Math.sin(d * 73 + ti * 10); y += e * Math.cos(d * 91 + ti * 7); }
  }
  return [x, y];
}

// ─── HUD: corner brackets, title, timecode, scene label, timeline ───
const pad2 = (n) => String(n).padStart(2, '0');
function hud(t) {
  if (!REEL.hud) return;
  const a = Math.min(E.outCubic(P(t, 0.15, 0.6)), 1 - P(t, DUR - 0.75, DUR - 0.45));
  if (a <= 0) return;
  const col = typeof hudLight === 'function' && hudLight(t) ? C.ink : C.cream;
  const S = Math.min(W, H) / 1080, m = 36 * S, l = 26 * S, fs = Math.round(17 * S), inset = 74 * S;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y); ctx.stroke();
  }
  text(REEL.title, inset, 80 * S, F.monoB(fs), col, { ls: 3 });
  text('/  ' + REEL.subtitle, inset + textWidth(REEL.title, F.monoB(fs), 3) + 12, 80 * S, F.mono(fs), col, { ls: 3, alpha: 0.7 });
  const f = Math.floor(t * FPS + 1e-6);
  text(`TC 00:${pad2(Math.floor(f / FPS / 60))}:${pad2(Math.floor(f / FPS) % 60)}:${pad2(f % FPS)}`, W - inset, 80 * S, F.mono(fs), col, { align: 'right', ls: 3 });
  let si = 0; SCENES.forEach(([st], k) => { if (t >= st) si = k; });
  const [st, nm] = SCENES[si];
  text(scramble(`${pad2(si + 1)} — ${nm}`, P(t, st, st + 0.4), t), inset, H - 60 * S, F.monoB(fs), col, { ls: 3 });
  text(`${W}×${H} · ${FPS} FPS`, W - inset, H - 60 * S, F.mono(fs), col, { align: 'right', ls: 3, alpha: 0.7 });
  const x0 = 80 * S, x1 = W - 80 * S, y = H - m;
  ctx.globalAlpha = a * 0.25; ctx.fillStyle = col; ctx.fillRect(x0, y - 1, x1 - x0, 2);
  ctx.globalAlpha = a; ctx.fillRect(x0, y - 1.5, (x1 - x0) * clamp(t / DUR), 3);
  for (const [s] of SCENES) ctx.fillRect(x0 + (x1 - x0) * (s / DUR) - 1, y - 6, 2, 12);
  ctx.restore();
}

let vig = null;
function vignette() {
  if (!vig) {
    vig = ctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.35, CX, CY, Math.max(W, H) * 0.6);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.2)');
  }
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
}

// camera (shake + punch zoom) → scene content → vignette
function drawScene(t) {
  t = clamp(t, 0, DUR - 1e-4);
  const [sx, sy] = shake(t), z = 1 + 0.03 * impact(t, 10);
  ctx.save();
  ctx.translate(CX + sx, CY + sy); ctx.scale(z, z); ctx.translate(-CX, -CY);
  draw(t);
  ctx.restore();
  vignette();
}

// ─── offline render: motion blur (SUB sub-frames), chromatic aberration, grain ───
let acc = null, grain = null, outImg = null;
function renderFrame(f, SUB = 4, shutter = 0.5) {
  const t0 = f / FPS;
  if (!acc) {
    acc = new Uint16Array(W * H * 4); grain = new Int8Array(W * H * 2);
    const R = mulberry32(99);
    for (let i = 0; i < grain.length; i++) grain[i] = Math.round((R() + R() + R() - 1.5) * 8);
    outImg = ctx.createImageData(W, H);
  }
  acc.fill(0);
  for (let s = 0; s < SUB; s++) {
    drawScene(t0 + ((s + 0.5) / SUB - 0.5) * (shutter / FPS));
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < d.length; i++) acc[i] += d[i];
  }
  const o = outImg.data, ca = impact(t0, 7), k = ca > 0.03 ? ca * 16 : 0, off = (f * 104729) % (W * H);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = (row + x) * 4, g = grain[off + row + x];
      let r, b;
      if (k) {
        const dx = Math.round((k * (x - CX)) / CX);
        r = acc[(row + clamp(x + dx, 0, W - 1)) * 4]; b = acc[(row + clamp(x - dx, 0, W - 1)) * 4 + 2];
      } else { r = acc[i]; b = acc[i + 2]; }
      o[i] = r / SUB + g; o[i + 1] = acc[i + 1] / SUB + g; o[i + 2] = b / SUB + g; o[i + 3] = 255;
    }
  }
  ctx.putImageData(outImg, 0, 0);
  hud(t0);
}

// ─── boot: called from index.html after scenes.js loads ───
function boot() {
  window.ready = (async () => {
    await Promise.all(['900 100px Inter', '500 20px JB', '800 20px JB', 'italic 400 40px Serif'].map((f) => document.fonts.load(f)));
    if (typeof init === 'function') await init();
    return true;
  })();
  window.renderFrame = renderFrame;
  window.drawAt = (t) => { drawScene(t); hud(t); };
  if (RENDER) return;
  let start = null, audio = null;
  window.ready.then(() => {
    const loop = (now) => {
      if (start === null) start = now;
      const t = audio && !audio.paused ? audio.currentTime : ((now - start) / 1000) % DUR;
      drawScene(t); hud(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  canvas.addEventListener('click', () => {
    if (!audio) { audio = new Audio(REEL.audio); audio.loop = true; }
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  });
}
