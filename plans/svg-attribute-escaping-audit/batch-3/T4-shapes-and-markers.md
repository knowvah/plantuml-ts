# T4 — `svg-shapes.ts` and `svg-markers.ts` sinks

## Context
The seam (T3a) escapes inside `attrs()`. These two files are the emission
seam the architecture test already names, and hold the last string-carrying
sinks: fills/strokes at `svg-shapes.ts:403`, `:411` (and numeric `:397`),
and marker fills/strokes/ids/geometry at `svg-markers.ts:132`, `:140`,
`:156`, `:177-178`, `:197-199`. `svgRoot` still hands markers an escaped
`bg` (T3a step 4); once the marker bodies go through `attrs()`, `svgRoot`
must pass the RAW `bgColor` — that one-line change in `svg.ts` is
pre-authorised for this task (write-set below) to avoid a double escape.
`:199` rewrites `stroke="#000"` inside an already-built body: rebuild the
body with the stroke as a parameter instead of string-replacing.

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
- `src/core/svg-shapes.ts`
- `src/core/svg-markers.ts`
- `src/core/svg.ts` (ONLY the `svgRoot` marker call: raw `bgColor`)

## Read-set
- `src/core/svg-shapes.ts:380-420`
- `src/core/svg-markers.ts:120-210`
- `src/core/svg.ts:526-560`, `:171-215`
- `tests/architecture/svg-emission-seam.test.ts:1-40`
- `decisions.md#d2`

## Commit
`refactor(saea-T4): shapes and markers emit attributes through attrs()`
