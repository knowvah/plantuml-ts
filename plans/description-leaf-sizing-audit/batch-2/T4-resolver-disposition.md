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

---

## RESCOPED by the orchestrator, 2026-07-28 — read this before the above

T3 overtook most of this task, and one of its premises was wrong. Verified
against the code before rescoping, per the mission's own method constraint.

| original group | status now |
|---|---|
| 1. `resolveElementShadowing` | **DONE by T3** — jar-proven GAP. `actor { Shadowing 6 }` and bare `root { Shadowing 6 }` both 1.027778 → **1.111111** (74→80px), width unchanged; size-neutral on component/usecase/control/entity. Numbers are in the Proofs section. |
| 2. `resolveElementLineThickness` | **DONE by T3** — jar-proven GAP. `actor { LineThickness 6 }` 0.498264×1.027778 → **0.527778×1.180556** (38 = 26+2×6, 85 = 59+2×6+14). |
| 3. the four "referenced by NO module at all" | **PREMISE FALSE.** All four are live, with real call sites: `resolveElementHeaderFont` → `renderer-classifier-rows.ts:149`; `resolveElementHeaderBackground` → `renderer-classifier-box.ts:257`; `resolveElementBackground` → `renderer-classifier-colors.ts:124`; `resolveElementBucketSelector` → `style-map-element.ts:96`. They read 0/0 when this brief was written because that grep was scoped to DESCRIPTION modules — these are CLASS-engine resolvers. They are neither dead code nor unwired features, so the disposition this task was written to make does not exist. T3 already classified all four `size-neutral` with written reasons. |

### What actually remains

1. **`guillemet` — inferred, never probed.** T3 assigned it `GAP` by shared
   code path with the proven `wrapWidth` gap. Prove or disprove it directly:
   does `«…»` substitution change measured node dimensions?
2. **`inkSprites` — proven dead by grep, not by dimension.** Confirm with a
   probe that the usecase path's declared-dims fit differs from an ink fit,
   i.e. that the dead thread is a real gap and not a distinction without a
   size difference.
3. **`skinparam actorStyle` — reachability unknown.** T3 found NO `Theme`
   field; both paths independently hardcode `STICKMAN`. T2 found
   ACTOR_AWESOME (55×61) and ACTOR_HOLLOW (26×33) as MISMATCHes. Same
   feature from two directions. Probe whether the jar honours
   `skinparam actorStyle awesome` / `hollow`, and record the dimensions —
   Batch 4 needs to know whether this is one fix or two.
4. **T2's open question, which blocks a Batch-4 row.** For
   USECASE_BUSINESS, does `Footprint` collect the marged block's right-hand
   padding as ink? The closed form matched to 0.01px, but our port fits REAL
   points via `footprintBoxes`, so confirm the padded box reaches the point
   set before assuming the closed form transfers.
5. **The ledger entry** (unmet acceptance criterion): record the six GAPs
   and six MISMATCHes in `plans/s1l-leaf-sizing/ledger.md` so they survive
   this mission.

### Write-set (revised)

- `planning/sizer-renderer-parity.md` (rows + Proofs only)
- `plans/s1l-leaf-sizing/ledger.md` (append)
