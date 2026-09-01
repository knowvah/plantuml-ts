# T7.1 — D6: how a message label moves the participants

**Decision: port the constraint SET, and solve it exactly with the sweep its
own structure permits.** Recorded in `decisions.md` under D6, as stop
condition 6 requires. Neither of the two options the question was framed with.

## Why not the pre-scan

`scanMessageLabels` widened only ADJACENT pairs:

```ts
if (fi >= 0 && ti >= 0 && Math.abs(fi - ti) === 1) { ... }
```

A message from participant 1 to participant 3 — however wide its label — asked
for nothing at all. Upstream constrains any pair.

## Why not a `Real` port

Because it is not needed. Every constraint that positions a participant is

```
x[j] >= x[i] + c        with  i < j  in participant order
```

from exactly two sources (`LivingSpaces#addConstraints:61-71` for neighbours,
`CommunicationTile#addConstraints:392-416` for messages), and a difference
system whose edges all point one way along a total order is a DAG
longest-path. One left-to-right sweep taking the max of the incoming edges is
its exact minimal solution. `solveParticipantXs` is that sweep.

The reverse branch (`:402-409`) bounds `point1` by `point2 + width` instead of
the other way round, but `point1` is then the RIGHT-hand participant, so the
edge still points along the order. Both directions are stored `from < to`.

## The span

`comp.getPreferredDimension(...).getWidth()` for the arrow component is
`getTextWidth + getArrowDeltaX` (`ComponentRoseArrow.java:347-349`), with

- `getTextWidth = pureText + padding.left + padding.right`
  (`AbstractTextualComponent.java:106-108`) and the arrow's padding is
  `topRightBottomLeft(1, 7, 1, 7)` (`AbstractComponentRoseArrow.java:62`), so
  **+14**;
- `arrowDeltaX = 10` (`AbstractComponentRoseArrow.java:54`), so **+10**.

`label + 24`. The same formula `sequence-layout-exo.ts#exoPreferredWidth`
already used for an exo message — one arrow component, one preferred width,
whether its far end is a border or another lifeline. `ARROW_PADDING_X` moved
to `sequence-layout-shared.ts` so the two paths read one constant.

The endpoints are `livingSpace.getPosC()`, the lifeline CENTRES
(`CommunicationTile:419-431`), so the constraint is on centre-to-centre
distance.

## The measurement that nearly hid a second bug

Fixtures where EVERY lifeline centre lands on the jar's, out of 1039 with
matching lifeline counts:

| | fixtures |
|---|---:|
| pairwise pre-scan (Batch 6 close) | 275 |
| exact sweep, labels still measured at 14pt | **212** |
| exact sweep, labels at the jar's 13pt | **482** |

**The sweep alone scored worse than the thing it replaced.** That reads as a
regression and is not one. Two errors were cancelling:

- the pre-scan's span was `label + 16`, 8px narrower than upstream's
  `label + 24`;
- every message label was measured at the ambient **14pt**, where the jar uses
  **13** — `arrow { FontSize 13 }` (`plantuml.skin:306-308`). Every golden
  with a message label emits `font-size="13"` for it beside `font-size="14"`
  participant text; `TeozTimelineIssues_0003_Test`'s is
  `<text ... font-size="13" textLength="27.544">hello</text>`.

Too-narrow formula times too-wide font came out closer than either alone.
Correcting the formula without the font made it worse; correcting both took
275 → 482. The mechanism was measured before the decision was recorded, not
inferred after — and the wrong reading here would have been to revert the
faithful solve because the corpus score dipped.

## The font, fixed rather than filed

`fontSpecOf(theme)` was the single ambient font for every sequence element.
The message label now uses `arrowFontSpecOf(theme)` — a flat 13, following
`divider-style.ts`'s `DIVIDER_FONT_SIZE` precedent for
`plantuml.skin:174`'s 13, and absolute rather than scaled off
`theme.fontSize` because `arrow { FontSize 13 }` is a declared value in the
style tree.

Applied at all four sites at once, so layout and render cannot disagree about
a label's width (`planning/sizer-renderer-parity.md`): the span scan, the exo
label width, `messageLabelBlock`, and `renderMessageLabel`.

Other elements upstream gives their own `FontSize` — `groupHeader` at 11,
`box` at 13 — remain on the ambient size. That is a separate, tracked gap:
**per-element font resolution for the sequence engine**, of which this batch
fixed the arrow.

## Measured, end of Batch 7

| | |
|---|---:|
| fixtures with EVERY lifeline centre exact | **482** of 1039 |
| fixtures with the first lifeline centre exact | 747 |
| total geometry distance | **2578916.759** |
| numeric diffs | 51890 (from 72266 at baseline) |

Cumulative fall from the Batch 1 baseline: **1596440.350**, 38.2% of it.

## Not modelled, stated rather than left silent

- The `LIVE_DELTA_SIZE` adjustments both branches of `addConstraints` apply to
  their endpoints (`:405-413`). **Measured, not estimated:**
  `TeozTimelineIssues_0003_Test`'s second lifeline is at 79.669 where the
  jar's is 84.669 — exactly one `LIVE_DELTA_SIZE` (5) short, on the one span
  whose target participant is live. Modelling it needs the activation LEVEL at
  each message, which the scan does not have: it runs before the event walk
  that computes levels, whereas upstream's `Real` defers the arithmetic until
  `compileNow()`. Closing it means either a third layout pass or deferring the
  span edges the way `Real` does — an extension of this sweep, on the same
  edges, not a challenge to it.
- `isCreate()` messages, which bound `posB`/`posD` rather than `posC`
  (`:423-431`).
- The englober and self-overflow margins in `posA`/`posE`
  (`Doll.java:220-221`, `CommunicationTileSelf.java:208-213`), carried
  forward from T6.1.

All three are additive terms on edges this sweep already carries: extensions
of the model, not challenges to it.
