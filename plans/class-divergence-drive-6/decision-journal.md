# Decision journal: cdd6

Append one row per decision, mover, halt or batch close. Never edit past rows;
correct with a new row that cites the old one.

| # | Date | Task | Entry | Evidence |
|---|---|---|---|---|
| 1 | 2026-09-28 | T0a | Branched `feat/class-divergence-drive-6` from main `2f59882a6`, not the brief's `0f3998f57`: main gained 5 commits between planning and execution (prettier pass 36fc38e5a, dependabot 708a5bdf3, vitest node-env 2137ea2c2, CI budget 2f59882a6). Phase 8's dirty-tree flag is resolved (tree clean). Starting counts (708/3/12, 225/26/37, ratchet 930) are re-measured at T0e rather than assumed. | `git log --oneline -6`; `git status --short` = 3 untracked only |
| 2 | 2026-09-28 | T0a | Brief committed as 08455161c (`plans/` is tracked in this repo; the reference doc's "plans/ is gitignored" does not hold here). | `git ls-files plans \| wc -l` > 0 |
| 3 | 2026-09-28 | T0a | Ledger seeded: 62 rows. Per task: T2a 14, T2b 7 (3 doubtful), T2c 5 (3 doubtful), T2d 5, T2e 4, T1b 4, T1e 2, T1c 1, T1d 1 (doubtful), T3a 5 (4 doubtful), T3b 3 (all doubtful), T3c 4, T3d 2, T3e 1, T0b 2 (harness rows racujo/xicili), `open -> cdd7` 2 (lubicu, semutu: embedded-engine-unported, scope H). Doubtful rows are written `T0d → Tn` (T0d verifies, Tn fixes) rather than bare `T0d`, so the fix owner is visible from the seed. | `seed-ledger.py` asserts 62 rows and owner-map = ledger set |
| 4 | 2026-09-28 | T0a | The 14 D1 doubtful rows are the 12 the T0d spec lists plus none extra; xuloxo counts once (T1d owns; gikaju is a c4-tree secondary, not a CLASS row). `verdict (b0)`/`dotEqual` columns hold cdd5's b5 values until T0e re-measures. | T0d spec table; cdd5 fixtures.md |
