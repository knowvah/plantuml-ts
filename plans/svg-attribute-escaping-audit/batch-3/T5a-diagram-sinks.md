# T5a — Diagram-layer template sinks

## Context
Eight constant/numeric sinks outside the seam: shadow filter definitions
(`src/diagrams/class/class-shadow.ts:54,56`,
`src/diagrams/state/state-shadow.ts:62,64`, `src/diagrams/board/renderer.ts:12`),
the chart root `<svg>` (`src/diagrams/chart/renderer.ts:238`), an enum name
(`src/diagrams/class/class-visibility-icon.ts:271`) and a polygon points
rewrite (`src/diagrams/state/renderer-pseudostate.ts:135`). None carries
user text; they are routed so D5's lint rule needs no allowlist.
`renderer-pseudostate.ts:135` string-replaces `points=` inside built
markup: build the points value first and emit once via `attrs()`.

## Task
For each listed sink, replace the template-literal attribute(s) with a call
to `attrs([...])` / `attrsFromRecord({...})` from `src/core/svg.ts`
(your choice, push-forward), passing RAW values — the seam escapes.
Numeric values pass as numbers so `formatAttrValue` formats them exactly
as `fmt` did (same `DEFAULT_SVG_DECIMALS`); if a site used raw `${n}`
without `fmt`, pass `String(n)` to stay byte-identical and note it in the
commit body. Constants (`SHADOW_COLOR_MATRIX_VALUES`, filter ids) go
through the same call. No other edit: no renames, no reordering of
attributes (attribute ORDER is part of the golden bytes), no comment
rewrites beyond the line touched.

## Architecture decisions
D2, D5 (locked). Stop 6 if a sink cannot route without a logic change.

## Acceptance criteria
- Given the listed files, when grepped for `="${`, then no match
- Given `npx vitest run svg-conformance` and the full suite, when run,
  then zero diffs (attribute order and decimals unchanged)
- Given the per-file unit tests that exist today, when run, then green
  with no expectation edits

## Quality bar
All four gates; conformance unmoved.

## Boundaries
- Never: change attribute order; add an `eslint-disable`; touch a file
  outside the write-set

## Observability
N/A.

## Rollback
Reversible.

## Write-set
- `src/diagrams/class/class-shadow.ts`
- `src/diagrams/state/state-shadow.ts`
- `src/diagrams/board/renderer.ts`
- `src/diagrams/chart/renderer.ts`
- `src/diagrams/class/class-visibility-icon.ts`
- `src/diagrams/state/renderer-pseudostate.ts`

## Read-set
- Each file at the cited line ±15
- `src/core/svg.ts:171-215` (`attrs`, `attrsFromRecord`)
- `tests/architecture/layering.test.ts:160-200` (`diagrams → core` imports are allowed; confirm no new `core → diagrams` edge)
- `decisions.md#d5`

## Commit
`refactor(saea-T5a): diagram emitters build attributes through attrs()`
