# T4 — state forwards `linetype` (3 assembly sites, 2 files)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T1–T3 have landed and are inert.
**This is the first task that moves geometry.**

## Task
Forward `theme.linetype` onto the `DotInputGraph` at all THREE state
assembly sites:

| file | line | site |
|---|---|---|
| `state-dot-graph.ts` | ~321 | flat pipeline `buildDotGraph` return |
| `state-composite-pass.ts` | ~240 | `runPass` |
| `state-composite-pass.ts` | ~410 | `buildTopLevelPass` |

**Use `theme.linetype` — the SAME expression the label half already reads**
at `state-dot-graph.ts:238` and `state-composite-edge-label.ts:98` ([D3]).
The two halves must agree; a different expression would let a diagram get
xlabels without ortho routing.

Note `runPass` sets `omitSepAttrs: true` — irrelevant here, T2/T3 already
emit splines outside that guard, and pavuzo's cached DOT proves upstream
does too.

## Write-set
- `src/diagrams/state/state-dot-graph.ts`
- `src/diagrams/state/state-composite-pass.ts`
- `tests/unit/state/` — the existing suites for those files

**Not** class (T5). **Not** description (T6).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D3
- `src/diagrams/state/state-dot-graph.ts:238` — the label half's expression
- `src/diagrams/state/state-composite-pass.ts:238-252,405-425` — two sites
- `oracle/goldens/svg-conformance/splines-baseline.json` — T0's pin

## Architecture decisions
[D3] read `theme.linetype`, matching this engine's label half.

## Interface contracts
None consumed downstream.

## Acceptance criteria
- Given a state diagram with `skinparam linetype ortho`, when laid out, then
  all three assembly sites produce a `DotInputGraph` carrying
  `linetype: 'ortho'`.
- Given the routing half's expression, then it is **textually the same** as
  the label half's at `state-dot-graph.ts:238` ([D3]).
- Given `pavuzo-79-zodu430`, then
  `npx jiti scripts/measure-composite-declared-size.ts pavuzo-79-zodu430`
  scope 2 width idx 2 improves from `-1.579968 px` to **~0.002 px**. A
  materially different value is stop condition 5 — never fit it.
- Given `kejabo-83-vinu490`, then it moves, and the movement is named with a
  mechanism in the decision journal.
- Given the **6 non-state fixtures**, then none moves — stop condition 1.

## Observability
N/A — no new observable operations. The measurement is
`measure-composite-declared-size.ts` plus the pinned gates.

## Rollback
**Reversible.** Three assembly sites; `git revert` restores curved routing.

## Quality bar
All four gates green, `Test Files` == **685**. Expect `size-backlog.json` and
`parity-state.json` to want re-pinning — that is **T8's** job, not this
task's. Do not re-pin here.

## Commit
`feat(lor-T4): forward linetype to the state layout graph`
