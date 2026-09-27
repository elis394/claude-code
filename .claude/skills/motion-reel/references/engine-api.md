# Engine API (template/engine.js)

Everything below is a global that `scenes.js` can use directly. Read this file, not engine.js.

## Config: `window.REEL` (set in index.html)
`{ width, height, fps, dur, title, subtitle, hud: true, audio: 'out/reel.wav' }`, exposed as `W, H, CX, CY, FPS, DUR`.

## Contract that scenes.js must fulfil
| Name | Required | Meaning |
|---|---|---|
| `draw(t)` | yes | Draws the whole frame at time `t` (seconds). It is a pure function of `t`, with no state carried between calls. |
| `IMPACTS` | yes | `[[t, strength], …]`. This one list drives camera shake, punch-zoom (+3%) and chromatic aberration. Use ~0.25 for a beat accent and 1 for a slam. |
| `SCENES` | yes | `[[start, 'NAME'], …]`, for the HUD scene label and timeline ticks. |
| `hudLight(t)` | no | Returns true where the background is light, so the HUD draws in ink. |
| `init()` | no | Runs once after fonts load. Use it to measure text or sample glyph pixels, e.g. particle targets. |

The engine wraps `draw` with shake/zoom and a vignette, then (offline) adds 4-sub-frame motion blur, chromatic aberration and grain. The HUD draws last and is never blurred.

## Palette and fonts
- `C.ink #0E0E13`, `C.cream #F3EEE3`, `C.coral #FF4F2E`, `C.cobalt #2F4BFF`, `C.lime #D7FF3B`, `C.pink #FF9BD6`, `C.blue #7D8BFF`
- `PAL = [coral, cobalt, lime, pink, cream]`
- `F.black(px)` is Inter 900 (display), `F.mono(px)` / `F.monoB(px)` is JetBrains Mono 500/800 (UI labels), and `F.serif(px)` is Instrument Serif Italic (contrast).
- To swap palettes, redefine the colours at the top of scenes.js, e.g. `C.coral = '#…'`, since `C` is a mutable object.

## Timing
- `P(t, a, b)` gives 0→1 progress of t through [a, b], clamped. **This is the core primitive**: `E.outExpo(P(t, 1.2, 1.6))`.
- `E.outCubic, inCubic, inOutCubic, outExpo, inExpo, inOutExpo, outBack, inBack`
- `spring(dt, freq=1.6, damp=6)` goes 0→1 with overshoot, where dt is the time since release. Use it for anything that should feel physical.
- `pulse(dt, k=9, f=3)` is a decaying 0→±1→0 wobble. Use it for squash & stretch: `scale(1+.1*p, 1-.16*p)`.
- `clamp(x, a=0, b=1)`, `lerp(a, b, t)`, `mulberry32(seed)` (a deterministic RNG; never use `Math.random`), `mix(hexA, hexB, t)` → rgb() string.

## Drawing
- `bg(color)` fills an oversized rect, so it survives shake.
- `circle(x, y, r, color)`, `ring(x, y, r, lineWidth, color)`, `rrect(x, y, w, h, r)` (builds the path; you fill/stroke it).
- `text(str, x, y, font, color, {align, ls, alpha, base})`, where `ls` is letter-spacing in px.
- `textWidth(str, font, ls)`
- `layout(str, font, spacing)` → `{xs[], ws[], width}` (cached per-glyph positions). Use it to animate letters individually.
- `scramble(str, p, t)` gives a decoding-text effect as p goes 0→1.
- `impact(t, k)` and `shake(t)` are also available if a scene wants to react to hits.

## Debug hooks (page)
`window.drawAt(t)` draws one un-blurred frame with the HUD. `window.renderFrame(frame, sub)` is the offline path used by render.cjs.
