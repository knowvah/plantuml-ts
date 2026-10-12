# sep-T1a: salt data source

## Observation: Pattern2 compiles every pattern CASE_INSENSITIVE
- **Context**: porting `DataSourceImpl.STRUCTURED_BLOCK_START_PATTERN` (`\{(?:[-+^#!*/]|S-|SI|S)?`).
- **Finding**: `Pattern2.compileInternal` (`regex/Pattern2.java:114`) always passes `Pattern.CASE_INSENSITIVE`, so `{s-` / `{si` / `{s` split exactly like `{S-` / `{SI` / `{S` (jar probe, `tests/unit/salt/fixtures/data-source-edges.puml`). Any `Pattern2.cmpile` port needs the `i` flag.
- **Impact**: salt factories matching tokens with `Pattern2`-built regexes must also be case-insensitive; a port with a bare JS regex silently diverges on lowercase input.
- **Confidence**: High

## Observation: jar classes can be probed directly with single-file Java
- **Context**: pinning DataSourceImpl tokens to the jar, not to a reading of the Java.
- **Finding**: `java -cp oracle/dist/plantuml-oracle.jar <Probe>.java <args>` (JDK 21 single-file source launch) runs any public jar class; `jshell --class-path oracle/dist/plantuml-oracle.jar <script>.jsh` works for one-liners. `tests/unit/salt/fixtures/DataSourceProbe.java` is the committed example.
- **Impact**: unit-level jar values for salt (and other packages) need no SVG render; regenerate fixtures this way instead of hand-deriving.
- **Confidence**: High

## Observation: brief's DataSource contract names members the Java lacks
- **Context**: T1a interface contract lists `peek`, `next`, `isEmpty`, `peekTerminated`.
- **Finding**: `salt/DataSource.java:40-43` is `Iterator<Terminated<String>>` + `peek(int)` only; no `isEmpty`/`peekTerminated` anywhere in `salt/`. Port exposes `peek`, `hasNext`, `next`, `remove`.
- **Impact**: consumers (T2c, T2e, factories) call `hasNext()`/`peek(i)`/`next()` as upstream does.
- **Confidence**: High
