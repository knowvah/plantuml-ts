# C2 — every vertical term of the sequence engine, derived from the Java

Written 2026-09-02 at `e6b778a9`, after C1 split the instrument by axis.
**No code was changed.** C3 implements from this file.

Every number below carries an upstream `file:line`, or is explicitly listed
as UNCITED. Nothing here was fitted: the model was derived from the Java
first and then checked against four goldens, which it reproduces to the
pixel.

---

## 0. The verified document formula

Read top-down, this is what the jar computes for a Teoz sequence diagram.
Every line has a citation, and §1 breaks each one out.

```
svg height      = (int)( bodyBlockHeight + margin.top + margin.bottom + 1 )
                       SvgGraphics#ensureVisible:129-136   (the +1)
                       TextBlockExporter:199-203           (the two margins, 5+5)

bodyBlockHeight = pswpHeight + heightEnglober1 + heightEnglober2 + 10
                       SequenceDiagramFileMakerTeoz#getTextBlock:150-158
                       (the +10 is 5 above and 5 below: drawU:132 is
                        `ug.apply(new UTranslate(5, 5))`)

pswpHeight      = pageHeight + (footbox ? 2 : 1) * headHeight
                       PlayingSpaceWithParticipants#calculateDimensionSlow:74-87

pageHeight      = max( inkHeight, 8 + SUM(tileHeight_i) ) + 10
                       PlayingSpace#getPreferredHeight:154-161  (the +10)
                       PlayingSpace:55                          (startingY = 8)

headHeight      = MAX over participants of getHeadPreferredDimension
                       LivingSpaces#getHeadHeight:148-155
                = textHeight + margin.top + margin.bottom + deltaShadow
                  + 1 + deltaCollection
                       ComponentRoseParticipant#getPreferredHeight:129-132
```

So, in absolute image coordinates:

| landmark | value |
|---|---|
| top of the head row | **10** |
| top of the body (first lifeline pixel) | `10 + headHeight` |
| first tile's top | `10 + headHeight + 8` |
| top of the foot row | `10 + headHeight + pageHeight` |
| bottom of the image | `(int)( footTop + headHeight + 10 + 1 )` |

### Checked against four goldens, exactly

| fixture | structure | head→body | first arrow | foot top | height |
|---|---|---|---|---|---|
| `bidopa-30-jafi560` | 1 flat message | 39 | 66 | 84 | 124 |
| `gibaro-25-sibu619` | 3 flat messages | 39 | 66/93/120 | 138 | 178 |
| `metano-36-gevu843` | message + `note left` | 39 | 66 | 90 | 130 |
| `fasafe-10-fepe885` | message + `alt` + message | 39 | 66/122 | 154 | 194 |
| `lenamo-57-fano574` | `alt`/`else`, 2 messages | 39 | 95/139 | 171 | 211 |

Every one of those numbers is what the formula predicts, to the unit. The
model is not approximate.

---

## 1. Term by term

`blockH` below is the text block's own height. `StringBounderFromWidthTable
#calculateDimension:64-80` returns `height = font size`, so a one-line label
at `font-size="13"` has `blockH = 13`, and an n-line one has `n * 13`.

### 1.1 The document margins

| term | upstream | value | this port | agrees |
|---|---|---|---|---|
| exporter margin, all 4 sides | `SequenceDiagram#getDefaultMargins:624-628` (`same(5)` in Teoz), applied at `TextBlockExporter:173,201-203` | 5 | x: 5 (folded into `LEFT_MARGIN`/`RIGHT_MARGIN` = 10); y: **0 top / 0 bottom** | **NO** |
| text block's own inset | `SequenceDiagramFileMakerTeoz#getTextBlock:132` (`UTranslate(5,5)`) and `:157` (`+10` on both axes) | 5 | x: 5 (same fold); y: **0 top / 5 bottom** (`layout.ts` `BOTTOM_MARGIN`) | **NO** |
| **net top margin** | 5 + 5 | **10** | **0** | NO — content starts at y=0 |
| **net bottom margin** | 5 + 5 | **10** | **5**, UNCITED (`src/diagrams/sequence/layout.ts#computeVerticalTotals`, `const BOTTOM_MARGIN = 5`) | NO — 5 short |

`findings/document-margins.md` derived all four sides last mission and
applied only the x pair. This is the unapplied half.

### 1.2 The document `+1` — an X *and* Y term, and it is systematic

```java
final protected void ensureVisible(double x, double y) {
    if (x > maxX)  maxX = (int) (x + 1);
    if (y > maxY)  maxY = (int) (y + 1);
}
```
`SvgGraphics#ensureVisible:129-136`, called from the constructor with the
computed dimension (`:138-143`). The emitted `width`/`height`/`viewBox` are
therefore `(int)(dim + 1)`, **not** `trunc(dim)`.

This port truncates: `src/core/klimt/document-shell.ts:130-131` is
`Math.trunc(fragment.width)` / `Math.trunc(fragment.height)`.

Measured over all 1101 renderable sequence fixtures (probe at `e6b778a9`):

| | count |
|---|---|
| our width **exactly 1 less** than the jar's | **424 (38.5%)** |
| our width exactly equal | **0** |
| our width narrower at all | 996 |

Zero exact widths and a mode of −1 is the signature of this one line. The
README's "416 within 1% on width" cohort *is* this cohort. **A perfect
layout cannot reach an exact width or height until this lands.**

> **Boundary flag — ask first.** `document-shell.ts` is shared by every
> diagram type. Changing it moves class/state/json/description root
> dimensions too. It is not in batch 5's declared write-set and C3 must not
> take it unilaterally; it is raised here as a maintainer decision.

### 1.3 The participant head band

| term | upstream | this port | agrees |
|---|---|---|---|
| drawn box height | `getTextHeight` = `blockH + padding.top + padding.bottom` (7 + 7, `plantuml.skin:186-190`), `ComponentRoseParticipant#drawInternalU:100-106` | same | **YES** |
| reserved band height | `getTextHeight + margin.top + margin.bottom + deltaShadow + 1 + deltaCollection` — **note the bare `+ 1`** — `ComponentRoseParticipant#getPreferredHeight:129-132` | `headSlackOf`, `sequence-layout-participants.ts:283-292` | **YES** |
| head alignment in the band | BOTTOM (`LivingSpaces#drawHeads:125-145`) | bottom-aligned, same | **YES** |
| foot band height | the SAME `headHeight`, `PlayingSpaceWithParticipants:83-84` (`factor * getHeadHeight`) | `maxParticipantHeight` | **YES** |
| foot alignment | TOP, drawn at `dy(pageHeight + headHeight)`, `PlayingSpaceWithParticipants#drawU:224-225` — **no gap, no extra label band** | `footerShapeY = lifelineEndY + footerLabelH` where `footerLabelH = theme.fontSize + 8` for an actor/database foot, **UNCITED** (`layout.ts#computeVerticalTotals`) | **NO** |
| no-footbox case | still reserves **1 ×** `headHeight` (`factor = 1`) | `totalHeight = lifelineEndY + BOTTOM_MARGIN` | see 1.1 |

The head band is the one part of the vertical model this port already gets
right, `+1` included. The **footer label band is invented** — upstream's
tail component places an actor's label above its stickman inside its own
height (`LivingSpaces:135-141`), and reserves nothing extra.

### 1.4 The tile chain — there is no `messageSpacing`

Tiles are **flush**. `YGauge.createWithContact:103-116` sets each tile's
`min` to the previous tile's `max`; `PlayingSpace:89` seeds the chain at
`startingY`. The vertical gap between two events is **entirely** the first
one's own `getPreferredHeight`. There is no inter-event spacing constant
anywhere in `teoz/`.

| term | upstream | value | this port | agrees |
|---|---|---|---|---|
| head → first tile | `PlayingSpace:55,89` (`startingY = 8`) | **8** | `layout.ts:166` — `maxParticipantHeight + theme.sequence.messageSpacing` | **NO**, 20 for 8 |
| gap between tiles | none — `YGauge.createWithContact:103-116` | **0** | `messageSpacing` added after every message, note, frame, delay and space | **NO** |
| `messageSpacing` | **has no upstream counterpart at all** | — | 20 (`src/core/theme.ts:351`, UNCITED — its doc comment is "Vertical gap between messages") | **NO** |
| tail below the last tile | `PlayingSpace#getPreferredHeight:158` (`... + 10`) | **10** | `lifelineExtension` = 20 (`theme.ts:355`, UNCITED) applied *after* the trailing `messageSpacing + lineHeight` | **NO** |

> **Ask-first flag.** `messageSpacing` is a term this port applies that has
> **no upstream counterpart**. It is not "20 where upstream says 14" — the
> concept does not exist in Teoz. C3 must delete it from the vertical path,
> not retune it.

### 1.5 A flat message tile

```java
public double getPreferredHeight(StringBounder stringBounder) {
    return getTextHeight(stringBounder) + getArrowDeltaY() + 2 * getPaddingY()
           + inclination1 + inclination2;
}
```
`ComponentRoseArrow#getPreferredHeight:341-344`, with

- `getTextHeight = blockH + padding.top + padding.bottom` = `blockH + 2`
  (`AbstractTextualComponent:110-114`; padding is
  `topRightBottomLeft(1, 7, 1, 7)`, `AbstractComponentRoseArrow:62`)
- `getArrowDeltaY() = 4` (`AbstractComponentRoseArrow:55,92-94`)
- `getPaddingY() = 4` (`AbstractComponentRoseArrow:96-99`)

| term | upstream | this port | agrees |
|---|---|---|---|
| tile height (vertical advance) | **`blockH + 14`** — 27 for a one-line label | `messageSpacing + lineHeight` = **`lineHeight + 20`** = 34 | **NO**, +7 per message |
| arrow y inside the tile | `getYPoint = getTextHeight + getPaddingY` = `blockH + 6` (`ComponentRoseArrow:329-335`), and the drawn line agrees: `AbstractComponent#drawU:142-143` translates by `getPaddingY()` and `drawInternalU:142-158` puts `posArrow = getTextHeight` | first arrow at `headHeight + messageSpacing` = `headHeight + 20` | **NO**, 7 too high (`headHeight + 8 + blockH + 6 = headHeight + 27`) |
| label block top | `yText = 0` in the component frame, i.e. tile top + `getPaddingY` = **tile top + 4** (`ComponentRoseArrow:142-149,179`) | `arrowY - (rows*lineHeight + 2)` — derived from the arrow, which is equivalent *given a correct arrow y* (`text-block-geo.ts:363-369`) | **YES** (relative), **NO** (absolute, because the arrow is wrong) |
| label line height | `blockH` at the **arrow** font, `arrow { FontSize 13 }` | `sequence-layout-message.ts:50` measures `'M'` at **`fontSpecOf(ctx.theme)`, size 14** — while `messageLabelBlock` draws at `arrowFontSpecOf`, size 13 | **NO** |

**A sizer/renderer split on the Y axis, live today.** The label is *drawn*
at 13 (`text-block-geo.ts:357-363`) and *reserved* at 14
(`sequence-layout-message.ts:50`, and the identical line at
`sequence-layout-exo.ts:296`). `planning/sizer-renderer-parity.md` exists to
prevent exactly this; the x half was closed in Phase A and the y half was
not. Same defect, same two call sites.

### 1.6 A self message

```java
public double getPreferredHeight(StringBounder stringBounder) {
    return getTextHeight(stringBounder) + getArrowDeltaY()
         + getArrowOnlyHeight(stringBounder) + 2 * getPaddingY();
}
private double getArrowOnlyHeight(StringBounder stringBounder) { return 13; }
```
`ComponentRoseSelfArrow#getPreferredHeight:316-323`.

| term | upstream | this port | agrees |
|---|---|---|---|
| tile height | **`blockH + 27`** (= flat tile + 13) | same as a flat message: `lineHeight + 20` | **NO**, 6 short for a one-line label |
| loop drop | **13** (`:321-323`); `jobadi-87-jegi648`'s golden drops `y1="53"` to `y2="66"` | `SELF_LOOP_HEIGHT = 20` (`renderer-message.ts:51`), cited and deliberately left | **NO**, 7 too deep |
| declared contact point | `(textHeight + textHeight + 13)/2 + getPaddingX()` — and `getPaddingX()` is **0**, not 4 (`AbstractComponent:151-153`; `AbstractComponentRoseArrow` overrides only `getPaddingY`) | n/a — this port has no contact concept | see §5 |

`getYPoint` uses `getPaddingX()` where every sibling uses `getPaddingY()`.
That reads like an upstream typo; it is preserved as-is here per
`CLAUDE.md`, and it only affects livebox steps and `&`-parallel alignment,
not the drawn loop.

### 1.7 A note

`NoteTile#getPreferredHeight:167-171` returns the component height and
nothing else — **no spacing before or after**.

`ComponentRoseNote#getPreferredHeight:88-91` is
`getTextHeight + 2 * getPaddingY + deltaShadow`, with padding
`topRightBottomLeft(5, 15, 5, 15)` (`:67-70`) and
`getPaddingY = Rose.paddingY = 5` (`Rose.java:66`, passed at `Rose:115`).

| term | upstream | this port | agrees |
|---|---|---|---|
| drawn box height | `getTextHeight` = **`blockH + 10`** (`ComponentRoseNote:104-118`) | `lines * lineHeight + 2*10` = `blockH + 20` (`sequence-layout-events.ts:190`, `notePadding = 10`, UNCITED) | **NO**, 10 too tall |
| text inset from box top | **5** (padding.top, `:69-70`) | 10 | **NO** |
| box top vs tile top | **+5** (`AbstractComponent#drawU:142-143`) | 0 — box drawn at `cursor.y` | **NO** |
| tile height | **`blockH + 20`** | `boxHeight + messageSpacing` = `blockH + 40` | **NO**, 20 too tall |
| `note left/right` **on a message** | `max(messageTileHeight, noteHeight)` — `CommunicationTileNoteLeft#getPreferredHeight:133-137` | a standalone advance, stacked below the message | **NO** |
| `note top/bottom` on a message | `messageTileHeight + noteHeight + spacey` with `spacey = 10` — `CommunicationTileNoteBottomTopAbstract:119,134-138` | same standalone advance | **NO** |
| `hnote` (box) | `getTextHeight + 2*5` with padding `same(4)` = `blockH + 18` — `ComponentRoseNoteBox:58-59,72-84` | not distinguished | **NO** |
| `rnote` (hexagonal) | same shape, padding `(4,12,4,12)` — `ComponentRoseNoteHexagonal:58-59,72-84` | not distinguished | **NO** |

Verified on `metano-36-gevu843`: its note box is `y=52 … 75`, height **23**
= `13 + 10`, its text baseline is `67.111` = `52 + 5 + ascent(10.111)`, and
its tile top is body-8 + 39 = 47, i.e. the box is drawn 5 lower.

### 1.8 A group frame (`alt` / `opt` / `loop` / `group` / `par` …)

`GroupingTile` constants: `EXTERNAL_MARGINY = 4` (`:88`),
`MARGINY_MAGIC = 20` (`:91`).

```java
// body offset from the gauge min
final double h = dim1.getHeight() + MARGINY_MAGIC / 2 + EXTERNAL_MARGINY;   // :156
// drawn frame top
private double getFrameY() { return gaugeMin + EXTERNAL_MARGINY; }          // :240-242
// drawn frame height
return bodyHeight + dimIfEmpty.getHeight() + MARGINY_MAGIC / 2;             // :342-345
// tile height
return dim1.getHeight() + bodyHeight + MARGINY_MAGIC + 2 * EXTERNAL_MARGINY; // :348-357
```

Header height: `ComponentRoseGroupingHeader#getPreferredHeight:120-123` is
`getTextHeight + 2*getPaddingY + suppForComment`, `getPaddingY` is 0
(not overridden), padding is `topRightBottomLeft(1, 30, 1, 15)` (`:76`) —
so **`headerH = blockH + 2`**, 15 for a 13px bold title.

| term | upstream | this port | agrees |
|---|---|---|---|
| frame border top | `gaugeMin + 4` | `gaugeMin + 0` (`frameGeo.y = frameStartY`) | **NO**, 4 too high |
| header tab height | `blockH + 2` (measured) | `titleLines * measured.height + 1 + 1` — **already correct**, `computeHeaderTab:405-406` | **YES** |
| body offset from gauge min | `headerH + 10 + 4` = **29** for a 13px title | flat **30** (`sequence-layout-events.ts:499`, `const frameHeaderHeight = 30`, UNCITED) | **NO**, and it is a constant where upstream measures |
| drawn frame height | `bodyH + headerH + 10` | `frameEndY − frameStartY` = `bodyH + 30` | **NO**, 5 too tall |
| slack below the frame border | `EXTERNAL_MARGINY + MARGINY_MAGIC/2` = **14** | `messageSpacing` = 20 (`:548`) | **NO**, 6 too much |
| `else` separator height | `getTextHeight + 4` = **`blockH + 6`** (teoz arm) — `ComponentRoseGroupingElse#getPreferredHeight:115-121`, tile at `ElseTile:80` | `SEPARATOR_HEIGHT = 20` (`sequence-layout-events.ts:230`, UNCITED) | **NO**, 17 for an 11px condition |
| `else` label offset | `ELSE_PADDING_Y (1) + ELSE_TEOZ_DY (2)` below the separator | already modelled (`:464-467`) | **YES** |

Verified on `lenamo-57-fano574`: frame border `y=51` = body-8 + 4 + 39;
tab 51…66 (**15**); first body arrow at 95 = `8 + 15 + 14 + 19 + 39`;
separator line at 104 = `8 + 27 + 1 + 39` in the port's own terms; second
arrow at 139 = separator tile (**17**) later; frame height **96** =
`71 + 15 + 10`; foot at 171 = `39 + (8 + 114) + 10`.

### 1.9 The remaining tiles

| element | upstream height | citation | this port | agrees |
|---|---|---|---|---|
| divider (`== x ==`) | `getTextHeight + 20` = `blockH + 8 + 20`, padding `same(4)` | `ComponentRoseDivider:67,127-131` | `dividerPreferredHeight` = same formula, then `cursor.y += height` with **no** spacing | **YES** |
| `newpage` | component `1` + `2 * MARGINY(10)` = **21** | `ComponentRoseNewpage:64-67`; `NewpageTile:50,94-96` | `NEWPAGE_TILE_HEIGHT` = 21 | **YES** |
| delay text (`...text...`) | `getTextHeight + 20` = `blockH + 8 + 20`, padding `(4,0,4,0)` | `ComponentRoseDelayText:54,72-75`; `DelayTile:114-118` | **`messageSpacing` (20) and nothing else** (`handleDelayEvent`, `:625-632`) | **NO** |
| delay line (`...`) | **20** | `ComponentRoseDelayLine:68-71` | as above | **NO** (right by luck for the bare form) |
| `\|\|\|` / `\|\|n\|\|` hspace | exactly the requested pixels | `HSpaceTile:72-75` | `event.pixels + messageSpacing` (`:665-675`) | **NO**, 20 too much |
| `activate` / `deactivate` | **0** | `LifeEventTile#getPreferredHeight:128-138` | 0 | **YES** |
| bare `destroy` (no message) | `crossSize * 2` = **18** | `LifeEventTile:132-136`; `ComponentRoseDestroy:57,68-70` | not modelled | UNCITED gap |
| `ref over` | `getTextHeight + getHeaderHeight + heightFooter(5)`, header `= blockH + 2`, padding `same(4)` | `ComponentRoseReference:61,69-70,140-142,151-153`; `ReferenceTile:74` | goes through `handleFrameEvent`'s flat 30 | **NO** |
| `space N` | `ComponentRoseGroupingSpace#getPreferredHeight:66-69` returns the space | `:66-69` | `pixels + messageSpacing` | **NO** |

### 1.10 The label block itself

`StringBounderFromWidthTable#calculateDimension:64-80` — `height = size`,
exactly, with no leading. This port's `WidthTableMeasurer` already returns
that (probed: `measure('M', {size:13}).height === 13`).

**One case where it is not the font size**: a label containing a sprite,
`<:emoji:>` or an OpenIconic glyph. `mifafi-02-dofi536` writes
`Alice->Bob : hello <$foo1> there` with a 36×36 sprite; the jar's document
is 147 tall against `bidopa`'s 124 — **+23**, which is `36 + 14` minus
`13 + 14`. The jar's text block reports the sprite's height; this port's
`lineHeight` is the font's, so the sprite reserves nothing. §3 shows why
this matters far more than its five fixtures suggest.

---

## 2. Where the height error actually comes from

Corpus probe at `e6b778a9`, all 1101 renderable fixtures, our document
height against the jar's:

| | count | share |
|---|---|---|
| too tall | **938** | 85.2% |
| too short | 153 | 13.9% |
| exact | 10 | 0.9% |
| mean signed error | **+42.35** | |
| modal error | **+13** (163 fixtures) | |

That modal +13 is the one-flat-message shape, and it decomposes exactly:

```
  −10   missing top margin                              (§1.1)
  +20   head → first tile: 20 applied where upstream has 8, and the
        first arrow's own 19 not applied                (§1.4, §1.5)
   +7   per message: advance 34 against upstream's 27   (§1.5)
  +12   tail: our 20 after a 14-unit over-advance, against upstream's 10
   −5   bottom margin 5 against 10                      (§1.1)
   −1   the missing ensureVisible +1                    (§1.2)
  ─────
  +13   `bidopa-30-jafi560`: ours 137, jar 124
```

The error is **not a constant** — it grows with the event count, because
every message contributes +7, every note +20, every group +6, and every
`|||`/`space`/delay +20.

---

## 3. The margin probe's +35 145, explained

**The batch overview's premise — "the document was already 10 short, so +10
top and +5 bottom overshot" — is wrong as a statement about the corpus, and
it is worth saying exactly where it came from.**

The five fixtures the previous mission adjudicated as rises are
`mifafi-02-dofi536`, `musive-74-reva838`, `posura-78-koji601`,
`rapoto-38-neca900` and `vekuno-87-ponu028`. Measured now, all five have a
document-height error of **exactly −10**. Ten short, five of them,
identically — which is where the premise comes from. But:

- **All five carry a sprite or emoji inside a message label.** Four are
  literally the same two-line diagram (`Alice->Bob : hello <$foo1> there`)
  with different sprite syntaxes; `rapoto` is a longer sheet whose first
  three messages are `<$circle>`, `<:rocket:>`, `<&box>`.
- Their −10 is a **compensating pair**, not a uniform shortfall: their body
  is +13 too tall like every other one-message diagram (§2), and their
  label reserves 23 too little because the sprite's height never reaches
  `lineHeight` (§1.10). 13 − 23 = −10.
- Add the margin's +15 to a −10 and you land on **+5** — which is the "body
  5 too tall" the brief describes. It is real, but it is a property of
  **these five sprite fixtures only**, and the term behind it is the
  unmodelled sprite height in the label block, not any margin term.
- On the other 1096 fixtures the document is +42 too tall on average, and
  +15 makes that +57.

**The mechanism of the rise itself**, on `bidopa-30-jafi560`, element by
element (probe = shift all content +10, bottom margin 5 → 10):

| element | ours | jar | error now | error after | Δ |
|---|---|---|---|---|---|
| head `rect@y` | 0 | 10 | 10 | 0 | **−10** |
| head label baseline | 17.889 | 27.889 | 10 | 0 | **−10** |
| lifeline `y1` | 29 | 39 | 10 | 0 | **−10** |
| arrow `line@y1` | 49 | 66 | 17 | 7 | −10 |
| foot `rect@y` | 103 | 84 | 19 | 29 | **+10** |
| foot label baseline | 120.889 | 107.889 | 13 | 23 | **+10** |
| lifeline `y2` | 103 | 84 | 19 | 29 | **+10** |
| document `height` | 137 | 124 | 13 | 28 | **+15** |
| `viewBox[3]` | 137 | 124 | 13 | 28 | **+15** |

Two facts do all the work:

1. **The head row is a small, fixed set of elements whose correct y is the
   margin itself.** 2 rects + 2 texts + 2 lifeline starts per fixture ≈
   6 600 across the corpus, which is the 6 447 diffs that vanished. Each
   was wrong by exactly 10 and became exact. That is a *count* win.
2. **Everything below is unbounded and already too low.** Our body excess
   is monotonically increasing down the page (+7 per message, +20 per
   note), so by the foot row the typical fixture is already 19–60 too low.
   Adding 10 to an error that is already positive and larger than 10
   *increases* it. Those elements outnumber the head row several-fold, so
   the *distance* loses even as the count wins.

The margin is correct. It cannot land alone because it is the only term
that moves the head row, and every other term moves everything under it.

---

## 4. The land-together set for C3

C3 must apply these as **one** change. Each is individually correct and
each, alone, makes the metric worse, for the reason §3 gives: they move
different bands of the same column and only their sum is the jar's layout.

**Group A — the frame (must land together, they define the two ends):**

1. **Top margin 0 → 10.** `SequenceDiagram#getDefaultMargins:624-628` +
   `TextBlockExporter:173` + `SequenceDiagramFileMakerTeoz:132`.
2. **Bottom margin 5 → 10.** Same citations.
3. **Delete the footer label band.** `footerLabelH` has no upstream
   counterpart (`LivingSpaces#drawHeads:135-141`,
   `PlayingSpaceWithParticipants:83-84`).

**Group B — the tile chain (must land with A; this is what makes the body
the right height so A stops overshooting):**

4. **Head → first tile: `messageSpacing` → `startingY = 8`.**
   `PlayingSpace:55,89`.
5. **Delete `messageSpacing` from every event advance** — message, exo,
   note, frame-end, delay, space. `YGauge.createWithContact:103-116`: tiles
   are flush.
6. **Message advance → `blockH + 14`, arrow at `tileTop + blockH + 6`.**
   `ComponentRoseArrow:341-344,329-335`;
   `AbstractComponentRoseArrow:55,62,96-99`.
7. **Measure the message label's line height at the arrow font (13), not
   the ambient 14** — `sequence-layout-message.ts:50` and
   `sequence-layout-exo.ts:296` must use `arrowFontSpecOf`, which the
   drawing side already uses.
8. **Tail: `lifelineExtension` 20 → `+10` measured from the last tile's
   max.** `PlayingSpace#getPreferredHeight:154-161`.

**Group C — the per-element heights (each is independent of the others, but
all belong in the same change because each shifts everything below it, and
a partial set reproduces §3's failure at smaller scale):**

9. **Note tile → `blockH + 20`; box `blockH + 10` drawn 5 below the tile
   top; text inset 5.** `ComponentRoseNote:67-70,88-91`; `Rose:66`;
   `NoteTile:167-171`.
10. **Self message tile → `blockH + 27`; `SELF_LOOP_HEIGHT` 20 → 13.**
    `ComponentRoseSelfArrow:316-323`.
11. **Group frame: border at `gaugeMin + 4`, body at `gaugeMin + headerH +
    14`, frame height `bodyH + headerH + 10`, slack below 14.**
    `GroupingTile:88,91,156,240-242,342-345,348-357`.
12. **`else` separator → `blockH + 6`.**
    `ComponentRoseGroupingElse:115-121`; `ElseTile:80`.
13. **Delay → `blockH + 28` (text) or 20 (bare line); `|||` and `space` →
    exactly their pixels.** `ComponentRoseDelayText:72-75`;
    `ComponentRoseDelayLine:68-71`; `HSpaceTile:72-75`.

**Not in the set, deliberately:**

- **The `ensureVisible` +1** (§1.2). Correct, cited, and it would close the
  last unit on both axes — but `document-shell.ts` is shared by every
  diagram type. **Ask the maintainer first.** If it is taken, take it in
  its own commit so its blast radius is separable.
- **The sprite/emoji label height** (§1.10, §3). Correct and needed, but it
  is a text-measurement change in `sequence-creole.ts`/`text-block-geo.ts`,
  not a vertical-layout constant, and it owns the five canaries. Its own
  task.
- **`ref` body geometry** (§1.9). `ComponentRoseReference` has a header, a
  body and a 5px footer that this port models as a flat 30; converting it
  needs `ref-body-geo.ts` as well. Own task.

---

## 5. Open questions for the maintainer

1. **May C3 change `src/core/klimt/document-shell.ts:130-131`?**
   `Math.trunc(x)` → `Math.trunc(x + 1)` is what `SvgGraphics#ensureVisible
   :129-136` does, and until it lands **no sequence fixture can have an
   exact width or height** (0 of 1101 do today; 424 are exactly 1 narrow).
   It moves every other diagram type's root dimensions in the same commit.
2. **`theme.sequence.messageSpacing`, `lifelineExtension`, `noteMargin`,
   `frameHeaderHeight` are theme fields with no upstream counterpart.**
   Removing `messageSpacing` from the vertical path leaves it referenced
   nowhere but a public `Theme` type. Delete the field, or keep it as a
   no-op for API stability?
3. **`ComponentRoseSelfArrow#getYPoint:309-314` adds `getPaddingX()` where
   every sibling adds `getPaddingY()`**, and `getPaddingX()` is 0
   (`AbstractComponent:151-153`). Preserved as-is per `CLAUDE.md`, but
   recorded so it is not "fixed" later by accident.
4. **A bare `destroy` reserves 18** (`LifeEventTile:132-136`,
   `ComponentRoseDestroy:57,68-70`). This port models no height for it.
   Small, cited, and outside every term above — fold into C3, or track it?
5. **Multi-page (`newpage`) vertical.** `getYMin`/`getYMax`
   (`PlayingSpaceWithParticipants:96-110`) clip each page to the newpage
   tile's gauge, and pages deliberately overlap by one separator. 153
   fixtures are *shorter* than the jar's, which is the shape a missing page
   split makes. Not derived here; C3 should not touch it.

---

## 6. Canaries — what C3 should watch, and what each proves

| fixture | today (ours → jar) | what it proves |
|---|---|---|
| `bidopa-30-jafi560` | h 137 → 124, w 115 → 116 | The whole §2 decomposition, at its smallest. If this is not exact after C3, the model is wrong, not the constants. Also the cleanest `ensureVisible +1` witness: width off by exactly 1. |
| `gibaro-25-sibu619` | h 205 → 178 | Three identical messages: `(205−178)/3` isolates the per-message +7. Arrow ys must be 66/93/120. |
| `metano-36-gevu843` | h 190 → 130 | Note box height (23), inset (5) and the 5px tile-top offset. The largest single-fixture delta in the small set — the note terms are the biggest per-element error in §1. |
| `fasafe-10-fepe885` | h 221 → 194 | Group header (15), body offset (29 from gauge min), frame height (52), and the 4px border margin. |
| `lenamo-57-fano574` | h 241 → 211 | Adds the `else` separator (17, not 20) and proves the frame arithmetic composes across two branches. |
| `jobadi-87-jegi648` | h 137 → 124 | `SELF_LOOP_HEIGHT` 20 → 13. Note it **short-circuits** in the comparator (`findings/activation-verify.md`), so verify it by direct extraction, never by its distance. |
| **`mifafi-02-dofi536`** | h 137 → **147** | Canary 1 of 5. Ten SHORT, not tall. If C3 lands groups A+B+C without the sprite-height fix, this goes to **+5** and rises — expected, adjudicate it, do not chase it. |
| **`musive-74-reva838`** | h 137 → 147 | Same shape, different sprite syntax. |
| **`posura-78-koji601`** | h 137 → 147 | Same, via `!pragma svgparser sax`. |
| **`vekuno-87-ponu028`** | h 137 → 147 | Same, multi-line `<svg>`. |
| **`rapoto-38-neca900`** | h 634 → 644 | The same mechanism at scale: sprite, `<:rocket:>` and `<&box>` labels, plus dividers. Watch it for the divider terms too. |

The five canaries are the whole reason C3 must not read a rise as a
failure. Their error today is a **compensating pair** — a body 13 too tall
against a label 23 too short — and correcting one half without the other
necessarily moves them. Every one of the five is a sprite-in-label fixture,
and none of them is evidence about margins.

---

## 7. Method note

Everything above was read from the Java before it was checked against a
golden, and no constant was chosen to close a delta. The document formula
in §0 was written from `SequenceDiagramFileMakerTeoz`,
`PlayingSpaceWithParticipants`, `PlayingSpace` and `TextBlockExporter`, and
*then* evaluated on five fixtures; it reproduced all five to the unit on
the first evaluation, which is the evidence that it is the jar's model
rather than a fit to it.

Two throwaway probes were used and deleted: one printing
`WidthTableMeasurer.measure` heights (confirming `height === font size`,
matching `StringBounderFromWidthTable:64-80`), and one rendering all 1141
fixtures to compare root dimensions (the §1.2 and §2 tables).

---

## ORCHESTRATOR RULING — the `ensureVisible +1` is NOT a shared-shell change

C2's open question 1 asked whether C3 may change
`src/core/klimt/document-shell.ts:130-131` from `Math.trunc(x)` to
`Math.trunc(x + 1)`, mirroring `SvgGraphics#ensureVisible:128-135`'s
`maxX = (int) (x + 1)`. The Java citation is correct and was verified
independently.

**Measured before ruling**, per fixture across all five families, same
instrument and method used for the `CommandCreoleUrl` fix:

| family | before | after | delta |
|---|---:|---:|---:|
| sequence | 1 314 753 | 1 313 923 | **−830** |
| class | 101 354 | 103 716 | **+2 362** |
| state | 37 165 | 38 101 | **+936** |
| object | 6 246 | 6 506 | **+260** |
| description | 75 833 | 75 859 | **+26** |

**Ruling: NO.** Reverted; the baseline was confirmed restored to the digit.

**What the measurement means.** It helps sequence and hurts the four cuca
families — which is only possible if those four are ALREADY correct at
`trunc(x)`. Their extent is not a raw max coordinate: it comes from a graphviz
bounding box plus explicit margins, already carrying the rounding upstream
applies during drawing. Sequence's is a raw max, so sequence alone is short.

**The defect is therefore in the SEQUENCE extent computation, not in the shared
shell.** C3 applies `ensureVisible`'s semantics on the sequence path, inside its
own write-set, and leaves `document-shell.ts` alone. The citation stands; only
its location was wrong.

This also revises C2's claim that "0 of 1101 sequence fixtures can have an
exact width or height until it lands" — true of sequence, and the fix is
available to C3 without touching another family.

