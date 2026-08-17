# Batch 3 — arrow-font engine wiring (D4)

Three tasks, parallel, disjoint write-sets, all consuming T2's
`resolveArrowLabelFont`. Each wires **measurement and SVG text in one commit**
so DOT box and ink agree. T7 has no backlog slug and is optional (push-forward:
skip and journal if time is better spent).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Class arrow-label font (`camuna`, `ticuxa`) | `typescript-pro` | `src/diagrams/class/class-dot-graph.ts`, `src/diagrams/class/renderer-edge.ts`, `src/diagrams/class/class-layout-edge-labels.ts` (stale comment only, if T4 left it), `tests/unit/class/*.test.ts` (existing), `oracle/goldens/class/label-size-backlog.json` | T2, T4 | [ ] |
| T6 | Description arrow-label font (`zosuje`) | `typescript-pro` | `src/diagrams/description/layout.ts`, `src/diagrams/description/renderer-edge.ts`, `tests/unit/description/*.test.ts` (existing), `oracle/goldens/description/label-size-backlog.json` | T2, T3 | [ ] |
| T7 | State arrow-label font (optional; zero movement) | `typescript-pro` | `src/diagrams/state/{layout,state-dot-graph,state-composite-autonom,state-composite-pass,state-composite-pass-edges,state-renderer-transitions}.ts`, `tests/unit/state/*.test.ts` (existing) | T2 | [ ] |

**Batch exit:** all gates; class DOT EQUAL ≥ Batch-2 value, description ≥
Batch-2 value, state 266/268 unchanged; no fixture rises; every fixture with
no arrow override byte-identical in DOT **and** SVG.
