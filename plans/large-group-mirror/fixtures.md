# Fixture ledger (lgm)

Numbers measured by the orchestrator at main `b46435b10` (2026-10-08). T0a
re-takes every one at b0; the b0 column is authoritative. `final` per D6.

## A1 — edge precision (T0b)

| Fixture | Engine | pre-b0 | b0 | final |
|---|---|---|---|---|
| bipudo-23-xavu432 | class | conformant | conformant (dotEqual) | exact (conformant; svek read mirrored, T0b) |
| every class/object/state/description-family fixture | — | survey verdicts | class 709/4/10, object 63/8/9, state 73/12/188, component 65/67/134, usecase 28/19/46 (+1 oracle-error), unknown 362/57/406 (conf/struct/div) | class 710/3/10, object 63/8/9, state 73/12/188, component 67/65/134, usecase 29/18/46, unknown 365/54/406 — 0 losses b0→final; A1 read audited, nothing unquantized remains (T0b) |
| a `@startdot` fixture (`diagrams/dot/layout.ts` reads dot-engine directly) | dot | — | 5/5 conformant | exact (5/5; `PSystemDot` passthrough mirrored, T0b) |

## A2 — mainframe (T1a)

| Fixture | Engine | pre-b0 ws | b0 | final |
|---|---|---|---|---|
| decace-28-majo724 | sequence | 40 | ws 40 / d 40 | moved 40→25: frame/tab/title placement exact; frame 1 px narrow because `note left` is 1 px narrow — open -> sequence note sizing (separate mechanism) |
| futaxe-10-xonu513 | sequence | 32 | ws 32 / d 32 | moved 32→14: frame/tab/title equal (width 0.001 last-digit, inside the 0.01 comparator); residual = unrelated sequence style diffs |
| gunecu-53-jebu067 | sequence | 44 | ws 44 / d 44 | moved 44→16: frame/tab/title exact (incl. LineStyle dash); residual = unrelated sequence style diffs |
| jutomu-49-kemi074 | sequence | 39 | ws 39 / d 39 | moved 39→15: frame/tab/title equal (width 0.001 last-digit, inside the 0.01 comparator); residual = unrelated sequence style diffs |
| zidova-39-bapi223 | sequence | 32 | ws 32 / d 32 | moved 32→14: frame/tab/title exact; residual = unrelated sequence style diffs |
| miveni-64-rexo238 | unknown | conformant | conformant | exact (conformant) |
| rivino-95-midu088 | unknown | conformant | conformant | exact (conformant) |
| soseka-43-riru110 | unknown | conformant | conformant | exact (conformant) |
| jakaja-15-faze022 (control) | class | conformant | conformant | exact (conformant; class special case subsumed by the shared chrome path) |
| authored: mainframe on activity, state, usecase, component, mindmap, timing, json | — | — | — | exact frame/tab/title/canvas on activity, mindmap, class, object, json, hcl (`lgm-T1a/`) and state, component, usecase, deployment, composite state (`lgm-T1c/`); timing/gantt: no engine in src (open -> engine ports) |

## A3 — composite-anchor clip rect (T1b)

| Fixture | Engine | pre-b0 | b0 | final |
|---|---|---|---|---|
| pesita-10-dene726 | state | diverged, 208 diffs | diverged, 208 diffs (ws 967) | moved 208→176 (ws 935): all 16 clipped link ends and the `AA` drawn box equal the jar (T1b/T1d); residual diffs carry other mechanisms |
| viroxo-69-fito663 | state | diverged, 90 diffs | diverged, 90 diffs (ws 150) | open -> state DOT member order (90/150, maxDelta 18.7→11): the jar emits `comp1`'s members in a different DOT order, so nodes sit 2-3 px off before any clip; clipped ends NOT equal — D6 clause unmet for this fixture |
| authored: composite with entry/exit points, edges into/out of it (lhead/ltail), several lines through the same cluster, titled vs untitled | state | — | — | exact: clipped ends + drawn box equal on 8 fixtures (`lgm-T1b/`, `lgm-T1d/`) |
| authored: component/package with `portin`/`portout` and cluster edges | description | — | — | open -> description port-cluster DOT (our DOT lacks the jar's `a`/`i` wrapper subgraphs, `ClusterDotString.java:91-96`); clip wiring unit-tested, jar test `it.fails` |

## Added during the mission (oracle seam #3, user-ordered)

| Fixture | Engine | b1 | b1o (new oracle) | final |
|---|---|---|---|---|
| gadufu-56, moxobo-16, zikabo-17 (class); josebu-55, kelefe-72, komuvi-52, rojida-14, rozugu-82, tefeco-12 (unknown) | class family | conformant (fitted 42x42) | structural-match | exact (conformant; SVG arm + leaf magnetic border, T1e) |
| fikuki-99, gufuma-85, mufixi-71, pufuzi-99 | activity | structural-match | conformant | exact (pinned to the golden ratchet) |
| semutu-45-zeno907 | unknown | structural-match | conformant | exact (ledger entry retired) |
| xadado-92-lazo250 | class | structural-match | structural-match | exact (conformant, pinned) |
| romuru-66-samu329 | activity | structural-match | structural-match | conformant in the survey; `status: error` in the activity baseline — open -> harness vs index.ts check |
| kovaxi-11, zidebi-71, runima-82, pixisi-38 | usecase, activity | — | jar crash page (random icon) | excluded: deterministic-mode jar crash (space width 0) — open -> instrument space-width mission |
