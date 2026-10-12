# T3b: check and radio factories

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryCheckboxOn.java` → `src/diagrams/salt/factory/ElementFactoryCheckboxOn.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryCheckboxOff.java` → `src/diagrams/salt/factory/ElementFactoryCheckboxOff.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryRadioOn.java` → `src/diagrams/salt/factory/ElementFactoryRadioOn.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryRadioOff.java` → `src/diagrams/salt/factory/ElementFactoryRadioOff.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
Each implements T2e's `ElementFactory`.

## Acceptance
- Given each factory's token form (from the Java's regex/prefix and a corpus line), when `ready()` runs, then it answers as the Java does; negative cases included.
- Given `create()`, then the built element and the `Terminated` terminator consumed equal the Java's.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
