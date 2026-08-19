# Decision journal — creole-exposant-port

| When | Task | Decision | Why | Evidence |
|---|---|---|---|---|
| 2026-08-18 | start | Execution plan: branch `feat/creole-exposant-port` off main `c7ede890`; batches serial 0→1→(2: T2‖T3)→(3: T4‖T5)→4; routing per D7 (T1/T3 Opus general-purpose, rest typescript-pro); orchestrator commits by pathspec | brief §Batches, D7 | README.md |
| 2026-08-18 | start | Pre-existing untracked `test-results/dot-cache/component/kofovu-01-niti223/` left in place, not part of any write-set; T0 pins baselines with it present | not ours to touch; both baselines are re-pinned by T0 anyway | `git status` at start |
| 2026-08-18 | T0 | Slugs `exposant-01-class`, `exposant-02-usecase`, `exposant-03-state`; usecase dot-cache lives under `test-results/dot-cache/usecase/` (corpus convention per `oracle/README.md`), goldens under `oracle/goldens/description/` | push-forward: slug names / dot-cache type dir follows corpus shape | T0 report |
| 2026-08-18 | T0 | Backlog pins tighten-only: class 2.246875, description 0.041667, state 1.097223 (dated SI30) | literal `<sup>` text today | `oracle/goldens/*/size-backlog.json` |
| 2026-08-18 | T0 | Baselines pinned: harness 273/2660/2558/65/37/0/44 (sha256 17d82672…), manifest 2017 fixtures (sha256 5cc74d15…) | +1 fixture/+3 mismatched = exposant-03-state rows | T0 report |
| 2026-08-18 | gate-0 | Batch 0 gates: npm test 55.9 s (1437 oracle tests green, cov 95.4/90.3/96.9), typecheck/lint/build green, harness-diff OK 0/0, manifest-diff OK 0/0 | — | this session |
