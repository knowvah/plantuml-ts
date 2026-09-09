# T5 — Text positioned by x, never by anchor

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Read [`../decisions.md#d2`](../decisions.md). The jar emits no `text-anchor`
on any activity text. `FtileBox#drawU` (`FtileBox.java:220-233`) draws the
text block at `translate(padding.left, padding.top)` for LEFT (the root
default), `(widthTotal − textWidth)/2` for CENTER, right-aligned otherwise;
`FtileDiamondInside.java:94-96` draws its label at `(W − labelW)/2`. Ours:
`renderMultilineText` (`activity-renderer-shapes.ts:108-120`) emits
`text-anchor="middle"` at the centre for every caller (`:404`, `:435`, the
action at `:222`), and `renderer.ts:80-102` anchors edge labels.

## Read-set

- `activity-renderer-shapes.ts:40-130, 222-260, 395-440, 480-510`;
  `renderer.ts:55-105`; `src/core/svg.ts` (`text`/`textLines` options — the
  anchor must be OMITTABLE; if it is not, that is stop condition 9)
- `activity-style-defaults.ts` — `activityHorizontalAlignment`,
  `activityPadding` (T1, existing)
- `oracle/goldens/svg-activity/text-baseline.json` — jar `inset` and `anchor`
  histograms; `test-results/dot-cache/activity/cizixu-00-koro700/in.svg`
  (`x = rect.x + 10`), a multi-line fixture of your choosing
- Java: `FtileBox.java:80-89, 195-233`, `FtileDiamondInside.java:80-104`,
  `klimt/creole/SheetBlock1.java:95-120` and `Sheet`'s per-line alignment
  (decide per-line vs per-block x from what it does, and cite)

## Write-set

See the batch table. A new sibling module under `src/diagrams/activity/`
is permitted if `activity-renderer-shapes.ts` would cross 500 lines.

## Task

Tests first. Change `renderMultilineText`'s contract from `(cx, anchor
middle)` to an explicit left `x` per line, computed by the CALLER:
- action box: `rect.x + padding` (LEFT), `rect.x + (W − lineW)/2` (CENTER),
  `rect.x + W − padding − lineW` (RIGHT) per `activityHorizontalAlignment`
- diamond/hexagon: `cx − lineW/2`
- note and edge labels: positioned by x the way their Java draws them
Remove every `textAnchor` in the activity renderer. The `y` placement is
unchanged (`padding.top` equals the current vertical centring for the box).

## Acceptance criteria

- Given an action box, then its text has no `text-anchor` and
  `x = rect.x + 10`; given `defaultTextAlignment center`, then
  `x = rect.x + (W − textW)/2`
- Given a two-line label under `center`, then each line's x is computed
  from its own width (or per-block, if the `Sheet` Java says so — cite)
- Given a diamond, then its text has no anchor and `x = cx − textW/2`
- Given the probe, then `text[]/@text-anchor` (1253) reaches 0 and
  `text[]/@x` (1427) falls; T0's `anchor` and `inset` censuses move, `fill`
  does not

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green except the expected activity oracle gates; list them.

## Commit

`fix(amb-T5): position activity text by x instead of text-anchor`
