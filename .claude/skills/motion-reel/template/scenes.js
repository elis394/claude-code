// Scene code for ONE reel. This is the only file you normally rewrite (plus audio.cjs).
// Example below: the 15 s, six-scene "Motion Reel". Keep what's useful, replace the rest.
// Helpers (E, P, spring, pulse, layout, text, scramble, bg, circle, ring, rrect, mix, mulberry32…) come from engine.js.
'use strict';

// Camera hits: [time, strength]. Strength ~0.25 for a beat accent, 1 for a scene-defining slam.
const IMPACTS = [[1.0, 1], [2.36, 0.25], [5.0, 0.6], [5.5, 0.25], [6.0, 0.25], [6.5, 0.25], [7.0, 0.3], [7.5, 0.5],
  [8.5, 1], [10.5, 0.4], [11.0, 0.3], [11.5, 0.3], [12.0, 0.3], [13.0, 1], [14.6, 0.35], [14.85, 0.3]];
// HUD scene labels: [start time, name]
const SCENES = [[0, 'GENESIS'], [2.45, 'MORPH'], [5, 'KINETIC TYPE'], [7.5, 'PARTICLES'], [10.5, 'GRID SYSTEM'], [13, 'FINALE']];
// true where the background is light, so the HUD switches to dark ink
const hudLight = (t) => (t >= 2.4 && t < 7.4) || (t >= 13 && t < 14.7);

// ═════════════════════════════════════════════════════════════════════════
// 01 GENESIS  [0 – 2.45]  a dot, three arcs, anticipation, burst, MOTION
// ═════════════════════════════════════════════════════════════════════════
const S1R = mulberry32(11);
const SHARDS = [...Array(72)].map(() => ({
  a: S1R() * TAU, sp: 380 + S1R() * 1000, sz: 4 + S1R() * 10, c: PAL[Math.floor(S1R() * 5)],
  spin: (S1R() - 0.5) * 3, r0: 160 + S1R() * 160,
}));
const ARCS = [[170, C.cream, 0.3], [240, C.coral, 0.38], [310, C.cobalt, 0.46]];

function s1(t) {
  bg(C.ink);
  const ant = 1 - 0.14 * E.inCubic(P(t, 0.74, 1.0)); // wind-up before the hit
  if (t < 1.0) {
    // tick ring
    const tp = E.inOutExpo(P(t, 0.46, 0.96));
    ctx.strokeStyle = C.cream; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
    for (let i = 0; i < Math.floor(90 * tp); i++) {
      const a = -PI / 2 + (i / 90) * TAU, r1 = 372 * ant, r2 = (i % 5 ? 382 : 396) * ant;
      ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1); ctx.lineTo(CX + Math.cos(a) * r2, CY + Math.sin(a) * r2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const [r, c, d] of ARCS) {
      const p = E.inOutExpo(P(t, d, d + 0.5));
      if (p <= 0) continue;
      const R = r * ant, a0 = -PI / 2, a1 = a0 + TAU * p;
      ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(CX, CY, R, a0, a1); ctx.stroke();
      circle(CX + Math.cos(a1) * R, CY + Math.sin(a1) * R, 10, c);
    }
    const dr = 16 * spring(t - 0.02, 1.8, 6) * (1 + 0.35 * pulse(t - 0.5, 7, 2.5)) * ant;
    circle(CX, CY, dr, C.cream);
  }

  const d = t - 1.0;
  if (d >= 0) {
    if (d < 0.3) { ctx.globalAlpha = 0.55 * Math.exp(-d * 16); bg(C.cream); ctx.globalAlpha = 1; }
    ARCS.forEach(([r, c], k) => {
      const p = E.outExpo(P(d, k * 0.03, 0.9 + k * 0.05));
      if (p < 1) { ctx.globalAlpha = 1 - p * 0.5; ring(CX, CY, r * 0.86 + (800 + k * 240) * p, 28 * Math.pow(1 - p, 1.4), c); ctx.globalAlpha = 1; }
    });
    if (d < 1.3) {
      const p = E.outExpo(P(d, 0, 1.2));
      for (const s of SHARDS) {
        const rr = s.r0 * 0.86 + s.sp * p;
        ctx.save();
        ctx.globalAlpha = 1 - P(d, 0.3, 1.2);
        ctx.translate(CX + Math.cos(s.a) * rr, CY + Math.sin(s.a) * rr);
        ctx.rotate(s.a + s.spin * d);
        ctx.fillStyle = s.c;
        const len = s.sz * 5 * (1 - 0.7 * p) + s.sz;
        ctx.fillRect(-len / 2, -s.sz / 2, len, s.sz);
        ctx.restore();
      }
    }
  }

  // MOTION — block-reveal per letter
  const WORD = 'MOTION', wf = F.black(280), sp = -6, L = layout(WORD, wf, sp);
  const x0 = CX - L.width / 2, base = CY + 102;
  const bcol = [C.coral, C.cobalt, C.lime, C.pink, C.cream, C.coral];
  for (let i = 0; i < WORD.length; i++) {
    const ti = 1.08 + i * 0.055, lx = x0 + L.xs[i], w = L.ws[i];
    if (t >= ti + 0.18) {
      const bump = pulse(t - (2.0 + i * 0.025), 9, 3.2);
      const pop = 1 + 0.12 * (1 - spring(t - ti - 0.18, 1.8, 7));
      ctx.save();
      ctx.translate(lx + w / 2, base);
      ctx.scale((1 + 0.1 * bump) * pop, (1 - 0.16 * bump) * pop);
      ctx.font = wf; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
      ctx.fillText(WORD[i], 0, 0);
      ctx.restore();
    }
    const p1 = E.outExpo(P(t, ti, ti + 0.2)), p2 = E.inOutExpo(P(t, ti + 0.2, ti + 0.46));
    if (p1 > 0 && p2 < 1) {
      const l = lx - 6 + (w + 12) * p2, r = lx - 6 + (w + 12) * p1;
      ctx.fillStyle = bcol[i]; ctx.fillRect(l, base - 226, r - l, 256);
    }
  }
  const up = E.inOutExpo(P(t, 1.5, 1.9)), uq = E.inOutExpo(P(t, 2.05, 2.35));
  if (up > uq) { ctx.fillStyle = C.coral; ctx.fillRect(x0 + L.width * uq, base + 44, L.width * (up - uq), 8); }
  const cap = scramble('A SHORT FILM ABOUT MOVEMENT', P(t, 1.4, 1.9), t);
  text(cap, CX, base - 272, F.mono(22), C.cream, { align: 'center', ls: 8, alpha: 0.75 });
}

// diagonal colour slices: GENESIS → MORPH
function slices(t) {
  const cols = [C.lime, C.cobalt, C.pink, C.coral, C.cream], sk = 260;
  cols.forEach((c, k) => {
    const st = 2.08 + k * 0.04, p = E.inOutExpo(P(t, st, st + 0.28));
    if (p <= 0) return;
    const edge = lerp(-sk - 20, W + sk + 40, p);
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(-300, -300); ctx.lineTo(edge + sk * 1.55, -300); ctx.lineTo(edge - sk * 1.55, H + 300); ctx.lineTo(-300, H + 300); ctx.fill();
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 02 MORPH  [2.45 – 5.0]  polar-sampled shape morphs with a time-echo stack
// ═════════════════════════════════════════════════════════════════════════
const NS = 240;
const radiiFrom = (f) => { const a = new Float32Array(NS); for (let i = 0; i < NS; i++) a[i] = f(-PI / 2 + (i / NS) * TAU); return a; };
function polyR(v) { // ray-cast from the origin against a star-convex polygon
  return radiiFrom((th) => {
    const dx = Math.cos(th), dy = Math.sin(th); let best = 1e9;
    for (let k = 0; k < v.length; k++) {
      const a = v[k], b = v[(k + 1) % v.length], ex = b[0] - a[0], ey = b[1] - a[1];
      const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      const tr = (a[0] * ey - a[1] * ex) / den, u = (a[0] * dy - a[1] * dx) / den;
      if (tr > 0 && u >= -1e-6 && u <= 1 + 1e-6 && tr < best) best = tr;
    }
    return best;
  });
}
const ngon = (n, r, rot) => [...Array(n)].map((_, k) => [Math.cos(rot + (k * TAU) / n) * r, Math.sin(rot + (k * TAU) / n) * r]);
const SH = {
  circle: radiiFrom(() => 1),
  square: polyR(ngon(4, 1.22, PI / 4)),
  triangle: polyR(ngon(3, 1.42, -PI / 2)),
  star: polyR([...Array(10)].map((_, k) => { const r = k % 2 ? 0.6 : 1.38, a = -PI / 2 + (k * PI) / 5; return [Math.cos(a) * r, Math.sin(a) * r]; })),
  flower: radiiFrom((th) => 0.9 + 0.22 * Math.cos(6 * th)),
};
const S2T = 2.52;
const KEYS = [[S2T, 'circle'], [3.0, 'square'], [3.5, 'triangle'], [4.0, 'star'], [4.5, 'flower'], [4.72, 'circle']];
const NAMES = ['CIRCLE', 'SQUARE', 'TRIANGLE', 'STAR', 'FLOWER'];
const tmpR = new Float32Array(NS);
function shapeR(t) {
  tmpR.set(SH[KEYS[0][1]]);
  for (let k = 1; k < KEYS.length; k++) {
    const m = spring(t - KEYS[k][0], 1.5, 6.5); if (m === 0) break;
    const S = SH[KEYS[k][1]];
    for (let i = 0; i < NS; i++) tmpR[i] = lerp(tmpR[i], S[i], m);
  }
  return tmpR;
}
function shapeRot(t) {
  let r = t * 0.15;
  for (let k = 1; k < 5; k++) r += (PI / 2) * E.inOutExpo(P(t, KEYS[k][0] - 0.08, KEYS[k][0] + 0.32));
  return r;
}
const shapeScale = (t) => 190 * spring(t - S2T, 1.3, 5.5) * (1 + 9 * E.inExpo(P(t, 4.72, 5.0)));
function shapePath(t) {
  const R = shapeScale(t); if (R <= 0) return false;
  const r = shapeR(t), ro = shapeRot(t);
  ctx.beginPath();
  for (let i = 0; i < NS; i++) {
    const a = -PI / 2 + (i / NS) * TAU + ro, rr = r[i] * R;
    const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); return true;
}
function s2(t) {
  bg(C.cream);
  const ui = E.outCubic(P(t, 2.6, 2.95)) * (1 - P(t, 4.58, 4.72));
  // construction lines
  const cl = E.outExpo(P(t, S2T, 3.1));
  ctx.save(); ctx.globalAlpha = 0.22 * ui + 0.0001; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(CX - 900 * cl, CY); ctx.lineTo(CX + 900 * cl, CY); ctx.moveTo(CX, CY - 480 * cl); ctx.lineTo(CX, CY + 480 * cl); ctx.stroke();
  ctx.globalAlpha = 0.45 * ui; ctx.setLineDash([3, 11]); ctx.lineDashOffset = -t * 60;
  ctx.beginPath(); ctx.arc(CX, CY, 340, -PI / 2, -PI / 2 + TAU * E.inOutExpo(P(t, 2.6, 3.2))); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
  // orbiting satellites
  [[C.coral, 1.7, 0], [C.cobalt, -1.2, 2], [C.ink, 2.3, 4]].forEach(([c, sp, ph], k) => {
    const a = ph + t * sp, s = spring(t - (2.7 + k * 0.08), 1.6, 6) * ui;
    circle(CX + Math.cos(a) * 340, CY + Math.sin(a) * 340, 10 * s, c);
  });
  // echo stack: the same shape sampled slightly in the past
  const ECH = [C.coral, C.pink, C.lime, C.cobalt, C.ink];
  for (let k = 5; k >= 1; k--) {
    if (shapePath(t - k * 0.045)) { ctx.fillStyle = ECH[k - 1]; ctx.globalAlpha = k === 5 ? 0.25 : 1; ctx.fill(); ctx.globalAlpha = 1; }
  }
  if (shapePath(t)) { ctx.fillStyle = t < 4.72 ? C.ink : C.coral; ctx.fill(); }
  // anchor point
  const ap = spring(t - 2.75, 1.6, 6) * ui;
  if (ap > 0) {
    ctx.strokeStyle = C.cream; ctx.lineWidth = 2;
    ring(CX, CY, 9 * ap, 2, C.cream);
    ctx.beginPath(); ctx.moveTo(CX - 20 * ap, CY); ctx.lineTo(CX + 20 * ap, CY); ctx.moveTo(CX, CY - 20 * ap); ctx.lineTo(CX, CY + 20 * ap); ctx.stroke();
  }
  // side UI
  let idx = 0; for (let k = 1; k < 5; k++) if (t >= KEYS[k][0]) idx = k;
  if (ui > 0) {
    ctx.save(); ctx.globalAlpha = ui;
    const lx = 150 - 40 * (1 - ui);
    text('SHAPE', lx, CY - 70, F.mono(18), C.ink, { ls: 6, alpha: 0.5 });
    text(scramble(NAMES[idx], P(t, KEYS[idx][0], KEYS[idx][0] + 0.3), t), lx, CY - 10, F.monoB(52), C.ink, { ls: 2 });
    const rot = ((shapeRot(t) * 180) / PI) % 360;
    text(`ROT  ${rot.toFixed(1).padStart(5, '0')}°`, lx, CY + 44, F.mono(20), C.ink, { ls: 3, alpha: 0.7 });
    text(`R    ${shapeScale(t).toFixed(1)}px`, lx, CY + 76, F.mono(20), C.ink, { ls: 3, alpha: 0.7 });
    text('EASE spring(1.5, 6.5)', lx, CY + 108, F.mono(20), C.ink, { ls: 3, alpha: 0.7 });
    // right list with a sprung selection marker
    const rx = W - 400 + 40 * (1 - ui), y0 = CY - 130;
    let my = y0; for (let k = 1; k < 5; k++) my += 58 * spring(t - KEYS[k][0], 1.6, 7);
    ctx.fillStyle = C.ink; ctx.fillRect(rx - 18, my - 33, 260, 46);
    NAMES.forEach((n, k) => {
      const on = Math.abs(my - (y0 + k * 58)) < 25;
      text(`0${k + 1}  ${n}`, rx, y0 + k * 58, F.monoB(24), on ? C.cream : C.ink, { ls: 3, alpha: on ? 1 : 0.45 });
    });
    ctx.restore();
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 03 KINETIC TYPE  [5.0 – 7.5]  marquee field + sprung word box
// ═════════════════════════════════════════════════════════════════════════
const WORDS = ['EASE', 'TIMING', 'SPACING', 'RHYTHM', 'FEEL'];
const WROT = [-3, 2.5, -2, 3, -1.5].map((d) => (d * PI) / 180);
const BEATS3 = [5.0, 5.5, 6.0, 6.5, 7.0];
function s3(t) {
  bg(C.coral);
  // marquee rows
  const MQ = 'EASE IN — EASE OUT — ', mf = F.black(150), uw = textWidth(MQ, mf, -2);
  let boost = 0; for (const b of BEATS3) boost += 220 * E.outExpo(P(t, b, b + 0.45));
  ctx.save(); ctx.translate(CX, CY); ctx.rotate((-8 * PI) / 180);
  ctx.font = mf; ctx.letterSpacing = '-2px'; ctx.textBaseline = 'middle';
  for (let j = 0; j < 9; j++) {
    const dir = j % 2 ? 1 : -1, y = (j - 4) * 168;
    const entry = (1 - E.outExpo(P(t, 5.0 + j * 0.025, 5.6 + j * 0.025))) * 2400 * dir;
    const off = ((((t * 260 + boost) * dir + j * 311) % uw) + uw) % uw;
    if (j % 2) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.4; }
    else { ctx.fillStyle = C.cream; ctx.globalAlpha = 0.16; }
    for (let x = -1500 - off + entry; x < 1500 + entry; x += uw) j % 2 ? ctx.strokeText(MQ, x, y) : ctx.fillText(MQ, x, y);
  }
  ctx.restore(); ctx.globalAlpha = 1;

  // word box
  const wf = F.black(170), sp = -4, pad = 120, bh = 230;
  const Ls = WORDS.map((w) => layout(w, wf, sp));
  let bw = Ls[0].width + pad, rot = WROT[0], pul = 0;
  for (let i = 1; i < WORDS.length; i++) {
    const s = spring(t - BEATS3[i], 2, 7);
    bw += (Ls[i].width - Ls[i - 1].width) * s; rot += (WROT[i] - WROT[i - 1]) * s;
  }
  for (const b of BEATS3) pul += pulse(t - b, 10, 2.2);
  const exit = 1 - E.inBack(P(t, 7.12, 7.34));
  const sc = spring(t - 5.0, 1.8, 6) * (1 + 0.07 * pul) * exit;
  if (sc > 0.001) {
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = C.ink; ctx.fillRect(-bw / 2 + 16, -bh / 2 + 16, bw, bh);
    ctx.fillStyle = C.lime; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.beginPath(); ctx.rect(-bw / 2, -bh / 2, bw, bh); ctx.clip();
    ctx.font = wf; ctx.fillStyle = C.ink; ctx.textAlign = 'left';
    for (let i = 0; i < WORDS.length; i++) {
      const L = Ls[i], x0 = -L.width / 2, tin = BEATS3[i], tout = BEATS3[i + 1] ?? 99;
      for (let c = 0; c < WORDS[i].length; c++) {
        const st = c * 0.02, ti = i ? tin + 0.09 + st : tin + st;
        const yin = (1 - E.outExpo(P(t, ti, ti + 0.32))) * 260;
        const yout = -E.inCubic(P(t, tout + st * 0.4, tout + st * 0.4 + 0.12)) * 260;
        if (t < ti || yout <= -259) continue;
        ctx.fillText(WORDS[i][c], x0 + L.xs[c], 62 + yin + yout);
      }
    }
    ctx.restore();
    let wi = 0; for (let i = 0; i < 5; i++) if (t >= BEATS3[i]) wi = i;
    const cap = `PRINCIPLE ${String(wi + 1).padStart(2, '0')} / 05`, cw = textWidth(cap, F.mono(22), 6), ca = exit * clamp(sc);
    ctx.globalAlpha = ca; ctx.fillStyle = C.ink; ctx.fillRect(CX - cw / 2 - 18, CY + bh / 2 + 42, cw + 30, 42); ctx.globalAlpha = 1;
    text(cap, CX + 3, CY + bh / 2 + 71, F.mono(22), C.cream, { align: 'center', ls: 6, alpha: ca });
  }

  // easing graph widget
  const ga = E.outCubic(P(t, 5.15, 5.5)) * (1 - P(t, 7.1, 7.25));
  if (ga > 0) {
    const gx = 120, gy = H - 150, gs = 220;
    ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.fillStyle = C.coral; ctx.fillRect(gx - 34, gy - gs - 60, gs + 250, gs + 94); ctx.strokeRect(gx - 34, gy - gs - 60, gs + 250, gs + 94);
    ctx.beginPath(); ctx.moveTo(gx, gy - gs); ctx.lineTo(gx, gy); ctx.lineTo(gx + gs, gy); ctx.stroke();
    const cp = E.inOutCubic(P(t, 5.2, 5.7));
    ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 60 * cp; i++) { const x = i / 60; ctx.lineTo(gx + x * gs, gy - E.outExpo(x) * gs); }
    ctx.stroke();
    const ph = (((t - 5) % 0.5) + 0.5) % 0.5 / 0.5, vy = E.outExpo(ph);
    ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(gx + ph * gs, gy); ctx.lineTo(gx + ph * gs, gy - vy * gs); ctx.lineTo(gx + gs + 40, gy - vy * gs); ctx.stroke();
    ctx.setLineDash([]);
    circle(gx + ph * gs, gy - vy * gs, 9, C.ink);
    ctx.fillStyle = C.lime; ctx.fillRect(gx + gs + 30, gy - vy * gs - 10, 20, 20);
    ctx.strokeRect(gx + gs + 30, gy - vy * gs - 10, 20, 20);
    text('ease-out-expo', gx, gy - gs - 22, F.mono(18), C.ink, { ls: 2 });
    text(`y = ${vy.toFixed(3)}`, gx + gs + 70, gy - vy * gs + 7, F.mono(18), C.ink, { ls: 2 });
    ctx.restore();
  }
  // iris out to ink
  const ip = E.inOutExpo(P(t, 7.18, 7.5));
  if (ip > 0) { ring(CX, CY, 1150 * ip + 40, 24 * (1 - ip) + 2, C.cream); circle(CX, CY, 1150 * ip, C.ink); }
}

// ═════════════════════════════════════════════════════════════════════════
// 04 PARTICLES  [7.5 – 10.6]  torus knot → explosion → dot-matrix type
// ═════════════════════════════════════════════════════════════════════════
let PARTS = null;
const PCOL = [C.cream, C.lime, C.pink, C.blue];
const knot = (u) => { const r = Math.cos(3 * u) + 2; return [r * Math.cos(2 * u), r * Math.sin(2 * u), -Math.sin(3 * u) * 1.2]; };
function knotCam(t) {
  return {
    yaw: t * 1.1 + 2.2 * E.inOutCubic(P(t, 8.15, 8.5)),
    pitch: 0.45 + 0.25 * Math.sin(t * 0.8),
    sc: 135 * (1 - 0.14 * E.inCubic(P(t, 8.2, 8.5))),
  };
}
function project(X, Y, Z, cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
  const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp;
  const s = 1100 / (1100 + z2);
  return [CX + x1 * s, CY + y2 * s, s, z2];
}
function knotPoint(p, t) {
  const cam = knotCam(t), k = knot(p.u);
  const pin = E.outExpo(P(t, 7.5 + p.del, 8.15 + p.del));
  const X = lerp(p.sx, (k[0] + p.ox) * cam.sc, pin), Y = lerp(p.sy, (k[1] + p.oy) * cam.sc, pin), Z = lerp(p.sz, (k[2] + p.oz) * cam.sc, pin);
  return project(X, Y, Z, cam);
}
function initParticles() {
  const R = mulberry32(42);
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
  const o = oc.getContext('2d');
  o.font = F.black(410); o.textAlign = 'center'; o.textBaseline = 'middle'; o.letterSpacing = '-10px'; o.fillStyle = '#fff';
  o.fillText('CRAFT', CX, CY + 6);
  const d = o.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 2; y < H; y += 6) for (let x = 2 + ((y / 6) % 2) * 3; x < W; x += 6) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  PARTS = pts.map(([tx, ty]) => {
    const u = R() * TAU, th = R() * TAU, ph = Math.acos(2 * R() - 1), tr = 0.38 * Math.cbrt(R());
    const sth = R() * TAU, sph = Math.acos(2 * R() - 1), sd = 1400 + R() * 900;
    const cr = R();
    const p = {
      u, ox: tr * Math.sin(ph) * Math.cos(th), oy: tr * Math.sin(ph) * Math.sin(th), oz: tr * Math.cos(ph),
      sx: sd * Math.sin(sph) * Math.cos(sth), sy: sd * Math.sin(sph) * Math.sin(sth), sz: sd * Math.cos(sph) * 0.3,
      del: R() * 0.3, tx, ty, tdel: (tx / W) * 0.35 + R() * 0.08,
      col: cr < 0.55 ? 0 : cr < 0.75 ? 1 : cr < 0.9 ? 2 : 3, col2: cr < 0.82 ? 0 : 1,
      dist: 250 + R() * 750, jit: (R() - 0.5) * 0.9, swx: (R() - 0.5) * 360, swy: (R() - 0.5) * 360, ph: R() * TAU,
    };
    const [kx, ky] = knotPoint(p, 8.5);
    const a = Math.atan2(ky - CY, kx - CX) + p.jit;
    p.kx = kx; p.ky = ky; p.dx = Math.cos(a); p.dy = Math.sin(a);
    return p;
  });
}
function s4(t) {
  bg(C.ink);
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 700);
  const ga = 0.35 * P(t, 7.5, 8.2) * (1 - 0.6 * P(t, 8.5, 9.2));
  g.addColorStop(0, `rgba(47,75,255,${ga})`); g.addColorStop(1, 'rgba(47,75,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cam = knotCam(t);
  if (t < 8.5) { // knot centreline
    ctx.strokeStyle = C.cream; ctx.globalAlpha = 0.14 * P(t, 7.8, 8.2); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const k = knot((i / 400) * TAU); const [x, y] = project(k[0] * cam.sc, k[1] * cam.sc, k[2] * cam.sc, cam); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'lighter';
  const cols = t < 8.5 ? PCOL : [C.lime, C.cream];
  for (let c = 0; c < cols.length; c++) {
    ctx.fillStyle = cols[c];
    for (const p of PARTS) {
      if ((t < 8.5 ? p.col : p.col2) !== c) continue;
      let x, y, s, al;
      if (t < 8.5) {
        const [px, py, ps, pz] = knotPoint(p, t);
        if (pz < -700) continue;
        x = px; y = py; s = Math.min(2.6 * ps, 5); al = clamp(0.35 + 0.65 * (1 - (pz + 300) / 600)) * P(t, 7.5 + p.del * 0.5, 7.7 + p.del);
      } else {
        const ex = E.outExpo(P(t, 8.5, 9.2));
        const bx = p.kx + p.dx * p.dist * ex, by = p.ky + p.dy * p.dist * ex;
        const q = E.inOutCubic(P(t, 8.75 + p.tdel * 0.8, 9.3 + p.tdel * 0.8)), sw = Math.sin(q * PI);
        x = lerp(bx, p.tx, q) + sw * p.swx + Math.sin(t * 9 + p.ph) * 0.7 * q;
        y = lerp(by, p.ty, q) + sw * p.swy + Math.cos(t * 8 + p.ph) * 0.7 * q;
        const w = E.inCubic(P(t, 9.98 + (p.tx / W) * 0.2, 10.4 + (p.tx / W) * 0.2));
        x += w * (1000 + p.dist); y += w * (p.swy * 1.5 - 150);
        s = lerp(2.4, 3.8, q); al = (0.8 + 0.2 * Math.sin(t * 14 + p.ph * 3)) * (1 - w * 0.7);
      }
      if (al <= 0.01) continue;
      ctx.globalAlpha = al; ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const d = t - 8.5;
  if (d >= 0 && d < 1) {
    const p = E.outExpo(P(d, 0, 0.8));
    ctx.globalAlpha = 1 - p; ring(CX, CY, 60 + 1200 * p, 40 * (1 - p), C.cream);
    ctx.globalAlpha = 0.5 * Math.exp(-d * 14); bg(C.cream); ctx.globalAlpha = 1;
  }
  const la = P(t, 9.5, 9.7) * (1 - P(t, 9.95, 10.1));
  if (la > 0) text(scramble(`${PARTS.length.toLocaleString('en-US')} PARTICLES · ONE WORD`, P(t, 9.5, 9.85), t), CX, CY + 250, F.mono(22), C.lime, { align: 'center', ls: 8, alpha: la });
}

// ═════════════════════════════════════════════════════════════════════════
// 05 GRID SYSTEM  [10.15 – 13.0]  tiles wipe in, breathe, card-flip ripples
// ═════════════════════════════════════════════════════════════════════════
const RIP = [[11.0, 7.5, 4], [11.5, 0, 0], [12.0, 15, 8]];
const TGT = [8, 4];
function tileColor(i, j, n) {
  if (n === 0) return C.cobalt;
  if (n === 1) return [C.coral, C.lime, C.pink, C.cobalt][(i + j) % 4];
  if (n === 2) return (i + j) % 2 ? C.cream : C.coral;
  if (i === TGT[0] && j === TGT[1]) return C.cream;
  return PAL[(((i - j) % 5) + 5) % 5];
}
function tiles(t) {
  const fz = E.inOutCubic(P(t, 12.15, 12.6));
  const fx = lerp(CX, 60 + 120 * TGT[0], fz), fy = lerp(CY, 60 + 120 * TGT[1], fz);
  const z = E.inExpo(P(t, 12.4, 13.0)), S = Math.exp(Math.log(30) * z);
  ctx.save(); ctx.translate(CX, CY); ctx.scale(S, S); ctx.rotate((z * PI) / 2); ctx.translate(-fx, -fy);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 16; i++) {
    const st = 10.15 + i * 0.01 + j * 0.004, e = E.outExpo(P(t, st, st + 0.26));
    if (e <= 0) continue;
    const dc = Math.hypot(i - 7.5, j - 4), sh = spring(t - (10.62 + dc * 0.035), 1.3, 6);
    let size = lerp(122, 86, sh) * e;
    const rad = lerp(0, 20, clamp(sh));
    size *= 1 - 0.12 * clamp(sh) * (1 - z) * (0.5 + 0.5 * Math.sin(dc * 0.9 - t * 6));
    let n = 0, fl = 1, lift = 0;
    for (const [rt, ri, rj] of RIP) {
      const fp = clamp((t - (rt + Math.hypot(i - ri, j - rj) / 20)) / 0.3);
      if (fp >= 0.5) n++;
      if (fp > 0 && fp < 1) { fl = Math.abs(Math.cos(PI * E.inOutCubic(fp))); lift = Math.sin(PI * fp); }
    }
    if (fl < 0.01) continue;
    ctx.save();
    ctx.translate(60 + 120 * i, 60 + 120 * j); ctx.rotate(((1 - e) * PI) / 2); ctx.scale(fl * (1 + 0.2 * lift), 1 + 0.2 * lift);
    rrect(-size / 2, -size / 2, size, size, rad);
    ctx.fillStyle = tileColor(i, j, n); ctx.fill();
    if (lift > 0) { ctx.fillStyle = `rgba(14,14,19,${0.3 * lift})`; ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════
// 06 FINALE  [13.0 – 15.0]  CLAUDE, rings, tagline, collapse to a dot → loop
// ═════════════════════════════════════════════════════════════════════════
const DIRS = [[-700, -350, -0.7], [0, -620, 0.4], [650, -380, 0.6], [-650, 380, -0.5], [0, 620, 0.3], [700, 360, 0.7]];
const TAG = '15 SEC · 900 FRAMES · 0 KEYFRAMES · 100% CODE';
function s6(t) {
  bg(C.cream);
  const g = 1 - E.inBack(P(t, 14.22, 14.58));
  const base = CY;
  if (g > 0.001) {
    ctx.save(); ctx.translate(CX, CY - 20); ctx.scale(g, g); ctx.translate(-CX, -(CY - 20));
    [C.coral, C.cobalt, C.lime, C.pink].forEach((c, k) => {
      const p = E.outExpo(P(t, 13.0 + k * 0.06, 14.1 + k * 0.06));
      ring(CX, CY - 80, 40 + (650 + k * 170) * p, 110 * Math.pow(1 - p, 1.5), c);
    });
    const wf = F.black(300), sp = -10, L = layout('CLAUDE', wf, sp), x0 = CX - L.width / 2;
    ctx.font = wf; ctx.textAlign = 'center';
    for (const layer of [0, 1]) {
      for (let i = 0; i < 6; i++) {
        const p = spring(t - (13.0 + i * 0.035 + layer * 0.05), 1.4, 6.5);
        if (p <= 0) continue;
        const [ox, oy, orot] = DIRS[i];
        ctx.save();
        ctx.globalAlpha = clamp(p * 4);
        ctx.translate(x0 + L.xs[i] + L.ws[i] / 2 + ox * (1 - p) + (layer ? 0 : 12), base + oy * (1 - p) + (layer ? 0 : 12));
        ctx.rotate(orot * (1 - p));
        ctx.fillStyle = layer ? C.ink : C.coral;
        ctx.fillText('CLAUDE'[i], 0, 0);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    // serif line, mask reveal
    const sf = F.serif(92), sw = textWidth('motion, written in code.', sf), rv = E.inOutExpo(P(t, 13.35, 13.9));
    if (rv > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(CX - sw / 2 - 10, base + 30, (sw + 20) * rv, 120); ctx.clip();
      text('motion, written in code.', CX, base + 112 + 24 * (1 - E.outExpo(P(t, 13.35, 13.9))), sf, C.ink, { align: 'center' });
      ctx.restore();
    }
    // swatches
    PAL.forEach((c, k) => {
      const p = spring(t - (13.65 + k * 0.05), 1.6, 6), s = 28 * p;
      if (s <= 0) return;
      rrect(CX + (k - 2) * 46 - s / 2, base + 180 - s / 2, s, s, 6);
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    });
    // typewriter
    const mf = F.mono(22), tw = textWidth(TAG, mf, 4), n = Math.floor(P(t, 13.85, 14.2) * TAG.length);
    if (t >= 13.85) {
      const shown = TAG.slice(0, n), sx = CX - tw / 2;
      text(shown, sx, base + 250, mf, C.ink, { ls: 4 });
      if (n < TAG.length || Math.floor(t * 5) % 2 === 0) { ctx.fillStyle = C.coral; ctx.fillRect(sx + textWidth(shown, mf, 4) + 4, base + 230, 13, 26); }
    }
    ctx.restore();
  }
  // collapse into a dot, dot irises out, a cream dot returns and vanishes → loops to frame 0
  const dot = 16 * E.outBack(P(t, 14.46, 14.6)), iris = 1150 * E.inOutExpo(P(t, 14.6, 14.85));
  circle(CX, CY - 20, Math.max(dot, iris), C.ink);
  if (t >= 14.84) circle(CX, CY, 16 * spring(t - 14.84, 1.8, 6) * (1 - E.inCubic(P(t, 14.9, 14.97))), C.cream);
}

// Scene router. Each hand-off must be fully covered (a wipe, an iris, a shape filling the frame)
// on the frame where the underlying scene switches, or the cut will pop.
function draw(t) {
  if (t < 2.45) s1(t);
  else if (t < 5.0) s2(t);
  else if (t < 7.5) s3(t);
  else if (t < 13.0) { if (t < 10.62) s4(t); else bg(C.ink); if (t >= 10.15) tiles(t); }
  else s6(t);
  if (t >= 2.08 && t < S2T) slices(t);
}

// runs once after fonts load (for anything that measures text or samples pixels)
function init() { initParticles(); }
