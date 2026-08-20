# Batch 0 — Baselines (serial)

Pins the measurement origin so every later batch's `harness-diff.py` /
`manifest-diff.py` comparison has a fixed comparison point. Writes no `src/`.

**Fixes a methodology gap SI31 recorded at its own close-out.** Both baselines
live under `test-results/*`, which `.gitignore` excludes, and each batch's gate
re-pins them — so by close-out the ORIGINAL pin no longer exists and the
mission-wide delta cannot be byte-diffed, only reconstructed from a journal
chain. T0 therefore also writes a **tracked** copy.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin both baselines, add a tracked copy of the harness pin, record the target and known-mover rows | typescript-pro (sonnet) | `test-results/state-declared-size-baseline.jsonl`, `test-results/render-manifest-baseline.json`, `tests/fixtures/si32-harness-baseline.jsonl` (tracked), `.agent-notes/si32-T0.md` | — | [x] |
