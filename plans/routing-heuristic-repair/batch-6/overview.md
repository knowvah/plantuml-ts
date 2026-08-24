# Batch 6 — re-pin, and the one fixture with no mechanism yet

Two tasks, parallel: disjoint write-sets, neither consuming the other's
output.

T8 is the first task in the mission permitted to touch a baseline (D5).
Batches 2–5 move rendered bytes across the class, description, sequence, json
and yaml engines simultaneously; re-pinning as they went would have made each
batch's regressions illegible.

T9 is the only fixture in the mission that arrives **without** a diagnosed
mechanism. It is scoped as diagnosis, and it is allowed to end in a stop.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T8 | [Re-pin the moved baselines](T8-repin-baselines.md) | typescript-pro | the affected `oracle/goldens/**/ratchet.json` and `diff-baseline.json` files, `oracle/goldens/svg-conformance/routing-baseline.json` | T6, T7 | [x] |
| T9 | [The preprocessor failure](T9-preprocessor-failure.md) | debugger | `.agent-notes/`, `plans/routing-heuristic-repair/decision-journal.md` — plus a `src/` write-set only if the diagnosis names one | T6, T7 | [x] (stopped: diagnosed, fix out of reach) |
