# Target rows and tick ledger

render-diff is structural/numeric. "plan" = measured 2026-10-16 on main `9094705aa` during planning;
T0 fills `b0`. Each task close fills the column for its own tag.

| Item | Row | plan | survey (plan) | b0 | after | Ticked |
|---|---|---|---|---|---|---|
| 34 | unknown/rubebe-45-sura795 | (error page) | conformant, errorPage | 160/63 conformant errorPage | | [x] 2026-10-16 gtc T0 |
| 32 | unknown/rufopi-30-roro642 | 2/0 | diverged | 2/0 diverged | T1 0/0 conformant | |
| 32 | component/zosuje-43-zebi775 | 17/0 | diverged | 17/0 diverged | | |
| 32 | unknown/bamami-10-lava790 | 0/0 | conformant | 0/0 conformant | | |
| 32 | unknown/bobixe-18-riza923 | 0/0 | conformant | 0/0 conformant | | |
| 32 | unknown/pugodi-27-kone040 | 0/0 | conformant | 0/0 conformant | | |
| 33 | component/xenusu-76-sabi405 | 7/2 | diverged | 7/2 diverged | | |
| 30 | class/sokevu-87-toce485 | 0/0 | conformant | 0/0 conformant | | |
| 30 | component/repoge-41-demu604 | 37/16 | diverged | 37/16 diverged | | |
| 29 | unknown/xagonu-36-sudi116 | 45/887 | diverged | 45/887 diverged | | |
| 28 | unknown/deroxu-29-gude369 | 719/1237 | diverged | 719/1237 diverged | | |
| 16 | state/pavuzo-79-zodu430 | 4/85 | diverged | 4/85 diverged | | |
| 14 | (no row: D3 criterion) | — | — | | | |

Out of scope (record only): 36 unknown/zodela-36-sica712 0/1, usecase/cimare-47-deke334 conformant.
Already `[~]`: 31 class/zuduxu-90-kosi876 (conformant, errorPage).

## Ledger
One line per tick or open residual: `<item> <date> <task> <verdict> <mechanism / next-missions anchor>`.
34 2026-10-16 T0 TICKED: rubebe conformant (errorPage; stock jar NPE `pt4` is null), dot-engine 2.4.0
32 2026-10-16 T1 rufopi conformant 0/0 (root style BackgroundColor fills containers); box open on zosuje (T2)
