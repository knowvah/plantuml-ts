# Fixture ledger — cdd4

Planning survey 2026-09-26 (HEAD `9a4503a2` + epsilon deletion): class
**689 / 16 / 18**, 13 accepted, **21 open**, plus 3 survey-conformant but
unpinned. **ws**: G dot-engine, P port-side, O oracle, A acceptance, H
harness. Fill `final` at each close (`conformant`, `accepted`,
`open -> <owner>`).

| slug | ws | task | verdict | mechanism (cdd3 id) | dot-engine response (TRACKER, 2026-09-26) | final |
|---|---|---|---|---|---|---|
| camuna-58-veca254 | G | T0d | diverged | gvi 19 (flat `sh0007:h->sh0009`) | FIXED dot-engine PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| nafiki-56-jixu680 | G | T0d | structural-match | gvi 19 (flat `sh0007:h->sh0009`) | FIXED dot-engine PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| coxose-20-nifu136 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| mucoti-34-seve858 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| rifuzu-80-nixo780 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| sefazi-02-defe499 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1) |
| ririlu-13-zipi740 | G | T0d | structural-match | gvi 19 + B-6 Kal stall (unresolved, re-check after bump) | gvi 19 FIXED PR #60; B-6 re-measure | open -> diagnosis (T0d: gvi 19 raw layout now matches; residual = B-6 Kal stall, plantuml-ts) |
| pijiju-95-xexi872 | G | T0d | structural-match | gvi 22 | FIXED PR #60 (b93b67b8), unpublished | conformant (T0d, dot-engine 1.6.1) |
| nugecu-04-tona107 | G | T1 | structural-match | gvi 23 | dot-engine ACCEPTED (known-divergences A3 tie-break); plantuml-ts acceptance SIGNED 2026-09-26 (T1) | |
| givoli-70-rade072 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1) |
| nadepi-13-mufu566 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1) |
| tekena-28-fobe713 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1) |
| delasa-80-jusu462 | G | T0d | diverged | gvi 25 (E3-12) | engine half FIXED PR #60 (5932a793); consumer half = T11 | conformant (T0d, dot-engine 1.6.1) |
| cobumi-83-bapu892 | G | T0d | structural-match | gvi 26 (E3-D1) | FIXED PR #60 (52982142), unpublished | conformant (T0d, dot-engine 1.6.1) |
| gujigi-63-roki030 | P | T5→T10 | structural-match | constraint-on-links stale pre-shift frame (after E3-13/14) | — | |
| jakapi-64-tine258 | P | T5→T8 | structural-match | +3.763 px ink term unexplained (after E1-6, HashSet order) | — | |
| lecelo-92-loma110 | P | T5→T9 | diverged | `<:label:>` in quoted classifier name: jar drops, we emit emoji | — | |
| sokevu-87-toce485 | P | T6 | diverged | E3-9 (patch) + E3-10b `ClusterDotString#hasPort` | — | |
| mizupo-59-zala765 | P | T7a/T7b | diverged | E3-20 `!theme` from lossy summary | — | |
| besepi-37-rori892 | O | T2 | diverged | committed dot-cache ≠ fresh jar on couple orientation | — | |
| luzive-62-zote562 | A | T1 | diverged | C-18 identity lines | — | |
| sadamo-18-siva346 | A | T1 | diverged | C-18 identity lines | — | |
| zuduxu-90-kosi876 | A | T1 | diverged | E3-A upstream NPE crash page | — | |
| bidusa-22-jutu505 | H | T4 | conformant (unpinned) | census lacks sprite store | — | |
| ruliki-78-biji661 | H | T4 | conformant (unpinned) | census lacks sprite store | — | |
| popesa-39-sobe866 | H | T4 | conformant (unpinned) | census pipeline ≠ renderSync (diffCount 7) | — | |
