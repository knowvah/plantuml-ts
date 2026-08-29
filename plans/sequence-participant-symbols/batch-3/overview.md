# Batch 3 — the five missing types

Two tasks, parallel: disjoint write-sets, both depending on T1 (and on
Batch 2 having proven the seam on `database`).

`collections`, `queue`, `entity`, `boundary` and `control` are **already
parsed** — `command-participant.ts:32` matches all eight keywords and
`ParticipantType` (`ast.ts:15-24`) carries all eight values. They reach layout
and the renderer intact and are then **silently drawn as a plain participant
box**, because `renderer.ts:137-185` dispatches only `actor` and `database`.

43 corpus fixtures. All five symbols are already ported under
`src/core/decoration/symbol/`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Dispatch the five types to the seam | `typescript-pro` | `src/diagrams/sequence/renderer.ts`, `src/diagrams/sequence/renderer-participant-shapes.ts`, `tests/unit/sequence/renderer.test.ts` | T1, T2 | [x] |
| T5 | Size the five types | `typescript-pro` | `src/diagrams/sequence/sequence-layout-participants.ts`, `tests/unit/sequence/layout.test.ts` | T1, T3 | [x] |

Batch gate: the four per-task gates, then the adjudicator against this batch's
parent. **Invariant: zero `regression`.** These 43 fixtures currently draw a
plain box where the jar draws a symbol, so expect substantial movement —
adjudicate it, do not read raw counts. `junaxa` must stay closed and
`fobube`/`rugeco` must not rise.
