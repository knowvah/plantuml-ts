# T4 — stop the descriptive signal declining real sequence diagrams

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing.**

This is the mission's largest bucket: **36 fixtures**, two directions, one
shared file.

**34 × SEQUENCE → DESCRIPTION.** Sequence's `accepts` opens with
`if (hasDescriptiveSignal(lines)) return false;`
(`src/diagrams/sequence/index.ts:36-41`). The guard exists for a real reason —
its comment records it, and AC2 below protects it — but it **over-declines**.
`butofu-60-kene642` is an unambiguous sequence diagram:

```
participant foo as f
queue bar as q
participant baz as b
f -> q: Enqueue
```

The jar renders it `SEQUENCE`. We render it `DESCRIPTION`, because `queue` is
both a sequence participant type — it is listed in `SEQUENCE_PATTERNS[1]`,
in the same file that then declines it — and a description keyword. The two
keyword sets **overlap**, and the guard treats the overlap as decisive for
description.

**2 × CLASS → DESCRIPTION.** The same file, the other direction:
`component/gutute-00-gaki684` and `component/kokebo-27-vafi688` are CLASS
diagrams per the jar, and description claims them. Do not assume this is the
same defect inverted — diagnose it before deciding whether one change closes
both. It may be a second mechanism in the same module.

**Why upstream needs no such guard.** `DescriptionDiagramFactory` and
`SequenceDiagramFactory` genuinely overlap on these keywords too. Upstream
resolves it by factory **order** plus **parse failure**
(`PSystemBuilder.java:257-266`), not by a keyword veto. We cannot copy that
here — see D1 — so the guard has to become more precise instead.

## Task

Make the guard distinguish "this line uses a shared keyword as a **sequence
participant declaration**" from "this diagram is descriptive".

Write the test first (TDD).

## Read-set

- `src/core/descriptive-keywords.ts` — `hasDescriptiveSignal` and its sibling
  `hasDescriptiveElement`, both in full
- `src/diagrams/sequence/index.ts:17-43` — `SEQUENCE_PATTERNS`, the caller,
  and the comment recording why the guard was added
- `~/git/plantuml/.../descdiagram/DescriptionDiagramFactory.java` and
  `~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java` — the
  command lists, i.e. what each factory genuinely accepts. The overlap is
  real; what differs is how upstream breaks it
- `~/git/plantuml/.../sequencediagram/command/CommandParticipant.java` — the
  participant-declaration grammar, which is what "used as a participant type"
  has to mean
- `test-results/dot-cache/sequence/butofu-60-kene642/in.puml`
- `test-results/dot-cache/component/gutute-00-gaki684/in.puml` — the other
  direction
- `../decisions.md#d1`, `../decisions.md#d2`

## Write-set

- `src/core/descriptive-keywords.ts`
- `tests/unit/core/descriptive-keywords.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it. In particular: if the fix appears to belong in
`src/diagrams/sequence/index.ts`, stop — that file is T7's write-set and the
overlap is a signal the mechanism has been misread.

## Acceptance criteria

1. Given `queue bar as q` alongside `f -> q: Enqueue`, when sequence's
   `accepts` runs, then `true`
2. Given the use-case/deployment source the guard was originally added for
   (find it — the comment names the shape: `actor Bob` plus `(Login)`), then
   sequence still declines. Deleting the guard trades one misroute class for
   another and is not a fix
3. Given the routing gate, then `SEQUENCE -> DESCRIPTION` and
   `CLASS -> DESCRIPTION` are **both empty**, and all 36 report
   `jarType === ourType`
4. Given the 51 promoted zero-diff fixtures in
   `oracle/goldens/svg-description/ratchet.json`, then none is de-promoted.
   **This is the acceptance criterion that matters most**: it is the guard
   that you did not fix sequence by breaking description
5. Given the 314 promoted fixtures in `svg-class/ratchet.json`, then none is
   de-promoted — the class engine reads this module too

## Quality bar

All four gates green. `descriptive-keywords.ts` is shared by three engines;
AC4 and AC5 are not formalities.

Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch range, not the task.

## Boundaries

- **Always:** keep the original guard's purpose working (AC2). It was added
  against a real defect
- **Never:** widen the descriptive keyword set; special-case a slug; touch
  `src/index.ts` (D1) or `src/diagrams/sequence/index.ts` (T7's write-set)
- **Ask first:** if the two cases cannot be told apart from the line text —
  that means the answer is parse-attempt, which is
  `dispatch-by-parse-attempt` and a stop condition here

## Commit

One commit: `fix(T4): stop descriptive signal declining sequence participants`
