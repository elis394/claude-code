# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Adults who like solving mysteries on their own: puzzle and true-crime fans who want to play a short, tense case on their phone or computer (on the train, in the evening on the sofa). Their job is to solve the case themselves, through their own reasoning and searching, without being led by the hand.

## Product Purpose
A free detective game in which the player solves a crime by searching a simulated phone (of a victim or someone involved): messages, photos, mail, agenda, health data, logs and settings. Success means the player finds the culprit through their own deduction, feels the "aha" moment, and wants to share their (spoiler-free) result.

## Positioning
The whole investigation takes place inside a realistic phone. There is no separate case file to read and no interrogations. All evidence is hidden in apps, deleted items, details in photos you have to zoom in on, and timestamps that contradict each other. Every case is fair: the solution can always be traced back to what is on the phone.

## Operating Context
- Played solo, in one sitting of about 10–20 minutes per case.
- Mainly on a phone (mobile web) and also on a computer; on a computer the phone and the case file sit side by side, on a phone the case file is a slide-out panel.
- Progress is stored in the player's own browser.
- The result is shared as text with emoji, without spoilers (for example in a group chat).

## Capabilities and Constraints
- Free for players. A revenue model (ads, donations, paid extra cases) is **undecided**.
- Distribution: **web only**, playable via a link and addable to the home screen. No app store.
- Language: **Dutch first**, with settings and humour from the Netherlands and Flanders. English comes later, so text must stay translatable (not baked into images or code that can't be translated).
- Mechanics: lock screen with a code puzzle, apps to search, pinning evidence, tasks that unlock one after another, hints with a point cost, a final report (who / how / why plus 3 pieces of evidence), a score and a shareable result.
- Current build: one static HTML file per case, with no server (`mysterie-app/`).
- Undecided: how often new cases appear (daily, weekly, by season) and whether there will be accounts or online progress.

## Brand Commitments
- Tone: **dark thriller**. Murder, fraud, deception, obsession and heavier themes are allowed; the atmosphere is tense and gritty. Cases with heavy themes get a content warning before they start.
- Never graphic as a goal in itself: tension comes from the deduction, not from shock imagery.
- Characters, places and works of art are fictional; no real people or real crimes.
- Case names are short and enigmatic (e.g. "De Reiger").

## Evidence on Hand
- Case #001 "De Reiger" has been built in full: `mysterie-app/game.html` (source) and `mysterie-app/index.html` (standalone).
- There are no player numbers, reviews or testimonials yet; never make them up.

## Product Principles
1. **Fair over clever.** Every solution can be reached with what is on the phone; red herrings are allowed, cheating is not.
2. **The phone is the story.** Clues feel like real traces of a life (a deleted message, a strange timestamp), not like puzzle pieces laid out for you.
3. **The player deduces, the game confirms.** Hints cost something and come only on request; the game never gives the answer unprompted.
4. **Short and tense.** One sitting, one "aha" moment, a result you want to share.
5. **Dark, never cheap.** Heavy themes are handled seriously and with a warning.

## Accessibility & Inclusion
Readable on small phones (from 320px wide) and usable with one thumb. Text in the game and the case file meets WCAG AA contrast. Content warnings for cases with heavy themes.
