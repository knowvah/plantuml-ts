# T7 — Generic `Command<S>` in `core/command/`

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec). Pure SVG, vitest, 500-line cap. Upstream has one
`command/Command.java` (58 lines: `getMatcher`, `execute`, `isEligibleFor
(ParserPass)`, `getDescription`). We have the same TS interface FOUR times:
`class/class-command-types.ts:12`, `description/command-table-types.ts`,
`sequence/sequence-parse-helpers.ts:50`, `state/state-commands.ts:37` (state's
adds `passes` — the `isEligibleFor` mirror). `core/command/` already holds
`ParserPass.ts` and `CommandExecutionResult.ts`.

## Task

1. Read `Command.java` and the four interfaces (+ state's `passes` doc
   `:37-60`).
2. Write `src/core/command/Command.ts`: `export interface Command<S> {
   pattern: RegExp; execute(state: S, match: RegExpExecArray): void; passes?:
   readonly ParserPass[]; }` with a doc mapping each field to `Command.java`
   lines (`passes` ↔ `isEligibleFor`; absent = eligible on every pass, which
   is exactly what the three engines without it do today — say so).
3. Each engine file: `import type { Command as CoreCommand } from
   '../../core/command/Command.js'; export type Command = CoreCommand<
   ParseState>;` — keep the export name so no caller changes. State: verify
   its dispatcher (`parser.ts#dispatchCommand`) still type-checks with the
   optional `passes`.
4. Tests: a type-level test (`expectTypeOf`) that each engine `Command` is
   assignable to `CoreCommand<their ParseState>`; no runtime change.
5. Manifest: EMPTY (types only — run `--only class,state` as a sanity check).

## Write-set

`src/core/command/Command.ts` (new), `src/diagrams/class/class-command-types
.ts`, `src/diagrams/description/command-table-types.ts`, `src/diagrams/
sequence/sequence-parse-helpers.ts`, `src/diagrams/state/state-commands.ts`
(interface block only), `tests/unit/core/command/Command.test.ts` (new).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java`
- `src/core/command/ParserPass.ts`, the four interface sites, `src/diagrams/
  state/parser.ts` (`dispatchCommand`)
- `decisions.md#d4`

## Architecture decisions

D4 locked: field names `pattern`/`execute`/`passes`; do NOT rename to
`getMatcher`/`isEligibleFor` (that is not a move).

## Interface contract (consumed by T9)

`core/command/Command.js#Command<S>` as above.

## Acceptance criteria

- Given the four engines, then each `Command` type is an alias of
  `CoreCommand<ParseState>` and `npm run typecheck` is green.
- Given `src/`, then the `{ pattern; execute }` interface literal appears
  once, in `core/command/Command.ts`.

## Quality bar

4 gates green. Commit `refactor(T7): generic core Command<S>; engines alias it`.

## Observability

N/A.

## Rollback

Reversible.
