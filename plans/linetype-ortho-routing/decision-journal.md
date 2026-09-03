# Decision journal — `linetype-ortho-routing`

Append one row per non-trivial judgment call made during execution.
"Non-trivial" means: a reasonable developer might have chosen differently.

Two lessons from the previous mission's journal are worth reading first.
(1) A task agent refused an orchestrator instruction twice and was right both
times — brief the measurement, not the conclusion, and say "report if you
disagree". (2) That mission's incremental re-pin scripts only wrote fixtures
whose score ROSE, leaving most pins stale between commits; T8 re-pins
unconditionally for exactly that reason.

| Date | Task | Decision | Rationale | Flagged for review |
|---|---|---|---|---|
| 2026-09-03 | T0 | Pin `bbW`/`bbH` as `layoutGraph()` canvas size, and add a `passes[]` array beyond the flat contract | The contract named one scalar pair per fixture, but the two state fixtures run two layout passes each and ortho routing moves both. A single scalar would have hidden a per-pass regression — the exact aggregate-blindness T0 exists to prevent. Contract extended additively, so T8 still reads `bbW`/`bbH`. | no |
| 2026-09-03 | T0 | Pin `kejabo-83-vinu490`'s composite declared-size delta (`+0.749952 px`) too, though the brief asked only for `pavuzo`'s | It is the other state fixture and the only other one with a `size-backlog` entry, so T8 needs a before-value for it. Its sign is OPPOSITE pavuzo's and it is the polyline fixture; there is no prediction on record for it. Pinned as an instrument, explicitly NOT as a target. | no |
