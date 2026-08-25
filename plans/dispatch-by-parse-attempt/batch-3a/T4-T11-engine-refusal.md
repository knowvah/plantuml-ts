# T4–T11 — strict refusal, one engine per task

**Shared specification.** Substitute your engine throughout. Your task ID and
engine come from [the batch overview](overview.md).

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec, and reading the Java **method body** —
not a filename, not this table — is the repo's most-violated and most-important
rule.

This mission ([README](../README.md)) replaces regex routing with upstream's
parse-attempt dispatch. That is impossible while our parsers are permissive.
Every one of these eight parse loops is a chain of `if (…) continue;` with no
`else`: an unrecognised line is silently dropped, so the parser always
"succeeds" and can never decline a source that is not its own.

Upstream fails instead. `PSystemCommandFactory.executeFewLines` calls
`getCandidate(it)`, and when no registered `Command` matches the line it builds
a `SYNTAX_ERROR "Syntax Error?"` and returns it as the diagram
(`PSystemCommandFactory.java:169-175`). `PSystemBuilder.isOk` (`:296`) then
rejects it and the next factory gets its turn.

## Task

Make your engine's parse loop refuse instead of skip.

Find the point where the loop falls off the end of its `continue` chain having
matched nothing. Return a `ParseRefusal` from `src/core/parse-refusal.ts` with
`kind: 'syntax'`, the line index, and the number of lines consumed so far.

Then read your engine's upstream factory and check the other three refusal
points — they are easy to miss and each one is a real upstream behaviour:

| Refusal | Upstream | What it means for you |
|---|---|---|
| command matched, execution failed | `PSystemCommandFactory.java:180-186` | your command handler reported failure — refuse with `kind: 'execution'` and its score |
| `isIncomplete()` | `:159-161` | e.g. an unclosed construct at end of source |
| `checkFinalError()` | `:148-152` | a whole-diagram validity check |

Implement the ones your engine's upstream counterpart actually has. If it has
none beyond the syntax case, say so explicitly in the decision journal — do not
invent one, and do not silently omit one that exists.

## Per-engine read-set

Read your own parser in full, plus your upstream factory's command
registration, so you know **which lines are legitimately recognised**. Refusing
a line upstream accepts is [stop condition 3](../README.md#stop-conditions) and
is the single most likely way this task goes wrong.

| Engine | Your parser | Upstream factory |
|---|---|---|
| sequence | `src/diagrams/sequence/parser.ts`, `sequence-commands.ts` | `sequencediagram/SequenceDiagramFactory.java` |
| class | `src/diagrams/class/parser.ts:430-470` | `classdiagram/ClassDiagramFactory.java` |
| activity | `src/diagrams/activity/parser.ts` | `activitydiagram3/ActivityDiagramFactory3.java` **and** `activitydiagram/ActivityDiagramFactory.java` — upstream has two, registered separately |
| description | `src/diagrams/description/parser.ts`, `command-table*.ts` | `descdiagram/DescriptionDiagramFactory.java` |
| state | `src/diagrams/state/parser.ts:190-210` | `statediagram/StateDiagramFactory.java` |
| board | `src/diagrams/board/parser.ts` | `board/BoardDiagramFactory.java` |
| chart | `src/diagrams/chart/parser.ts`, `line-handlers.ts` | `chart/ChartDiagramFactory.java` |
| packetdiag | `src/diagrams/packetdiag/parser.ts` | `packet/PacketDiagramFactory.java` |

Also read, all engines:

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:107-250` — including `getCandidate` (`:225-246`) and `safeIsValid` (`:256-266`), which show how a command declines
- `src/core/parse-refusal.ts` — T1's output
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java` — commands registered on **every** factory. A line handled here is recognised by all of them, and refusing it is a defect

## Write-set

Your engine's parser file(s) only, plus its unit tests. **Do not touch
`index.ts`, `accepts()`, the dispatcher, or another engine.** T12 owns those.

## Architecture decisions in force

- [D0](../decisions.md#d0) — the strict parse is the **real** parse path, not a
  dispatch-only probe. There is one parse path, not two
- [D1](../decisions.md#d1) — refusal is **returned**, never thrown
- [D6](../decisions.md#d6) — you are in scope because your upstream factory
  extends `PSystemCommandFactory`

## Acceptance criteria

1. *Given* a source containing a line no command in your engine recognises,
   *when* parsed, *then* a `ParseRefusal` with `kind: 'syntax'` is returned,
   naming that line index
2. *Given* a source every line of which your engine recognises, *when* parsed,
   *then* an AST is returned and it is **identical** to what the permissive
   parser produced — refusal must not change successful parsing
3. *Given* a line handled by `CommonCommands`, *when* parsed, *then* it is
   **accepted** — these are registered on every factory
4. *Given* a blank line or a comment, *when* parsed, *then* it is accepted;
   check how your parser and upstream each treat these before assuming
5. *Given* each additional refusal point your upstream factory implements,
   *when* triggered, *then* the corresponding `kind` is returned — or the
   decision journal records that your factory has none

## Observability

Report your engine's contribution to **SLI 2**: after your change, how many
corpus fixtures does your engine now error on that the jar rendered? T0's gate
records `engine` per entry, so filter to yours. **This number is the input that
sizes batches 4–6** — report it even if it is large, and especially if it is
large.

## Rollback

Reversible — revert the commit. Note that reverting one engine alone leaves the
batch incoherent; the atomic unit is 3a+3b.

## Quality bar

`npm run typecheck` and `npm run lint` must pass on your commit. **`npm test`
is expected to fail** at this point, batch-wide — that is the atomicity
described in the batch overview, not a defect in your task. Do not "fix" other
engines' failures, and do not weaken your refusal to make tests pass.

## Boundaries

- **Always:** read your upstream factory's command registration before
  deciding a line is unrecognised; report your SLI 2 contribution
- **Ask first:** a case where you cannot tell whether upstream accepts a line
- **Never:** refuse a line upstream accepts to make a number look better;
  touch another engine or `index.ts`; run Prettier; add a heuristic

## Commit

`feat(T<n>): strict unrecognised-line refusal in <engine> parser`
