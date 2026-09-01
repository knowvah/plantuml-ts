# A1 — the sequence text emitter and the geometry metrics

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
2. Add `textWidth`, `textAscent`, `textLineHeight` to every text-bearing geo
   in `ast.ts`, and scale them in `scale-geo.ts` (D1).
3. Unit-test the emitter against the jar's own markup.

Do **not** change any renderer or layout call site. That is A2–A5.

## Write-set

- `src/diagrams/sequence/sequence-text.ts` (create)
- `src/diagrams/sequence/ast.ts` (modify — type additions only)
- `src/diagrams/sequence/scale-geo.ts` (modify — scale the new fields)
- `tests/unit/sequence/sequence-text.test.ts` (create)

## Read-set

- `src/core/svg-shapes.ts:80-135` — `text()` and `textLengthOf`. It already
  supports `textLength` and already implements upstream's `text.length() > 1`
  guard. Do not reimplement either; call it.
- `src/diagrams/sequence/renderer-frame-header.ts:60-73` — the one sequence
  renderer already emitting a correct baseline, and the `textAscent` arithmetic
  D2 retires.
- `src/core/measurer.ts:19-22, 92-94` — the `StringMeasurer` contract and a
  `getDescent` implementation.
- `plans/sequence-text-and-y-convergence/decisions.md` — D1, D2, D3, D4.
- Jar reference: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java`,
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
  readonly fontWeight?: 'bold';
  readonly textDecoration?: string;
}
export function sequenceText(spec: SequenceTextSpec): string;
```

Geometry fields added to every text-bearing geo (`ParticipantGeo`,
`MessageGeo`'s runs, `NoteGeo`, `FrameGeo`, `DividerGeo`, `NewpageGeo`):

```ts
readonly textWidth: number;       // measured, at the element's own font
readonly textAscent: number;      // measure().height - getDescent()
readonly textLineHeight: number;  // measure().height
```

All three are **required**, not optional — an absent metric must not silently
become zero. Scale by `k` in `scale-geo.ts`.

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
- Given a geometry with the three new fields, when `scaleSequenceGeometry` runs
  with `k`, then `textWidth` and `textAscent` are both multiplied by `k`.
- Given the whole corpus, when rendered, then total distance is **exactly**
  2578916.759 — unchanged, because no call site moved.

## Observability

N/A — no new observable operations. The task's own gate is the distance
instrument reporting no change.

## Rollback

**Reversible.** Type additions and one new module; no baseline or golden is
touched by this task.

## Quality bar

All four gates: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`. `git diff --name-only` must list exactly the four write-set
files.

## Commit

`feat(A1): add the sequence text emitter and carry its metrics`
