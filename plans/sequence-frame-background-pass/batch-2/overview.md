# Batch 2 — parser, Blotter, header, tile order

Four tasks, fully parallel: disjoint write-sets, all depending only on T1.

T3 and T4 split along **upstream's own class boundary** —
`teoz/Blotter.java` and `skin/rose/ComponentRoseGroupingHeader.java` are two
classes in two packages, so they are two files here.

Both produce code that nothing calls until T6 wires it. That is deliberate
(contract-first), and their own unit tests cover it, so it is not dead code.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Capture the group colours | `typescript-pro` | `src/diagrams/sequence/command-grouping.ts`, `tests/unit/sequence/command-grouping.test.ts`, `tests/unit/sequence/parser.test.ts`, **+ D10**: `src/diagrams/sequence/ast.ts`, `src/diagrams/sequence/sequence-layout-events.ts` | T1 | [x] |
| T3 | Port `Blotter.java` | `typescript-pro` | `src/diagrams/sequence/renderer-frame-blotter.ts` (new), `tests/unit/sequence/renderer-frame-blotter.test.ts` (new) | T1 | [x] |
| T4 | Port `ComponentRoseGroupingHeader.java` | `typescript-pro` | `src/diagrams/sequence/renderer-frame-header.ts` (new), `tests/unit/sequence/renderer-frame-header.test.ts` (new) | T1 | [x] |
| T5 | Tile order + colour carry-through | `typescript-pro` | `src/diagrams/sequence/sequence-layout-events.ts`, `tests/unit/sequence/layout.test.ts`, `tests/unit/sequence/renderer.test.ts` (the three `FrameGeo` literals only — D9) | T1 | [x] |

Batch gate: the four per-task gates — and per **D9** this batch must return
`npm run typecheck` to exit 0, clearing the four `TS2739` errors T1 left. Then
`npx jiti scripts/sequence-ratchet-adjudicate.ts` against this batch's parent
commit. **Invariant: zero `regression`.** T5 alone moves output (frames change
position), so expect movement and adjudicate it — do not read raw counts.
