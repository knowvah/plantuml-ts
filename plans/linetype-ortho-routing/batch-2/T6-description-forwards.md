# T6 — description forwards `linetype`

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T4 and T5 have landed; 7 of the 8 fixtures
have moved.

## Task
Forward `linetype` onto the `DotInputGraph` at
`src/diagrams/description/layout.ts:246` (the `input` literal).

**This engine differs, deliberately ([D3]).** Its precedence is
`theme.linetype ?? ast.linetype`, not bare `theme.linetype` — and the value
is **already in scope** as a parameter at `layout.ts:208`, threaded from
`:469`. Use that parameter; do not re-derive it, and do not "normalise" the
precedence to match state/class. Description's own command table parses
`skinparam linetype` directly into `ast.linetype`
(`command-table-directives.ts:110`), which is why the fallback exists.

## Write-set
- `src/diagrams/description/layout.ts`
- `tests/unit/description/` — the existing suite for that file

**Not** state (T4's) or class (T5's), both now frozen.

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D3
- `src/diagrams/description/layout.ts:205-260` — the param and the assembly
- `src/diagrams/description/layout.ts:465-472` — where the precedence is formed
- `oracle/goldens/svg-conformance/splines-baseline.json` — T0's pin

## Architecture decisions
[D3] read `theme.linetype ?? ast.linetype` — this engine's label-half
expression, NOT the state/class one.

## Interface contracts
None consumed downstream.

## Acceptance criteria
- Given a description diagram with `skinparam linetype ortho`, when laid
  out, then the assembly at `:246` carries `linetype: 'ortho'`.
- Given only `ast.linetype` set (no theme value), then it is still honoured —
  the `??` fallback is exercised, not bypassed.
- Given `zosaxo-93-nici652`, then it moves and is named with a mechanism.
- Given the **7 non-component fixtures**, then none moves beyond what T4/T5
  already recorded — stop condition 1.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One assembly site.

## Quality bar
All four gates green, `Test Files` == **685**. `parity.json` will want
re-pinning — **T8's** job.

## Commit
`feat(lor-T6): forward linetype to the description layout graph`
