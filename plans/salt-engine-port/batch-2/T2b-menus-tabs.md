# T2b: menus and tabs

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuBar.java` → `src/diagrams/salt/element/ElementMenuBar.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuEntry.java` → `src/diagrams/salt/element/ElementMenuEntry.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuPopup.java` → `src/diagrams/salt/element/ElementMenuPopup.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTabBar.java` → `src/diagrams/salt/element/ElementTabBar.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
Constructors and `add*` members as in the Java (consumed by T3c's Menu and Tab factories).

## Acceptance
- Given each element, when drawn through a recording `UGraphic` at z-index 0 and 1, then the calls and coordinates equal the Java's, asserted per value.
- Given each element's preferred dimension, then it equals the jar's, pinned from a corpus fixture or an `oracle-render.sh` probe stored under `tests/fixtures/salt/`.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
