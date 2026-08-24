# T2 — stop the swimlane pattern claiming sequence spacers and creole tables

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing** — not this file's summary.

`src/diagrams/activity/index.ts`, `ACTIVITY_ACCEPTS_PATTERNS`, carries:

```ts
/^\|.+\|/,                   // |swimlane|
```

It is a bare "starts with a pipe, ends with a pipe" test, and it claims three
things that are not swimlanes. All nine fixtures in this bucket are sequence
diagrams per the jar, and all nine trip **this one pattern**:

| the line | what it actually is | fixtures |
|---|---|---|
| `\|\|\|` | sequence's spacer directive | `caxali-40-cotu420`, `dugeki-47-celo546`, `xucibo-16-zisi974` |
| `\|\|0\|\|` | sequence's parameterised delay | `fotiku-67-lilu728`, `telavi-12-pifu671` |
| `\|= \|= Type \|`, `\| Item1 \| 1 \| 3 \|` | **creole table rows** inside a `legend` | `kuputa-52-caxa434`, `ramive-48-vabu271`, `rilefo-62-jedi773`, `togopo-38-tuza899` |

The bucket reads `SEQUENCE -> NONE` rather than `SEQUENCE -> ACTIVITY` only
because the activity engine emits no `data-diagram-type` at all — its
`RenderFragment` carries no `diagramType` field. The routing defect is
complete on its own; whether the activity render then also throws is
incidental.

## Task

Narrow the swimlane pattern so it matches a swimlane declaration and not a
sequence spacer, a delay, or a creole table row. Derive the shape from
upstream's own swimlane grammar, not from what makes these nine fixtures
pass.

Write the test first (TDD).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/command/CommandSwimlane.java`
  and `CommandSwimlane2.java` — the real grammar, and what upstream requires
  between the pipes
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:105-150`
  — the command list this port's `accepts()` patterns actually mirror
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandDelay.java`
  and the `\|\|\|` spacer command — what the strings above mean upstream
- `src/diagrams/activity/index.ts:17-64` — the pattern list, its long doc
  comment (it records a previous over-claim through `end`, which is the same
  failure mode) and `accepts`
- `test-results/dot-cache/sequence/caxali-40-cotu420/in.puml` and
  `.../kuputa-52-caxa434/in.puml` — the two distinct shapes
- `../decisions.md#d2`, `../decisions.md#d3`

## Write-set

- `src/diagrams/activity/index.ts`
- `tests/unit/activity/accepts.test.ts` (new)

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it.

## Acceptance criteria

1. Given `|||`, `||0||`, `|= |= Type |` and `| Item1 | 1 | 3 |`, when
   activity's `accepts` runs on a source containing only that plus sequence
   messages, then `false` for each
2. Given a real swimlane declaration in every form `CommandSwimlane` and
   `CommandSwimlane2` accept, then `true` for each — table-driven, citing the
   command class. A narrowing that breaks a real swimlane is worse than the bug
3. Given the routing gate, then **8 of the 9** fixtures report
   `jarType === ourType === 'SEQUENCE'`, and no other bucket grew
4. Given `sequence/dugeki-47-celo546`, then it closes **only if T3 has
   landed** — measured, it falls through to yaml otherwise. If T3 has landed
   and it still does not close, that is a finding, not a rounding error:
   diagnose it before proceeding (D2)
5. Given every fixture under `test-results/dot-cache/` that the jar calls
   `ACTIVITY`, then none newly misroutes — the narrowing must not cost real
   activity diagrams

## Quality bar

All four gates green. Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations. The measurement surface is T1's gate.

## Rollback

Reversible, but not independently: reverting this without batch 6's re-pins
leaves baselines pinned to output that no longer exists. Revert the batch
range, not the task.

## Boundaries

- **Always:** derive the accepted swimlane syntax from the upstream command
  classes, and cite them in a comment beside the pattern
- **Never:** widen any pattern in this file; special-case a slug; touch the
  activity parser, layout or renderer — this is dispatch only; change
  `src/index.ts` (D1)
- **Ask first:** if a sequence spacer and a swimlane cannot be told apart
  from the line text — that means the answer is parse-attempt, which is
  `dispatch-by-parse-attempt` and a stop condition here

## Commit

One commit: `fix(T2): stop the swimlane pattern claiming sequence spacers`
