# T6 — `sanitizeSvg` disposition (D6)

## Context
`src/core/svg-sanitize.ts` is exported and tested (PR #58 hardened it) but
has no production caller. The jar splices fetched SVG raw into the document
(`SvgGraphics.java:790-797`); this port does not inline fetched SVG yet —
`src/core/klimt/drawing/svg/svg-graphics.ts:157` throws "deferred per
D3-prime: image embedding". D6: keep the utility, name its wiring point.

## Task
Two doc-comment edits, no behaviour:
1. `svg-sanitize.ts` header: state it has no in-library caller today; the
   intended call site is D3-prime image embedding (`svg-graphics.ts:157`),
   where fetched SVG would be inlined; hosts inlining SVG themselves may
   call it directly.
2. `svg-graphics.ts:157` deferral comment: add one sentence pointing at
   `svg-sanitize.ts#sanitizeSvg` as the sanitizer to apply when the
   deferral lifts.

## Write-set
- `src/core/svg-sanitize.ts` (comments only)
- `src/core/klimt/drawing/svg/svg-graphics.ts` (comment at `:150-160` only)

## Read-set
- `src/core/svg-sanitize.ts:1-30`
- `src/core/klimt/drawing/svg/svg-graphics.ts:145-165`
- `decisions.md#d6`

## Acceptance criteria
- Given both files, when diffed, then only comment lines change
- Given `npm run catalog`, when run, then no drift

## Quality bar
`npm run lint`, `npm run typecheck`, `npm run catalog` (no drift).

## Observability
N/A.

## Rollback
Reversible.

## Commit
`docs(saea-T6): record sanitizeSvg's wiring point at the D3-prime deferral`
