# Locked decisions — sequence-participant-g-wrapper

Every decision here is **locked**. If a task discovers a conflicting
constraint in the Java, stop and log it to `decision-journal.md` — do not
silently override.

Each cites the upstream method body that settles it, per CLAUDE.md's
"I read the Java means you can quote it".

---

## D1 — The lifeline group is `ComponentRoseLine`, and it contains two children

`skin/rose/ComponentRoseLine.java:75-88`:

```java
ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
drawTitleHoverTargetRect(ug, dimensionToUse);

final int x = (int) (dimensionToUse.getWidth() / 2);
ug.apply(UTranslate.dx(x)).draw(ULine.vline(dimensionToUse.getHeight()));
ug.closeGroup();
```

and `:99-108`:

```java
private void drawTitleHoverTargetRect(UGraphic ug, XDimension2D dimensionToUse) {
    if (dimensionToUse.getHeight() > 0) {
        final double hoverTargetWidth = 8;
        ug = ug.apply(UStroke.withThickness(0));
        ug = ug.apply(HColors.transparent());
        ug = ug.apply(HColors.transparent(WITH_FILL_OPACITY).bg());
        ug = ug.apply(UTranslate.dx((dimensionToUse.getWidth() - hoverTargetWidth) / 2));
        ug.draw(URectangle.build(hoverTargetWidth, dimensionToUse.getHeight()));
    }
}
```

So the emitted shape is `<g><title>T</title><rect …/><line …/></g>`:

- **the rect** is `width="8"`, `height` = the line's height, `fill="#000"`
  `fill-opacity="0"`, **no stroke attribute at all** (thickness 0 +
  transparent). Its `x` is `areaX + (w - 8) / 2`.
- **the line** is at `areaX + (int)(w / 2)`.

`getPreferredWidth` returns `1` (`:96-98`), so with `w = 1`:
`(int)(1/2) = 0` and `(1-8)/2 = -3.5`. The area origin is therefore the
participant centre, giving **rect x = centreX − 3.5, line x = centreX**.
Confirmed arithmetically against the golden: A's head box is `x=10 w=23.362`
→ centre `21.681`; the golden emits `rect x="18.181"` and `line x1="21.681"`.
`21.681 − 3.5 = 18.181`. ✔

**These are not fitted constants** — 8 is `hoverTargetWidth` at
`ComponentRoseLine.java:101`, and the −3.5 is `(w-8)/2` evaluated at
upstream's own `getPreferredWidth` of 1.

## D2 — The title text is the participant display's first line

`teoz/MutingLine.java:107-109` builds the component with
`participant.getDisplay(skinParam.forceSequenceParticipantUnderlined())`, and
`Display#toTooltipText` (`klimt/creole/Display.java:601-605`) is:

```java
if (size() == 0) return "";
return get(0).toString();
```

First line, or empty string. **Not** the participant code, and **not** joined
multi-line text.

## D3 — Head and tail boxes stay UNWRAPPED

`Participant#groupTypeHead`/`groupTypeTail`
(`sequencediagram/Participant.java:202-220`) build a `<g>` carrying
`class="participant participant-head"`, `data-qualified-name`, `data-uid` …
— but their only call sites are
`sequencediagram/graphic/ParticipantBox.java:132` and `:145`, in the **dead
`graphic/` package**. Teoz draws heads through
`livingSpaces.drawHeads(…)`, which never opens that group.

Confirmed against the jar, not inferred: the golden emits
`<rect x="10" y="10" …/><text …>A</text>` bare, with no enclosing `<g>`.
`ParticipantBox.drawHeadTailU` has **no guard** around its `startGroup` calls
— had that path run, the wrapper would be present unconditionally.

**Do not add head/tail wrappers.** Doing so would break the alignment this
mission exists to establish.

## D4 — Activations are `ComponentRoseActiveLine`, and they belong to the LIFELINE pass

`teoz/PlayingSpaceWithParticipants.java:221`:

```java
// Lifelines and liveboxes use absolute positions over the whole diagram:
// they must be drawn with the full height, the clip trims them to the page
livingSpaces.drawLifeLines(ugBody, fullHeight, context);
```

Liveboxes (= activations) are drawn **with** the lifelines, before the heads,
not interleaved with the message tiles. The port's `renderer.ts` step 3
currently emits them inside the event pass; that is the divergence.

The group shape is `skin/rose/ComponentRoseActiveLine.java:71-105`:

```java
final int x = (int) (dimensionToUse.getWidth() - getPreferredWidth(stringBounder)) / 2;
if (dimensionToUse.getHeight() == 0)
    return;
ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
```

Two facts that follow and must be preserved:

1. **The zero-height early return happens BEFORE `startGroup`** — a
   zero-height activation emits no `<g>` at all, not an empty one.
2. `getPreferredWidth` is `10` (`:114-116`), matching the port's existing
   `ACTIVATION_HALF_WIDTH * 2`.

The golden's activation group is `<g><title></title><rect …/></g>` — an
**empty** title, because the `Display` handed to the active-line component is
empty. Emit `<title></title>`, not a self-closed `<title/>` and not an
omitted title.

## D5 — Footbox is drawn BEFORE the foreground tiles

`teoz/PlayingSpaceWithParticipants.java:223-227`:

```java
livingSpaces.drawHeads(ug, context, VerticalAlignment.BOTTOM);
if (playingSpace.isShowFootbox())
    livingSpaces.drawHeads(ug.apply(UTranslate.dy(pageHeight + headHeight)), context, VerticalAlignment.TOP);

playingSpace.drawForeground(ugBody);
```

The port emits footboxes last (`renderer.ts` step 4, after the event pass).
That is a z-order divergence as well as an index one: upstream lets arrows
paint **over** the footbox, the port paints the footbox over the arrows.

## D6 — This mission changes no geometry

No coordinate, no width, no colour resolution changes. The only new numeric
values are D1's `8` and `−3.5`, both quoted above from upstream.

If a fixture's score will not fall without moving a coordinate, that is a
**separate, filed defect** — record it and move on. Fitting is forbidden
"*especially* when it shrinks the error" (CLAUDE.md).

## D7 — Falls are the instrument; the target is alignment, not a number

Success is: the child sequence under the root `<g>` matches the golden's
tag sequence for a representative fixture set, verified by reading the diff
records — **not** by Σ weightedScore alone. A score that falls while tags
still mismatch means something else moved and must be diagnosed.
