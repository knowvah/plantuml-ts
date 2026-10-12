# T3c: complex factories

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryBorder.java` → `src/diagrams/salt/factory/ElementFactoryBorder.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryMenu.java` → `src/diagrams/salt/factory/ElementFactoryMenu.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryPyramid.java` → `src/diagrams/salt/factory/ElementFactoryPyramid.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryScroll.java` → `src/diagrams/salt/factory/ElementFactoryScroll.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTab.java` → `src/diagrams/salt/factory/ElementFactoryTab.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTree.java` → `src/diagrams/salt/factory/ElementFactoryTree.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
Each extends T2e's `AbstractElementFactoryComplex`; `ElementFactoryTree` is shared as one instance (`PSystemSalt.java` comment, issue #2730).

## Acceptance
- Given each factory's token form (from the Java's regex/prefix and a corpus line), when `ready()` runs, then it answers as the Java does; negative cases included.
- Given `create()`, then the built element and the `Terminated` terminator consumed equal the Java's.
- Given nested `{ { … } }` blocks, then recursion through `addFactory` builds the Java's element tree (assert the element types and order).

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
