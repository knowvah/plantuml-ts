# add4-T1a: switch case row +11 px (D3)

## Commits
- `535df1d1f` fix(activity): draw switch merge diamond only when a case has an out
- `4b1dc2400` fix(activity): port switch case FtileDecorateIn/OutLabel decoration
  (also includes the case-label reservation and the ten authored fixtures and tests)

## Mechanism (diagnosis)
- **Mechanism:** the case tiles were the bare branch bodies. Upstream wraps each one as
  `FtileDecorateOutLabel(FtileDecorateInLabel(branch.getFtile(), dimLabelIn), dimLabelOut)`
  (`FtileFactoryDelegatorSwitch.java:109-113`). `FtileDecorateInLabel#drawU` draws the body
  `dy(yl)` lower, where `yl` is the case label's own TextBlock height (11 for one 11 pt line).
  So case row = `d1.h + getYdelta1a + yl_i`, and `yl` differs per case.
- **getYdelta1a was already correct.** `max(10, 11) + 10 = 21` (`FtileSwitchWithManyLinks.java:412-423`).
  The census-b claim that the label TextBlock is 22 high is wrong: the 11 px comes from a second
  term, the decoration. In `small-mixed`, case B (2-line label) sits exactly 11 px below A and C,
  which the decoration produces and a 22-px label height would not. Nothing was fitted.
- **Second half (same commit):** the census sandbox saw y 107.167 instead of 111 because the
  compressor removed the new gap again. Case labels did not push a reservation, so the only slot
  was `shapes-of.ts#edgeLabelShape`'s mid-point estimate. Fix: `walk-switch.ts#applyLastEdgeLabel`
  now goes through `applyInLabel`, so the label's real placed ink is reserved
  (`SlotFinder#drawText`, `klimt/compress/SlotFinder.java`).
- **Ruled out:** the 22-px label-height reading (`small-mixed` per-case offsets); a wrong mode
  (BIG and SMALL fixtures both exact); the OneLink flat 20 (`one-link-1line` exact in x, y and height).

## Java -> ours
- `FtileDecorateInLabel#calculateDimension/drawU` (`addTop(yl)`, `incRight`, `dy(yl)`) and
  `FtileDecorateOutLabel#calculateDimension` (`addBottom`, `incRight`) -> `tiles/gtile-switch.ts#decorateCase`.
- `Branch#getTextBlock` (`Branch.java:248-266`) -> `gtile-switch.ts#measureLabel` (width and height).
- `FtileGeometry` subset -> `gtile-switch-geometry.ts#CaseDim`/`caseDimOf`. Mode, nude and x-offset
  math now read the decorated dims.
- `FtileSwitchWithDiamonds#drawU` `if (calculateDimension().hasPointOut())` before drawing diamond2
  (`:142-143`) -> `walk-switch.ts#walkSwitch` gate.
- Per-case body y -> `walk-switch.ts#pushCaseToMergeEdges` (positions array; it no longer shares one y).

## Fixtures (tests/fixtures/activity/add4-T1a/<case>/{in.puml,in.svg}, jar via oracle-render.sh)
- Jar-equal on case-row y and canvas height:
  - small-1line: all texts, x and y.
  - big-1line
  - one-link-1line: all texts.
  - small-wide-label
  - small-out-label
- Multi-line fixtures (small-2line, small-3line, small-mixed, big-mixed, one-link) are `it.fails`.
  They are blocked by SWITCH-NL: `switch-dispatch.ts:51` does not run `unescapeLabelNewlines`, while
  upstream does (`CommandCase.java:87` `Display.getWithNewlines`). With that one-line fix applied as
  a scratch test, small-mixed is jar-exact on y and height.
- Tests: `tests/diagrams/activity/tiles/gtile-switch-decorate-fixtures.test.ts`, plus 5 new unit
  tests in `gtile-switch.test.ts`.
- `walk-switch-cross-lane-merge.test.ts` walk-time coordinates were updated 168.5/190.5 -> 180.5/202.5,
  which now equal the jar's mojezi `<line>`s.

## Probe Σ (100 rows)
| state | Σ |
|---|---|
| base | 12056 |
| after `535df1d1f` | 12021 (jazedo, xaxene 41->34; sisate 88->81; vatame 192->178) |
| after `4b1dc2400` | 10332 |

0 risers at both commits.

## Brief rows (before -> after)
| row | before | after | residual |
|---|---|---|---|
| sojono | 276 | 175 | notes on a switch, owned by SWITCH-NOTE; width 318 vs jar 508 |
| rujixe | 187 | 116 | notes; width 247 vs 367 |
| demibe | 86 | 1 | |
| pateca | 61 | 20 | missing arrowhead, see below |
| ruzazu | 60 | 3 | |
| rekuxa | 58 | 1 | |
| mojezi | 46 | 1 | |

## Forwarded rows (before -> after)
| row | before | after | residual |
|---|---|---|---|
| mazoka | 259 | 20 | |
| mukigo | 229 | 104 | phantom slot |
| cezabi | 224 | 104 | phantom slot |
| vatame | 192 | 0 | |
| fitega | 132 | 1 | |
| lipiki | 115 | 66 | phantom slot |

## Other rows that fell
| row | before | after |
|---|---|---|
| zucile | 95 | 1 |
| sisate | 88 | 0 |
| momala | 61 | 49 |
| duvole | 58 | 28 |
| sipibi | 51 | 1 |
| sokomu | 51 | 47 |
| nosape | 43 | 1 |
| jazedo | 41 | 2 |
| xaxene | 41 | 2 |
| giteso | 440 | 439 |
| vimena | 427 | 415 |

## Element census
- Became exact:
  - fitega, mukigo, rujixe: line -2 -> 0.
  - lipiki: extra line +2 -> 0.
  - jazedo, xaxene, sisate, vatame: extra merge polygon removed. Ours had a polygon the jar does not
    draw, so this is toward the jar.
- One mover away from the jar: giteso line +2 -> +4. The inner switch's last in-edge now takes the
  `isLast && p1.x > p2.x` detour (`FtileSwitchWithManyLinks.java:94-98`) because its case-row
  geometry differs from the jar's. The cause is unported notes in the switch (SWITCH-NOTE): the jar
  is 723 wide, ours 500.
- No information-carrying element was dropped.

## Census movers (equality pins; style 25 rows, swimlane mojezi/ruzazu; the orchestrator must re-pin)
- **Now equal to the jar column:**
  - demibe, fitega, jazedo, mazoka, mojezi, momala, nosape, rekuxa, ruzazu, sipibi, sisate,
    sokomu, vatame, xaxene, zucile.
  - Height only: cezabi, mukigo, rujixe, sojono. Stroke width also equal: fitega, mukigo, rujixe, lipiki.
- **Toward the jar, not equal:**
  - Height: duvole 238->249 and pateca 262->273, both against jar +10.
  - Height: lipiki 147->162 (jar 168), vimena 618->633 (677), zivocu 309->322 (374).
  - Width: giteso 454->500 (723), sojono 278->318 (508), rujixe 243->247 (367).
- **Away from the jar, each with a named owner outside my write-set:**
  - **Phantom compress slot** (`compress/shapes-of.ts#edgeLabelShape`). It adds a mid-point label
    box at `x+4` for every labelled edge, even when the edge has `labelAlign` and a real reservation.
    The phantom extends 4 px past the real ink and blocks the X compression the jar applies to the
    gap the decoration opened.
    - Movers: cezabi width 540->559 (jar 536), lipiki 217->222 (210), mukigo 493->505 (493).
    - Scratch check with `labelAlign !== undefined -> undefined`: all three equal the jar, and
      small-wide-label and small-out-label become jar-exact in x.
    - Not committed (outside write-set).
  - **SWITCH-NL plus raw-creole label measurement.** vimena width 457->834 (jar 546).
    - The literal `\n` case labels measure as one long line, so incRight widens the cases.
    - With the scratch parser fix and the phantom fix: width 580, height 677 = jar.
    - The remaining 34 px is `**bold**` measured raw (same convention as
      `gtile-diamond-inside#measureLabel`).
  - **SWITCH-NOTE.** giteso height 560->588 (jar 543), stroke width 22->24 (20).

## Not done
- **pateca/duvole, 10 px short in height, missing arrowhead polygon -1.** The jar's
  `ConnectionVerticalThenHorizontal` uses `direction == DOWN` with `asToDown`
  (`FtileSwitchWithManyLinks.java:167-169`) and emits a zero-length last segment. `Worm.java:164-170`
  draws the end decoration unconditionally. `renderer.ts#arrowTip`'s `len === 0` guard drops the
  arrowhead, and the Y compressor then removes its 10 px. Owner: `renderer.ts` and
  `compress/shapes-of.ts#terminalArrowhead`.
- **BIG-mode and first/last-label y residual of 1.72 px** (big-1line label, jazedo/xaxene "503"
  label y). The jar keeps the label's own compressed y; ours recenters the label on the compressed
  segment. Owner: label placement after compression (renderer/compress), not switch code.
- **Out-label y +5.056** (small-out-label "first exit label"). Same family: label placement, owned
  outside the write-set.
- **Multi-line reservation.** `tile-layout-inlabel.ts#inLabelReservation` reserves one line
  (`height = font size`). Multi-line case labels will under-reserve once SWITCH-NL lands.
- No `src/core/**` edits, so no all-engine survey was needed. Gates run at each commit:
  - typecheck and eslint
  - `tests/diagrams/activity`: 1159 pass, 5 expected fail
  - golden ratchet and harness-parity: 386/386, pins byte-equal
  - style/text/swimlane census: only the movers listed above fail
