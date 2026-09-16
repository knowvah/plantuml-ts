# T2 — edge decorations and the if shapes the renderer lacks

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see` on ported symbols). Read
[`../README.md`](../README.md) (stops 5, 12), [`../decisions.md`](../decisions.md)
D2, D3, D6 (locked) and `.agent-notes/aitp-T1.md` Q3, Q5.

Four gaps the builder tasks need closed first:

1. **No end arrowhead.** `ConnectionHorizontalThenVertical` is built with a
   `null` end decoration when its branch is empty (`cond/FtileIfWithLinks
   .java:96-101`); `…Direct` (`:288-367`) and `ConnectionHline` draw none.
   `renderer.ts:170-174` always draws the tip.
2. **Mid-arrow placement.** `Worm#drawInternalOneColor` marks the FIRST
   segment whose `Direction.fromVector(p1, p2)` equals `emphasizeDirection`
   (`Worm.java:138-139`) and draws `arrows.asTo(direction)` at that
   segment's midpoint (`:178-183`). Ours draws `midArrow` on the LONGEST
   segment (`renderer.ts:176-195`). The only emitter is the repeat back-edge
   (`tile-coordinates.ts:281-286,292-297` — check which sets `midArrow`).
3. **`if-merge` draws nothing** (`activity-renderer-shapes.ts:539-540`) and
   takes no compress slot (`compress/shapes-of.ts:133` `NO_SHAPE_KINDS`).
   The jar's `diamond2` is `FtileDiamond`: a 24x24 rhombus at `(12,0)
   (24,12) (12,24) (0,12)` (`Hexagon.java:49-56`), north label height
   added above (`vertical/FtileDiamond.java:85-112`).
4. **No `if-label` node kind** for the branch labels (D3).

**Fix.** `ActivityEdgeGeo` gains `arrowhead?: false` and `emphasize?: 'up' |
'down' | 'left' | 'right'`, `midArrow` is removed; `renderEdge` skips the
tip when `arrowhead === false` and places the emphasized arrow per
`Worm.java:138-139,178-183`, using `arrowDirection`/`arrowHeadPoints`
(`arrows-regular.ts`) as today. The repeat back-edge sets `emphasize: 'up'`
if that is what `ConnectionBackSimple`/`FtileRepeat` does — read
`vcompact/FtileRepeat.java` for the `emphasizeDirection` call and cite it;
if the jar passes no emphasis there, say so and keep whatever Q3 showed
the golden draws. `renderNode` draws `if-merge` as the rhombus with the
diamond stroke/fill and `if-label` via `renderLabel` with the `arrow`
SName at Q5's baseline convention; `shapes-of.ts` gives both a box
(`polygon` for `if-merge`, text for `if-label`).

## Read-set

- `src/diagrams/activity/activity-layout-types.ts:37-42`
- `src/diagrams/activity/renderer.ts:139-205`
- `src/diagrams/activity/activity-renderer-shapes.ts:280-330,372-400,505-545`
- `src/diagrams/activity/arrows-regular.ts:20-120`
- `src/diagrams/activity/layout/compress/shapes-of.ts:100-170`
- `src/diagrams/activity/layout/tile-coordinates.ts:238-300`
- `.agent-notes/aitp-T1.md#q3`, `#q5`
- Java: `Worm.java:120-183`; `vertical/FtileDiamond.java:85-112`;
  `Hexagon.java:44-56`; `vcompact/FtileRepeat.java` (the back
  connection's `Snake.create` and any `emphasizeDirection`)

## Write-set

`src/diagrams/activity/activity-layout-types.ts`, `renderer.ts`,
`activity-renderer-shapes.ts`, `layout/compress/shapes-of.ts`,
`layout/tile-coordinates.ts` (the repeat case's `midArrow` field ONLY);
`tests/unit/activity/renderer.test.ts`,
`tests/diagrams/activity/layout/compress/shapes-of.test.ts`,
`tests/diagrams/activity/layout/tile-coordinates.test.ts` — assertions the
rename/new fields touch, plus new Given/When/Then below;
`plans/activity-if-tile-port/measurements/t2.json`;
`plans/activity-if-tile-port/decision-journal.md` (rows);
`docs/catalog.md` on drift.

## Interface contract (consumed by T3–T5)

```ts
interface ActivityEdgeGeo {
  points: Array<{ x: number; y: number }>;
  label?: string;
  color?: string;
  /** `false` = no end decoration (`Snake.create(skin, color)` with no arrow). */
  arrowhead?: false;
  /** `Snake#emphasizeDirection`: arrow at the midpoint of the FIRST segment in this direction. */
  emphasize?: 'up' | 'down' | 'left' | 'right';
}
```
Node kinds `'if-merge'` (rhombus, `width = height = 24` for the drawn
part) and `'if-label'` (text; `label` is the text, `x`/`y` the top-left of
the block, `width`/`height` its measured dimension).

## Acceptance criteria

- Given an edge with `arrowhead: false`, when rendered, then the SVG has
  its `<line>`s and no `<polygon>` tip
- Given an edge `(0,0) (0,30) (50,30) (50,90)` with `emphasize: 'down'`,
  when rendered, then the mid-arrow sits at `(0,15)` pointing down — the
  first DOWN segment, not the longest
- Given the repeat back-edge, when the probe runs over the baseline repeat
  fixtures Q3 listed, then every pin is unchanged (`measurements/t2.json`
  vs `base.json`: zero movers)
- Given an `if-merge` node at `(x, y)`, when rendered, then one `<polygon>`
  with points `(x+12,y) (x+24,y+12) (x+12,y+24) (x,y+12)` and the diamond
  fill/stroke
- Given an `if-label` node, when rendered, then one `<text>` with the
  `arrow` SName font size at Q5's baseline offset
- Given `shapesOf`, then `if-merge` yields a polygon box and `if-label` a
  text box; `hardViolations` stays empty on all 268 (stop 8)

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

All four gates green, no red allowance (this task must not move a pin).
`git diff --name-only HEAD~1` = write-set only. Stage explicit paths.

## Commit

`feat(aitp-T2): add edge decorations and the if-merge and if-label shapes`
