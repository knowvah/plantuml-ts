# Fixtures, families and ledger

Planning facts were measured at main `306a81151` on 2026-10-15. T0 re-measures them at b0.
- Census per-fixture: `measurements/seed/perfix-306a81151.txt`
- Family classification of the 68 rows at 1–10 diffs: `measurements/seed/families-1to10.txt`,
  from `seed/rd/` via `measurements/classify.mjs`

## Census baseline (component, DeterministicMeasurer)

| bucket | 0 | 1–3 | 4–10 | 11–30 | 31+ | error | Σ diffs |
|---|---|---|---|---|---|---|---|
| planning | 61 | 30 | 38 | 46 | 90 | 1 (gutute-00-gaki684) | 21058 |
| b0 (a80812e21) | 61 | 30 | 38 | 46 | 90 | 1 (gutute-00-gaki684) | 21058 |
| b0n (renderSync instrument, a80812e21) | 68 | 30 | 35 | 46 | 87 | 0 | 21319 |
| b5 (5b4b5c731) | 179 | 22 | 28 | 22 | 15 | 0 | 2201 |
| D1 target | — | all pinned or ledgered | — | — | — | — | ≤ 12635 (60% of b0) / ≤ 12791 (60% of b0n) |

**Instrument note for T0.** gevaje-94-sajo802, kokebo-27-vafi688 and tusugu-95-geju398 render-diff
at 0/0, yet the census counts them at 1 or more. The two tools take different paths. Name the path
before triaging these rows ([[measurement-artifacts-outnumber-defects]]).

## The 30 rows at 1–3 diffs (D1 clause 2). Owner = task that must pin or ledger it

| slug (component/) | diffs | family | owner |
|---|---|---|---|
| butebe-90-dozo380, gafico-37-cuma657, gevaje-94-sajo802, tusugu-95-geju398 | 1 | text-xy | T6→T7 |
| buduco-56-jeke005, cigite-14-kane677, fimoxe-74-sobi956, fodena-72-sule202, keniji-18-tupu819, luniju-97-tuja870, nedapu-57-dife142, pegali-65-rotu416, tajadu-40-juro990 | 2 | text-xy | T6→T7 |
| cukafa-49-fona812, kagapo-72-cofe085, lobute-63-tizi096, somugi-21-doli483, suzemi-86-kuma659 | 1 | colour | T1c |
| gocexi-61-biso565 (2), rapaji-98-xato067 (3) | 2–3 | colour | T1c |
| cuxelu-66-zopu195, gacida-77-joku810, jazabe-68-bica131 (2), givape-84-xano421 (1) | 1–2 | childCount | T3 |
| dugovi-24-kupu658, nevuzi-33-duna992 | 3 | canvas (+childCount) | T4 |
| fuzula-86-temo881, rimiku-31-cigo272, xadinu-90-vasu322 | 2 | stroke-width/rx-ry | T10 |
| sugaca-11-boma467 | 3 | mixed (background, childCount) | T3 |

## Families on the rows at 4–10 diffs (re-ranked at every close)

| family | rows (component/) | owner |
|---|---|---|
| canvas | basetu, cenoja, cumofi, dozudi, figika, fogexa, gogosu, kezodo, kuciku, mavicu, radiga, rekisu, revusu, sobobi, sodoza, vimulo, zodare | T4 |
| text-xy | babafi, bitexe | T6→T7 |
| colour | diduxa, gafegu, kucabo, lovapo, malado, zozutu | T1c |
| childCount | gekato, lakuti, tijexo | T3 |
| stroke-width/rx-ry | nufofe, reroca | T10 |
| mixed | cojege, fopako, nujito, romuco, style-stereotype-on-arrow-1, zonobi, kokebo (0/0 rd) | re-slot at b1 |

## Named fixtures (render-diff structural/numeric; L= layout-equal)

| tree/slug | owner | jar fact / known mechanism | b0 | b1 | b2 | b3 | b4 | b5 |
|---|---|---|---|---|---|---|---|---|
| unknown/bamami-10-lava790 | T1b/T2 | drawn package box = cluster6 bb 16.07..97.07 (81 tall); ours draws 62 | 0/88 L= | 0/88 | (b5) | (b5) | (b5) | 0/0 |
| component/zosuje-43-zebi775 | T1b/T2 | layout-equal, drawing-side only (dsw row 18) | 20/180 L= | 20/180 | (b5) | (b5) | (b5) | 17/0 |
| unknown/deroxu-29-gude369 | T4 | `skinparam dpi 60` scale, missing title; layout-equal since dsw T9 | 743/2505 L= | 743/2505 | (b5) | (b5) | (b5) | 719/1237 |
| component/fojamu-08-veku866 | T5 | kermor: note drawn at (6,6), 272×36 (`Cluster.java:302-307`) | 2/22 | 2/22 | (b5) | (b5) | (b5) | 0/0 |
| component/zubujo-87-xaxa087 | T5 | kermor | 2/15 (17 census) | 2/15 | (b5) | (b5) | (b5) | 0/0 |
| component/siseda-71-napu395 | T5 | kermor | 20/168 | 20/168 | (b5) | (b5) | (b5) | 0/0 |
| unknown/gerebe-26-neli152 | T8 | `foo1.foo2`: one jar cluster, two of ours | 3/44 | 3/44 | (b5) | (b5) | (b5) | 0/0 |
| unknown/jafexe-59-muzo362 | T8 | same as gerebe | 35/57 | 35/57 | (b5) | (b5) | (b5) | 0/0 |
| unknown/xagonu-36-sudi116 | T9 | jar self-loop xlabel TABLEs `sh0050->sh0050` 139×38, `zaent0019->zaent0019` 142×25 (dsw row 20, suspected) | 191/586 L≠ bb | 191/586 | (b5) | (b5) | (b5) | 45/887 |
| unknown/golamo-46-lume529 | T7 | per-stereotype StereotypeFontSize in the title table | 13/21 | 11/21 | (b5) | (b5) | (b5) | 7/0 |
| unknown/juvose-99-mopu040 | T1b/T2 | `skinparam packagestyle node`; `src/core/theme.ts:169` `packageStyle?: 'rect'` only | 58/294 | 58/294 | (b5) | (b5) | (b5) | 0/0 |
| unknown/rebena-98-kiba723, vuvave-27-saki879, xipane-40-dune740 | T7 | title creole (shared `buildTextBlock`) | 4/17, 3/17, 24/24 | 4/17, 3/17, 24/24 | (b5) | (b5) | (b5) | 0/0, 0/0, 0/0 |
| component/xenusu-76-sabi405 | — (control) | layout-equal, 7/8 post-layout; must not regress | 7/8 L= | 7/8 | (b5) | (b5) | (b5) | 7/2 |

T0 fills the b0 column wherever it is blank. The per-batch columns are filled by the close procedure, step 7.

## Accepted-divergence / unpinnable ledger (D1 clause 2, D4)

| slug | reason it cannot be pinned (mechanism) | task |
|---|---|---|
| component/givape-84-xano421 | b5 1 diff (`g[2]` childCount jar 1 vs ours 5): entity `[[url]]` — the jar wraps the entity's shapes in one `<a>` inside the entity group (`EntityImageDescription.java:139` `entity.getUrl99()`, `:305` `ug.startUrl(url)`, `:328` `ug.closeUrl()`); core `EntityImageDescription.ts:413-419` already supports `entity.url`, but the description parser strips the token (`stripUrl`) and `buildEntityParams` passes `url: null`. Needs parser → `DescriptiveNode.url` → `DescriptionNodeGeo.url` (layout-helpers-types.ts) → `buildEntityParams`. | T3 R2 → next-missions |
| component/gacida-77-joku810 | b5 2 diffs (two entity groups, childCount 1 vs 5): same entity `[[url]]` mechanism as givape. | T3 R2 → next-missions |
| component/jazabe-68-bica131 | b5 2 diffs (childCount 1 vs 6 and 1 vs 3): same entity `[[url]]` mechanism as givape (`url of X is [[..]]` form, `CommandUrl.java:93-100`, also unwired). | T3 R2 → next-missions |
| component/nevuzi-33-duna992 | b5 3 diffs (`g[3]/text[1]` jar `<a>` vs ours `text`; canvas width 193 vs 192): link label `[[http://www.google.com]]` — the jar builds the label through creole with a url atom (`<a>` wrapper, link text width 131.4); ours has no url atom in the label block (T7a residual 2, "label atoms"), so the label is plain text and the ink width differs by 1 px. | T7a R2 → next-missions |
