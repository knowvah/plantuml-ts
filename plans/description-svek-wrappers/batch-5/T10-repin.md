# T10 — measure and re-pin after T9

**Agent:** orchestrator. Merge T9 per the close procedure (steps 1–3), survey all engines as `b5-eng`,
then repeat [../batch-4/T6-measure-repin.md](../batch-4/T6-measure-repin.md) steps 1–7 against `b4`.
Commit `chore(dsw-b5): close batch 5 — deroxu <before> -> <after>`.

## Acceptance
- Given b5 vs b4, then conformant losses = 0 and every mover is journaled.
- Given `fixtures.md`, then the b5 column is filled for every named fixture.

**Observability:** SLI checkpoint. **Rollback:** Reversible.
