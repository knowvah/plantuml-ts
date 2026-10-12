# sep-T1b: salt geometry strategies

## Observation: `salt/element/Skeleton2.java` was already ported under klimt
- **Context**: porting the batch-1 strategies (`Skeleton`, `Skeleton2`, `Grid2`, …).
- **Finding**: `src/core/klimt/creole/atom/Skeleton2.ts` is a jar-verified port of `salt/element/Skeleton2.java`; its only upstream caller is `klimt/creole/atom/AtomTree.java:63,80` (creole `|_` trees), never salt itself. `src/diagrams/salt/element/Skeleton2.ts` is a re-export so D1's one-file-per-Java layout holds; a test asserts the two bindings are the same class.
- **Impact**: check `docs/catalog.md` / grep `src/core` for an upstream class before porting it under `src/diagrams/` — the catalog answers "does a module for X exist".
- **Confidence**: High

## Observation: `TableStrategy` has six chars, none of them `.`
- **Context**: the T1b brief listed "`#`, `!`, `-`, `+`, `.`".
- **Finding**: `TableStrategy.java:39-40`: `' '` (DRAW_NONE), `+` (DRAW_OUTSIDE), `^` (DRAW_OUTSIDE_WITH_TITLE), `-` (DRAW_HORIZONTAL), `!` (DRAW_VERTICAL), `#` (DRAW_ALL). `fromChar('.')` is `null` upstream (undefined in the port).
- **Impact**: T2c/T2d must use `^` for the titled outline; nothing maps `.`.
- **Confidence**: High

## Observation: `Segment.equals` and TS `Set`
- **Context**: `Grid.java` stores `Segment`s in a `Set`.
- **Finding**: TS `Set` compares by identity, so the `Grid` port (T2c) must de-duplicate on `hashCode()` + `equals()` itself.
- **Impact**: a naive `Set<Segment>` draws duplicate lines.
- **Confidence**: High
