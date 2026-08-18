# Decision journal — state-declared-size-diagnosis

| When | Task | Decision | Why | Evidence |
|---|---|---|---|---|
| 2026-08-18 | start | Branch `docs/state-declared-size-diagnosis` created at `e544038d`; README stop 7 (`.claude/catalog.md` absent) read as a "do not create" guard, not a halt | Same clause in SI27 README stop 9 was honoured by not creating the file; file has never existed in git history | `git log --all -- .claude/catalog.md` empty |
| 2026-08-18 | T0 | Baseline pinned: two runs byte-identical, sha256 `b790fabcfcf3511d291d4bf1f0985ee98c26b0c00509983b34d0dc5b533505e0`; summary `fixtures 272, declarations 2654, exact 2481, mismatched 144, lastDigitOnly 29, unmatched 4, dirty 79` — README numbers unchanged | Exit bar 4 / gate 6 ruler | `test-results/state-declared-size-baseline.jsonl` (gitignored) |
| 2026-08-18 | T0 | Pseudo-state classifier pattern matched case-insensitively (only that pattern) | Spec regex had no flags; `<<entrypoint>>` lowercase in bitaxo-18/resido-15 would move them to `stereotype`, contradicting the preview and T4's fixture list; PlantUML stereotype names are case-insensitive | PARTITION.md == preview (63/27/4, buckets 10/10/8/7/7/6/5/3/3/4) |
| 2026-08-18 | T0 | `check-schema.py` skips the slug-completeness check when 0 records exist; also emits `findings/partition.json` (machine-readable slug sets) | T0 acceptance requires `0 records, 0 violations` on the empty dir while the gate requires 94 at close-out; both hold with this rule | negative test (empty originFileLine) exits 1 |
| 2026-08-18 | T0 | Orchestrator executed T0 directly (no subagent) | Mechanical: harness runs, generated tables, a 90-line checker; the sha must land in the journal anyway | — |
| 2026-08-18 | gate | Batch 0 gates: test 601 files/14599 pass (95.4/90.4/96.9), typecheck ✓, lint ✓, build ✓, diff has no src/tests/oracle/scripts path, schema `0 records, 0 violations` | — | — |
