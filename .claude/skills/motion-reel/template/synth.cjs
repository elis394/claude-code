// Synth library: tiny DSP instruments + reverb + limiter → 16-bit stereo WAV. Don't edit per reel.
// Usage (see audio.cjs): const s = require('./synth.cjs')(durationSeconds); s.kick(1.0); … s.write('out/reel.wav');
// IMPORTANT: place all kick() calls before pad()/bass(), which read the kick side-chain curve.
const fs = require('fs');
const path = require('path');

module.exports = function synth(DUR) {
  const SR = 48000, N = Math.round(SR * DUR), TAU = Math.PI * 2;
  const L = new Float32Array(N), R = new Float32Array(N);   // dry bus
  const VL = new Float32Array(N), VR = new Float32Array(N); // reverb send
  const DUCK = new Float32Array(N).fill(1);                  // kick side-chain

  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const noise = () => rnd() * 2 - 1;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI note → Hz (69 = A4, 57 = A3, 33 = A1)
  const S = (t) => Math.round(t * SR);
  const range = (a, b, step) => { const o = []; for (let t = a; t <= b + 1e-9; t += step) o.push(+t.toFixed(4)); return o; };

  function put(i, v, pan = 0, send = 0) {
    if (i < 0 || i >= N) return;
    const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
    L[i] += v * gl; R[i] += v * gr;
    if (send) { VL[i] += v * gl * send; VR[i] += v * gr * send; }
  }
  function svf() {
    let low = 0, band = 0;
    return (x, fc, q = 0.5) => {
      const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
      low += f * band; const high = x - low - q * band; band += f * high;
      return { low, band, high };
    };
  }

  // ─── instruments ───────────────────────────────────────────────────────────
  function kick(t0, a = 1, duck = true) {
    const s0 = S(t0); let ph = 0;
    for (let k = 0; k < S(0.5); k++) {
      const t = k / SR, f = 46 + 130 * Math.exp(-t * 32) + 40 * Math.exp(-t * 7);
      ph += f / SR;
      let v = Math.tanh(Math.sin(ph * TAU) * Math.exp(-t * 6.5) * 1.8);
      if (k < 90) v += noise() * 0.4 * (1 - k / 90);
      put(s0 + k, v * a * 0.85);
      if (duck && s0 + k < N) DUCK[s0 + k] = Math.min(DUCK[s0 + k], 1 - 0.8 * Math.exp(-t * 9));
    }
  }
  function boom(t0, a = 1) {
    const s0 = S(t0), f = svf(); let ph = 0;
    for (let k = 0; k < S(2.6); k++) {
      const t = k / SR; ph += (30 + 70 * Math.exp(-t * 6)) / SR;
      const sub = Math.sin(ph * TAU) * Math.exp(-t * 1.5);
      const nz = f(noise(), 180 + 2500 * Math.exp(-t * 7)).low * Math.exp(-t * 4) * 0.9;
      put(s0 + k, Math.tanh((sub + nz) * 1.4) * a * 0.8, 0, 0.35);
    }
  }
  function crash(t0, a = 0.3) {
    const s0 = S(t0), f = svf();
    for (let k = 0; k < S(2.2); k++) {
      const t = k / SR, v = f(noise(), 7000, 0.3).high * Math.exp(-t * 2.4);
      put(s0 + k, v * a, (k % 2 ? 0.3 : -0.3), 0.4);
    }
  }
  function hat(t0, a = 0.2, pan = 0.2) {
    const s0 = S(t0), f = svf();
    for (let k = 0; k < S(0.07); k++) put(s0 + k, f(noise(), 9000, 0.4).high * Math.exp((-k / SR) * 70) * a, pan);
  }
  function clap(t0, a = 0.45) {
    const s0 = S(t0), f = svf();
    for (let k = 0; k < S(0.4); k++) {
      const t = k / SR;
      const env = Math.max(...[0, 0.011, 0.022].map((o) => (t >= o ? Math.exp(-(t - o) * (o < 0.02 ? 120 : 16)) : 0)));
      put(s0 + k, f(noise(), 1400, 0.6).band * env * a * 2, 0, 0.35);
    }
  }
  function tick(t0, a = 0.12, pan = 0) {
    const s0 = S(t0);
    for (let k = 0; k < S(0.03); k++) { const t = k / SR; put(s0 + k, (Math.sin(TAU * 3200 * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260) * a, pan); }
  }
  // FM bell / pluck
  function fm(t0, f, a = 0.2, pan = 0, dec = 5, idx = 2.5, send = 0.35, ratio = 2) {
    const s0 = S(t0);
    for (let k = 0; k < S(Math.min(2.5, 7 / dec)); k++) {
      const t = k / SR, env = Math.min(1, t / 0.003) * Math.exp(-t * dec);
      put(s0 + k, Math.sin(TAU * f * t + idx * Math.exp(-t * 7) * Math.sin(TAU * ratio * f * t)) * env * a, pan, send);
    }
  }
  function riser(t0, t1, a = 0.4) {
    const s0 = S(t0), n = S(t1 - t0), f = svf(); let ph = 0;
    for (let k = 0; k < n; k++) {
      const p = k / n, fc = 250 * Math.pow(40, p);
      ph += (110 * Math.pow(8, p)) / SR;
      const v = f(noise(), fc, 0.25).band * p * p + Math.sin(ph * TAU) * 0.15 * p * p;
      put(s0 + k, v * a, Math.sin(p * 9) * 0.4, 0.3);
    }
  }
  function swoosh(t0, t1, a = 0.35, dir = 1) {
    const s0 = S(t0), n = S(t1 - t0), f = svf();
    for (let k = 0; k < n; k++) {
      const p = k / n, q = dir > 0 ? p : 1 - p;
      const v = f(noise(), 400 * Math.pow(18, q), 0.35).band * Math.pow(Math.sin(Math.PI * p), 2);
      put(s0 + k, v * a * 1.6, (p * 2 - 1) * 0.8 * dir, 0.25);
    }
  }
  function pad(t0, t1, notes, a = 0.05) {
    const s0 = S(t0), n = S(t1 - t0 + 0.8);
    notes.forEach((m, j) => {
      const lp = [0, 0], ph = [rnd(), rnd(), rnd()];
      for (let k = 0; k < n; k++) {
        const t = k / SR, env = Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (t1 - t0 + 0.6 - t) / 0.6));
        let v = 0;
        for (let d = 0; d < 3; d++) { ph[d] = (ph[d] + (hz(m) * (1 + (d - 1) * 0.004)) / SR) % 1; v += ph[d] * 2 - 1; }
        lp[0] += (v - lp[0]) * 0.06; lp[1] += (lp[0] - lp[1]) * 0.06;
        put(s0 + k, lp[1] * env * a * (DUCK[s0 + k] ?? 1), j % 2 ? 0.35 : -0.35, 0.5);
      }
    });
  }
  function bass(t0, t1, m, a = 0.32) {
    const s0 = S(t0), n = S(t1 - t0); let ph = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR; ph += hz(m) / SR;
      const env = Math.min(1, t / 0.01) * Math.min(1, (n - k) / S(0.05));
      put(s0 + k, Math.tanh(Math.sin(ph * TAU) * 1.6 + 0.3 * Math.sin(ph * TAU * 2)) * env * a * (DUCK[s0 + k] ?? 1));
    }
  }


  function write(file) {
    // ─── reverb (Freeverb-style combs + allpasses) and master ──────────────────
    function comb(inp, d, fb, damp) {
      const out = new Float32Array(N), buf = new Float32Array(d); let i2 = 0, filt = 0;
      for (let i = 0; i < N; i++) { const y = buf[i2]; filt = y * (1 - damp) + filt * damp; buf[i2] = inp[i] + filt * fb; i2 = (i2 + 1) % d; out[i] = y; }
      return out;
    }
    function allpass(inp, d, g = 0.5) {
      const out = new Float32Array(N), buf = new Float32Array(d); let i2 = 0;
      for (let i = 0; i < N; i++) { const b = buf[i2], y = -inp[i] + b; buf[i2] = inp[i] + b * g; i2 = (i2 + 1) % d; out[i] = y; }
      return out;
    }
    function reverb(inp, spread) {
      let sum = new Float32Array(N);
      for (const d of [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116]) {
        const c = comb(inp, Math.round(((d + spread) * SR) / 44100), 0.82, 0.3);
        for (let i = 0; i < N; i++) sum[i] += c[i] * 0.125;
      }
      for (const d of [556, 441, 341, 225]) sum = allpass(sum, Math.round(((d + spread) * SR) / 44100));
      return sum;
    }
    const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    const WL = reverb(VL, 0), WR = reverb(VR, 23);
    const wet = (0.45 * (rms(L) + rms(R))) / (rms(WL) + rms(WR) + 1e-9) * 0.5;
    let peak = 0;
    for (let i = 0; i < N; i++) { L[i] += WL[i] * wet; R[i] += WR[i] * wet; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
    const drive = 1.4, norm = Math.tanh(drive);
    const buf = Buffer.alloc(44 + N * 4);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
    buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
    for (let i = 0; i < N; i++) {
      const fade = Math.min(1, (N - i) / S(0.03));
      for (const [c, x] of [[0, L[i]], [1, R[i]]]) {
        const y = (Math.tanh((x / peak) * drive) / norm) * 0.93 * fade;
        buf.writeInt16LE(Math.round(y * 32767), 44 + i * 4 + c * 2);
      }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    console.log(`wrote ${path.relative(process.cwd(), file)} (peak before limiter ${peak.toFixed(2)}, reverb wet ${wet.toFixed(3)})`);
  }

  return { kick, boom, crash, hat, clap, tick, fm, riser, swoosh, pad, bass, hz, range, write };
};
