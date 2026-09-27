# T1 — diagnose E numeric-only, part A

**Agent:** debugger (opus — diagnose-first) · **Depends on:** T0 ·
parallel with the other T1–T5. Prompt = [`diagnosis-task.md`](../diagnosis-task.md)
+ this file. Writes ONLY `diagnosis/E1.md` (+ gitignored scratch).

## Fixtures (13, from `fixtures.md`, S/N at b-plan)

| slug | verdict | S | N | prior (lead) |
|---|---|---|---|---|
| cocube-46-tusu692 | structural-match | 0 | 177 |  |
| cuzoga-39-tufu259 | structural-match | 0 | 77 |  |
| dibinu-95-kavo178 | structural-match | 0 | 345 |  |
| diroxo-41-zezo954 | structural-match | 0 | 181 |  |
| foxosa-41-bono202 | structural-match | 0 | 453 |  |
| gamevo-26-runo973 | structural-match | 0 | 450 |  |
| jakapi-64-tine258 | structural-match | 0 | 438 |  |
| nadono-22-gidu983 | structural-match | 0 | 248 |  |
| nuxoni-26-xala894 | structural-match | 0 | 130 |  |
| rideze-59-lizu265 | structural-match | 0 | 81 |  |
| voluca-76-fosu617 | structural-match | 0 | 1036 |  |
| xitobu-41-lame230 | structural-match | 0 | 58 |  |
| ziparo-17-joku307 | structural-match | 0 | 58 |  |

## Leads, not findings

All structural-match with large numeric counts: find the ONE element each diff cascade is keyed off (a node size, an origin shift, an edge route), not the count. Several may share a mechanism with each other or with T2/T3 — give shared ids.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible.
