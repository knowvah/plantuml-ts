# T3 — The `element` line-thickness tier

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Read [`../decisions.md#d4`](../decisions.md). `LINE_THICKNESS_DEFAULTS`
(`activity-style-defaults.ts:~200-215`) falls back to
`ROOT_LINE_THICKNESS = 1` (`plantuml.skin:15`) for `activity`, `activityBar`
and `diamond`. The jar draws the action rect at `stroke-width:0.5`:
`FtileBox#drawU:208` applies `style.getStroke()`, and the merged style for
`of(root, element, activityDiagram, activity)` includes
`element { LineThickness 0.5 }` (`plantuml.skin:91-93`), which the
file-order overwrite merge (`StyleStorage.java:102-116`) lets beat the root.

## Read-set

- `src/diagrams/activity/activity-style-defaults.ts:150-225`
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:1-19, 84-100, 355-390`
- `style/StyleStorage.java:102-116`, `style/StyleSignatureBasic.java:260-275`
  (`activity()` and siblings), and the constructor of EACH tile you change
  the default for: `vertical/FtileBox.java:97-99`, the diamond
  (`ftile/FtileFactoryDelegator.java:80` or `vertical/FtileDiamondInside.java`),
  the bar (`vcompact/ParallelBuilderFork.java` / `FtileBlackBlock.java`) — cite
  the line that builds the signature and confirm `SName.element` is in it
- `tests/unit/activity/renderer-shapes.test.ts` — pins of `stroke-width="1"`

## Write-set

See the batch table. `docs/catalog.md` only on drift.

## Task

Tests first. Add `ELEMENT_LINE_THICKNESS = 0.5` cited to `plantuml.skin:93`;
for each of `activity`, `activityBar`, `diamond`, read its signature and,
if it contains `element` and declares no own LineThickness, make it the
default. Delete `ROOT_LINE_THICKNESS` if nothing reads it afterwards. Leave
arrow (1), composite (1.5), circle (1 / end 1.5), note (0.5), swimlane (1.5).

## Acceptance criteria

- Given the default theme, then `activityLineThickness(theme, 'activity')`
  is 0.5, cited; likewise each SName whose signature you confirmed
- Given a `<style> activityDiagram { activity { LineThickness 3 } }` bucket,
  then 3 wins
- Given arrow/composite/circle/note/swimlane, then unchanged
- Given the probe, then `rect[]/@stroke-width` (846) falls and every riser
  is named with a mechanism

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates; list them.

## Commit

`fix(amb-T3): resolve the element-tier 0.5 line thickness for activity boxes`
