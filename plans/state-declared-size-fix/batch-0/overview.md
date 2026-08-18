# Batch 0 — Harness attribution (serial)

Run first so every later batch's rows name a real declared node (D4).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Candidate B pairing in the declared-size harness; `harness-diff.py`; pin both baselines | typescript-pro | `scripts/measure-composite-declared-size.ts`, `plans/state-declared-size-fix/scripts/harness-diff.py`, `test-results/state-declared-size-baseline.jsonl`, `test-results/render-manifest-baseline.json` (both gitignored) | — | [ ] |

Expected manifest moves: none (harness + baselines only).
