# unwind-U2 — `@startdot` directives mirror the jar

## Observation: multi-file jar runs corrupt `@startdot` output
- **Context**: rendering 14 `@startdot` fixtures in one `scripts/oracle-render.sh` call.
- **Finding**: every fixture, including a plain `digraph G { a -> b; }`, came
  back as graphviz's `Error: <stdin>: syntax error in line 2|4 …`. One
  fixture per jar run renders correctly. `PSystemDotFactory` keeps the DOT
  text in an instance field (`private StringBuilder data;`,
  `directdot/PSystemDotFactory.java:47`) on a factory shared across the run,
  so concurrent blocks interleave their DOT. Two-file runs sometimes pass,
  which fits a race.
- **Impact**: render `@startdot` oracles one file per `oracle-render.sh` call.
  A multi-file capture can bake a corrupted golden.
- **Confidence**: High for the symptom and the workaround. Medium for the race
  as the mechanism (it fits the shared field, but the interleaving was not traced).

## Observation: `UmlSource.seedSourceLines` is upstream's `UmlSource`
- **Context**: porting `PSystemBasicFactory#createSystem` for dot.
- **Finding**: `lines` has `@start`/`@end`, `skinparam` and `<style>` stripped.
  `seedSourceLines` (`BlockUml#data`) keeps all of them, and only `'` comments
  are gone, which is exactly what upstream's factories iterate. An engine that
  must treat those lines as content (dot sends them to graphviz) has to read
  `seedSourceLines`. Before this change, `skinparam` after the `digraph` header
  never reached graphviz.
- **Impact**: any `PSystemBasicFactory` port that needs the full line stream
  should read `seedSourceLines`.
- **Confidence**: High

## Observation: graphviz errors are emitted as raw text by the jar
- **Context**: rendering fixtures whose post-header lines are invalid DOT.
- **Finding**: `ProcessRunner.java:69` (`redirectErrorStream(true)`) merges
  stderr into the output. A DOT syntax error therefore produces the 49-byte
  text `Error: <stdin>: syntax error in line 3 near '->'` where an SVG would
  be. @knowvah/dot-engine accepts some of these inputs: `Graph` used as a node
  name (graphviz keywords are case-insensitive) and `node { … }`. When it does
  reject one, its message is a peggy message, not yacc's.
- **Impact**: the `graph-keyword-after` / `style-after` fixtures cannot match
  the jar until dot-engine's grammar and error text match graphviz. This is
  forced by the library.
- **Confidence**: High

## Observation: error-page listing differs from the jar after removed lines
- **Context**: `title-before-blank`, `skinparam-only`.
- **Finding**: the jar lists the noise-removed trace
  (`UmlSource#removeInitialNoise`), with no blank and no `skinparam` line.
  `core/error/error-diagrams.ts#errorSvg` lists raw document lines.
  Welcome-stacked pages (source < 5 lines) also use the fitted legacy layout.
  Both gaps are in core, not dot.
- **Impact**: dot fixtures in those shapes match the jar on text and line
  number, but not on listing or geometry.
- **Confidence**: High
