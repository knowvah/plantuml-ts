# T2 — Geometry: per-line glyphs on `labelLines`, ink at the resolved arrow font

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG; tests are vitest.

`class-edge-geo.ts#attachEdgeLabel` (`:47-115`) returns early for a multi-line
label (`:90-93`, `multiLineLabelAnchor` → `EdgeGeo.labelLines`) and never
reaches the magic-arrow path, so `gobuco`/`lapoma` draw no glyph while the
jar draws four (`test-results/dot-cache/class/gobuco-16-ruke239/in.svg`: four
`<polygon>`s, text at glyph + 3px, x values 79.68/80.05/81.51/79.68 —
per-line blocks centred in the merged block). Separately, `attachMagicArrow`
(`:151`) and `multiLineLabelAnchor` (`class-edge-label-anchor.ts:57`) position
ink at `CARDINALITY_FONT_SIZE` (13) via a `fontFamily` string, while SI24 T5
(`cb4de5c7`) made the DOT reservation follow `resolveArrowLabelFont(theme)` —
box and ink can drift on `camuna` (14 bold), `ticuxa` (58), `nafiki`.

## Task

1. **Types (D1, D5):** `class-geo-types.ts:302` — `labelLines` entries gain
   `glyph?: { points: Array<{ x: number; y: number }> }` (3 points, jar's
   tip-then-two-back-corners order, same as `arrowGlyph`). The file is
   501/500 lines: trim doc prose (never a citation) until the hook passes.
2. **Font threading (D2):** `buildEdgeGeos` (`class-edge-geo.ts:303`),
   `attachEdgeLabel`, `attachMagicArrow`, and `multiLineLabelAnchor` take
   `labelFont: FontSpec` instead of `fontFamily`; `layout.ts:288` passes
   `resolveArrowLabelFont(theme)` (`src/core/arrow-label-font.ts` — the only
   theme reader). Tail/head labels keep their font — check what `portLabelAnchor`
   is called with for `tailLabel`/`headLabel` and leave it.
3. **Per-line glyphs (D3, D4):** in the multi-line branch, when
   `hasSeveralGuideLines(lines)`, use T1's `splitGuideLines(lines, labelFont,
   measurer)`: merged width = max `blockWidth`; per line, block left per the
   label's alignment inside the merged block; if the line has a `direction`,
   `glyph.points = magicArrowGlyphPoints(lineBlockLeft, lineTop,
   magicArrowAngle(fromToPoints, direction), labelFont.size)` and the text
   x is offset by `labelFont.size`; `y` per `multiLineLabelAnchor`'s existing
   per-line formula. Read `abel/LinkArrow.java:55` (`mute`) for how the edge
   guide mutes the token direction and mirror the whole-label path; journal
   the reading. Labels `hasSeveralGuideLines` rejects keep the EXACT existing
   path (pin one).
4. `layout.ts:170-174`: translate `glyph.points` with `dx/dy`;
   `class-ink-box.ts:323-331`: include `glyph.points` in the bounding box.
5. Tests (`class-geo-builders.test.ts`, `class-edge-labels.test.ts`): the
   acceptance criteria below.

## Write-set

- `src/diagrams/class/class-geo-types.ts` (501 — trim), `class-edge-geo.ts`
  (376), `class-edge-label-anchor.ts` (222), `layout.ts` (471),
  `class-ink-box.ts` (344)
- `tests/unit/class/class-geo-builders.test.ts`, `tests/unit/class/class-edge-labels.test.ts`

If `class-geo-builders.ts`, `class-layout-edge-labels.ts` or anything under
`src/core/` must change, stop and log.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/StringWithArrow.java:56-127`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockArrow2.java:50-95`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LinkArrow.java:40-70`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockUtils.java` (`mergeLR`/`mergeTB` alignment)
- `src/diagrams/class/class-edge-geo.ts:47-175,303-376`, `class-edge-label-anchor.ts:50-135`, `class-magic-arrow.ts` (T1's `splitGuideLines`, `magicArrowAngle:153`, `magicArrowGlyphPoints:183`), `class-geo-types.ts:280-315`, `layout.ts:160-180,280-300`, `class-ink-box.ts:315-335`
- `src/core/arrow-label-font.ts`, `src/core/measurer.ts:12-22`
- `decisions.md` D1–D6; `plans/edge-label-box-backlog/batch-6/T12c-magic-arrow.md`; `.agent-notes/m4-single-line-width.md`
- `test-results/dot-cache/class/{gobuco-16-ruke239,lapoma-04-vaga142,camuna-58-veca254,lojepe-37-liri985}/in.svg`

## Architecture decisions

D1–D6 as written. Consume T1's walk; never re-parse per line here.

## Interface contract (consumed by T3)

```ts
// EdgeGeo
labelLines?: Array<{ text: string; x: number; y: number; width: number; glyph?: { points: Array<{ x: number; y: number }> } }>;
// glyph present iff that line carried a `< `/`> `/` <`/` >` token AND the label hasSeveralGuideLines
```

## Acceptance criteria

- **Given** `gobuco`, **when** laid out, **then** `labelLines` has 4 entries,
  each with a 3-point `glyph`, text `x` offset by `font.size` from its block
  left, and DOT EQUAL stays 705/711.
- **Given** a two-line label with no guide-line token, **then** no `glyph` and
  every `x`/`y` byte-identical to before (pin).
- **Given** single-line `> foo`, **then** `arrowGlyph`/`label` unchanged
  (T12c path; pin against `lojepe`).
- **Given** `<style> arrow { FontSize 20 }` on a guide-line label, **then**
  `computeGuideLinesBox` width equals the geo merged width and the glyph is
  20px (box and ink agree — D4 of SI24).
- **Given** `camuna`/`ticuxa`/`nafiki`, **then** any SVG movement is toward
  jar (journal per fixture); every other class fixture SVG byte-identical.

## Quality bar

Four gates; `dot-sync-report class` = 705/711; class ratchet
(`class.golden.ratchet.test.ts`, `class-dot-parity.test.ts`) — pins hold or
move toward jar, journalled.

## Observability

N/A — class DOT EQUAL and the ratchet pins are the signal.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** put `.80`/`ARROW_GLYPH_SIZE` in a position or width; glyph size is
  `labelFont.size`.
- **Never** change tail/head (cardinality) label fonts.
- **Stop** on stop 1, 6, 7, 8.

## Commit

`fix(T2): class edge-label geometry places per-line glyphs at the resolved arrow font`
