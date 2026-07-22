# Batch 6 - Attempt 6 (human sign-off 2026-07-22)

Fix the two T9-isolated pre-existing gaps as standalone jar-faithful
mechanism ports, re-gate on paper, then re-apply the T9 wiring
unchanged.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T11 | Port ClusterHeader titleAndAttributeWidth (max of title/stereo and attribute text) | typescript-pro | state-composite-cluster.ts (+types) + tests | - | [x] |
| T12 | Consume Transition.direction: jar-faithful edge reversal before graphviz | typescript-pro | state-composite-pass.ts (+types) + tests | T11 | [x] |
| T13 | Paper gate v3: 3 targets from port-emitted DOT, zero unverified assertions | debugger | derivation-doc addendum | T12 | MISS (paper) - stopped before code |
| T14 | Re-apply T9 ten-item wiring; measure; hard bar | typescript-pro (T9 agent resumed) | T9 write-set | T13 | NOT RUN (T13 stop) |
| T15 | Family sweep, pins/backlog, close | typescript-pro | pins/backlog/journal/README | T14 | NOT RUN (T13 stop) |

Hard bars: T13 paper miss -> stop before code; T14 measured miss ->
full revert -> stop (SEVENTH attempt needs fresh sign-off). DOT gate
frozen, svg-state pin ratchet, backlog tighten-only at every commit.
T11/T12 rule: if a pin or parity fixture changes, the ported
condition diverges from jar - fix the condition, never relax a gate;
if genuinely irreconcilable, stop and report with evidence.
