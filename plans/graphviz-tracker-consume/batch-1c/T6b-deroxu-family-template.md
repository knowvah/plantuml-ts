# T6b+ — deroxu family fix (template; one task per T6a family)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Instantiate per family from
`measurements/deroxu-families.json` (T6b = first non-cascade family, T6c = the next, …; the orchestrator
adds T6f+ rows to the batch overview).

## Context
The family's row in `deroxu-families.json`: paths, javaRef, hypothesis, writeSet, touchesCore. Re-measure
deroxu first, because earlier families change the residual's shape.

## Task
Confirm or replace the hypothesis with a diagnosis artifact, then fix at the origin, with a failing test
on a **reduced fixture** for this family's feature. If no corpus fixture isolates it, author a `.puml` and
render its oracle with `scripts/oracle-render.sh`.

## Write-set
The family's `writeSet` from the census, plus the matching `tests/unit/**`. `src/core/**` only when
`touchesCore` is true. In that case also run the class/object/state golden ratchets and report them.

## Acceptance
- Given deroxu, when this family's fix lands, then all of the family's paths, and its `cascadeOf`
  dependents, clear.
- Given the reduced fixture, then it matches its oracle for this feature.
- Given the all-engine survey (core) or the description surveys (description-only), then there are no
  losses and every mover has a mechanism.
- On the last family: deroxu is conformant, and the close ticks 28.

**Observability:** N/A. **Rollback:** reversible.
