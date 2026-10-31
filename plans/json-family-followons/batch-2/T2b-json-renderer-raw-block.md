# T2b — json renderer hands chrome the raw 1x block (D1)

Agent: typescript-pro (opus, effort high), worktree `jff-T2b` (off the branch
after the T2a gate). Include [../task-contract.md](../task-contract.md).
Commit: `fix(json): scale the chromed block at export, title included (T2b)`.

## Context
`renderJson` (`src/diagrams/json/renderer.ts:445-486`) resolves `k` over the
title-less `finalDimension`, scales its body (`scaleAtEmit`, `scale-at-emit.ts`),
and declares a margin-baked block (`declaredBlock`, `:333-370`) that
`applyExportedChrome` un-margins, chromes and re-margins. So the title is
never scaled and `scale max …` reads the wrong dimension. Planning probe:
json `title` + `scale 1.5` canvas 185 vs 277, title font 14 vs 21; yaml
`title` + `scale 2` height 115 vs 150, every diff title-related.

Upstream: `SmetanaForJson` draws at the block's own origin
(`JsonDiagram.java:113-122`), `calculateDimension` is the ink EXTENT
(`JsonDiagram.java:130-137`, `MinMax.java:151-153`), the exporter translates by
the margin and scales the chromed block (see T2a). The layout currently adds
the leading margin (`src/diagrams/json/layout.ts:55-59` `marginsOf`, used at
`:418`, `:464`) and `documentDimensions` returns extent + margins
(`document-dimensions.ts:102-130`).

## Task
Hand over what `JsonDiagram#getTextBlock` is: the body drawn at block origin
(no leading margin), `width/height` = the extent (`finalWidth − margin.x`,
`finalHeight − margin.y` — float, no `+1`), `exportMargin` = the
`TextBlockExporter.java:510-516` margin (style `Margin`, else `same(10)`), as a
`ClockwiseTopRightBottomLeft` like `src/diagrams/mindmap/index.ts:221`,
`scaleSpec` = `geo.scale` when present, the body drawn under
`withDeferredFormat` with `numbersDeferred: true` (so the one format pass runs
after the scale, `SvgGraphics.java:466-475`), never `dpi` (D5). Delete
`scale-at-emit.ts` and `declaredBlock`'s margin-baking; remove the
`preChromeWidth`/`documentMargin` fields from the json fragment so
`applyExportedChrome` chromes it as handed over (`chrome-export.ts:44-46`).
Move the margin out of the layout's coordinates where it is baked (prefer
removing the leading-margin offset in `layout.ts` over a compensating shift;
if a shift is unavoidable, do it once, deferred, and journal why). Cover the
three special pages: the parse-failure page (`renderParseFailure`,
`JsonDiagram.java:116-120` `withMargin(5,2)` drawn at origin), the empty
diagram (`renderJson`'s early return), and handwritten (`handwrittenDims`,
`:380-395` — its ink span is already the extent; drop the margin terms, keep
`JsonDiagram.java:113-115`'s own handwritten pass, do not let `exportTo` wrap).

Diagnosis mode on every row that moves the wrong way (stop 2/14).

## Write-set
`src/diagrams/json/renderer.ts`, `src/diagrams/json/layout.ts`,
`src/diagrams/json/document-dimensions.ts`, delete `src/diagrams/json/scale-at-emit.ts`,
unit tests under `tests/unit/json/` that assert the changed sizes/offsets
(re-point with the reason in the commit body). Anything else (e.g.
`json-node-position.ts`, `JsonCurve.ts`, `src/core/**`) is stop 1.

## Read-set
`src/diagrams/json/renderer.ts:330-486`, `src/diagrams/json/layout.ts:30-60,410-478`,
`src/diagrams/json/document-dimensions.ts`, `src/core/annotations/chrome-export.ts`,
`src/diagrams/mindmap/index.ts:200-226`, T2a's finalize branch,
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagram.java:68-142`,
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:155-215,505-520`.

## Acceptance
- Given authored `json/title-scale`, `yaml/title-scale`, `hcl/title-scale`, `json/title-scale-max-width`, `json/caption-scale`, then title/caption font-size, x/y and the canvas match the jar; any remaining diff is body Smetana residue no larger than the same body's unscaled residue × the factor (stop 14).
- Given the no-title scale rows (overview "Rows to watch"), then no positional value rises vs b1 (`residue.mts`).
- Given the handwritten rows, then their structural and positional values equal b1 (no double wrap).
- Given the json/yaml/hcl golden ratchets (14/7/1) and every other engine, then they are byte-identical to b1.
- Given `grep -rn "scale-at-emit\|scaleAtEmit" src/`, then nothing.

Observability: N/A. Rollback: Reversible.
