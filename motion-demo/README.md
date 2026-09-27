# Motion Reel

A 15-second, 1080p60 motion graphics piece. Every frame and every sample of audio is generated from code: no After Effects, no keyframe editor, no stock assets.

**▶ [`out/reel.mp4`](out/reel.mp4)**

| # | Scene | Time | What's happening |
|---|-------|------|------------------|
| 01 | Genesis | 0.0 – 2.5 | A dot draws three staggered arcs, winds up (anticipation), and bursts into rings and 72 shards. `MOTION` then lands with a per-letter colour block reveal and squashes on the beat. |
| 02 | Morph | 2.5 – 5.0 | Circle → square → triangle → star → flower. Every shape is ray-cast into the same 240 polar samples, so any shape can spring into any other. A 5-deep time-echo stack trails the motion in colour. The shape becomes the next scene's background. |
| 03 | Kinetic Type | 5.0 – 7.5 | A rotated marquee field that accelerates on every beat. A neo-brutalist word box springs to each new word's width, with staggered letter swaps and a live easing-curve readout. Irises out. |
| 04 | Particles | 7.5 – 10.6 | About 6,500 particles fly in to form a rotating 3D torus knot. It anticipates, explodes, then reassembles left-to-right into dot-matrix type spelling `CRAFT`. Wind carries it away. |
| 05 | Grid System | 10.15 – 13.0 | 144 tiles sweep in over the particles, shrink outward from the centre and breathe. Three card-flip ripples then recolour the grid. The camera dives into a single tile. |
| 06 | Finale | 13.0 – 15.0 | `CLAUDE` flies in from six directions with a sprung colour echo, then a serif line, swatches and a typewriter tagline follow. Everything collapses into a dot, which irises out. The last frame loops seamlessly into the first. |

A persistent HUD shows a running timecode, scene labels that scramble between scenes, and a timeline scrubber. Its colour flips automatically to stay readable on light or dark backgrounds.

## Techniques

- **Pure function of time.** `drawScene(t)` has no state, so any frame renders on its own. That makes parallel rendering and real motion blur possible.
- **Motion blur.** Each frame averages 4 sub-frames across a 180° shutter.
- **Camera.** One impact list drives camera shake, punch-zoom and chromatic aberration, so every hit lands visually *and* aurally at the same moment.
- **Animation principles, in code.** Damped springs for overshoot and settle, anticipation before every big release, squash and stretch on the beat, and staggered follow-through on letters, tiles and particles.
- **Film finish.** Triangular-distributed grain and a vignette.
- **Soundtrack (`audio.cjs`).** 120 BPM in A minor, synthesized from scratch: FM bells, a pitch-swept kick with sidechain ducking on the bass and pads, noise risers and swooshes through a state-variable filter, and a Freeverb-style reverb. Every hit, including the tile-by-tile ticks and the typewriter clicks, sits on the visual timeline.

## Run it

```bash
npm install                 # playwright (uses a preinstalled Chromium if PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)
npm run build               # audio.cjs → out/reel.wav, then render.cjs → out/reel.mp4
```

`render.cjs` needs `ffmpeg` with libx264 on `PATH` (or set `FFMPEG=/path/to/ffmpeg`). Useful flags:

- `--workers=4` sets the number of parallel Chromium pages.
- `--sub=4` sets the motion-blur sub-frames.
- `--stills=1,8.6,13.4` renders PNG stills at those times instead of the full video.

For a real-time preview, serve the folder (for example with `npx serve`) and open `index.html`. Click to play it with sound.

Fonts are Inter, JetBrains Mono and Instrument Serif, all under the SIL Open Font License, via Fontsource.
