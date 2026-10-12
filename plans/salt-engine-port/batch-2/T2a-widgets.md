# T2a: widgets

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementButton.java` → `src/diagrams/salt/element/ElementButton.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementDroplist.java` → `src/diagrams/salt/element/ElementDroplist.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTextField.java` → `src/diagrams/salt/element/ElementTextField.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementRadioCheckbox.java` → `src/diagrams/salt/element/ElementRadioCheckbox.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementLine.java` → `src/diagrams/salt/element/ElementLine.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementImage.java` → `src/diagrams/salt/element/ElementImage.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
Each class implements T1c's `Element`; constructor arguments as in the Java (consumed by T3a/T3b).

## Acceptance
- Given each element, when drawn through a recording `UGraphic` at z-index 0 and 1, then the calls and coordinates equal the Java's, asserted per value.
- Given each element's preferred dimension, then it equals the jar's, pinned from a corpus fixture or an `oracle-render.sh` probe stored under `tests/fixtures/salt/`.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
