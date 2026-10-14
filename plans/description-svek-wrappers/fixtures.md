# Named fixtures

Every row routes DESCRIPTION in both jar and ours (`oracle/goldens/svg-conformance/routing-baseline.json`),
except the controls marked otherwise. Jar facts are measured from `test-results/dot-cache/<tree>/<slug>/svek-1.dot`
and `.agent-notes/dot-engine-2.4.0-bump.md` (2026-10-14).

| tree/slug | tracker | jar DOT fact | our gap (2026-10-14) | b0 | b2 | b3 | b4 | b5 |
|---|---|---|---|---|---|---|---|---|
| unknown/bamami-10-lava790 | 32, 35 | `cluster6p0 > cluster6` (TABLE 17×23) `> cluster6p1`; 4 parallel flat edges | 1 plain-text cluster; bb 145×90.57 vs 177×113.07; 0/100 | 0/100 | 0/88 L= | | | |
| unknown/bobixe-18-riza923 | 32 | wrapper family as bamami | 0/100 | 0/100 | 0/88 L= | | | |
| unknown/pugodi-27-kone040 | 32 | wrapper family as bamami | 0/100 | 0/100 | 0/88 L= | | | |
| unknown/rufopi-30-roro642 | 32 | wrapper family as bamami | 5/103 | 5/103 | 5/91 L= | | | |
| component/zosuje-43-zebi775 | 32 | wrapper family as bamami | 20/180 | 20/180 | 20/180 L= | | | |
| component/repoge-41-demu604 | 30 | port + wrapper | not moved by 2.4.0 | 36/20 | 36/20 L≠ clusterTree | | | |
| class/sokevu-87-toce485 | 30 | port; DESCRIPTION | not moved by 2.4.0 | 0/0 (pass) | 0/0 L= | | | |
| unknown/xagonu-36-sudi116 | 29 | 43 clusters (package wrappers) | 13 clusters; 192/594 | 192/594 | 191/586 L≠ clusterTree (bb) | | | |
| unknown/deroxu-29-gude369 | 28 | 38 clusters; plaintext TABLE port nodes | same 38 clusters; bb width 4958 vs 3757; 7/246 edge pos; 879/2500 | 879/2500 | 879/2500 L≠ clusterTree | | | |

## Controls (layout already equals native; expected layoutParity `equal` at b0)

| tree/slug | engine | note |
|---|---|---|
| component/xenusu-76-sabi405 | description | 7/8 post-layout (follow-on 4) |
| state/pavuzo-79-zodu430 | state | 4/85 (follow-on 4); brief said `class/`, cache tree is `state` (journal 3) |
| unknown/rubebe-45-sura795 | ours CLASS, jar errored | 160/63; jar-error row (follow-on 4) |
| class/zuduxu-90-kosi876 | ours CLASS, jar errored | 127/52; jar-error row (follow-on 4) |

A control that is NOT layout-equal at T1a is a gate defect (instrument first,
[[measurement-artifacts-outnumber-defects]]) before it is a finding.

## Population (b0 facts)

Jar DOT containing `subgraph cluster<N>p0`: component 85 (0 pinned), usecase 18 (0 pinned),
unknown 169, c4 4. None of the 51 `oracle/goldens/svg-description/ratchet.json` pins has one.
Kermor fixtures in the cache: 3.
