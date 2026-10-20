# sdd1 T1b — observations

## Observation: a skinparam line carries no document position
- **Context**: sdd1 T1b, per-event builder capture in `parseSequence` (2026-10-20).
- **Finding**: the preprocessor records a skinparam's place on the declaration
  counter (`preprocessor-collector.ts:306`, keyed by its LAST assignment) but
  no line. `positionedDeclarationsOf` (`mindmap-style-builder.ts:75-95`) sits
  it at the previous `<style>` block's line, or -1. So `A -> B` / `skinparam
  participantBorderThickness 2` / `C -> D` gives BOTH messages thickness 2
  (probed: `[2, 2]`); upstream's `CommandSkinParam` executes where it stands
  (`[0.5, 2]`). T1a's dispatch test (`sequence-skin-param.test.ts:255-262`)
  calls `executeDeclarationsBefore(dispatch, 3)`, which cannot tell -1 from 2.
- **Impact**: per-command capture is exact for `<style>` blocks only. Fixing it
  needs a preprocessor edit plus `src/core/style/**` (stop 8). Pinned as
  `it.fails` in `tests/unit/sequence/parser-style-capture.test.ts`.
- **Confidence**: High (probe + source read).

## Observation: `buildBlockUmls(...)[i].source` has no style sources
- **Context**: sdd1 T1b, harness change.
- **Finding**: `BlockUmlOk.source` carries `lines`/`linePositions` only;
  `styleSource`/`stylePositions`/`rawStyles` are added by the private
  `src/index.ts#umlSourceOfBlock` (`index.ts:73-83`). A harness that passes
  `first.source` parses with no styles at all.
- **Impact**: every harness whose parser reads style sources must widen the
  block the same way (`render-fixture-sequence.ts#sequenceBlockSource`,
  `render-fixture-activity.ts:137-142`).
- **Confidence**: High.

## Observation: the loop's `origIndex` is not a document position
- **Context**: sdd1 T1b, `executeDeclarationsBefore` call site.
- **Finding**: `runDispatchLoop`'s `trimmedEntries[i].origIndex` indexes
  `source.lines` (the directive-stripped interior); `stylePositions` is in the
  document frame of `linePositions` (`preprocessor.ts:64-101`). Probed: lines
  `['A -> B','','C -> D']`, linePositions `[1,2,7]`, stylePositions `[4]`.
  The position passed is `linePositions[origIndex]`.
- **Impact**: passing `origIndex` would run a `<style>` up to (start-line count
  + stripped directives) lines late.
- **Confidence**: High.
