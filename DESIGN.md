---
name: Mysterie — De Reiger
description: A night gallery after closing time; the dead man's phone is the only exhibit under the light.
colors:
  wall: "#161D1A"
  wall-hi: "#1F2824"
  wall-lo: "#0D1210"
  ink: "#E4DFD3"
  muted: "#A3A69C"
  line: "#33403A"
  plaster: "#E7E3DA"
  label: "#EFEBE3"
  label-ink: "#171C19"
  label-mute: "#5A5F58"
  label-line: "#D2CCBF"
  light: "#F5DDAA"
  dot: "#C8261C"
  dot-deep: "#8E1A13"
  ok: "#9CC7A2"
typography:
  display:
    fontFamily: "Jost, Futura, Century Gothic, Avenir Next, sans-serif"
    fontSize: "clamp(60px, 7.4vw, 92px)"
    fontWeight: 300
    lineHeight: 0.88
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Jost, Futura, Century Gothic, Avenir Next, sans-serif"
    fontSize: "54px"
    fontWeight: 300
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "Jost, Futura, Century Gothic, Avenir Next, sans-serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  none: "0px"
  gallery: "2px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "12px"
  lg: "20px"
  xl: "30px"
  gutter: "72px"
components:
  button-primary:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.label-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.gallery}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.label-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.gallery}"
    padding: "10px 18px"
  button-on-label:
    backgroundColor: "{colors.label-ink}"
    textColor: "{colors.label}"
    rounded: "{rounded.gallery}"
    padding: "10px 18px"
  object-label:
    backgroundColor: "{colors.label}"
    textColor: "{colors.label-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "14px 16px 13px"
  task-active:
    backgroundColor: "{colors.label}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.none}"
    padding: "16px 18px 16px 12px"
  input-answer:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.gallery}"
    padding: "10px 12px"
    width: "120px"
  result-sheet:
    backgroundColor: "{colors.label}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.none}"
    padding: "30px 28px"
  dossier-button-mobile:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.gallery}"
    padding: "13px 18px"
  pin-chip-on:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.dot-deep}"
    padding: "3px 9px 3px 6px"
---

# Design System: Mysterie — De Reiger

## Overview

**Creative North Star: "The Night Gallery"**

Every case is an exhibition of a life after closing time. The page is a dark painted museum wall in deep green-black slate, lit by a single warm tungsten pool. The evidence, a phone, stands as the one exhibit on a plaster-white plinth. Everything the player reads hangs on the wall the way a gallery hangs it: very large, thin wall-vinyl lettering for the case name, small precise grotesk on cream label stock for object facts, hairline rules and catalogue numbering for the dossier. The world is dark only. There is no light theme (`color-scheme: dark`).

The system has two layers and keeps them apart. The **gallery layer** (wall, labels, dossier, result sheet) owns every token below. The **phone layer** inside the device screen is an embedded native-mimic surface: it deliberately copies iOS conventions (system font stack, system blue, red badges, frosted notifications, rounded list groups) so the device reads as a real phone. Its colours are fixed to the device and are not part of the gallery palette. The only thing that crosses between the layers is the red "sold" dot.

Motion is slow and weighted, with an exponential ease-out. The signature moment is light changing rather than things bouncing: the phone lifts off the plinth and turns upright, the spotlight dims to the screen's glow, and the lock screen wakes. Density is calm; the wall is mostly empty.

**Key Characteristics:**
- Single dark theme: green-black wall with a radial tungsten pool, never pure black.
- One saturated colour, the red dot, reserved for suspect/pinned/correct-accusation.
- Cream label stock as the "lit paper" surface for anything the player must act on now.
- Thin geometric display face (Jost 300) for wall vinyl; a precise grotesk (Hanken Grotesk) for everything read.
- Square or near-square corners in the gallery (0 or 2px); rounded corners belong to the phone.
- Soft, deep hanging shadows under cards; no hard offsets, no glows except the faint tungsten halo around the phone.

## Colors

A near-monochrome night palette of slate wall, warm off-white ink and cream paper, with one tungsten light and one red dot.

### Primary
- **Sold-Dot Red** (dot): the gallery's red "sold" sticker. Used only as a dot or thin stroke: the pinned-evidence bullet in the dossier, the filled pin chip in the phone, the radio accent in the final report, the confirm-accusation outline, and the filled verdict dots on the result sheet. Never a fill for buttons, panels or text blocks.
- **Deep Dot** (dot-deep): text colour for a pinned chip ("Gepind") so the label stays legible on white beside the red dot.

### Secondary
- **Tungsten** (light): the spotlight. Appears as light, not as paint: the radial spotlight cone behind the stage, the faint halo around the phone, the focus outline (2px, 3px offset), the caret, and text selection (at 32% alpha).

### Neutral
- **Gallery Wall** (wall): the page and every dossier surface.
- **Wall in Light** (wall-hi): the lit upper part of the wall gradient; also the mobile dossier sheet and the mobile task bar.
- **Wall in Shadow** (wall-lo): the gradient's floor.
- **Gallery Ink** (ink): primary text on the wall.
- **Faded Ink** (muted): secondary text, locked tasks, section labels, captions on the wall.
- **Wall Hairline** (line): the 1px rules that structure the dossier (between tasks, pins, suspects, header).
- **Plaster** (plaster): the plinth and the primary button face on the wall.
- **Label Stock** (label): cream card for object labels, the active task, the result sheet and toasts.
- **Label Ink / Label Mute / Label Rule** (label-ink, label-mute, label-line): text, secondary text and hairlines on label stock. Components on label stock re-scope `--ink`, `--muted` and `--line` to these values instead of inventing new colours.
- **Solved Sage** (ok): the check on a completed task. A muted state colour, never a fill.

### Named Rules
**The Sold-Dot Rule.** Red appears only as a small dot or hairline that means "suspect", "pinned" or "correct". If red fills an area larger than a chip, it is wrong.

**The Light-Not-Paint Rule.** Tungsten is used as light (gradients, halos, focus, selection), never as a flat button or text fill.

**The Label-Stock Rule.** Whatever the player must act on right now (the current task, the verdict, a toast) is printed on cream label stock; everything else stays on the wall.

## Typography

**Display Font:** Jost (with Futura, Century Gothic, Avenir Next, sans-serif)
**Body Font:** Hanken Grotesk (with Helvetica Neue, Arial, sans-serif)
**Phone Font:** the system UI stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto), inside the device only
**Evidence Handwriting:** Caveat, only inside evidence images (handwritten notes in photos), never as interface type

**Character:** Thin, wide geometric vinyl letters cut for a gallery wall, paired with a small, exact grotesk that reads like museum label copy.

### Hierarchy
- **Display** (Jost 300, clamp(60px, 7.4vw, 92px), 0.88): the case name as wall vinyl on the opening wall; 50px on mobile.
- **Headline** (Jost 300, 54px, 0.9): the case name atop the dossier; the result-sheet verdict uses the same voice at 44px.
- **Numeral** (Jost 400, 36px, tabular): the score. Jost also sets catalogue numbers (task numbers 16px, move numbers 17px) and the tally figure (26px).
- **Title** (Hanken Grotesk 600, 17px, 1.4): the active task question; object-label titles are 15px 700.
- **Body** (Hanken Grotesk 400, 16px, 1.5): running text; briefing paragraphs at 15.5px with a 62ch measure.
- **Lead** (Hanken Grotesk 400, 18px, 1.5, 38ch): the opening premise under the vinyl; 15.5px on mobile.
- **Caption** (Hanken Grotesk 400, 13.5px, 1.5): object-label lines, suspect lines, content note.
- **Label** (Hanken Grotesk 600, 12px, 0.16em, uppercase): dossier section headings ("Opdrachten", "Vastgepind bewijs") and report legends, always followed by their content, with counts set in ink beside them.

### Named Rules
**The Vinyl Rule.** Jost appears at weight 300 for words and 400 only for numerals. It is never used for running text or buttons.

**The Handwriting-Stays-In-Evidence Rule.** Caveat lives inside evidence imagery only.

## Layout

Desktop is a two-column gallery hang: the phone column (390px) and the dossier column (up to 440px), separated by a 72px gutter and centred on the wall. The phone is sticky at 28px from the top and its height tracks the viewport (min(812px, 100dvh − 56px)). On the opening wall the grid becomes a stage-plus-label arrangement: phone on the plinth left, vinyl title and object label right at eye height, steps and the primary action below.

The dossier is a vertical stack of sections 30px apart, each a list of hairline-ruled rows (12px vertical padding). Task and move numbers sit in a narrow numeric column (26–30px) like catalogue numbering.

Below 900px the layout collapses to one column: the opening label stacks above the plinth, the dossier becomes a bottom sheet (max 86dvh, wall-hi surface, slides up with the exponential ease-out), and a plaster "Dossier" button is fixed bottom-right. A one-line task bar sits above the phone. Below 440px the phone loses its bezel and fills the width with a 22px screen radius. The lock screen inside the phone adapts with container height queries (700px, 600px, 470px) instead of viewport breakpoints. Safe-area insets pad every fixed edge. Minimum supported width is 320px.

## Elevation & Depth

Depth comes from light and hanging, not from layered UI chrome. The wall is a radial gradient from wall-hi to wall-lo; a tungsten radial cone sits behind the stage. Cards hung on the wall (labels, active task, sheet, toast) cast soft, deep, downward shadows with strong negative spread so they read as paper a few millimetres off the wall. The phone has a 1.5px dark rim, a deep drop shadow and a faint tungsten halo.

### Shadow Vocabulary
- **Label hang** (`box-shadow: 0 14px 30px -16px rgba(0,0,0,.9)`): object labels on the opening wall.
- **Active task hang** (`box-shadow: 0 18px 34px -18px rgba(0,0,0,.95)`): the current task card.
- **Sheet hang** (`box-shadow: 0 30px 80px -20px rgba(0,0,0,.9)`): the result sheet over the dimmed modal (rgba(6,9,8,.78)).
- **Toast hang** (`box-shadow: 0 14px 30px -10px rgba(0,0,0,.8)`): the transient label at the top.
- **Phone on display** (`box-shadow: 0 0 0 1.5px #2e3330, 0 40px 70px -30px rgba(0,0,0,.9), 0 0 90px -20px rgba(245,221,170,.10)`): the device in play.

### Named Rules
**The Hanging-Paper Rule.** Shadows fall downward and are soft. No hard offset shadows, no coloured glows, no shadow on wall-level rows.

## Shapes

Gallery forms are rectilinear: labels, the active task, the sheet and toasts have square corners (0); buttons and inputs carry a barely-there 2px radius. Structure is drawn with 1px hairlines rather than boxes. Circles are reserved for dots (pinned bullet 10px, verdict dots 12px, pin indicator 9px). The plinth is a trapezoidal top face over a straight block. All curvature beyond 2px belongs to the phone: 52px bezel, 40px screen, 18px bubbles and notifications, 12px list groups, 14px chips.

## Components

### Buttons
Printed and quiet; a button is a plaster plaque.
- **Shape:** near-square (2px).
- **Primary on the wall:** plaster face with label-ink text, Hanken Grotesk 600 15px, 10px 18px. Hover lifts to white. Transitions 0.2s on background, colour and border.
- **Ghost on the wall:** transparent, ink text, 1px muted border; hover brings the border to ink.
- **On label stock:** inverted to a label-ink face with label text; ghost becomes a label-ink outline that fills on hover.
- **Text link button:** muted, underlined with a 3px offset; hover to ink.
- **Focus:** 2px tungsten outline, 3px offset, on every button, input and summary.
- **Disabled:** 40% opacity.

### Cards / Containers
- **Object label:** label stock, square, 14px 16px 13px padding, bold 15px title line then caption lines in label-mute, the label hang shadow. Max width 330px.
- **Active task:** the current dossier row turns into a label-stock card (16px 18px 16px 12px) with the active-task hang; it re-scopes ink, muted and line to the label values so all nested parts follow.
- **Result sheet:** label stock, square, max 580px, 30px 28px padding, Jost 300 verdict headline with a ring-or-filled dot before it, a three-cell verdict strip divided by hairlines, a share block on a darker cream (#E2DBCC).

### Inputs / Fields
- **Answer field:** white, 1px #BDB6A8 border, 2px radius, Hanken Grotesk 500 17px tabular figures, 120px wide, placeholder #7C8079.
- **Report choices:** native radios with the dot red as accent colour; legends in the label style.
- **Focus:** tungsten outline as above.

### Navigation
- **Dossier sections:** collapsible briefing uses a hairline plus/minus drawn in CSS, not a glyph.
- **Mobile:** fixed plaster "Dossier" button bottom-right with the open-task count in label-mute; the dossier opens as a bottom sheet with a close link.

### Pinned Evidence List (signature)
Each pinned item is a hairline-ruled row: a 10px red dot, a catalogue number (B-01, B-02 … in 12px tabular muted figures), the evidence line, and an underlined "los" to unpin.

### Pin Chip (bridge component)
The only gallery element that lives inside the phone. Unpinned: white chip, 1px #c7c7cc border, 14px radius, hollow 9px ring, system font 600 12px. Pinned ("Gepind"): border and dot turn dot red, text dot-deep.

### Icons
One authored inline-SVG set: 24-unit viewBox, 1.9 stroke, round caps and joins, `currentColor`, default 20px. New icons extend this set; no icon fonts, packages or emoji glyphs in the interface.

### Phone Layer (embedded native-mimic surface)
Inside the device the interface intentionally follows native iOS conventions rather than gallery tokens: system UI font at 15px/1.35, grouped-list background #f2f2f7, white list groups (12px radius) with #e7e7ec separators, system blue (#0a7aff) for back links, unread dots and sent bubbles, grey received bubbles (#e9e9eb, 18px radius), red notification badges (#ff3b30), frosted lock-screen notifications and keypad (14px blur). These values are fixed to the device for realism and must not leak into the gallery.

## Do's and Don'ts

### Do:
- **Do** keep the page dark only and the wall green-black (wall, wall-hi, wall-lo), never pure black.
- **Do** reserve dot red for small dots and hairlines meaning suspect, pinned or correct.
- **Do** put what the player must act on now on cream label stock with a soft downward hang shadow.
- **Do** set case names in Jost 300 as wall vinyl and everything read in Hanken Grotesk.
- **Do** structure the dossier with 1px hairlines and catalogue numbering instead of boxes.
- **Do** animate with the exponential ease-out (cubic-bezier(.16,1,.3,1)) and prefer changing light over moving things; honour reduced motion by removing all transitions.
- **Do** keep the phone layer native-looking with its own fixed iOS colours.

### Don't:
- **Don't** fill buttons, panels or headings with red or tungsten.
- **Don't** use gallery tokens inside the phone, or iOS blue and badge red on the wall.
- **Don't** round gallery cards; curvature beyond 2px belongs to the phone.
- **Don't** use hard offset shadows or coloured glows on cards.
- **Don't** use manila folders, typewriter type, crime tape, neon or horror effects.
- **Don't** use Caveat or any handwriting face outside evidence images.
