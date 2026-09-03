# T5 — class forwards `linetype`

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T4 has landed; the 2 state fixtures have moved.

## Task
Forward `theme.linetype` onto the `DotInputGraph` at
`src/diagrams/class/class-dot-graph.ts:460` (the `dotGraph` literal, beside
`...sepAttrs(theme)`).

**Use `theme.linetype`** — the same expression the label half reads at
`class-dot-graph.ts:401`, where it is already passed into the edge builder as
`linetype: theme.linetype` ([D3]).

## Write-set
- `src/diagrams/class/class-dot-graph.ts`
- `tests/unit/class/` — the existing suite for that file

**Not** state (T4's, now frozen). **Not** description (T6).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D3
- `src/diagrams/class/class-dot-graph.ts:395-410` — the label half's expression
- `src/diagrams/class/class-dot-graph.ts:455-475` — the assembly
- `oracle/goldens/svg-conformance/splines-baseline.json` — T0's pin

## Architecture decisions
[D3] read `theme.linetype`, matching this engine's label half.

## Interface contracts
None consumed downstream.

## Acceptance criteria
- Given a class diagram with `skinparam linetype ortho|polyline`, when laid
  out, then the assembly at `:460` carries the matching `linetype`.
- Given `polyline` specifically, then the emitted DOT gains
  `splines=polyline;` and NO `forcelabels` ([D4]) — `kuxato-79-muno809` is
  the polyline fixture and is the one to check this on.
- Given the **5 class fixtures**, then each moves and each is named with a
  mechanism in the decision journal.
- Given the **3 non-class fixtures**, then none moves — stop condition 1.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One assembly site.

## Quality bar
All four gates green, `Test Files` == **685**. `parity-class.json` will want
re-pinning — **T8's** job, not this task's.

## Commit
`feat(lor-T5): forward linetype to the class layout graph`
