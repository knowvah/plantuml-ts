# Batch 8 — the three activation-geometry commits, re-verified ABSOLUTELY

They were verified relatively (offset from this port's own lifeline) because
absolute comparison was impossible: every lifeline was in the wrong place.
Batches 2–7 put 482 of 1039 fixtures' lifelines exactly on the jar's, so the
absolute comparison is now available. **All three hold.**

## T8.1 — activation bars: position, width, per-level indent

`kejoke-76-curu931` — four nested levels on each of two participants.

| | jar | ours |
|---|---|---|
| lifelines | 57.075, 161.225 | **57.075, 161.225** |
| bar x, participant 1 | 52.075, 57.075, 62.075, 67.075 | **identical** |
| bar x, participant 2 | 156.225, 161.225, 166.225, 171.225 | **identical** |
| bar count | 14 | 14 |
| bar width | 10 | 10 |

Every one of the fourteen bars is on the jar's x, absolutely — position, width
and the 5px per-level indent together. `bbcc90ae` is **correct**.

`rugeco-70-muro754` — its bars are `lifeline − 5` on both sides, exactly. Its
lifelines are 5, 10 and 15 short of the jar's, which is the accumulating
`LIVE_DELTA_SIZE` residual D6 records (every participant in that fixture is
live, so every span is 5 short). Relative to its own lifeline each bar is
exact; the absolute offset is not a bar-geometry error.

## T8.2 — message endpoints, both branches

`kejoke-76-curu931` carries 24 message bodies across four activation levels
and both the forward and reverse branches of
`CommunicationTile#addConstraints:392-416`.

```
exact: 24 of 24
```

Every endpoint, both ends, absolutely on the jar's. `5dfa0982` is **correct**,
and this is a stronger statement than the commit itself could make.

`rugeco-70-muro754`'s two bodies carry the same 5/10/15 lifeline shortfall and
are exact relative to their own lifelines.

## T8.3 — self loops, and Gap SQ-5 measured at last

`jobadi-87-jegi648`, after correcting the loop width:

| | jar | ours |
|---|---|---|
| loop start x | 34.469 | **34.469** |
| vertical stroke x | 76.469 | **76.469** |
| returning segment start x | 35.469 | **35.469** |
| head polygon x | 45.469, 35.469, 41.469 | **identical** |

The whole loop's x geometry is now exact. `ebbd1f41` is **correct**: its
subject was the loop's offset by the live level, and both the start and the
returning-segment start land on the jar's.

**Gap SQ-5 was recorded as "40 vs 45". Both numbers were wrong about the drawn
loop; the gap was 40 vs 42.** `arrowWidth = 45` is not what is drawn —
`xRight = arrowWidth - 3 = 42` is (`ComponentRoseSelfArrow.java:59-60`), and
`drawRightSide:124-126` puts all three strokes against `xRight`:

```java
ug2.apply(new UTranslate(x1, textHeight)).draw(ULine.hline(xRight - x1));
ug2.apply(new UTranslate(xRight, textHeight)).draw(ULine.vline(arrowHeight));
ug2.apply(new UTranslate(x2, textHeight + arrowHeight)).draw(ULine.hline(xRight - x2));
```

`SELF_LOOP_WIDTH` is now 42, and `jobadi`'s loop is exact. Gap SQ-5 is closed
with a citation rather than a fitted number.

`gesiba-07-rise357` (`B -> B ++`) — start x exact (60.044 both), returning
segment exact (66.044 both), and the vertical 5px short: jar 107.044, ours
102.044. Mechanism: `drawRightSide:93` is
`x2 = area.getDeltaX1() > 0 ? -area.getDeltaX1() : 1`, so when the activation
level CHANGES across the message the component starts 5px (one
`LIVE_DELTA_SIZE`) left of its origin and the loop reaches 5px further. This
port does not model `deltaX1`. Same family as D6's unmodelled live terms.

## Two constants cited, one deliberately left

- `SELF_LOOP_WIDTH` 40 → **42** (`ComponentRoseSelfArrow.java:59-60`). Fixed.
- `SELF_LOOP_HEIGHT` is 20; upstream's is `getArrowOnlyHeight()` = **13**
  (`:321-323`), and `jobadi`'s golden drops `y1="53"` to `y2="66"`. **Left at
  20 deliberately** — y-coordinate convergence is an explicit non-goal of this
  mission and the change moves every event after a self message. Now carries
  its citation in the code so the next mission need not re-derive it.

## Verdict

| commit | subject | verdict |
|---|---|---|
| `bbcc90ae` | nested activation indent | **exact**, 14/14 bars on `kejoke` |
| `5dfa0982` | message endpoint offsets by live level | **exact**, 24/24 endpoints on `kejoke` |
| `ebbd1f41` | self-loop offset by live level | **exact**, whole loop x on `jobadi` |

No `DIVERGENCES.md` entry is owed: nothing here is a considered divergence.
Two residuals remain, both with mechanisms and both the same unmodelled
`LIVE_DELTA_SIZE` family already recorded under D6.

## Why the distance instrument did not move, and what that exposed

Total distance after this batch is **identical to Batch 7's, to the byte**,
even though the self-loop x geometry demonstrably changed. That is not the
instrument failing; it is the cohort hazard its own header documents, hit in
practice.

- `jobadi-87-jegi648` measures `descended: false` — it short-circuits at the
  top-level child count, so only the root `<svg>` attributes are ever
  compared and its loop is never reached.
- Every other self loop is unreachable for a second, structural reason: **the
  jar draws a self loop as three `<line>` elements and this port draws it as
  one `<path>`.** `compareNodes` short-circuits on a tag mismatch
  (`compare.ts:229`) and never descends into the `d` attribute's numbers. The
  jar emits no `<path>` at all for a self message — `pibefe-94-cibu835`, which
  DOES descend, contains none.

So this batch's correction is verified by direct extraction against the golden
(above) and is invisible to the corpus metric by construction. Recorded rather
than explained away, because a metric that cannot see a whole feature is worth
knowing about before the next mission relies on it.

**Follow-on, not fixed here:** the `<path>`-versus-three-`<line>`s divergence
is structural, and CLAUDE.md's rule is that a structural divergence IS the bug.
Re-mirroring it would also make every self-message geometry measurable for the
first time. It is a renderer change outside this batch's write-set.
