# Target rows and ledger

Planning facts measured at main `bb5b660d9` (2026-10-15) with render-diff (structural/numeric).
"`<a>` diffs" = render-diff lines whose expected element is `a`. T0 re-measures the b0 column.
Text kinds and drop points: [measurements/seed/seam-map.md](measurements/seed/seam-map.md).

## Targets

| tree/slug | family | owner | planning | `<a>` diffs | b0 | b1 | b2 | b3 | b4 |
|---|---|---|---|---|---|---|---|---|---|
| component/gacida-77-joku810 | A entity | T1a→T4 | 2/0 | childCount ×2 | 2/0 (a 2) | 2/0 (a 2) |  |  |  |
| component/givape-84-xano421 | A `url of` | T1c→T4 | 1/0 | childCount | 1/0 (a 1) | 1/0 (a 1) |  |  |  |
| component/jazabe-68-bica131 | A bracket | T1b→T4 | 2/0 | childCount ×2 | 2/0 (a 2) | 2/0 (a 2) |  |  |  |
| component/tukipe-82-ziva562 | A `url for` | T1c→T4 | 1/0 | childCount | 1/0 (a 1) | 1/0 (a 1) |  |  |  |
| usecase/lizutu-99-mapa855 | A actor | T1a→T4 | 1/0 | childCount | 1/0 (a 1) | 1/0 (a 1) |  |  |  |
| usecase/sadeja-25-tina867 | A actor/usecase + tooltip | T1a→T4 | 2/0 | childCount ×2 | 2/0 (a 2) | 2/0 (a 2) |  |  |  |
| usecase/kolibo-58-rata251 | A rectangle | T1a→T4 | 1/0 | childCount | 1/0 (a 1) | 1/0 (a 1) |  |  |  |
| component/xufexu-38-fola855 | B note body | T2 | 2/0 | 2 | 2/0 (a 2) | 0/0 (a 0) |  |  |  |
| component/tuliba-37-liza126 | B note body | T2 | 2/4 | 1 | 2/4 (a 1, id 1) | 1/4 (a 0, id 1) |  |  |  |
| component/nevuzi-33-duna992 | B link label | T2 | 1/2 | 1 | 1/2 (a 1) | 0/2 (a 0) |  |  |  |
| usecase/malumi-33-safu797 | B link label | T2 | 1/0 | 1 | 1/0 (a 1) | 0/0 (a 0) |  |  |  |
| usecase/bivira-53-boja685 | B entity desc + sprite in url | T2 | 3/26 | 2 | 3/26 (a 3) | 1/28 (a 1) |  |  |  |
| usecase/vivido-49-nisu863 | B entity desc + sprites in url | T2 | 7/1 | 6 | 7/1 (a 7) | 0/25 (a 0) |  |  |  |
| unknown/gubexu-05-dufu787 | B archimate display | T2 | 1/0 | 1 | 1/0 (a 1) | 0/0 (a 0) |  |  |  |
| unknown/jajeve-56-poza115 | B archimate display | T2 | 19/177 | 1 | 19/177 (a 4, id 5) | 24/178 (a 3, id 5) |  |  |  |
| unknown/jobuje-80-mopu051 | B rectangle display + note | T2 | 4/0 | 2 | 4/0 (a 2) | 3/0 (a 0) |  |  |  |
| component/fidati-41-kofe029 | C edge @id | T3 | 88/0 | 88 `@id` | 88/0 (a 0, id 88) | 0/0 (a 0) |  |  |  |
| component/kofovu-01-niti223 | C edge @id | T3 | 88/0 | 88 `@id` | 88/0 (a 0, id 88) | 0/0 (a 0) |  |  |  |
| component/tojitu-03-ruto643 | C edge @id | T3 | 88/0 | 88 `@id` | 88/0 (a 0, id 88) | 0/0 (a 0) |  |  |  |
| tests/fixtures/description-url/* | A cluster (authored) | T5 | — | — | | | | | |

Known non-url residuals on target rows (not required by D1): tuliba `rx/ry` 2.5 vs 12.5 and note `@id`
`__note_0` vs `GMN7`; jobuje text fills `#FFF` vs `#000`; jajeve/bivira numeric deltas (measure at b0).

## Ledger (D1 clause 1: rows whose `<a>`/`@id` diffs are not 0 at T6)

| slug | mechanism (Java + port `file:line`) | owner |
|---|---|---|
