# Batch 0 — Baselines + allow-list (serial)

Pins the two gitignored baselines at the branch point and records the 14
target rows, so every later batch's `harness-diff.py` / `manifest-diff.py`
comparison has a fixed origin. Writes no `src/`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin both baselines, record sha256 and the 14 target rows, seed `expected-moves.txt` | typescript-pro (sonnet) | `plans/state-residual-fix-batch/expected-moves.txt`, `test-results/state-declared-size-baseline.jsonl`, `test-results/render-manifest-baseline.json`, `.agent-notes/si31-T0.md` | — | [x] |
