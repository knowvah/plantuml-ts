# Parser accepts `node { … }`, which graphviz rejects as a syntax error

**Impact:** `@startdot` sources (plantuml-ts `src/diagrams/dot/`): the jar streams
graphviz's own output (`PSystemDot.java:78-115`), and for invalid DOT that output is
graphviz's error text (`ProcessRunner.java:69`, `redirectErrorStream(true)`). Where
dot-engine accepts input graphviz rejects, plantuml-ts draws a diagram where the jar
draws an error. Filed by plantuml-ts unwind-U2 (2026-10-08); fixture
`tests/fixtures/unwind-U2/style-after`.

**Finding.** dot-engine 1.6.1 parses a brace block after the `node` keyword as if it
were a valid statement; graphviz's yacc grammar has no such production.

## Repro

```dot
digraph g { node { shape=box } a -> b }
```

- `dot -Tsvg` (graphviz): exit 1, `Error: <stdin>: syntax error in line 1 near '{'`.
- `@knowvah/dot-engine` 1.6.1 `renderSvg(src, 'dot')`: returns an SVG (1252 chars).

**Related, not a parser-acceptance bug:** for `digraph g { a -> b; Graph -> c }` both
reject (keywords are case-insensitive), but the error text differs — dot-engine throws
a peggy `ParseError: Expected "." or [0-9] but ">" found.` where graphviz writes
`syntax error in line 1 near '->'`. Matching the jar's output for invalid DOT would
need graphviz's error message format.
