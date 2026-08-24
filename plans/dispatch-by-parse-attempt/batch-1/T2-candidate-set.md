# T2 — the start-tag candidate set

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Upstream decides *which factories are
even eligible* for a source from its `@start` line alone, then attempts the
parse among those. This task ports the first half.

This is the finding that resized the whole mission: **only `@startuml` yields
more than one candidate.** Every other tag maps to exactly one, so for those
the "parse attempt" is a no-op dispatch.

## Task

Port `DiagramType.findStartTypes` faithfully.

Read `DiagramType.java` in full. The shape is: skip leading whitespace; require
`@` or `\`; require `start`; then switch on the next character and match the
tag. `@startuml` returns
`EnumSet.of(SEQUENCE, STATE, CLASS, OBJECT, ACTIVITY, DESCRIPTION, COMPOSITE,
TIMING, HELP, SPRITES)` (`:198-201`); an unmatched tag returns
`EnumSet.of(UNKNOWN)`; a non-`@` first character returns **empty**.

Preserve upstream's names, including `DEFINITION`, `CHEN_EER` and `CRASH` even
where this port has no such engine. The enum is the spec; missing engines are
this port's gap, not a reason to trim the set.

## Write-set

- `src/core/diagram-type-set.ts` (create)
- `tests/unit/core/diagram-type-set.test.ts` (create)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramType.java` — the whole file
- `src/core/block-extractor.ts:260-330` — how this port currently derives a
  type from a block. **Read it, do not change it**: T3 owns that file. You need
  to know what shape T3 will be replacing

## Interface contracts

Consumed by T3:

```ts
function findStartTypes(firstLine: string): ReadonlySet<DiagramType>;
```

Empty set for a line that is not a start directive. `DiagramType` here is
upstream's enum, which is **wider** than this port's plugin `type` union — T3
maps between them; do not narrow it in this module.

## Architecture decisions in force

- [D5](../decisions.md#d5) — `detectUmlType` is deleted, not reduced. Upstream
  never guesses a single type from `@startuml` content, so this function must
  not either

## Acceptance criteria

1. *Given* `@startuml`, *when* called, *then* exactly the 10 types at
   `DiagramType.java:198-201` are returned
2. *Given* each single-type tag in the corpus (`@startjson`, `@startyaml`,
   `@starthcl`, `@startgantt`, `@startsalt`, `@startdot`, `@startmindmap`,
   `@startwbs`, `@startchronology`, `@startchart`, `@startboard`, …), *when*
   called, *then* a singleton set matching the Java's switch is returned
3. *Given* `@startfoo`, *when* called, *then* `{UNKNOWN}` — not empty
4. *Given* a line with no start directive, *when* called, *then* the set is
   **empty** — distinct from `{UNKNOWN}`, per `:73-74`
5. *Given* leading whitespace or a `\start` form, *when* called, *then* it
   matches upstream's handling at `:70-76`

## Observability

N/A — no new observable operations.

## Rollback

Reversible — new files only.

## Quality bar

All four gates green. A test case per branch of upstream's switch. Each ported
tag carries its `DiagramType.java` line in a comment or a `@see`.

## Boundaries

- **Always:** preserve upstream names, including for unported diagram types
- **Never:** trim the enum to what this port implements; run Prettier

## Commit

`feat(T2): port DiagramType.findStartTypes candidate set`
