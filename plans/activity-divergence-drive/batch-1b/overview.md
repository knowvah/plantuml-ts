# Batch 1b — stop/end circles (D3)

After the b1 close. One task; it shares `activity-renderer-shapes.ts` with
T1b, which is why it is not in batch 1. Close per
[close-procedure.md](../close-procedure.md) (`b1b`); step 9 names every
cohort row's next mechanism and writes `batch-2/overview.md`'s task table.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1c](T1c-stop-end-circles.md) | `FtileCircleStop` / `FtileCircleEndCross` 1:1 | typescript-pro | `src/diagrams/activity/tiles/{gtile-stop,gtile-end}.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `src/diagrams/activity/activity-renderer-shapes.ts` (amended, journal 18/19), `tests/unit/activity/{renderer-shapes,tile-sizing}.test.ts`, `oracle/goldens/svg-activity/{diff,style}-baseline.json` | T1a, T1b | [ ] |
