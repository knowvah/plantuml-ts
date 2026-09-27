# T5 — diagnose B dot-engine verification

**Agent:** debugger (opus — diagnose-first) · **Depends on:** T0 ·
parallel with the other T1–T5. Prompt = [`diagnosis-task.md`](../diagnosis-task.md)
+ this file. Writes `diagnosis/B.md` and `docs/graphviz-issues/` only (+ gitignored scratch).

## Fixtures (16, from `fixtures.md`, S/N at b-plan)

| slug | verdict | S | N | prior (lead) |
|---|---|---|---|---|
| bicabi-42-coto932 | structural-match | 0 | 1 | spline precision (prior list) |
| boseba-99-zopo693 | diverged | 1 | 681 | dot-engine issue 21 (same-rank order mirrored) |
| coxose-20-nifu136 | structural-match | 0 | 36 | Q-2 + Q-3 (closed) + flat `minlen=0` port edge |
| famizo-04-joxe063 | structural-match | 0 | 1 | spline precision (prior list) |
| focaci-80-suzu938 | structural-match | 0 | 95 | dot-engine issue 20 (taillabel/headlabel reserve no canvas) |
| kicuna-39-riki626 | structural-match | 0 | 114 | spline precision (prior list) |
| konomi-00-gico141 | structural-match | 0 | 1 | spline precision Δ0.315 |
| kupetu-36-kive480 | structural-match | 0 | 1 | spline precision Δ0.011 (N25/N62) |
| majuva-44-luta965 | diverged | 1 | 114 | dot-engine issue 21 |
| mucoti-34-seve858 | structural-match | 0 | 12 | Q-8 |
| nixema-71-tuke505 | structural-match | 0 | 1 | spline precision (prior list) |
| paluca-39-desa696 | structural-match | 0 | 1 | spline precision (prior list) |
| rifuzu-80-nixo780 | structural-match | 0 | 24 | Q-2/Q-3 (closed), Q-10 gone; flat edge (gvi 19) + Q-11 |
| ririlu-13-zipi740 | structural-match | 0 | 48 | Q-2 (closed) + Q-8 flat port edges + Q-7 LineOfSegments precision |
| sefazi-02-defe499 | structural-match | 0 | 12 | Q-8 |
| vebini-34-gapu710 | structural-match | 0 | 7 | spline precision (prior list) |

## Leads, not findings

Every fixture here is attributed to `@knowvah/dot-engine` (issue 19 flat `minlen=0` HTML-port edges; 20 taillabel/headlabel canvas; 21 same-rank order; spline precision). For EACH, run the real-`dot` probe (D5) on the cached `svek-N.dot` and state: (a) confirmed dot-engine — refresh the matching `docs/graphviz-issues/<n>-*.md` with the probe numbers and add a TRACKER line if new; or (b) NOT dot-engine — full artifact, owner this mission. ririlu also carries a `LineOfSegments` precision residual (D3 — note it, do not chase). This task MAY write `docs/graphviz-issues/` in addition to its report.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible.
