# Batch 1 — build the measuring instrument first

One task, and nothing else may start until it lands. Every later batch is
judged by the number this task produces; without it a reorder that fixes 70
fixtures and breaks 5 is indistinguishable from one that fixes 65.

Nothing in this batch changes any rendered byte — it adds a test and a
baseline. `render-manifest` must be unmoved at the end of it.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T1 | [Routing-conformance gate](T1-routing-conformance-gate.md) | typescript-pro | `tests/oracle/svg-conformance/routing-conformance.test.ts`, `oracle/goldens/svg-conformance/routing-baseline.json` | — | [x] |

## Result — 2026-08-23

Landed as `ef62ef74`. The gate covers **3158 fixtures** across both trees
(2674 `test-results/dot-cache`, 484 `oracle/goldens/svg-*`) and pins
**79 known-misroute · 3079 agree**, measured at `0315454c`.

`render-manifest` is unmoved: no `src/` file changed, so no rendered byte
did. Suite wall-clock 60.54 s -> 60.94 s (+0.4 s); the gate's own 15,492 ms
is absorbed by the 12-way worker parallelism.

**79, not 86** — the brief's 86 reproduces exactly, bucket for bucket, and is
the dot-cache tree rendered with *no* include store. See D7 in
[../decision-journal.md](../decision-journal.md); confirmed by the maintainer
before the baseline was pinned.

| jar says | we route to | n |
|---|---|---|
| SEQUENCE | DESCRIPTION | 34 |
| SEQUENCE | CLASS | 12 |
| SEQUENCE | JSON | 12 |
| SEQUENCE | NONE | 10 |
| NONE | CLASS | 4 |
| CLASS | DESCRIPTION | 2 |
| CLASS | YAML | 2 |
| SEQUENCE | YAML | 2 |
| CLASS | SEQUENCE | 1 |
