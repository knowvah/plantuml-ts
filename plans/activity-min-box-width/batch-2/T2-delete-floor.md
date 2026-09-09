# T2 — Delete the width floor

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Read [`../README.md`](../README.md) and [`../decisions.md#d1`](../decisions.md).
`tiles/gtile-action.ts:9-16` documents `ACTION_MIN_WIDTH = 120` as
unsourced and deliberately left by `activity-style-defaults` T4 (D8 there
was the HEIGHT). Upstream floors the width at `PName.MinimumWidth` only
(`FtileBox.java:237-243`), unset = 0. The live sizer is
`src/diagrams/activity/tiles/`; `layout.old.ts` and `activity-layout-*.ts`
are a superseded engine — stop condition 5.

## Read-set

- `src/diagrams/activity/tiles/gtile-action.ts` (whole)
- `src/diagrams/activity/activity-style-defaults.ts` — `activityMinimumWidth` (T1)
- `tests/unit/activity/activity-box-derivation.test.ts`, `tile-sizing.test.ts`;
  `rg -n '120' tests/unit/activity tests/diagrams/activity` for pins of the floor
- `tests/oracle/svg-conformance/compare.ts:380-420` — how `childCount` is
  charged (the sum of both sides when counts differ; NOT monotone — see
  `.agent-notes/asd-T7.md` and the `weightedscore-can-rise-on-a-correct-fix`
  finding in `plans/activity-style-defaults/`)
- `test-results/dot-cache/activity/{simuti-16-lece058,xenofo-81-rame803}/in.{puml,svg}`
- Java: `FtileBox.java:237-243`; for the diagnosis, the fork/split tiles
  `src/diagrams/activity/tiles/gtile-fork.ts`, `gtile-split.ts` and upstream
  `vcompact/ParallelBuilderSplit.java` / `FtileFactoryDelegatorCreateParallel*.java`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

1. Tests first: `:3;` sizes to text + 2·Padding (26.675 under
   `DeterministicMeasurer`, the jar's `cizixu-00-koro700`); a theme with
   `minClassWidth 200` sizes to 200.
2. `this.width = Math.max(maxWidth + 2 * pad, activityMinimumWidth(theme))`;
   delete the constant and its doc comment; cite `FtileBox.java:237-243`.
3. Run the aggregate probe. For EACH riser, instrument (per-family diff
   before/after, then the actual elements that pair differently) until the
   mechanism is stated in the journal: what changed in OUR element list, or
   in the positional pairing, when the boxes narrowed. Do not commit before.
4. Update pre-existing tests that pin the 120 floor, each with the citation.

## Acceptance criteria

- Given `:3;`, when laid out, then the tile is 26.675 wide, not 120
- Given `skinparam minClassWidth 200`, then the tile is 200 wide
- Given a label wider than any floor, then the width is unchanged from before
- Given the probe, then the aggregate falls (expected ≈ 47638) and the two
  risers carry a diagnosed mechanism in the journal before the commit
- Given the no-swimlane path, then `canvas-bounds.test.ts` stays green

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green EXCEPT the expected red in the three/four activity
oracle equality/ratchet gates, listed with counts; no other file red.

## Commit

`fix(amb-T2): size the action box to its text, not a 120px floor`
