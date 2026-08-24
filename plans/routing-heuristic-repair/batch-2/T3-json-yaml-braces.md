# T3 — stop json and yaml claiming a `@startuml` source

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing.**

16 fixtures across three buckets, one root: json's and yaml's `accepts()`
read structure out of text that is not structure.

| n | jar → ours | the line that does it |
|---|---|---|
| 12 | SEQUENCE → JSON | `SbcMXdCtrl->SbcMXdCtrl: struct timespec initialTimeout={1,0}` — the `{1,0}` is **message text** |
| 2 | SEQUENCE → YAML | the same shape, matched by yaml's indentation heuristic |
| 2 | CLASS → YAML | yaml claiming a class diagram outright |

**Upstream cannot make this mistake, and the reason matters more than the
fixtures.** `JsonDiagramFactory`'s `getDiagramType()` is `JSON`, and
`DiagramType.getTypes` (`DiagramType.java`) produces `JSON` only from the
`@startjson` start token. `PSystemBuilder.java:258-259` then skips any factory
whose type is not in the candidate set, so a plain `@startuml` source is never
offered to the json factory at all. **Upstream has no content heuristic here
whatsoever** — the start token is the entire gate.

That is the shape to aim for. A content heuristic on these engines is itself
the divergence; prefer deleting reach over adding conditions.

Note the boundary, though: this port's dispatcher does have a typed fast path,
and `@startjson`/`@startyaml`/`@starthcl`/`@startdot` sources (119 of 3158)
already route correctly through it today. This task must not disturb that.

## Task

Narrow json's and yaml's `accepts()` so brace or indentation syntax appearing
inside a `@startuml` source cannot claim it.

Write the test first (TDD).

## Read-set

- `src/diagrams/json/index.ts` and `src/diagrams/yaml/index.ts` — the two
  `accepts()` implementations, in full
- `src/core/dispatcher.ts:245-270` — `resolve`, so you can see exactly how
  the typed fast path and the `accepts()` scan interact. **Read it; do not
  change it** — it is in no task's write-set
- `~/git/plantuml/.../jsondiagram/JsonDiagramFactory.java` — its
  `getDiagramType()`, and confirm for yourself that it has no content
  heuristic
- `~/git/plantuml/.../core/DiagramType.java` — where `JSON` and `YAML` come
  from, which is the real gate upstream
- `test-results/dot-cache/sequence/debufa-67-poma789/in.puml` — the clearest
  of the twelve
- `../decisions.md#d2`, `../decisions.md#d3`

## Write-set

- `src/diagrams/json/index.ts`
- `src/diagrams/yaml/index.ts`
- `tests/unit/json/accepts.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it.

## Acceptance criteria

1. Given a `@startuml` source whose only brace or indentation content is
   inside a message body, when json's `accepts()` runs, then `false`; same
   for yaml
2. Given a genuine `@startjson` source, then json still claims it — asserted
   against an existing `oracle/goldens/svg-json/` fixture, not a synthetic
   one. Same for yaml against `oracle/goldens/svg-yaml/`
3. Given the routing gate, then `SEQUENCE -> JSON`, `SEQUENCE -> YAML` and
   `CLASS -> YAML` are **all empty**, and every one of the 16 reports
   `jarType === ourType`
4. Given the 10 promoted fixtures in `svg-json/ratchet.json` and the 6 in
   `svg-yaml/ratchet.json`, then none is de-promoted
5. Given the 119 `@startjson`/`@startyaml`/`@starthcl`/`@startdot` fixtures,
   then none newly misroutes — the typed fast path must be undisturbed

## Quality bar

All four gates green. Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch range, not the task.

## Boundaries

- **Always:** prefer removing a content heuristic to adding one — upstream
  has none here, so a heuristic that exists at all is already a divergence
- **Never:** widen; touch the json/yaml parsers or `JsonDiagram` layout;
  touch `src/core/dispatcher.ts` or `src/index.ts` (D1)
- **Ask first:** if json's `accepts()` cannot be narrowed without breaking an
  `@startjson`-less embedded-json path, should one exist. Find out whether it
  does before assuming either way

## Commit

One commit: `fix(T3): stop json and yaml claiming braces in message text`
