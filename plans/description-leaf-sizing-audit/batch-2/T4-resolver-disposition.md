# T4 — Probe and dispose of the open resolvers

## Context

T3's table will leave some rows undecided. Three groups need a jar probe
before anyone can honestly call them threaded, gapped, or size-neutral:

1. `resolveElementShadowing` (renderer=2, sizer=0). Shadow depth reaches
   drawing via `Fashion.getDeltaShadow` / `UEllipse.setDeltaShadow`. The
   open question is whether it changes a node's measured DIMENSIONS or
   only its ink. **Expected: ink only** — but expectation is not evidence.
2. `resolveElementLineThickness` (renderer=1, sizer=0). Same question for
   stroke width.
3. `HeaderFont`, `HeaderBackground`, `Background`, `BucketSelector` —
   referenced by NO module at all. Each is either dead code or an unwired
   feature, and the two have different dispositions.

## Task

Probe each, write the verdict into T3's table. Do not thread anything.

## Write-set

- `planning/sizer-renderer-parity.md` (rows only — T3 owns its structure)

## Read-set

- `planning/sizer-renderer-parity.md` (T3's output)
- `src/core/theme-element-resolve.ts`
- upstream: `Fashion`, `UEllipse#setDeltaShadow`, `UStroke`, and the
  `getMargin`/`calculateDimension` of any symbol whose size might include
  stroke or shadow

## Acceptance criteria

- Given `resolveElementShadowing`, when the jar is probed with shadowing
  ON vs OFF on the same diagram, then the row records whether node
  width/height changed, WITH the numbers from both runs
- Given `resolveElementLineThickness`, when probed at two thicknesses
  (e.g. 0.5 vs 3), then the row records the same
- Given each of the four unreferenced resolvers, then it is classified
  `dead code` (safe to delete — say so) or `unwired feature` (name what
  would consume it), and ledgered in `plans/s1l-leaf-sizing/ledger.md`
- Given ANY probe that proves a real sizing gap, then it becomes a
  Batch-4 row — it is NOT fixed in this task
- Given every probe, then the exact command and output numbers are in the
  table, so nobody has to re-run it to trust it

## Probe recipe and its traps

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>
```

DOT node order ≠ declaration order — isolate ONE element per diagram.
A single-entity diagram emits NO DOT (`isDegeneratedWithFewEntities`) —
always add a second element. If the jar will not run: STOP.

## Observability

N/A — documentation only.

## Rollback

Reversible. No source or pin changes.

## Quality bar

No code changes. "Expected: ink only" is a hypothesis; a row that records
an expectation instead of a measurement fails this task.
