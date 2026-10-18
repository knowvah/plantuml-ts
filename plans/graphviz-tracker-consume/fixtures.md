# Target rows and tick ledger

render-diff is structural/numeric. "plan" = measured 2026-10-16 on main `9094705aa` during planning;
T0 fills `b0`. Each task close fills the column for its own tag.

| Item | Row | plan | survey (plan) | b0 | after | Ticked |
|---|---|---|---|---|---|---|
| 34 | unknown/rubebe-45-sura795 | (error page) | conformant, errorPage | 160/63 conformant errorPage | | [x] 2026-10-16 gtc T0 |
| 32 | unknown/rufopi-30-roro642 | 2/0 | diverged | 2/0 diverged | T1 0/0 conformant | [x] 2026-10-18 gtc T2b |
| 32 | component/zosuje-43-zebi775 | 17/0 | diverged | 17/0 diverged | T2b 0/0 conformant | [x] 2026-10-18 gtc T2b |
| 32 | unknown/bamami-10-lava790 | 0/0 | conformant | 0/0 conformant | | [x] 2026-10-18 gtc T2b |
| 32 | unknown/bobixe-18-riza923 | 0/0 | conformant | 0/0 conformant | | [x] 2026-10-18 gtc T2b |
| 32 | unknown/pugodi-27-kone040 | 0/0 | conformant | 0/0 conformant | | [x] 2026-10-18 gtc T2b |
| 33 | component/xenusu-76-sabi405 | 7/2 | diverged | 7/2 diverged | T3b 0/0 conformant | [x] 2026-10-18 gtc T3b |
| 30 | class/sokevu-87-toce485 | 0/0 | conformant | 0/0 conformant | T4 0/0 conformant | [x] 2026-10-18 gtc T4 |
| 30 | component/repoge-41-demu604 | 37/16 | diverged | 37/16 diverged | T4 0/0 conformant | [x] 2026-10-18 gtc T4 |
| 29 | unknown/xagonu-36-sudi116 | 45/887 | diverged | 45/887 diverged | T5a 30/170 diverged | |
| 28 | unknown/deroxu-29-gude369 | 719/1237 | diverged | 719/1237 diverged | T2b 687/1237 diverged | |
| 16 | state/pavuzo-79-zodu430 | 4/85 | diverged | 4/85 diverged | S 0/0 conformant | [x] 2026-10-16 gtc S |
| 14 | (no row: D3 criterion) | — | — | | T8 byte-identical, 0 losses | [x] 2026-10-16 gtc S |

Out of scope (record only): 36 unknown/zodela-36-sica712 0/1, usecase/cimare-47-deke334 conformant.
Already `[~]`: 31 class/zuduxu-90-kosi876 (conformant, errorPage).

## Ledger
One line per tick or open residual: `<item> <date> <task> <verdict> <mechanism / next-missions anchor>`.
34 2026-10-16 T0 TICKED: rubebe conformant (errorPage; stock jar NPE `pt4` is null), dot-engine 2.4.0
32 2026-10-16 T1 rufopi conformant 0/0 (root style BackgroundColor fills containers); box open on zosuje (T2)
32 2026-10-16 T2 zosuje 13/0 open: font-style + link colour originate in src/core (stop 1, awaiting ruling)
16 2026-10-16 S TICKED: pavuzo conformant 0/0 (T7a textLength, T7b label-box ink fold)
14 2026-10-16 S TICKED (D3): title Y from clusters[].label; 0 losses, 0 state census rows away
32 2026-10-18 T2b TICKED: rufopi, zosuje, bamami, bobixe, pugodi conformant 0/0
33 2026-10-18 T3 xenusu 0/2: strokes fixed; svg width +1 from missing label UEmpty in SvekEdge.ts (T3b, user-allowed)
33 2026-10-18 T3b TICKED: xenusu conformant 0/0
30 2026-10-18 T4 TICKED: repoge + sokevu conformant 0/0
29 2026-10-18 T5a xagonu 30/170: label split fixed; alignment (T5a2) and edge order (T5b) open
