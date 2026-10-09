# Fixture ledger (isw)

Numbers from lgm's final measurement (main `03f155ea7`, 2026-10-08). T0a re-takes
every one at b0; the b0 column is authoritative. b1 = after the instrument
change; `final` ∈ `exact`, `moved (<mechanism>)`, `library-forced (<experiment>)`.

## Instrument

| Probe | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|
| `DeterministicMeasurer.measure(" ", 12pt)` | 0 | 0 | | |
| `"a b"` @12: ours / new-jar `textLength` | 13.35 / 13.35 (old jar) | 13.35 / 13.35 (old jar; @14 15.575 = "ab") | | |
| sampled oracle texts with spaces measuring space = 0 | 538/538 | 48829/48855 all cached in.svg runs with a space (0 match 44; 26 = jar float rounding, no space term) | | |
| production manifest changes | — | 4903 rows, 0 err (b0-prod.json) | | |

## The four lgm crash fixtures (D10)

| Fixture | Engine | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|---|
| kovaxi-11-reti348 | usecase | jar crash page (nested), excluded | unchanged; zidebi non-deterministic solo (3 md5s) | | |
| zidebi-71-nocu387 | usecase | jar crash page (nested), excluded | unchanged; zidebi non-deterministic solo (3 md5s) | | |
| runima-82-jigi009 | activity | jar crash page, excluded | unchanged | | |
| pixisi-38-kixa563 | activity | jar crash page, excluded | unchanged | | |

## Survey totals (conformant / structural-match / diverged)

| Engine | pre-b0 (lgm final) | b0 | b1 | final |
|---|---|---|---|---|
| class | 710/3/10 | 710/3/10 | | |
| object | 63/8/9 | 63/8/9 | | |
| state | 73/12/188 | 73/12/188 | | |
| component | 67/65/134 | 67/65/134 | | |
| usecase | 29/18/46 | 29/18/46 (+1 oracle-error) | | |
| unknown | 365/54/406 | 365/54/406 | | |
| activity | (b0) | 415/1/35 | | |
| mindmap | (b0) | 137/1/4 | | |
| sequence Σ ws | 304703 | 304703 (1128 scored, 13 refused) | | |

## Reveal families (filled at T1b; one row per family, never deleted)

| Family | Diff-path signature | Fixtures | Mechanism (Java file:line) | Fix task | final |
|---|---|---|---|---|---|
