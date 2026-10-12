# T1a: data source

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
Port 1:1, reading each Java file whole first:
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Terminator.java` → `src/diagrams/salt/Terminator.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Terminated.java` → `src/diagrams/salt/Terminated.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/DataSource.java` → `src/diagrams/salt/DataSource.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/DataSourceImpl.java` → `src/diagrams/salt/DataSourceImpl.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Position.java` → `src/diagrams/salt/Position.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Cell.java` → `src/diagrams/salt/Cell.ts`

## Write-set
The TS files above and their tests under `tests/unit/salt/` (same sub-directory), plus
`docs/catalog.md`.

## Interface contracts
`DataSource` (`peek`, `next`, `isEmpty`, `peekTerminated` … as in the Java), `Terminated<T>`, `Terminator`, `Cell` — consumed by T2c, T2e and every factory.

## Acceptance
- Given the lines of a corpus salt block (`{`, `[ok] | [cancel]`, `}`), when tokenised by `DataSourceImpl`, then the token/terminator sequence equals the Java's (assert each token).
- Given `Cell` spans, then merge/extent values equal the Java's.
- Given `Position`, then its arithmetic equals the Java's.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
