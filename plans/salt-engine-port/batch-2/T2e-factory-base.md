# T2e: factory base

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactory.java` → `src/diagrams/salt/factory/ElementFactory.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/AbstractElementFactoryComplex.java` → `src/diagrams/salt/factory/AbstractElementFactoryComplex.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`ElementFactory { create(): Terminated<Element>; ready(): boolean }`; `AbstractElementFactoryComplex(dataSource, dictionary)` with `addFactory`, `getNextElement`, `getDataSource`, `getDictionary` — consumed by every batch-3 factory and by T4a's `createElement`.

## Acceptance
- Given a complex factory with two child factories, when `getNextElement` runs, then the first `ready()` child is used, as in the Java.
- Given no ready child, then the Java's failure path is mirrored (D5).

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
