# sdd2 planning — research observations (2026-10-21)

Recorded by the orchestrator from four read-only research agents. The full
reports are in `plans/sequence-divergence-drive-2/research/`.

## Observation: the sequence jar is always teoz
- **Context**: Research B and C traced which sequence engine the jar uses.
- **Finding**: `SequenceDiagram.java:311-314` returns `SequenceDiagramFileMakerTeoz`
  unconditionally (the puma return is commented out, since d087fc0c, 2026-07-09);
  `GlobalConfig.java:46-47` `FORCE_TEOZ = true`. `!pragma teoz true` is inert.
  The `graphic/` (puma) classes ship in the jar but are never dispatched.
- **Impact**: cite `teoz/` and `skin/rose/` only. Any port comment that excuses
  a gap with "the classic renderer does not read X" is stale (one was:
  `ast.ts:72-75`, parallel/anchor).
- **Confidence**: High

## Observation: group frames are bounded by every lifeline, not their tiles
- **Context**: Research B, width family.
- **Finding**: `sequence-layout-frame.ts:163-182` uses all participants ±16;
  upstream `GroupingTile.java:207-225` uses the frame's child tiles ±16, the
  header width + 16 and the else tiles; `getMaxX` adds 9 (`:988-990`).
- **Impact**: the largest single source of group-frame x/width diffs (51 rows).
- **Confidence**: High

## Observation: an upstream width predictor over port geometry works
- **Context**: Research B.
- **Finding**: recomputing the canvas width the PlayingSpace way from the port's
  own `layoutSequence` geometry reproduces 377/419 pinned widths with the port's
  label loop removed. Saved as `plans/sequence-divergence-drive-2/prototypes/
  width-predictor.mts`.
- **Impact**: a reusable instrument for width diagnosis.
- **Confidence**: High

## Observation: two port error rows were port bugs, not harness gaps
- **Context**: Research D, error rows.
- **Finding**: a missing `!includedef` definition is a no-op upstream
  (`TContext.java:687-705`), but `core/tim/IncludeExecutor.ts:124-130` throws;
  sdd1 had filed it as a harness gap. `RE_STYLE_CLOSE`
  (`core/preprocessor-collector.ts:13`) misses upstream's `</?style>` END.
- **Impact**: both are core fixes that touch every engine (sdd2 Batch 8).
- **Confidence**: High
