# T5b — `coord-shift.ts` and `latex.ts` sinks

## Context
`src/core/annotations/coord-shift.ts:162-164` rebuilds `points=`, `d=` and
`transform=` after shifting numeric coordinates; `src/core/latex.ts:355`
builds the KaTeX wrapper `<svg width height>` with raw `${width}`. All
numeric; routed for D5.

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
- `src/core/annotations/coord-shift.ts`
- `src/core/latex.ts`

## Read-set
- `src/core/annotations/coord-shift.ts:140-175`
- `src/core/latex.ts:340-365`
- `src/core/svg.ts:171-215`
- `decisions.md#d5`

## Commit
`refactor(saea-T5b): coord-shift and latex wrapper emit attributes through attrs()`
