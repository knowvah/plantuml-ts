# T3a: simple factories

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryButton.java` → `src/diagrams/salt/factory/ElementFactoryButton.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryDroplist.java` → `src/diagrams/salt/factory/ElementFactoryDroplist.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryImage.java` → `src/diagrams/salt/factory/ElementFactoryImage.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryLine.java` → `src/diagrams/salt/factory/ElementFactoryLine.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryText.java` → `src/diagrams/salt/factory/ElementFactoryText.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTextField.java` → `src/diagrams/salt/factory/ElementFactoryTextField.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryRetrieveFromDictonnary.java` → `src/diagrams/salt/factory/ElementFactoryRetrieveFromDictonnary.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
Each implements T2e's `ElementFactory`; constructor `(dataSource, dictionary)` as in the Java.

## Acceptance
- Given each factory's token form (from the Java's regex/prefix and a corpus line), when `ready()` runs, then it answers as the Java does; negative cases included.
- Given `create()`, then the built element and the `Terminated` terminator consumed equal the Java's.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
