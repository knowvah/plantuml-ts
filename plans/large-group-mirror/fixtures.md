# Fixture ledger (lgm)

Numbers measured by the orchestrator at main `b46435b10` (2026-10-08). T0a
re-takes every one at b0; the b0 column is authoritative. `final` per D6.

## A1 — edge precision (T0b)

| Fixture | Engine | pre-b0 | b0 | final |
|---|---|---|---|---|
| bipudo-23-xavu432 | class | conformant | conformant (dotEqual) | |
| every class/object/state/description-family fixture | — | survey verdicts | class 709/4/10, object 63/8/9, state 73/12/188, component 65/67/134, usecase 28/19/46 (+1 oracle-error), unknown 362/57/406 (conf/struct/div) | |
| a `@startdot` fixture (`diagrams/dot/layout.ts` reads dot-engine directly) | dot | — | 5/5 conformant | |

## A2 — mainframe (T1a)

| Fixture | Engine | pre-b0 ws | b0 | final |
|---|---|---|---|---|
| decace-28-majo724 | sequence | 40 | ws 40 / d 40 | |
| futaxe-10-xonu513 | sequence | 32 | ws 32 / d 32 | |
| gunecu-53-jebu067 | sequence | 44 | ws 44 / d 44 | |
| jutomu-49-kemi074 | sequence | 39 | ws 39 / d 39 | |
| zidova-39-bapi223 | sequence | 32 | ws 32 / d 32 | |
| miveni-64-rexo238 | unknown | conformant | conformant | |
| rivino-95-midu088 | unknown | conformant | conformant | |
| soseka-43-riru110 | unknown | conformant | conformant | |
| jakaja-15-faze022 (control) | class | conformant | conformant | |
| authored: mainframe on activity, state, usecase, component, mindmap, timing, json | — | — | | |

## A3 — composite-anchor clip rect (T1b)

| Fixture | Engine | pre-b0 | b0 | final |
|---|---|---|---|---|
| pesita-10-dene726 | state | diverged, 208 diffs | diverged, 208 diffs (ws 967) | |
| viroxo-69-fito663 | state | diverged, 90 diffs | diverged, 90 diffs (ws 150) | |
| authored: composite with entry/exit points, edges into/out of it (lhead/ltail), several lines through the same cluster, titled vs untitled | state | — | | |
| authored: component/package with `portin`/`portout` and cluster edges | description | — | | |
