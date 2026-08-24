# T5 — stop `hasDescriptiveSignal` declining real sequence diagrams

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

Sequence's `accepts` opens with `if (hasDescriptiveSignal(lines)) return false;`
(`src/diagrams/sequence/index.ts:36-40`). That guard exists for a real reason —
the comment records it — but it **over-declines**.

`butofu-60-kene642` is an unambiguous sequence diagram:

```
participant foo as f
queue bar as q
participant baz as b
f -> q: Enqueue
```

and the jar renders it `SEQUENCE`. We render it `DESCRIPTION`, because `queue`
is both a sequence participant type (`SEQUENCE_PATTERNS[1]` lists it) and a
description keyword. The two keyword sets **overlap**, and the guard treats
the overlap as decisive for description.

**Check the residual first** — T2's reorder may have closed this bucket
already. If `SEQUENCE -> DESCRIPTION` is empty, close as a measured no-op.

## Task

Make the guard distinguish "this line uses a shared keyword as a **sequence
participant declaration**" from "this diagram is descriptive".

Write the test first (TDD).

## Read-set

- `src/core/descriptive-keywords.ts:437-511` — `hasDescriptiveSignal`
- `src/core/descriptive-keywords.ts:512+` — `hasDescriptiveElement`, its sibling
- `src/diagrams/sequence/index.ts:36-41` — the caller and its comment
- `~/git/plantuml/.../descdiagram/DescriptionDiagramFactory.java` and
  `~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java` — what each
  upstream factory actually accepts; the overlap is resolved upstream by
  factory ORDER plus parse failure, which is why upstream needs no such guard
- `../decisions.md#d2`

## Write-set

- `src/core/descriptive-keywords.ts`
- `tests/unit/core/descriptive-keywords.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given `queue bar as q` alongside `f -> q: Enqueue`, when sequence's
   `accepts` runs, then `true`
2. Given the use-case/deployment source the guard was originally added for
   (find it — the comment names the shape: `actor Bob` plus `(Login)`), then
   sequence still declines
3. Given the routing gate, then the `SEQUENCE -> DESCRIPTION` bucket is empty
   and the `CLASS -> DESCRIPTION` bucket has not grown
4. Given the 51 promoted zero-diff fixtures in
   `oracle/goldens/svg-description/ratchet.json`, then none is de-promoted

## Quality bar

All four gates green. `descriptive-keywords.ts` is shared by class and
description as well as sequence — AC4 is the guard that you did not fix
sequence by breaking description.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch, not the task.

## Boundaries

- **Always:** keep the original guard's purpose working (AC2). It was added
  against a real defect; deleting it trades one misroute class for another
- **Never:** widen the descriptive keyword set; special-case the one slug
- **Ask first:** if the two cases cannot be told apart from the line text —
  that means the answer is parse-attempt (D2), a stop condition here

## Commit

One commit: `fix(T5): stop descriptive signal declining sequence participants`
