# T1 — `splitGuideLines`: one per-line walk for box and ink

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG; tests are vitest.

SI24 T4 (`d24fd288`) ported `Display.hasSeveralGuideLines` and
`StringWithArrow#addSeveralMagicArrows` as `class-magic-arrow.ts
#computeGuideLinesBox` (`:90-108`): per line `parseMagicArrowLabel`, measure
the stripped text, `font.size + width` iff token, max width × sum height. The
DOT box for `gobuco`/`lapoma` is exact (29x54). Batch 2 needs the SAME per-line
breakdown to place glyphs and text; D3 forbids a second parse+measure walk.

## Task

1. Export `interface GuideLine { text: string; direction?: MagicArrowDirection;
   textWidth: number; blockWidth: number; blockHeight: number }` and
   `splitGuideLines(lines: readonly string[], font: FontSpec, measurer:
   StringMeasurer): GuideLine[]` — one entry per line, `text` = the stripped
   text (`magic.text ?? ''`) or the raw line, `blockWidth = font.size +
   textWidth` iff token else `textWidth`, `blockHeight = max(font.size,
   textHeight)` iff token else `textHeight` — exactly `computeGuideLinesBox`'s
   arithmetic today (`StringWithArrow.java:115-127`, `TextBlockArrow2.java:
   87-89`, `XDimension2D.java:94-98,108-112`; cite in JSDoc).
2. Refactor `computeGuideLinesBox` to `max(blockWidth) × sum(blockHeight)` over
   `splitGuideLines`. Widen its `font` parameter type to `FontSpec` (superset
   of `{family,size}`) — no caller changes.
3. Tests: `gobuco`'s label at 13 → 4 lines, directions right/left/left/right,
   `blockWidth = 13 + textWidth`; a no-token line → `direction` undefined,
   `blockWidth === textWidth`; `computeGuideLinesBox` still 29x54 (pin the
   before/after equality explicitly).

## Write-set

- `src/diagrams/class/class-magic-arrow.ts` (201 lines; hook cap 500)
- `tests/unit/class/class-magic-arrow.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/StringWithArrow.java:56-127`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockArrow2.java:50-95`
- `src/diagrams/class/class-magic-arrow.ts` (whole), `src/core/measurer.ts:12-22`
- `decisions.md#d3`; `plans/edge-label-box-followups/decisions.md#d6` and its corrections section

## Architecture decisions

D3. Do not change `hasSeveralGuideLines`, `parseMagicArrowLabel`,
`magicArrowGlyphPoints`, `magicArrowAngle`.

## Interface contract (consumed by T2)

```ts
export interface GuideLine { text: string; direction?: MagicArrowDirection; textWidth: number; blockWidth: number; blockHeight: number }
export function splitGuideLines(lines: readonly string[], font: FontSpec, measurer: StringMeasurer): GuideLine[];
// invariant: computeGuideLinesBox(lines, font, m) deep-equals { width: max(blockWidth), height: sum(blockHeight) }
```

## Acceptance criteria

- **Given** `['ab >','cd <','< ef','> gh']` at 13, **when** split, **then** 4
  entries with directions right/left/left/right and `blockWidth = 13 +
  textWidth`.
- **Given** the same input, **then** `computeGuideLinesBox` returns exactly
  what it returned before (29x54 for the fixture) and class DOT EQUAL is
  705/711.
- **Given** a line with no token, **then** `direction` is undefined and
  `blockWidth === textWidth`.

## Quality bar

Four gates; `npx jiti scripts/dot-sync-report.ts class` = 705/711.

## Observability

N/A — no new observable operations; class DOT EQUAL is the signal.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** change any measured number; **never** put `.80` in the walk.
- **Stop** if a caller outside the write-set must change.

## Commit

`refactor(T1): export the per-line guide-line walk behind computeGuideLinesBox`
