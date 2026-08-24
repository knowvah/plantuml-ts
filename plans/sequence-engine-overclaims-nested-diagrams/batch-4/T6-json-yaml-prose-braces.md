# T6 — stop JSON/YAML claiming braces that appear in prose

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

`debufa-67-poma789` is a sequence diagram the jar renders `SEQUENCE`. We
render it **JSON**, on this line:

```
SbcMXdCtrl->SbcMXdCtrl: struct timespec initialTimeout={1,0}
```

The `{1,0}` is message text. Upstream cannot make this mistake: `@startjson`
is its own start token (`JsonDiagramFactory`'s `getDiagramType()` is `JSON`),
so a plain `@startuml` source is never even offered to the json factory —
`PSystemBuilder.java:259` skips it on the candidate-set test.

**This bucket may close entirely in T3**, which ports exactly that
candidate-set filter. Check the residual first; if `SEQUENCE -> JSON` and
`SEQUENCE -> YAML` are both empty, close as a measured no-op and say so.

## Task

If a residual remains, narrow json's and yaml's `accepts` so brace or
indentation syntax inside a message body cannot claim a `@startuml` source.

Write the test first (TDD).

## Read-set

- `src/diagrams/json/index.ts` and `src/diagrams/yaml/index.ts` — the two
  `accepts` implementations
- `~/git/plantuml/.../jsondiagram/JsonDiagramFactory.java` — its
  `getDiagramType()`, and note it has no content heuristic at all
- `~/git/plantuml/.../core/DiagramType.java` — where `JSON`/`YAML` come from
  (`@startjson`/`@startyaml`), which is the real gate upstream
- `test-results/dot-cache/sequence/debufa-67-poma789/in.puml`
- `../decisions.md#d4`

## Write-set

- `src/diagrams/json/index.ts`
- `src/diagrams/yaml/index.ts`
- `tests/unit/json/accepts.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given a `@startuml` source whose only brace content is inside a message
   body, when json's `accepts` runs, then `false`
2. Given a genuine `@startjson` source, then json still claims it — assert
   against an existing `oracle/goldens/svg-json/` fixture, not a synthetic one
3. Given the routing gate, then `SEQUENCE -> JSON` and `SEQUENCE -> YAML` are
   both empty, and the 10 + 6 promoted fixtures in `svg-json/ratchet.json` and
   `svg-yaml/ratchet.json` are not de-promoted
4. If T3 already closed both buckets, then this task commits nothing and the
   journal records the measurement that made it unnecessary

## Quality bar

All four gates green. Do not re-pin baselines.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch, not the task.

## Boundaries

- **Always:** prefer removing a content heuristic over adding one — upstream
  has none here, so a heuristic that exists at all is already a divergence
- **Never:** widen; touch the json/yaml parsers or `JsonDiagram` layout
- **Ask first:** if json's `accepts` cannot be narrowed without breaking the
  `@startjson`-less embedded-json path, if one exists

## Commit

One commit: `fix(T6): stop json and yaml claiming braces in message text`
