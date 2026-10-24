# T0b — authored fixtures and jar oracles

Agent: `typescript-pro` (sonnet), worktree `lad-T0b`. Commit:
`test(lad): author lengthAdjust fixtures with jar oracles for 16 engines`.
Read [../task-contract.md](../task-contract.md) first. No `src/` change.

## Task
Create `tests/fixtures/lengthadjust/<engine>-<variant>.puml` for the 16
engines × 4 variants below (64 files) and render each oracle beside it as
`<engine>-<variant>.svg` with `scripts/oracle-render.sh <out-dir> <puml>`
(deterministic text metrics ON; never a hand-typed `java -jar`). Keep every
fixture tiny — one or two labelled elements — so the projection is readable.

Engines and start tags (take the smallest corpus row of each engine in
`test-results/dot-cache/<engine>/*/in.puml` as the syntax model): class
`@startuml class A`, object `@startuml object foo`, state `@startuml state
S1`, activity `@startuml :label;`, component `@startuml [A] --> [B]`, usecase
`@startuml (Login)`, json `@startjson`, yaml `@startyaml`, hcl `@starthcl`,
mindmap `@startmindmap`, salt `@startsalt`, wbs `@startwbs`, board
`@startboard`, files `@startfiles`, packet `@startpacketdiag`, chart
`@startchart`.

Variants (the skinparam line goes right after the start tag; for engines
whose start tag is not `@startuml`, `skinparam lengthAdjust x` is still a
valid line — verify on the oracle, stop 17 if the jar errors twice):
- `default`: no skinparam; labels of 2+ characters.
- `none`: `skinparam lengthAdjust none`.
- `glyphs`: `skinparam lengthAdjust spacingAndGlyphs`.
- `onechar`: no skinparam; exactly one label that is a single character
  (`A`) plus one longer label (`SvgGraphics.java:703` `text.length() > 1`).

## Write-set
`tests/fixtures/lengthadjust/**` (new directory).

## Read-set
`tests/fixtures/utility/` (shape of a flat authored root);
`scripts/oracle-render.sh:1-25`; one `in.puml` per engine in the dot cache;
Java `SkinParam.java:1258-1269`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given the 16 engines, when the 4 variants render through
  `oracle-render.sh`, then 64 `.puml`/`.svg` pairs exist and no `.svg` is a
  jar error page (`<text>` containing "Syntax Error" or "[From string").
- Given every `none` oracle, then its root `<g>` has no `lengthAdjust` and no
  `<text>` carries `textLength`.
- Given every `glyphs` oracle, then its root `<g>` has
  `lengthAdjust="spacingAndGlyphs"`.
- Given every `onechar` oracle, then the one-character `<text>` has no
  `textLength` while the longer one does (where the engine writes
  `textLength` at all — all 16 jar renders do).
- Given the hand-back, then it lists per engine the oracle's root `<g>`
  attribute string for each variant (the orchestrator pastes it into
  `fixtures.md`).

Observability: N/A. Rollback: Reversible.
