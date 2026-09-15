# Batch 0 — measurement tooling, in parallel

Disjoint write-sets; run in separate worktrees
(`.agent-notes/batch-parallelism-needs-worktrees.md`). Neither task moves a
fixture: aggregate **52954** exactly, all four gates green.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0a | Commit the activity oracle probe | typescript-pro | `scripts/activity-probe.ts`, its unit test | — | [x] |
| T0b | Commit the activity baseline re-pin tool | typescript-pro | `scripts/repin-activity-baselines.ts`, its unit test | — | [x] |

Specs: [`T0a-activity-probe.md`](T0a-activity-probe.md),
[`T0b-repin-activity-baselines.md`](T0b-repin-activity-baselines.md).

## The probe

After T0a lands, the orchestrator measures between every task with:

```
npx tsx scripts/activity-probe.ts --slugs-file plans/activity-lane-capture/fixtures.md --json <out>
npx tsx scripts/activity-probe.ts --dump <slug>     # ours vs jar shapes, with lane index
npx tsx scripts/activity-probe.ts --lanes <slug>    # compound-shape lanes, ours vs jar
```

Compare each task's `--json` against `plans/activity-lane-capture/
measurements/base.json` (written by T1), not against the pins — the pins go
stale on purpose between T3 and T8.
