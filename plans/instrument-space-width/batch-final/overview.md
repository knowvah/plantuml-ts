# Final batch — exit and close-out (orchestrator)

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T-exit | final survey (`final-eng`), sequence scores, elements b0→final, production manifest b0→final, verify each D10 clause with evidence in README Status, fill `final` columns | `measurements/final*`, `fixtures.md`, README | owed.json empty | [x] |
| T-close-out | DIVERGENCES.md: retire "Deterministic-text oracle crashes on a lone space"; refresh any `accepted-divergences.json` entry whose numbers were measured with space = 0; ADR-001 addendum (the instrument deviates from the verbatim table for U+0020, D1–D4); update memories (instrument-space-width-zero → done; status memory); `planning/next-missions.md` isw section; four gates; merge commit to main | `DIVERGENCES.md`, `oracle/accepted-divergences.json`, `planning/adr/ADR-001-text-measurement.md`, `planning/next-missions.md`, memory | T-exit | [x] |

Never push; the user pushes.
