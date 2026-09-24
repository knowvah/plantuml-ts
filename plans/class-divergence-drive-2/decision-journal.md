# Decision journal — `class-divergence-drive-2`

Append-only. One row per decision, riser, flip, regroup, stop, or
push-forward call.

| # | When | Task | Decision / finding | Why / evidence |
|---|---|---|---|---|
| 1 | 2026-09-24 | T0 | Branch `feat/class-divergence-drive-2` cut from `origin/main` = `18a8e0c50`; four gates green (807/807 test files collected, 22509 pass, 0 fail) | Baseline must be green (T0 step 2); JSON reporter files 807 = `find tests -name '*.test.ts'` 807 |
| 2 | 2026-09-24 | T0 | `b0.json` = 560/86/77, **0 movers** vs `b-plan.json` (pin-diff: 0 transitions; per-row S/N/verdict identical on all 723) | `506fdb4e6` (applySeededDefIds url(#) scan) and `18a8e0c50` (measurer probe-once) changed no class output; no def-id mover |
| 3 | 2026-09-24 | T0 | Oracle record (D5): `oracle/dist/plantuml-oracle.jar -> ~/git/plantuml/build/libs/plantuml-1.2026.8beta1.jar`, MANIFEST `Implementation-Version: 1.2026.8beta1`; `oracle/pin.json` `plantumlVersion: 1.2026.7beta11` (upstreamSha 11ed6720) | Symlink ≠ pin is the known maintainer step (next-missions "Oracle pin (D12)"); not touched (stop 9) |
