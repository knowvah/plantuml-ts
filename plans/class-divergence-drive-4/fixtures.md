# Fixture ledger — cdd4

Planning survey 2026-09-26 (HEAD `9a4503a2` + epsilon deletion): class
**689 / 16 / 18**, 13 accepted, **21 open**, plus 3 survey-conformant but
unpinned. **ws**: G dot-engine, P port-side, O oracle, A acceptance, H
harness. Fill `final` at each close (`conformant`, `accepted`,
`open -> <owner>`).

| slug | ws | task | verdict | mechanism (cdd3 id) | dot-engine response (TRACKER, 2026-09-26) | final |
|---|---|---|---|---|---|---|
| camuna-58-veca254 | G | T0d | diverged | gvi 19 (flat `sh0007:h->sh0009`) | FIXED dot-engine PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| nafiki-56-jixu680 | G | T0d | structural-match | gvi 19 (flat `sh0007:h->sh0009`) | FIXED dot-engine PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| coxose-20-nifu136 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| mucoti-34-seve858 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| rifuzu-80-nixo780 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| sefazi-02-defe499 | G | T0d | structural-match | gvi 19 | FIXED PR #60 (022a21b7), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| ririlu-13-zipi740 | G | T0d | structural-match | gvi 19 + B-6 Kal stall (unresolved, re-check after bump) | gvi 19 FIXED PR #60; B-6 re-measure | conformant (b2, pinned cdd4-b2; T10 pass-1 Kal re-solve) |
| pijiju-95-xexi872 | G | T0d | structural-match | gvi 22 | FIXED PR #60 (b93b67b8), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| nugecu-04-tona107 | G | T1 | structural-match | gvi 23 | dot-engine ACCEPTED (known-divergences A3 tie-break); plantuml-ts acceptance SIGNED 2026-09-26 (T1) | accepted (T1 `b105814a`; dot-engine A3) |
| givoli-70-rade072 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| nadepi-13-mufu566 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| tekena-28-fobe713 | G | T0d | structural-match | gvi 24 (C-12) | FIXED PR #60 (8c9579ea), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| delasa-80-jusu462 | G | T0d | diverged | gvi 25 (E3-12) | engine half FIXED PR #60 (5932a793); consumer half = T11 | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| cobumi-83-bapu892 | G | T0d | structural-match | gvi 26 (E3-D1) | FIXED PR #60 (52982142), unpublished | conformant (T0d, dot-engine 1.6.1), pinned cdd4-b2 |
| gujigi-63-roki030 | P | T5→T10 | structural-match | constraint-on-links stale pre-shift frame (after E3-13/14) | — | conformant (b2, pinned cdd4-b2; T10) |
| jakapi-64-tine258 | P | T5→T8 | structural-match | +3.763 px ink term unexplained (after E1-6, HashSet order) | — | conformant (b2, pinned cdd4-b2; T8) |
| lecelo-92-loma110 | P | T5→T9 | diverged | `<:label:>` in quoted classifier name: jar drops, we emit emoji | — | conformant (b2, pinned cdd4-b2; T9 + T12) |
| sokevu-87-toce485 | P | T6 | diverged | E3-9 (patch) + E3-10b `ClusterDotString#hasPort` | — | survey-conformant (b2; T6 + T6b); NOT pinned: class-only census errors ("Use allowmixing") where renderSync auto-dispatches -> census dispatch follow-on |
| mizupo-59-zala765 | P | T7a/T7b | diverged | E3-20 `!theme` from lossy summary | — | conformant (b2, pinned cdd4-b2; T7a + T7b) |
| besepi-37-rori892 | O | T2 | diverged | committed dot-cache ≠ fresh jar on couple orientation | — | open -> oracle re-pin mission (jar drift 7beta11 vs 8beta1; ours = 8beta1 exactly; journal 6-7) |
| luzive-62-zote562 | A | T1 | diverged | C-18 identity lines | — | accepted (T1 `b105814a`) |
| sadamo-18-siva346 | A | T1 | diverged | C-18 identity lines | — | accepted (T1 `b105814a`) |
| zuduxu-90-kosi876 | A | T1 | diverged | E3-A upstream NPE crash page | — | accepted (T1 `b105814a`) |
| bidusa-22-jutu505 | H | T4 | conformant (unpinned) | census lacks sprite store | — | conformant, pinned cdd4-b2 (T4 census assetStore) |
| ruliki-78-biji661 | H | T4 | conformant (unpinned) | census lacks sprite store | — | conformant, pinned cdd4-b2 (T4 census assetStore) |
| popesa-39-sobe866 | H | T4 | conformant (unpinned) | census pipeline ≠ renderSync (diffCount 7) | — | conformant, pinned cdd4-b2 (T4 census seed) |
