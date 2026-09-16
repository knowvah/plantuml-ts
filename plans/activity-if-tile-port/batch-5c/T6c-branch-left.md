# T6c — the if tiles carry each branch's OWN `left`

**Agent:** `typescript-pro` · **Depends on:** T6b

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see`; port the arithmetic verbatim). Read
[`../README.md`](../README.md) (stops 5, 8, 9, 12; red allowance; gates),
[`../decisions.md`](../decisions.md) D4, the journal rows "T6b |
Diagonal-sibling-segment scan" (bucket C) and "T6b | risers" (`gakelo`/
`vozane` +24, a uniform +6 px shift), and [`overview.md`](overview.md).

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

A tile's `left` is its in/out x (`FtileGeometry.java:48-82`); for every
tile in this port that is `getCoord(NORTH_HOOK).x`. The wrappers the if
builders apply to a branch move that `left`, they do not replace it:
- `FtileMinWidthCentered(branch, 30)`: `width = max(w, 30)`; `left' =
  left + (30 - w)/2` when `w < 30`, else `left`
  (`FtileMinWidthCentered.java:68-79,99-106`)
- `FtileMarged(_, 10, 10)` (`addHorizontalMargin(_, 10)`): `width'' = w' +
  20`, `left'' = left' + 10` (`FtileMarged.java:93-97`)
- `addHorizontalMargin(_, inlabelSize, 0)` on a long-form couple: `left +=
  inlabelSize` (`FtileMarged.java:93-97` with `margin2 = 0`)

Then: `FtileIfNude` (`cond/FtileIfNude.java:142-160`) uses `t1.left`,
`t1.w - t1.left`, `t2.left`, `t2.w - t2.left` of the WRAPPED branches;
`FtileIfDown#getTranslateForThen` puts the then-block at `x = total.left -
then.left` (`vcompact/FtileIfDown.java:624-637`); `FtileAssemblySimple`
(long-form couple) puts the tile at `assemblyLeft - tile.left`
(`FtileAssemblySimple.java:131-141`, `FtileGeometryMerger.java:44-56`).

Ours assumes `left === outer / 2` for the padded branch:
`gtile-if-with-links.ts:26-40` (`PaddedWidth` doc: "both wraps preserve
`left === width / 2` symmetry"), `:92-95` (`b1.padded.outer / 2`);
`gtile-if-down.ts:110-112` (`thenGeo.left = thenPadded.outer / 2`);
`gtile-if-long-horizontal.ts:75-83` (`assemblyLeft = max(diamond.left,
tilePad.outer / 2)`). `contentDx` itself is already correct in all three.

## Fix

1. Give `PaddedWidth` (and the long form's `minWidthCentered`) the branch's
   own `left`: `paddedLeft = branch.getCoord(NORTH_HOOK).x + contentDx`
   (`contentDx = (max(w, 30) - w)/2 + margin`), `paddedRight = outer -
   paddedLeft`. Replace every `outer / 2` that stands for a branch's `left`
   with `paddedLeft`, and every `outer - outer/2` with `paddedRight`.
2. `GtileIfWithLinks`: `innerMargin = max(b1.paddedRight + b2.paddedLeft,
   diamond.w + 20)`; `width = b1.paddedLeft + innerMargin + b2.paddedRight`;
   `left = b1.paddedLeft + innerMargin / 2`; `tile1X = contentDx1` (branch 1
   at x = 0, `FtileIfNude.java:96-100`), `tile2X = width - b2.outer +
   contentDx2` (`:102-110`); everything else unchanged.
3. `GtileIfDown`: `thenGeo.left = paddedLeft`; `wrapX = core.left -
   thenGeo.left` already places the padded box, so the content lands at
   `wrapX + contentDx` — verify the walker's origin for the main tile.
4. `GtileIfLongHorizontal`: `tileLeft = tile.getCoord(NORTH_HOOK).x +
   tilePad.contentDx`; `assemblyLeft = max(diamond.left, tileLeft)`;
   `assemblyWidth = max(diamond.w + (assemblyLeft - diamond.left),
   tilePad.outer + (assemblyLeft - tileLeft))`; `tileLocalX = inlabelSize +
   (assemblyLeft - tileLeft) + tilePad.contentDx`; couple `left =
   assemblyLeft + inlabelSize`. `tile2` (`getTranslate2`, `:624-635`) is
   placed by width, unchanged, but its `pointIn`/`pointOut` x is its `left`
   — the walker already uses the hook.
5. The walkers should need no change (they place branch subtrees at the
   tile's `tileX` origins and take connector endpoints from `getCoord`);
   if one does, it is a defect — fix and journal it.

## Read-set

- The three tile files (whole) and `layout/walk-if-*.ts` (origins only)
- `tiles/gtile-top-down.ts` after T6b (`left`, `childOffsetsX`)
- Java: every range cited above

## Write-set

`src/diagrams/activity/tiles/gtile-if-with-links.ts`, `gtile-if-down.ts`,
`gtile-if-long-horizontal.ts`; `tests/diagrams/activity/tiles/
gtile-if-with-links.test.ts`, `gtile-if-down.test.ts`,
`gtile-if-long-horizontal.test.ts`; `tests/diagrams/activity/layout/
walk-if-*.test.ts`, `compress/invariant.test.ts`, `tests/unit/activity/
layout.test.ts` — only assertions the geometry changes, re-asserted with a
Java cite, never deleted (stop 12); `plans/activity-if-tile-port/
measurements/t6c.json`; journal rows; `docs/catalog.md` on drift.

## Acceptance criteria

- Given a with-links if whose then-branch is a nested if with `left` 20 px
  right of its `width/2`, when laid out, then `in1` ends on that nested
  hexagon's centre and is axis-aligned (2 segments), and `out1` starts there
- Given a down if whose then-block is a nested if, then `ConnectionIn` and
  `ConnectionOut` are single vertical segments (`sutura-08-zeme419`)
- Given a long if whose branch tile is a nested if, then `VerticalIn` is a
  single vertical segment
- Given branches whose `left == width/2`, then every position is
  byte-identical to T6b's (no symmetric fixture moves — verify with the
  probe against `t6b.json`)
- Given the diagonal scan over all 268 baseline slugs, then bucket C's 13
  fixtures show no diagonal inside an if; the 19 `while`/`repeat` survivors
  (buckets A/B) remain and are filed by T7
- Given `t6c.json` vs `t6b.json`, then every mover contains an if with an
  asymmetric branch; every riser has a journal row; `gakelo-29-neno787` and
  `vozane-63-kepe177`'s +6 px shift is explained (fixed or attributed)
- Given `invariant.test.ts`, then `hardViolations` is empty and the two
  allowed lists are re-attributed per entry (stop 8)

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

`typecheck`, `lint`, `build` exit 0; targeted tests green; the orchestrator
runs `npm test` (red only on the four activity oracle gates) and the probe.
`git diff --name-only HEAD~1` = write-set only.

## Commit

`fix(aitp-T6c): carry each if branch's own left through the wrappers`
