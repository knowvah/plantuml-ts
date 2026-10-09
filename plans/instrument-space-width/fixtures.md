# Fixture ledger (isw)

Numbers from lgm's final measurement (main `03f155ea7`, 2026-10-08). T0a re-takes
every one at b0; the b0 column is authoritative. b1 = after the instrument
change; `final` ∈ `exact`, `moved (<mechanism>)`, `library-forced (<experiment>)`.

## Instrument

| Probe | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|
| `DeterministicMeasurer.measure(" ", 12pt)` | 0 | | | |
| `"a b"` @12: ours / new-jar `textLength` | 13.35 / 13.35 (old jar) | | | |
| sampled oracle texts with spaces measuring space = 0 | 538/538 | | | |
| production manifest changes | — | | | |

## The four lgm crash fixtures (D10)

| Fixture | Engine | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|---|
| kovaxi-11-reti348 | usecase | jar crash page (nested), excluded | | | |
| zidebi-71-nocu387 | usecase | jar crash page (nested), excluded | | | |
| runima-82-jigi009 | activity | jar crash page, excluded | | | |
| pixisi-38-kixa563 | activity | jar crash page, excluded | | | |

## Survey totals (conformant / structural-match / diverged)

| Engine | pre-b0 (lgm final) | b0 | b1 | final |
|---|---|---|---|---|
| class | 710/3/10 | | | |
| object | 63/8/9 | | | |
| state | 73/12/188 | | | |
| component | 67/65/134 | | | |
| usecase | 29/18/46 | | | |
| unknown | 365/54/406 | | | |
| activity | (b0) | | | |
| mindmap | (b0) | | | |
| sequence Σ ws | 304703 | | | |

## Reveal families (filled at T1b; one row per family, never deleted)

| Family | Diff-path signature | Fixtures | Mechanism (Java file:line) | Fix task | final |
|---|---|---|---|---|---|
