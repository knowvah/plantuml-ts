# Batch 1 — the seam

One task. Every later batch imports from it, so it lands alone.

T1 builds the sequence-local composition module that drives the already-ported
`USymbol` primitives through `UGraphicSvg`, mirroring upstream's
`ComponentRose*` family (D1, D2). It exports BOTH a draw and a measure entry
point, because the renderer and the layout sizer each need one and splitting
them across modules is how `planning/sizer-renderer-parity.md`'s defect class
recurs.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | The participant-symbol seam | `typescript-pro` | `src/diagrams/sequence/renderer-participant-symbol.ts` (new), `tests/unit/sequence/renderer-participant-symbol.test.ts` (new) | — | [ ] |

Batch gate: the four per-task gates. **No adjudicator run — T1 changes no
rendered output**, because nothing calls it until T2/T3. (Verify that claim
rather than assuming it: `git diff` should show only the two new files, and
the ratchet should still report exactly the three known failures.)
