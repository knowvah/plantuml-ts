# Decision journal (isw)

| # | Date | Task | Decision / finding | Evidence |
|---|---|---|---|---|
| 1 | 2026-10-09 | T0a | Branch `feat/instrument-space-width` off main 65ca21fa8 (brief commit). Instrument probe re-taken: `DeterministicMeasurer.measure(" ",12)`=0; `"a b"`@14 ours 15.575 = old-jar textLength 15.575 = `"ab"` (space zero on both sides, confirmed). | probe /private/tmp/claude-501/isw-orch |
| 2 | 2026-10-09 | T0b | Merged 81b53cb0d. Acceptance "zidebi solo == tool" is unsatisfiable on the current jar: zidebi-71 (a lgm crash fixture) renders 3 distinct md5s on 3 solo runs (canvas 865/911/878) — random-icon crash page, oracle-svg-seam.md. Substituted proof: 5/5 svg-dot SAME (incl. cluster-basic), 3 `{{ }}` activity fixtures SAME, 11/11 other kinds SAME. The 4 crash fixtures are excluded from every equality gate until b1. Manifest = 8374 targets (dot-cache 4903, svg-golden 1703, dot-golden 1211, fixture-svg 557). Merge ran with untracked orchestrator measurement files (b0-eng/, b0-pins/, production-manifest.mts) in the checkout — T0a in-progress outputs, not a dirty tracked tree; stop 15 not triggered. | isw-T0b.md |
