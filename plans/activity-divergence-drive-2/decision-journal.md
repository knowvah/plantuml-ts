# Decision journal: add2

Append one row per decision, mover, halt or batch close. Never edit past rows;
correct with a new row that cites the old one.

| # | when | task | kind (decision / mover / halt / close) | what | mechanism (Java file:line) |
|---|---|---|---|---|---|
| 1 | 2026-10-02 | T0a | decision | b0 on `97836f3e8`: Σ 31366 over 245 baseline rows, probe + classify identical to planning (0 per-row mismatches); element census reproduces `plan-elements.json` (99 extra line+arrow ws 18820, 22 arrow, 12 line, 5 missing, 10 text, 9 mixed, 88 exact). b0-eng: 28 engines, 0 timeouts; vs the committed `parity-*.json` 26 movers, all gains (sequence errored->diverged, unknown ->conformant), 0 losses — committed files lag main, `b0-eng/` is the reference. ditaa 2 oracle-error = cached non-SVG bytes (pre-existing). Ledger: 164 cohort rows (all 67 add1 `open -> add2` rows have ws <= 150) + 38 error rows | measurement only |
| 2 | 2026-10-02 | T0b | decision | harness-parity gate `f094c3948`: 58 fixtures (20 chrome-bearing + every 8th of 312), byte-equal; bite-proof: harness chrome branch removed -> exactly the 20 chrome fixtures fail incl. cifafo-49-jazi415. ~13 s wall | D4 |
| 3 | 2026-10-02 | b0 | close | gates: npm test 1018/1018 collected = on-disk, 24842 tests 0 failed; typecheck, lint, build green. Catalog unchanged (scripts/ not catalogued) | — |
