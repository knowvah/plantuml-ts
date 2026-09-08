# T4 — Derive the box constants from resolved font and padding

**Agent:** `typescript-pro`
**Depends on:** T2

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md);
[D8] governs this task and is locked.

`activity-layout-constants.ts` hardcodes `ACTION_HEIGHT = 36` and
`ACTION_H_PAD = 16`. Upstream has no such constants — the box size falls
out of `FontSize 12` + `Padding 10` (`plantuml.skin:360-361`).

## Read-set

- `src/diagrams/activity/activity-layout-constants.ts` (29 lines)
- `src/diagrams/activity/activity-layout-leaf.ts` (135 lines)
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:358-385`
- The upstream ftile that sizes an activity box — locate it under
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`
  and **read the method that computes its dimension**, not just the class
  name. Record the `file:line` in the journal.

## Write-set

- `src/diagrams/activity/activity-layout-constants.ts`
- `src/diagrams/activity/activity-layout-leaf.ts`
- `tests/unit/activity/activity-layout-constants.test.ts`

## Task

Replace the fixed `ACTION_HEIGHT` / `ACTION_H_PAD` with values derived from
the resolved font size and padding, per the upstream ftile's own arithmetic.

**[D8] is explicit: do not substitute the jar's observed `32`.** The jar's
rect measures 32 on `bakopu-96-pudu086`; if your derivation lands on 32
that is corroboration, and if it does not, the derivation is what ships and
the gap is a journal finding. Fitting is forbidden.

## Boundaries

**Always:** the derivation carries the Java `file:line` it came from.
**Never:** write `32`, or any other value read off a golden.
**Ask first (halt and journal):** if the upstream ftile's dimension method
cannot be located — an un-located spec is a halt, not a licence to fit.

## Acceptance criteria

- Given the default theme, when an activity box is sized, then its height
  is computed from the resolved `activity` font size and padding, and the
  computation cites its upstream `file:line`
- Given `skinparam activity { FontSize 20 }`, when a box is sized, then its
  height grows accordingly — a fixed constant could not do this
- Given `grep -n "36" activity-layout-constants.ts`, when run, then
  `ACTION_HEIGHT` is no longer a literal
- Given the activity ratchet, when run, then no fixture rises against T0's
  pin, or every riser is named with a mechanism

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`.

## Commit

`refactor(asd-T4): derive activity box size from font and padding`
