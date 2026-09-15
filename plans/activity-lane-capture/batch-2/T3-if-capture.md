# T3 — capture the `if` swimlane at its opener

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md)
(stops 4–6, red allowance), [`../decisions.md`](../decisions.md) D1 and D6,
and `.agent-notes/alc-T1.md`. `tryIf` (`src/diagrams/activity/
if-dispatch.ts:164-192`) parses the then-branch (`:172`) and every
elseif/else clause (`:176`), and only then spreads `swimlaneSpread(ctx)`
(`:189`). So `if.swimlane` is the lane current at `endif`. Upstream builds
`new InstructionIf(swimlanes.getCurrentSwimlane(), …)` when the `if` line is
parsed (`ActivityDiagram3.java:309`), and `InstructionIf` returns that one
lane for both In and Out (`InstructionIf.java:247-253`).

**Fix:** read `swimlaneSpread(ctx)` into a local BEFORE `parseNodes` at
`:172`, spread the local at `:189`, and add a JSDoc `@see` to
`ActivityDiagram3.java:309`.

**`switch`:** zero laned baseline fixtures, but it belongs to the same class
(`ActivityDiagram3.java:277`). Grep how activity dispatches `switch`. If it is
in `if-dispatch.ts` and captures after its body, fix it here with its own
test. If it lives in any other file, FILE it in the journal and do not touch it.

## Read-set

- `src/diagrams/activity/if-dispatch.ts:164-192`
- `src/diagrams/activity/dispatch-support.ts:112-141`
- `tests/unit/activity/parser.test.ts:1-40` (the `parse` helper to copy) and
  `:276-292` (the existing swimlane test)
- `.agent-notes/alc-T1.md#q3` (the `if` rows)

## Write-set

`src/diagrams/activity/if-dispatch.ts`;
`tests/unit/activity/parser-lane-capture.test.ts` (new; T4–T7 append to it).

## Task

Tests first, in the new file with a `describe('if captures its opener lane')`
block. Then the two-line fix. Run the probe against `measurements/base.json`.
Journal every riser's mechanism BEFORE committing (stop 5).

## Acceptance criteria

- Given `|A|`, `if (x) then`, `|B|`, `:b;`, `endif`, when parsed, then the if
  node's `swimlane` is `'A'` and the action's is `'B'`
- Given lane switches in an `elseif` and an `else` branch, then the if node's
  `swimlane` is still the lane at `if`
- Given no lane declaration, then `swimlane` is `undefined`
- Given the probe, then every changed slug is an `if` row of `fixtures.md`,
  and every riser has a journal row

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint` and `build` green. `npm test` green, except the four
activity oracle gates on journaled `if` slugs (list each file with its slug count).

## Commit

`fix(alc-T3): capture the activity if swimlane at its opener`
