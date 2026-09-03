# Decision journal — `activity-oracle-harness`

Append one row per non-trivial judgment call made during execution.
"Non-trivial" means: a reasonable developer might have chosen differently.

| Date | Task | Decision | Rationale | Flagged for review |
|---|---|---|---|---|
| 2026-09-02 | batch-0 | Serialize T0 then T1 instead of running them in parallel | Write-sets are disjoint, but a single working tree shares one git index; two concurrent agents committing race it. Prior mission (`sequence-creole` batch 3) hit exactly this. Wall-clock cost is one small task's duration. | no |
| 2026-09-02 | T0 | Halted on stop condition 1 rather than writing two baseline JSONs outside every task's write-set | Correct call by the task agent; `scripts/repin-sequence-baselines.ts:3-8` reserves baseline writes to the orchestrator. Verified the failure independently (both suites red, 373 unpinned each). | no |
| 2026-09-02 | T0b | Added task T0b (orchestrator-executed) to pin the activity tree into routing- and refusal-baseline additively; recorded as D11 | Both gates' failure text forbids narrowing the walk. Measured first: 350 ACTIVITY->NONE, 23 jar-error, 82 we-error-jar-rendered. All 350 share one cited mechanism (renderer.ts:221-226 vs TextBlockExporter.java:293) that T5 fixes. User ruled on this explicitly. | YES — expands scope into two prior missions' gates |
| 2026-09-02 | T0b | Commit T0b BEFORE T0 | Both gates walk the disk tree, which already holds the cache; pinning first keeps every commit green, whereas committing the cache first lands one red commit. | no |
