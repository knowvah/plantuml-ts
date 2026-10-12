# T1b: geometry strategies

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TableStrategy.java` → `src/diagrams/salt/element/TableStrategy.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Segment.java` → `src/diagrams/salt/element/Segment.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java` → `src/diagrams/salt/element/ListWidth.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java` → `src/diagrams/salt/element/Skeleton.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton2.java` → `src/diagrams/salt/element/Skeleton2.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java` → `src/diagrams/salt/element/Grid2.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ScrollStrategy.java` → `src/diagrams/salt/factory/ScrollStrategy.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`TableStrategy` (the `#`, `!`, `-`, `+`, `.` table-line strategies), `ListWidth`, `Skeleton`/`Skeleton2`, `Grid2`, `ScrollStrategy` — consumed by T2c and T2d.

## Acceptance
- Given each `TableStrategy` char, then the parsed strategy equals the Java's.
- Given a `Grid2` with set rows/columns, when drawn through a recording `UGraphic`, then the lines equal the Java's per coordinate.
- Given `Skeleton`/`Skeleton2` entries, then the tree-guide lines equal the Java's (pin one value from a `{T` corpus fixture's `in.svg`).

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
