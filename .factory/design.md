# Pulse Check — visual thesis

## Direction

**Monochrome typographic broadsheet.** Pulse Check should feel like a freshly
printed timing report from a calibration bench: decisive black rules, dense but
legible figures, large editorial headlines, and small red proofreader marks
where human correction matters. It avoids the glowing-waveform visual language
of DAWs because this product diagnoses evidence; it does not perform music.

The page is deliberately single-mode. Warm paper replaces pure white and ink
replaces pure black, reducing glare during repeated phone tests while retaining
high contrast. Depth comes from rule weight, type scale, and offset ink shadows,
not rounded cards or gradients.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#F3F0E8` | page background |
| Sheet | `#FFFCF5` | working surfaces |
| Ink | `#151512` | primary text and heavy rules |
| Quiet ink | `#5C5A52` | secondary text (7.0:1 on paper) |
| Proof red | `#B42318` | primary action, active marks (5.4:1) |
| Deep red | `#7D1710` | hover/focus emphasis |
| Rule | `#A9A69D` | structural lines, never sole state cue |
| Good | `#176B3A` | pass state, always paired with text/icon |
| Warning | `#8A4B08` | caution, always paired with text/icon |
| Danger | `#A11B14` | errors, always paired with text/icon |

## Type and spacing

- **Display/editorial:** Georgia, `Times New Roman`, serif. The familiar print
  face makes the diagnosis read like a report, not a dashboard.
- **Utility/data:** `Arial Narrow`, `Roboto Condensed`, Arial, sans-serif.
  Device-native only, so no font downloads; tabular figures are mandatory.
- Scale: 14 / 16 / 20 / 30 / clamp(48–88) px. Body is never below 16 px.
- Spacing follows an 8 px baseline: 4, 8, 16, 24, 32, 48, 64, 96.
- Reading measure is 68 characters. Desktop uses a 12-column editorial grid;
  mobile at 390 px becomes one column and removes ornamental folio metadata.

## Interaction grammar

- Primary actions are red, rectangular, and carry a short verb. Secondary
  actions are ink-on-paper with a 2 px rule. Every target is at least 44 px.
- The workflow is a numbered three-part issue: **Track / Device / Verify**.
  One active section is visually dominant, while completed sections retain
  their result and can be reopened without data loss.
- Timing samples appear as vertical proof marks around a central zero rule.
  The same marks have a table/text equivalent for non-visual users.
- Adjustable beat anchors use labeled numeric fields and nudge buttons; no
  drag-only interaction. Tap testing also supports Space and Enter.
- Empty, processing, offline, success, and error states use plain diagnostic
  language with an explicit next action.

## Motion policy

Only state changes move: a result sheet enters with a 180 ms 4 px rise, button
presses settle by 1 px, and the metronome uses a 120 ms scale pulse at each
click. No ambient or looping decorative motion. Under
`prefers-reduced-motion: reduce`, all translation and scale are removed and
state changes are instantaneous; audio remains user-triggered.

## Original asset plan and prompt sheet

The hero uses one generated editorial still-life, treated as a halftone press
plate and cropped behind typographic rules. It explains the product boundary:
a phone (device timing), a punched paper beat strip (source timing), and a
calibration needle (measured result). All functional diagrams and icons are
hand-authored in HTML/CSS/SVG because they must be exact and accessible.

**Prompt sheet**

- Use case: `stylized-concept`
- Asset type: wide landing-page editorial illustration
- Subject/world: top-down calibration bench with an unbranded black smartphone,
  a long paper timing strip punched with evenly spaced beat holes that slowly
  drift off a ruled grid, a small mechanical calibration needle, and a pencil
- Materials: uncoated newsprint, black ink, metal instrument, subtle paper grain
- Light/lens: hard overhead studio light, long crisp shadow, top-down 50 mm
- Palette words: warm ivory paper, carbon black, one restrained proof-red mark
- Composition: horizontal, objects concentrated on the right, quiet negative
  paper on the left for editorial copy, no UI screenshot
- Negative list: no people or hands, no brands, no logos, no music notes, no
  neon, no gradient, no legible text, no watermark, no fake interface

## Asset provenance

- `public/assets/pulse-bench-1536.webp` and `public/assets/pulse-bench-768.webp`:
  generated specifically for Pulse Check with
  the factory Azure image generation deployment (`factory-image`) on
  2026-08-28 using the prompt sheet above; original source and prompt sidecar
  retained in `assets/src/`. Original generated work, no third-party asset.
- `public/assets/pulse-check-social.jpg`: a 1200 × 630 editorial crop derived
  from the generated bench illustration on 2026-09-06 for social previews.
  It adds no third-party material.
- `public/apple-touch-icon.png`: a hand-built rasterization of the product
  mark on 2026-09-06; it uses only the documented Ink, Paper, and Proof red
  tokens.
- Functional waveform/grid graphics are produced from the user's local audio
  in-browser and are not uploaded or retained by Pulse Check.
