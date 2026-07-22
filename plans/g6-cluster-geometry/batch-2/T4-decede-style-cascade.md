# T4 — decede's `<style>stateDiagram{}</style>` cascade

## Prior observations

- G5 C5 item 4 named this gap: `decede-10-buvu414` carries a
  `<style>stateDiagram{ ... }</style>` block whose cascade this port
  does not apply; the jar oracle SVG shows the styled result. It is
  unrelated to mechanism 16 (cluster geometry) but blocks decede's
  byte-exact pin.
- `src/core/skinparam.ts` already implements `parseStyleBlock` and
  `resolveSkinparam`; state-side consumption lives in
  `src/diagrams/state/state-render-colors.ts`.

## Context

plantuml-ts style resolution. Decision D4 (decisions.md): extend the
EXISTING style-block machinery; no state-renderer special-case parser;
`cleanForKeySlow` key normalization must not change. Upstream
reference for `<style>` semantics: `~/git/plantuml/.../style/` (grep
`src/main/java/net/`, never a subtree).

## Task

1. Diagnose first (diagnosis.md applies — this is an observed
   discrepancy): render decede, diff against its jar oracle, and
   enumerate exactly which SVG attributes differ due to the style
   block. Trace where the cascade drops: parse? resolution? state
   consumption?
2. Fix at the origin: extend `parseStyleBlock`/`resolveSkinparam`
   selector handling and/or `state-render-colors.ts` consumption so
   decede's `stateDiagram{}` selectors cascade as jar does.
3. Unit tests: the specific selector forms decede uses, plus one
   negative case (a selector that must NOT match).
4. Verify no other diagram family regresses (`npm test` full suite —
   skinparam is shared infrastructure).

## Write-set

`src/core/skinparam.ts`, `src/diagrams/state/state-render-colors.ts`,
nearest existing unit test files for each.

## Read-set

`decisions.md#d4`; decede's fixture source + jar oracle SVG;
`src/core/skinparam.ts` (symbol overview via Serena, then only the
selector-resolution bodies); G5 ledger §C5 item 4.

## Acceptance criteria

- Given decede's style block, when rendered, then every
  style-attributable attribute matches the jar oracle (enumerated in
  step 1; each asserted).
- Given the full suite, when run, then zero regressions outside state
  (skinparam is shared — description/class/object gates all stay
  green).
- Given `cleanForKeySlow`-dependent keys, when resolved, then behavior
  is unchanged (existing tests stay green untouched).

## Quality bar

`npm test && npm run typecheck && npm run lint` green.

## Boundaries

No changes to key normalization; no renderer special-cases; no git
mutations.

## Observability / Rollback

N/A new operations; Reversible (git revert).
