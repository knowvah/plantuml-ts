# T2 — diagnose E numeric-only, part B + prior canvas items

**Agent:** debugger (opus — diagnose-first) · **Depends on:** T0 ·
parallel with the other T1–T5. Prompt = [`diagnosis-task.md`](../diagnosis-task.md)
+ this file. Writes ONLY `diagnosis/E2.md` (+ gitignored scratch).

## Fixtures (12, from `fixtures.md`, S/N at b-plan)

| slug | verdict | S | N | prior (lead) |
|---|---|---|---|---|
| cukaze-78-zija070 | structural-match | 0 | 109 | whole-document 0.87 px shift, untraced |
| foxata-81-miva542 | structural-match | 0 | 2 |  |
| jevuvi-65-dipo437 | structural-match | 0 | 29 |  |
| joguva-54-tevo966 | structural-match | 0 | 2 |  |
| ledepo-11-muto607 | structural-match | 0 | 2 |  |
| mefike-75-vova900 | structural-match | 0 | 3 |  |
| nagega-30-poso418 | structural-match | 0 | 114 | S-4 closed its structural; numerics pre-existing |
| nugecu-04-tona107 | structural-match | 0 | 23 |  |
| pijiju-95-xexi872 | structural-match | 0 | 19 | `Neighborhood` triangle/stub contact points, sub-1.5 px |
| pixexi-81-sete111 | structural-match | 0 | 58 | +5.389 canvas shift, zero edges (label-margin term disproved) |
| tijira-61-fere730 | structural-match | 0 | 2 |  |
| zuramo-86-liku129 | structural-match | 0 | 2 | 0.012 px control-point numerics (after cdd2 T13) |

## Leads, not findings

Includes prior-list items with a named symptom but no traced cause (pixexi +5.389 canvas shift with zero edges — the label-margin term was disproved; cukaze whole-document 0.87 px; pijiju Neighborhood contact points; zuramo's 0.012 px control points; nagega's numerics are pre-existing after cdd2 S-4). Canvas claims need the ink-extent probe.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible.
