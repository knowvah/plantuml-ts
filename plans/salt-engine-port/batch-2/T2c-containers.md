# T2c: containers and placement

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid.java` → `src/diagrams/salt/element/Grid.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/LeftFirst.java` → `src/diagrams/salt/element/LeftFirst.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TopFirst.java` → `src/diagrams/salt/element/TopFirst.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Positionner2.java` → `src/diagrams/salt/Positionner2.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementPyramid.java` → `src/diagrams/salt/element/ElementPyramid.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementPyramidScrolled.java` → `src/diagrams/salt/element/ElementPyramidScrolled.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementBorder.java` → `src/diagrams/salt/element/ElementBorder.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`Positionner2` (`add`, `getElements`, the placement loop), `Grid`, `ElementPyramid(positionner, tableStrategy, …)`, `ElementPyramidScrolled`, `ElementBorder` — consumed by T3c.

## Acceptance
- Given each element, when drawn through a recording `UGraphic` at z-index 0 and 1, then the calls and coordinates equal the Java's, asserted per value.
- Given each element's preferred dimension, then it equals the jar's, pinned from a corpus fixture or an `oracle-render.sh` probe stored under `tests/fixtures/salt/`.
- Given a `{# … }` corpus fixture's cells, then `Grid` + `TableStrategy` draw the jar's table lines exactly.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
