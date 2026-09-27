#!/usr/bin/env node
// Renders index.html frame-by-frame in headless Chromium and encodes it with ffmpeg.
//
//   node render.cjs                      full render → out/reel-master.mp4 + out/reel.mp4 (muxes out/reel.wav if present)
//   node render.cjs --stills=1,2.3,8.6   PNG stills at the given times → out/still-<t>.png
//
// Options: --workers=4 --sub=4 (motion-blur sub-frames). Set FFMPEG to override the ffmpeg binary.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 60, TOTAL = FPS * 15;
const WORKERS = +(args.workers || 4), SUB = +(args.sub || 4);
const OUT = path.join(__dirname, 'out');
const URL = 'file://' + path.join(__dirname, 'index.html') + '?render';
fs.mkdirSync(OUT, { recursive: true });

function run(argv, stdin) {
  const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', ...argv], { stdio: [stdin ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));
  return { p, done };
}

async function openPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => { console.error('page error:', e); process.exit(1); });
  await page.goto(URL);
  await page.evaluate(() => window.ready);
  return page;
}

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();

  if (args.stills) {
    const page = await openPage(browser);
    for (const s of args.stills.split(',')) {
      await page.evaluate(([f, sub]) => window.renderFrame(f, sub), [Math.round(+s * FPS), SUB]);
      await page.screenshot({ path: path.join(OUT, `still-${s}.png`) });
    }
    await browser.close();
    return;
  }

  const chunk = Math.ceil(TOTAL / WORKERS);
  let doneFrames = 0;
  const segs = await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * chunk, b = Math.min(TOTAL, a + chunk);
    const page = await openPage(browser);
    const seg = path.join(OUT, `seg${w}.mp4`);
    const enc = run(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
      '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', seg], true);
    for (let f = a; f < b; f++) {
      await page.evaluate(([f, sub]) => window.renderFrame(f, sub), [f, SUB]);
      const png = await page.screenshot({ type: 'png' });
      if (!enc.p.stdin.write(png)) await new Promise((r) => enc.p.stdin.once('drain', r));
      if (++doneFrames % 30 === 0) process.stdout.write(`\r${doneFrames}/${TOTAL} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    enc.p.stdin.end();
    await enc.done;
    return seg;
  }));
  await browser.close();
  console.log();

  const list = path.join(OUT, 'segments.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const wav = path.join(OUT, 'reel.wav');
  const audio = fs.existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '256k', '-shortest'] : [];
  const master = path.join(OUT, 'reel-master.mp4');
  await run(['-f', 'concat', '-safe', '0', '-i', list, ...audio, '-c:v', 'copy', '-movflags', '+faststart', master]).done;
  segs.forEach((s) => fs.unlinkSync(s));
  fs.unlinkSync(list);

  // the master is ~300 MB (grain is expensive); make a two-pass 12 Mbps copy for sharing
  const log = path.join(OUT, 'x264pass');
  const v = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '12M', '-maxrate', '20M', '-bufsize', '24M', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-passlogfile', log];
  await run(['-i', master, ...v, '-pass', '1', '-an', '-f', 'null', '-']).done;
  await run(['-i', master, ...v, '-pass', '2', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.join(OUT, 'reel.mp4')]).done;
  fs.readdirSync(OUT).filter((f) => f.startsWith('x264pass')).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
  console.log(`wrote out/reel-master.mp4 and out/reel.mp4 in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
