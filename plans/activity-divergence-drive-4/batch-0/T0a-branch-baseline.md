# T0a — branch, b0, ledger (orchestrator)

1. `git checkout -b feat/activity-divergence-drive-4 main` (main = `1651cf200`); commit the brief.
2. b0: probe/classify/elements into `measurements/b0*.json` (expect Σ 4413 over 48);
   `measurements/survey-all.sh measurements/b0-eng` (28 engines, 0 FAIL).
3. `fixtures.md`: one row per old baseline row; carry add3's `final` mechanism text into
   `mechanism` (`plans/activity-divergence-drive-3/fixtures.md`). Journal row 1.

Acceptance: Given main at `1651cf200`, when probed, then Σ 4413 over 48 is in `b0.json`;
given the survey, then `b0-eng/` holds 28 engines, 0 FAIL.
Observability: N/A (measurement). Rollback: Reversible.
