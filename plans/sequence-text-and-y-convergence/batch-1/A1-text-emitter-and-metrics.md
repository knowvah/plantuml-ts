# A1 — the sequence text emitter, the run metrics, and the `ast.ts` split

> **Amended 2026-09-01, mid-execution.** The original task put three scalar
> metric fields on each of six geometry types. Four of the six cannot carry
> one; the maintainer's ruling moved them onto `TextRun` and added the
> `ast.ts` split. See D8, and `.agent-notes/A1-sequence-geo-text-metric-fields.md`
> for the measurements behind it.

## Context

This port emits sequence text by anchor (`text-anchor="middle"`,
`dominant-baseline="middle"`) at a centre point. The jar emits an explicit left
edge, an explicit baseline `y`, and a `textLength`, and never anchors — 0 of
its 70 622 `<text>` elements carry an anchor, 97.3% carry a `textLength`.

The comparator does not know these are different conventions: it compares our
centre against the jar's left edge and charges the difference. On
`jobadi-87-jegi648` our participant label centre is 29.469 and the jar's is
`17 + 24.938/2 = 29.469` — identical to the thousandth — and the comparator
charges 12.469 for it. Across the corpus that is **423 064 of phantom
distance**, 16.4% of everything remaining, plus roughly 46 000 spurious diff
records.

This task builds the seam. It changes no call site and no output.

## Task

1. Create `src/diagrams/sequence/sequence-text.ts` exporting `sequenceText`,
   the one emitter every sequence `<text>` will route through (D3).
2. Split `ast.ts` at the `Geometry Types` banner it already carries: the
   parse-stage AST stays, the geometry moves to `geo.ts`, and `ast.ts`
   re-exports `geo.ts` so no import site changes (D8).
3. Add `textWidth`, `textAscent` and `textLineHeight` to **`TextRun`**, all
   three required, and populate them in `messageLabelBlock` — the only
   producer of runs today (D1, D8).
4. Scale all three by `k` in `scale-geo.ts`.
5. Unit-test the emitter against the jar's own markup, and the metrics against
   the measurer.

Do **not** change any renderer or layout call site. That is A2–A5.

## Write-set

- `src/diagrams/sequence/sequence-text.ts` (create)
- `src/diagrams/sequence/geo.ts` (create — the moved half of `ast.ts`)
- `src/diagrams/sequence/ast.ts` (modify — split + re-export barrel)
- `src/diagrams/sequence/text-block-geo.ts` (modify — `TextRun` metrics)
- `src/diagrams/sequence/scale-geo.ts` (modify — scale the new fields)
- `tests/unit/sequence/sequence-text.test.ts` (create)
- `tests/unit/sequence/text-block-geo-metrics.test.ts` (create)
- `tests/unit/sequence/sequence-page.test.ts` (modify — one `TextRun` literal)
- `docs/catalog.md` (generated; `npm run catalog`, drift-gated)

## Read-set

- `src/core/svg-shapes.ts:80-135` — `text()` and `textLengthOf`. It already
  supports `textLength` and already implements upstream's `text.length() > 1`
  guard. Do not reimplement either; call it.
- `src/diagrams/sequence/renderer-frame-header.ts:60-73` — the one sequence
  renderer already emitting a correct baseline, and the `textAscent` arithmetic
  D2 retires.
- `src/core/measurer.ts:19-22, 92-94` — the `StringMeasurer` contract and a
  `getDescent` implementation. Every implementation ignores its `text`
  argument, so any probe string gives the same descent.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D2, D3, D4, D8.
- Jar reference: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:114-181`,
  and this port's faithful copy at
  `src/core/klimt/drawing/svg/driver-text-svg.ts:122-150` (`textLength: dim.width`,
  no anchor) — the shape to match.

## Architecture decisions in force

- **D1** — the emitter takes metrics as parameters. It must NOT measure, and it
  must NOT compute an ascent from a font size.
- **D3** — one emitter; it is the only place `text-anchor` is forbidden by
  construction.
- **D4** — the emitter takes `leftX`, not a centre. Callers derive the left
  edge.
- **D8** — metrics live on `TextRun`. Do NOT add a scalar `textWidth` to a
  geometry type; four of the six cannot carry one.

## Interface contract (consumed by A2, A3, A4, A5)

```ts
export interface SequenceTextSpec {
  readonly leftX: number;
  readonly baselineY: number;
  readonly text: string;
  /** Measured width; reaches `textLength` subject to the length>1 guard. */
  readonly width: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fill: string;
  /** `'700'` is what this port emits for a bold sequence label; the jar's
   *  deterministic-text SVG writes the numeric weight, never the keyword. */
  readonly fontWeight?: 'bold' | '700';
  readonly textDecoration?: string;
}
export function sequenceText(spec: SequenceTextSpec): string;
```

`TextRun` grows three **required** fields:

```ts
readonly textWidth: number;       // measure(text, font).width
readonly textAscent: number;      // measure(...).height - getDescent(font, text)
readonly textLineHeight: number;  // measure(...).height
```

Required, not optional: an absent metric defaulting to zero would emit
`textLength="0"`, a visible text distortion the comparator barely sees.
`scale-geo.ts` multiplies all three by `k`.

Note `exactOptionalPropertyTypes: true` — passing an optional field straight
through to another optional field does not compile. Use a spread-conditional.

## Acceptance criteria

- Given a 3-character label of width 24.938 at leftX 17 and baselineY 27.889,
  when `sequenceText` emits it, then the markup matches
  `jobadi-87-jegi648`'s jar `<text>` for that label attribute-for-attribute
  (modulo attribute order and this port's own `fill` convention).
- Given a single-character label, when emitted, then no `textLength` attribute
  is present — upstream's `text.length() > 1` guard, already implemented in
  `svg-shapes.ts#textLengthOf`.
- Given any input at all, when emitted, then the output contains neither
  `text-anchor` nor `dominant-baseline`.
- Given a layout driven by `FixedMeasurer(8, 16)`, when a run is built, then
  `textAscent` is `16 - 16/4.5`, not `13 - 13/4.5` — the metric is MEASURED,
  not derived from the font size (D1, D2).
- Given a `TextRun`, when `scaleSequenceGeometry` runs with `k`, then all three
  metrics are multiplied by `k`, and so are `x` and `y`.
- Given the whole corpus, when rendered, then total distance is **exactly**
  2578916.759 — unchanged, because no call site moved.

## Observability

N/A — no new observable operations. The task's own gate is the distance
instrument reporting no change.

## Rollback

**Reversible.** Two new modules, one file split with a compensating re-export,
and type additions; no baseline or golden is touched by this task.

## Quality bar

All four gates: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`. `git diff --name-only` must list exactly the write-set above.

`npm test`, not `npx vitest run tests/unit` — the narrow gate misses the
catalog drift that adding a module always causes.

## Commit

`feat(A1): add the sequence text emitter and carry its metrics`
