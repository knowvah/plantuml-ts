# T2d: tree

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTree.java` → `src/diagrams/salt/element/ElementTree.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTreeEntry.java` → `src/diagrams/salt/element/ElementTreeEntry.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`ElementTree` construction and `addEntry`/`addCell` members as in the Java — consumed by T3c's Tree factory.

## Acceptance
- Given each element, when drawn through a recording `UGraphic` at z-index 0 and 1, then the calls and coordinates equal the Java's, asserted per value.
- Given each element's preferred dimension, then it equals the jar's, pinned from a corpus fixture or an `oracle-render.sh` probe stored under `tests/fixtures/salt/`.
- Given a `{T` corpus fixture, then the tree's guide lines and indents equal its `in.svg`.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
