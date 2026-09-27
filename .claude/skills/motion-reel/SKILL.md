---
name: motion-reel
description: Make motion graphics videos entirely in code. A canvas engine renders deterministically in headless Chromium, adds real motion blur, camera shake, chromatic aberration and grain, and encodes MP4 with a synthesized soundtrack locked to the cuts. Use this whenever the user wants an animated video, motion graphics, a sizzle reel, a kinetic-typography piece, an animated logo or title card, a social clip (including 9:16 or 1:1), a looping animation, or asks Claude to "show off" animation skills, even if they never say "motion graphics". It ships a working engine, render pipeline, synth and a six-scene example, so write only scene code and an audio arrangement instead of building from scratch.
---

# Motion Reel

A finished, tested pipeline. **Don't rebuild the engine**: copy the template, then write `scenes.js` (visuals) and `audio.cjs` (soundtrack). There is no need to read engine.js or synth.cjs: `references/engine-api.md` and the `audio.cjs` header document everything they expose.

## Workflow

1. **Scaffold** (installs playwright + ffmpeg when missing):
   `bash <skill>/scripts/new-reel.sh <project-dir>`
2. **Plan** a beat-grid storyboard. At 120 BPM, 0.5 s is a beat. Fix scene boundaries, big hits (`IMPACTS`) and the transition that covers each cut. Read `references/craft.md` for the principles, transition rules, and which example scene demonstrates what.
3. **Configure** `window.REEL` in `index.html`: size, fps, dur, HUD title.
4. **Write `scenes.js`.** Fulfil the contract `draw(t)`, `IMPACTS`, `SCENES`, plus optional `hudLight(t)` and `init()`. The template's `scenes.js` is a complete 15 s six-scene reel. Reuse its functions (morphs, particles, tiles, kinetic type, transitions) by adapting them rather than rewriting. `draw` must be a pure function of `t`, and randomness must come from `mulberry32`.
5. **QA cheaply with contact sheets.** Don't do a full render per tweak:
   `bash <skill>/scripts/sheet.sh <project-dir> <out.png> 1.1,3.6,6,9.8,11.6,13.8`
   This renders six un-blurred stills and tiles them into one image, which you then view. Check each transition frame and the frames around each cut.
6. **Write `audio.cjs`.** It holds only the arrangement; instruments are in `synth.cjs` (API in the file header). Put every hit on the visual timeline. Call all `kick()`s before `pad()`/`bass()`, which read the kick side-chain.
7. **Build:** `npm run build` (audio, then full render). 900 frames at 1080p60 with 4× motion blur on 4 cores takes about 11 min, so run it in the background. It outputs `out/reel-master.mp4` (CRF 14, ~300 MB, keep local) and `out/reel.mp4` (two-pass 12 Mbps, ~23 MB, share this).
8. **Deliver** `out/reel.mp4` with the file-sending tool, and tell the user to unmute: in-app previews and iPhones in silent mode play it silent even though the file has audio. If they report no sound, verify the stream exists (`ffmpeg -i out/reel.mp4` shows `Audio: aac`), then offer the soundtrack as an MP3.

## Gotchas already solved (don't rediscover them)
- **ffmpeg.** `render.cjs` auto-finds `$FFMPEG`, then system `ffmpeg`, then `pip install imageio-ffmpeg`'s static build. That build has **no `drawtext`** filter, so don't try to burn in labels; the HUD timecode already identifies frames.
- **Fonts.** Inter, JetBrains Mono and Instrument Serif are bundled (OFL). For other fonts, run `npm pack @fontsource/<name>` and use the files in `package/files/*.woff2`. System fonts in cloud containers are only DejaVu/Liberation.
- **Git.** Never commit the master (it exceeds GitHub's 100 MB limit). `.gitignore` already excludes it along with the wav and stills.
- **Waiting on the render.** Don't poll with `pgrep -f render.cjs` in a loop, because the loop's own command line matches and it never exits. Run the build with `run_in_background` and wait for its completion notice.
- **Colour.** Tagging bt709 alone shifts colours, so render.cjs converts with `scale=out_color_matrix=bt709`. Keep that.
- **Muddy blends.** Blending a big fill between two saturated colours (ink→coral) looks brown. Hard-switch on a beat.
