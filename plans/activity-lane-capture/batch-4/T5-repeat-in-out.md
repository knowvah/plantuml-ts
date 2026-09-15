# T5 — give `repeat` its opener and out swimlanes

**Agent:** `typescript-pro` · **Depends on:** T4

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md)
(stops 4–7, red allowance), [`../decisions.md`](../decisions.md) D1–D3 and D6,
and `.agent-notes/alc-T1.md#q3`.

Upstream: `InstructionRepeat`'s constructor stores
`swimlane = swimlanes.getCurrentSwimlane()` when `repeat` is parsed
(`InstructionRepeat.java:107`), and its body list defaults to that lane
(`:108`). `setTest` stores `swimlaneOut` when `repeat while` is parsed
(`:194-196`, called from `ActivityDiagram3.java:367`). `FtileRepeat.create`
draws the entry diamond in `swimlane` (`ftile/vcompact/FtileRepeat.java:136`)
and the INSIDE_HEXAGON condition diamond in `swimlaneOut` (`:149,152`). The
EMPTY_DIAMOND and INSIDE_DIAMOND styles use `swimlane` instead (`:157,162`).

Ours: `tryRepeat` (`src/diagrams/activity/node-dispatch.ts:187-233`) spreads
`swimlaneSpread(ctx)` after the body at `:230`. The inline `repeat :action;`
form already reads the lane at the opener (`:211`). `tileRepeat`
(`layout/tile-layout.ts:130-136`) sets one lane on `GtileRepeat`, and the
condition diamond inherits it.

**Fix:**
- `ActivityRepeat` gains `swimlaneOut?: string`.
- `tryRepeat` reads the opener lane before `parseNodes` (`:216`) and reads
  `swimlaneOut` from `ctx.currentSwimlane` when it reaches the `repeat while`
  line (`:220-225`).
- `tileRepeat` sets `swimlane` on the repeat tile. It sets the condition
  diamond's lane to `node.swimlaneOut ?? node.swimlane` for the hexagon style.
  Grep `conditionStyle` in `src/diagrams/activity` and the theme first: if
  non-hexagon styles are supported, they use `swimlane`, with a cite; if not,
  hexagon only, with a cite.
- Whether the repeat tile itself carries `swimlaneOut` follows T1's table.

**The six `*` fixtures** (`becanu`, `givanu`, `kasadu`, `kudedo`, `mafete`,
`manata`): upstream draws `ConnectionBackComplex1` (`FtileRepeat.java:188-196`)
from a diamond we do not have. Keep our `GConnectionDownThenUp`, and journal
each fixture's move against `activity-repeat-entry-diamond` (D3, stop 7).

## Read-set

- `src/diagrams/activity/node-dispatch.ts:181-233`;
  `src/diagrams/activity/ast.ts:80-110`
- `src/diagrams/activity/layout/tile-layout.ts:40-51,130-136`
- `src/diagrams/activity/layout/tile-coordinates.ts:238-300` (the repeat walker)
- `tests/diagrams/activity/layout/tile-layout.test.ts:1-60` (the pattern)
- `.agent-notes/alc-T1.md#q3` (the `repeat` rows)

## Write-set

`src/diagrams/activity/ast.ts`; `src/diagrams/activity/node-dispatch.ts`
(`tryRepeat` only); `src/diagrams/activity/layout/tile-layout.ts`
(`tileRepeat` only); `src/diagrams/activity/layout/tile-coordinates.ts` (only
if T1's table requires; journal it);
`tests/unit/activity/parser-lane-capture.test.ts`;
`tests/diagrams/activity/layout/tile-layout.test.ts`.

## Interface contract (consumed by T8's lane report)

```ts
interface ActivityRepeat { /* … */ swimlane?: string; swimlaneOut?: string }
```

## Acceptance criteria

- Given `|A|`, `repeat`, `|B|`, `:b;`, `repeat while (x)`, when parsed, then
  `swimlane` is `'A'` and `swimlaneOut` is `'B'`
- Given the same source, when laid out, then the `repeat-cond` node's lane is
  `'B'` and the body action's lane is `'B'`
- Given a repeat that opens and closes in one lane, then `swimlaneOut` equals
  `swimlane`, and geometry is unchanged from T4
- Given the probe, then only `repeat` rows move, every riser has a journal
  row, and each `*` row that moves names `activity-repeat-entry-diamond`

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint` and `build` green. `npm test` green, except the four
activity oracle gates on journaled `fixtures.md` slugs.

## Commit

`fix(alc-T5): give activity repeat its opener and out swimlanes`
