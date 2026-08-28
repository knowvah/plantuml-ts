# Batch 1 — the contract

One task. Everything in Batch 2 imports from it, so it lands alone.

T1 adds the frame colour fields, the header-Display fields, and a new
`frame-style.ts` holding every cited `plantuml.skin` constant. `frame-style.ts`
exists because **layout** must size the tab (it is the only stage with a
measurer — see `FrameGeo.refBody`'s own doc comment) while the **renderer**
must draw it, so the padding constants have a third owner.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Frame colour + tab contract | `typescript-pro` | `src/diagrams/sequence/ast.ts`, `src/diagrams/sequence/scale-geo.ts`, `src/diagrams/sequence/frame-style.ts` (new), `tests/unit/sequence/frame-style.test.ts` (new), `tests/unit/measurer.test.ts` (D3 amendment) | — | [x] |

Batch gate (**amended 2026-08-28, D9**): `lint`, `build` and
`npx vitest run tests/unit` must be green at T1. `npm run typecheck` is
DEFERRED to the Batch 2 gate — T1 commits with exactly four `TS2739` errors on
`FrameGeo` construction sites owned by T5 and T6, because the new tab fields
are required and no fix exists inside T1's write-set. See D9. No adjudicator
run — T1 changes no output.
