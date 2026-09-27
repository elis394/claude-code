#!/usr/bin/env node
// Soundtrack arrangement for THIS reel. Rewrite freely; instruments come from synth.cjs.
// Put every hit on the same times as the visuals in scenes.js (IMPACTS, scene cuts, reveals).
//   kick(t, amp, duck=true)   boom(t, amp)          crash(t, amp)       hat(t, amp, pan)
//   clap(t, amp)              tick(t, amp, pan)     riser(t0, t1, amp)  swoosh(t0, t1, amp, dir=±1)
//   fm(t, freqHz, amp, pan, decay, index, reverbSend, ratio)   ← bells / plucks / stabs
//   pad(t0, t1, [midi…], amp)  bass(t0, t1, midi, amp)        ← call AFTER all kicks (side-chain)
const path = require('path');
const DUR = 15;
const { kick, boom, crash, hat, clap, tick, fm, riser, swoosh, pad, bass, hz, range, write } = require('./synth.cjs')(DUR);

// ─── arrangement ───────────────────────────────────────────────────────────
const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91];

// kicks first: they write the side-chain curve everything else reads
[1.0, 1.5, 2.0, ...range(2.5, 7.0, 0.5), 7.5, ...range(8.5, 12.0, 0.5), 13.0, 13.5, 14.0].forEach((t) => kick(t, t === 7.5 || t >= 13.5 ? 0.7 : 1));
kick(14.6, 0.55, false);

// 01 GENESIS
fm(0.03, hz(93), 0.1, 0, 7, 1.5, 0.5);
riser(0.15, 1.0, 0.35);
[[0.3, 81, -0.5], [0.38, 84, 0], [0.46, 88, 0.5]].forEach(([t, m, p]) => fm(t, hz(m), 0.14, p, 6, 2, 0.4));
boom(1.0, 1); crash(1.0, 0.3);
[69, 72, 74, 76, 79, 81].forEach((m, i) => fm(1.27 + i * 0.055, hz(m + 12), 0.07, -0.6 + i * 0.24, 9, 1.2, 0.3));
[1.25, 1.75, 2.25].forEach((t) => hat(t));
swoosh(2.02, 2.52, 0.4);

// 02 MORPH + 03 KINETIC TYPE: groove
range(2.75, 7.25, 0.5).forEach((t, i) => hat(t, 0.22, i % 2 ? 0.25 : -0.25));
range(2.5, 7.25, 0.25).forEach((t) => hat(t, 0.06, -0.4));
[3.0, 4.0, 5.5, 6.5].forEach((t) => clap(t));
[[2.52, 72], [3.0, 76], [3.5, 79], [4.0, 81], [4.5, 84]].forEach(([t, m], i) => fm(t, hz(m), 0.12, -0.4 + i * 0.2, 4, 3, 0.45));
swoosh(4.62, 5.0, 0.45); crash(5.0, 0.22);
[[5.0, 57], [5.5, 60], [6.0, 62], [6.5, 64], [7.0, 67]].forEach(([t, m]) =>
  [0, 7, 12].forEach((iv, j) => fm(t + 0.09, hz(m + iv + 12), 0.07, (j - 1) * 0.5, 8, 2.2, 0.3, 1)));
swoosh(7.12, 7.5, 0.4);

// 04 PARTICLES: breakdown → drop
boom(7.5, 0.35);
riser(7.55, 8.5, 0.5);
range(7.5, 8.375, 0.125).forEach((t, i) => fm(t, hz([57, 60, 64, 69, 72, 76, 81, 84][i % 8]), 0.04 + i * 0.006, (i % 2 ? 0.5 : -0.5), 10, 1.5, 0.5));
boom(8.5, 1.1); crash(8.5, 0.4);
range(8.75, 10.25, 0.5).forEach((t) => hat(t, 0.22, 0.25));
range(8.5, 10.25, 0.25).forEach((t) => hat(t, 0.06, -0.4));
[9.0, 10.0].forEach((t) => clap(t));
fm(9.5, hz(88), 0.06, 0, 2, 1, 0.8, 3);

// 05 GRID SYSTEM
for (let i = 0; i < 16; i++) tick(10.15 + i * 0.01, 0.09, -0.9 + i * 0.12);
swoosh(10.08, 10.5, 0.3);
crash(10.5, 0.15);
range(10.75, 12.25, 0.5).forEach((t) => hat(t, 0.22, 0.25));
range(10.5, 12.25, 0.25).forEach((t) => hat(t, 0.06, -0.4));
[11.0, 12.0].forEach((t) => clap(t));
[[11.0, 0, 0], [11.5, 2, -1], [12.0, 4, 1]].forEach(([t, o, dir]) =>
  PENTA.slice(o, o + 6).forEach((m, i) => fm(t + i * 0.04, hz(m), 0.06, dir ? dir * (-0.8 + i * 0.3) : (i % 2 ? 0.5 : -0.5), 9, 2, 0.35)));
riser(12.3, 13.0, 0.55);
[12.5, 12.625, 12.75, 12.8125, 12.875, 12.9375].forEach((t, i) => clap(t, 0.15 + i * 0.05));

// 06 FINALE
boom(13.0, 1.2); crash(13.0, 0.45);
[45, 52, 57, 60, 64, 71].forEach((m, i) => fm(13.0, hz(m), 0.09, (i - 2.5) * 0.25, 1.4, 1.8, 0.5, 1));
fm(13.35, hz(96), 0.05, 0.3, 3, 1, 0.8);
[81, 84, 86, 88, 91].forEach((m, k) => fm(13.65 + k * 0.05, hz(m), 0.06, -0.5 + k * 0.25, 8, 1.5, 0.3));
for (let k = 0; k < 44; k++) tick(13.85 + k * (0.35 / 44), 0.035, 0.2);
range(13.25, 14.25, 0.5).forEach((t) => hat(t, 0.16, 0.25));
swoosh(14.2, 14.6, 0.35, -1);
swoosh(14.6, 14.86, 0.25);
fm(14.84, hz(93), 0.16, 0, 3, 1.2, 0.9);

// harmony (reads the side-chain curve written by the kicks)
const CH = { Am: [57, 60, 64], F: [53, 57, 60], C: [55, 60, 64], G: [55, 59, 62] };
[[1.0, 2.5, 'Am', 33], [2.5, 3.5, 'Am', 33], [3.5, 4.5, 'F', 29], [4.5, 5.5, 'C', 36], [5.5, 6.5, 'G', 31], [6.5, 7.5, 'Am', 33],
  [8.5, 9.5, 'F', 29], [9.5, 10.5, 'C', 36], [10.5, 11.5, 'G', 31], [11.5, 12.5, 'Am', 33]].forEach(([a, b, ch, root]) => {
  pad(a, b, CH[ch], 0.035);
  if (a >= 2.5) bass(a, b, root);
});
pad(7.5, 8.5, [53, 57, 60, 64], 0.04);
pad(13.0, 14.4, [45, 52, 57, 60, 64, 71], 0.045);
bass(13.0, 14.4, 33, 0.3);


write(path.join(__dirname, 'out', 'reel.wav'));
