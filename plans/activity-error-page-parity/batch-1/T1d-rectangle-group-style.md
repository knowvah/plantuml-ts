# T1d — tidoda: rectangle group style keyed on the USymbol

## Context
tidoda-12-juxu745 draws in the jar; ours differs only at
`svg/g[1]/rect[1]/@fill` (maxDelta 0). Source:

```
skinparam rectangle { RoundCorner 25 / BackgroundColor red / BorderColor blue }
hide stereotype
rectangle outerAction {
:innerAction;
}
```

add4 recorded the mechanism as "`rectangle` group style not keyed on the
USymbol" — verify it, do not trust it (CLAUDE.md: read the Java first).
Upstream: `activitydiagram3/command/CommandPartition3.java:73` (TYPE regex),
`:89-103` (`getUSymbol`), `:150` (symbol chosen), `:161-165` (style/colour
lookup). Follow the symbol into the style resolution it drives and quote
every hop.

## Task
TDD. Make the group's fill/border/round-corner resolve from the USymbol's
skinparam block (`skinparam rectangle {…}` for `rectangle`, and likewise for
package/card/group/partition as upstream does). If the mechanism needs a
`src/core` style-engine change, stop (stop 8) and report it.

## Write-set
`src/diagrams/activity/group-dispatch.ts`,
`src/diagrams/activity/activity-style-defaults.ts`,
`src/diagrams/activity/activity-renderer-composite-symbols.ts`,
`src/diagrams/activity/activity-renderer-composite.ts`,
`tests/unit/activity/aepp-T1d-rectangle-group-style.test.ts`.

## Read-set
`src/diagrams/activity/group-dispatch.ts:1-60`; the two renderer-composite
files; `activity-style-defaults.ts`;
`test-results/dot-cache/activity/tidoda-12-juxu745/{in.puml,in.svg}`.

## Acceptance
- Given tidoda, when surveyed (`npm run svg:survey -- activity --out <tmp>`),
  then it is conformant.
- Given each USymbol keyword with its own skinparam block, when rendered, then
  the group takes that block's colours (unit test per keyword upstream maps).
- Given every other pinned activity fixture, then byte-identical; census
  movers reported with whether they equal the pin's `jar` column.

## Observability
N/A — no new observable operations.

## Rollback
Reversible.
