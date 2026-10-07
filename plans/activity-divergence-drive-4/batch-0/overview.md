# Batch 0 — branch, b0, capture the 80, census

T0a -> T0b (orchestrator, serial) -> T0c ∥ T0d (read-only, one output file each).
Close: four gates; `chore(add4-b0): branch, b0, 80 captured, census`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline.md) | branch, brief commit, b0 (all engines), ledger | orchestrator | `plans/activity-divergence-drive-4/**` | — | [x] |
| [T0b](T0b-capture.md) | capture the 80, routing/refusal + baseline pins, promote, pin zero rows | orchestrator | `test-results/dot-cache/activity/<80>/**`, routing/refusal + 4 activity baselines, count tests, `parity-activity.json`, `docs/parity-report.md`, golden dirs | T0a | [ ] |
| [T0c](T0c-census.md) | census rows ws <= 100 + spot-letter list | general-purpose | `measurements/census-a.md` | T0b | [ ] |
| [T0d](T0c-census.md) | census rows ws > 100 | general-purpose | `measurements/census-b.md` | T0b | [ ] |
