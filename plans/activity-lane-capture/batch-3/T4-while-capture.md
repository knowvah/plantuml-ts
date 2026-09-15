# T4 — capture the `while` swimlane at its opener

**Agent:** `typescript-pro` · **Depends on:** T2, T3

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md)
(stops 4–6, red allowance), [`../decisions.md`](../decisions.md) D1, D2 and
D6, and `.agent-notes/alc-T1.md#q3`. `tryWhile`
(`src/diagrams/activity/node-dispatch.ts:154-179`) parses the body (`:160`)
and then spreads `swimlaneSpread(ctx)` (`:176`). Upstream builds
`new InstructionWhile(swimlanes.getCurrentSwimlane(), …)` when the `while`
line is parsed (`ActivityDiagram3.java:397`; stored at
`InstructionWhile.java:101`), and `GtileWhile.createWhile`/`createWhile`
draw with that lane (`InstructionWhile.java:115,124`). `InstructionWhile`'s
own getters return the parent's lanes (`:175-181`). T1's table says whether
any of our while call sites (`layout/walk-while-branch.ts:48-61`) must read
differently; if it names none, `walk-while-branch.ts` stays untouched.

**Fix:** read the lane before `parseNodes` at `:160`, spread it at `:176`,
and add a JSDoc `@see` to `ActivityDiagram3.java:397`.

## Read-set

- `src/diagrams/activity/node-dispatch.ts:154-179`
- `src/diagrams/activity/layout/walk-while-branch.ts:40-65`
- `tests/unit/activity/parser-lane-capture.test.ts` (T3's helper)
- `.agent-notes/alc-T1.md#q3` (the `while` rows)

## Write-set

`src/diagrams/activity/node-dispatch.ts` (`tryWhile` only);
`src/diagrams/activity/layout/walk-while-branch.ts` (only if T1's table
requires; journal it); `tests/unit/activity/parser-lane-capture.test.ts`.

## Acceptance criteria

- Given `|A|`, `while (x)`, `|B|`, `:b;`, `endwhile`, when parsed, then the
  while node's `swimlane` is `'A'` and the action's is `'B'`
- Given the probe against the T3 measurement, then only `while` rows of
  `fixtures.md` change, and every riser has a journal row before the commit
- Given T1's table, then every while call site it lists reads the lane it names

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint` and `build` green. `npm test` green, except the four
activity oracle gates on journaled `fixtures.md` slugs.

## Commit

`fix(alc-T4): capture the activity while swimlane at its opener`
