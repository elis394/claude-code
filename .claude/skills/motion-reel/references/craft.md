# Craft notes: what makes these reels read as "designed"

## Principles (each maps to a helper)
- **Anticipation before every release.** Shrink or wind up by 10–15% over the ~0.25 s before a burst (`1 - 0.14*E.inCubic(P(t, hit-.26, hit))`). This is the single biggest quality signal.
- **Overshoot and settle.** Use `spring()` for scale, position and width changes rather than linear or plain ease.
- **Stagger everything.** Letters get 0.02–0.055 s, tiles get distance × 0.035 s, particles get x-position × 0.35 s. Nothing important should move all at once.
- **Squash & stretch on the beat** with `pulse()`.
- **The beat grid:** at 120 BPM a beat is 0.5 s. Put cuts, word swaps and ripples on beats, and put the biggest hits on bar lines. Add each hit to `IMPACTS` *and* to the audio.
- **Contrast of scale and texture.** Pair a huge Inter Black with small spaced-out mono UI labels, and add a serif italic once for warmth.
- **Motion-design "UI" garnish** makes it feel like a designer's tool: live numeric readouts, easing graphs, anchor-point crosshairs, construction lines, scramble labels.
- **Colour discipline.** Use one background colour per scene and cycle the palette across scenes. Avoid mid-transition colour blends like ink→coral, which go muddy; hard-switch on a beat instead.

## Transitions (and the rule that keeps them seamless)
The scene router switches the underlying scene at a fixed time. **On that frame the screen must be fully covered** by the transition element, or the cut pops. Check the maths, including the corner distance `hypot(CX, CY)` (1101 px at 1080p), plus ~20 px margin for shake.
- **Slice wipe:** skewed colour bands, staggered 0.04 s apart. The last band is the next scene's background colour.
- **Iris:** a circle growing to 1150 px with `inOutExpo`, led by a thin ring.
- **Match cut:** an element from the current scene scales up with `inExpo` to become the next background (morph shape → coral).
- **Camera dive:** zoom about one tile by ×30 with `inExpo` while rotating 90°.
- **Loop:** end on the first frame's state (e.g. an empty background with the dot at r=0).

## Example scenes in template/scenes.js (lift and adapt)
| Function | Technique |
|---|---|
| `s1` | Staggered arcs, then anticipation, then ring burst + shards + flash, then per-letter colour-block reveal |
| `slices` | Diagonal multi-colour wipe |
| `s2` + `polyR/SH/shapeR` | Any-shape-to-any-shape morph through shared polar samples (ray-cast polygons), plus a time-echo stack (the same shape drawn at `t - k*0.045` in colours) |
| `s3` | Rotated marquee rows that accelerate on beats, a sprung word box with letter swaps, an easing-graph widget, iris out |
| `s4` + `initParticles` | ~6.5k particles: 3D torus knot (perspective projection) → explosion → dot-matrix text sampled from an offscreen canvas → wind dispersal. Drawn in colour buckets with `lighter` compositing |
| `tiles` | Grid wipe-in, radial shrink, breathing, card-flip ripples (scaleX = \|cos\|) that recolour, camera dive |
| `s6` | Letters flying in from different directions with a lagged colour echo, ring burst, mask-reveal serif, swatches, typewriter, collapse → dot → iris → loop |

The example scenes use fixed pixel sizes designed for 1920×1080. For 9:16 or 1:1, size type and layout from `W`/`H`, e.g. `F.black(W * 0.15)`.
