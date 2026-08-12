# T1 — class port-band producer (pure, unit-tested, NOT wired)

## Prior observations

- `.agent-notes/T8-member-ports-wrong-mechanism.md` — the current class
  `::member` path is the wrong upstream mechanism. You are building its
  replacement's *input half*; you do **not** switch anything over in this
  task.
- The election algorithm is already ported and faithful
  (`src/core/cucadiagram/MethodsOrFieldsArea.ts:215-275`). Reuse it. Do not
  reimplement `getElected`/`getScore`/`sortBySize`.
- `Ports#add` keeps the **higher** score for a duplicate id
  (`svek/Ports.java:70-76`), so a 100 beats a 50 for the same short name.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. This task adds the class arm beside the
existing `mapPortRows` in `src/diagrams/class/class-port-rows.ts`.

The band source — block tree vs flat sizer — was decided by
[T0](../batch-0/T0-band-source-gono-go.md). **Read its journal entry and
use the source it names.** If T0 has not run, stop.

## Task

Add `classPortRows(classifier, measured)` returning `DotInputPortRow[]`,
mirroring `EntityImageClass#getPorts` (`svek/image/EntityImageClass.java
:247-253`): body bands from the source T0 chose, translated by the header
height.

**Do not wire it.** `applyShapeAndPorts` keeps its current `map`-only
behavior in this task, so the tree's rendered output is unchanged and every
gate stays green on the existing numbers. The wiring is T2.

## Write-set

- `src/diagrams/class/class-port-rows.ts`
- `tests/unit/class/class-port-rows.test.ts` (new)

## Read-set

- `../decision-journal.md` — T0's entry. **The band source is not yours to
  choose.**
- `~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:194-236` — read
  the method body.
- `~/git/plantuml/.../svek/image/EntityImageClass.java:247-259`
- `src/core/cucadiagram/MethodsOrFieldsArea.ts:215-275`
- `src/diagrams/class/class-port-rows.ts:1-128` — `mapPortRows`, whose doc
  comment is the model for the one you write.
- `src/core/svek/Ports.ts`

## Architecture decisions in force

[ADR-1](../decisions.md) (resolved by T0 — obey it), ADR-4, ADR-5.

## Interface contract — consumed by T2

```ts
export function classPortRows(
  classifier: Classifier,
  measured: MeasuredClassifier,
): DotInputPortRow[];
// [] when the classifier has no port short names.
// Each: { id: 'p<md5(shortName)>', position: number, height: number }
// position/height are UNtruncated here; the emitter applies (int).
```

## Acceptance criteria

- Given a member whose `getDisplay(false)` contains the short name as a
  whole word, when bands are produced, then that band's id is `p` + MD5 of
  the **short name** (not the member text) and its elected score is 100.
- Given a member matching only as a substring, then the score is 50; and
  given both a 100 and a 50 competing for one id, then the 100 survives.
- Given a classifier with no port short names, then the result is `[]`.
- Given ADR-5, then the election input equals `Member.getDisplay(false)` —
  assert this on a member **with** a visibility char, where that form
  differs from the rendered one. A test that only uses unprefixed members
  cannot detect the drift this criterion exists to catch.
- Given the four quality gates, then all pass and **no** frozen count moves
  — this task is inert by construction.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible.** Additive; nothing calls the new function yet.

## Quality bar

TDD: the failing unit test precedes the implementation. Every constant
carries its upstream `file:line`. Four gates green, unpiped.

## Boundaries

- **Always:** cite upstream `file:line`; reuse the ported election.
- **Ask first:** any change outside the write-set.
- **Never:** wire the producer in this task; fit a value; reimplement
  `getElected`/`getScore`/`sortBySize`.

## Commit format

```
feat(T1): produce class member-row port bands
```
