# Evidence — everything already measured

Every number here came from a real run or from jar's own committed files.
Probes were reverted; the tree is unchanged. **Nothing in this document
needs re-deriving.**

Subject throughout: `test-results/dot-cache/state/bemena-23-zebu249`, the
`Configuring` composite. `pajefo-95-neri955` and `xepafa-33-lazi826` are the
same diagram in different spellings and behave identically.

---

## 1. The composite's size formula is CORRECT

Probe-measured on our pipeline:

```
spec kind      = autonom        <- NOT a cluster spec
ink extent     = 357.86168      <- buildInkBox, minX 0 / maxX 357.86168
geometry.width = 372.86168      = extent + INK_DELTA(15)          ✓ SvekResult
wrapper.width  = 392.86168      = + 20 (MARGIN*2 + 2*MARGIN_LINE) ✓ InnerStateAutonom
dx = dy        = 6                                                 ✓ moveDelta
declared node  = 392.86168 px = 5.456412 in   (jar: 5.449097 in = 392.33498)
```

Upstream sources, all verified:

- `SvekResult#calculateDimension` — ink walk, `moveDelta(6 - min)`,
  `getDimension().delta(15, 15)`
- `InnerStateAutonom#calculateDimensionSlow` —
  `dim.delta(MARGIN*2 + 2*MARGIN_LINE + marginForFields)`; `marginForFields`
  is `MARGIN`(5) or 0, and is **0** here (no attributes) ⇒ 20
- `IEntityImage.java:44-46` — `MARGIN = 5`, `MARGIN_LINE = 5`

**So `composite width = ink + 35`, and the 0.527 is in the INK.** An earlier
mission (`plans/state-composite-inner-canvas/`) halted on exactly this
finding; its `decision-journal.md` STOP entry is the fuller write-up.

## 2. Our label numbers all match jar

| | ours | jar | source |
|---|---|---|---|
| reserved box (DOT) | `WIDTH="113"` | `WIDTH="113"` | jar's `svek-1.dot` |
| measured text width | 111.475 | `textLength="111.475"` | jar's `in.svg` |
| label draw x (raw frame) | 244.86168 | 244.86 (derived, §4) | probe / jar SVG |
| `marginLabel` | 1 | — | `computeReservedLabelBox` |
| label centre x (raw) | 300.36168 | — | graphviz's `labelX` |

`label.x = centre.x − reservedWidth/2 + marginLabel`
(`state-transition-label.ts#transitionLabelAnchor`).

## 3. Mechanism (A) — the fold uses the reserved box, not the drawn text

`src/diagrams/state/layout-ink-extent.ts:391`:

```ts
addPoint(box, transition.label.x + transition.label.width, transition.label.y);
```

`label.width` is `computeReservedLabelBox`'s `reservedWidth` = **113**.

Upstream folds the DRAWN text instead — `LimitFinder.java#drawText`
(:217-225), which our own `src/core/klimt/drawing/LimitFinder.ts#drawText`
ports **verbatim and correctly**:

```java
final XDimension2D dim = getStringBounder().calculateDimension(font, text);
y -= dim.getHeight() - 1.5;
addPoint(x + dim.getWidth(), y);   // dim.getWidth() = 111.475, not 113
```

So the call site simply does not route through the rule this port already
has. **Fold error: 113 − 111.475 = +1.525.**

## 4. The coordinate frames, and jar's actual drawn extent

Independently derived, then confirmed:

- jar's composite rect: `x="7" width="392.335"`
- `InnerStateAutonom#drawU` draws the inner image at
  `UTranslate(IEntityImage.MARGIN, …)` ⇒ image origin **absolute 12** (7+5)
- `moveDelta` puts inner ink at 6 within the image ⇒ leftmost ink
  **absolute 18**
- Our raw label x 244.86168 + 6 + 12 = **262.86168**, against jar's drawn
  `x="262.86"` ✓ — our label placement matches jar's exactly

Scanning jar's `in.svg` bounded to the composite box, excluding its own
outline and title divider:

```
leftmost  absolute x = 18.000    a transition spline  (M57.37,223.48 C… 18,…)
rightmost absolute x = 374.335   the label text       (262.86 + 111.475)
jar DRAWS                        = 356.335
```

`18.000` independently corroborates our raw `minX = 0`.

## 5. Mechanism (B) — the 1.000 nobody can source

```
jar drawn extent    356.335   (measured above)
jar implied extent  357.335   (392.335 − 15 − 20)
                    -------
                    +1.000    jar's ink exceeds its own rightmost drawn element
```

And our corrected fold would give `244.86168 + 111.475 = 356.33668` —
matching jar's DRAWN extent to **0.002**. So (A)'s fix is right, and (B) is
the entire remaining question.

### Eliminated, each with its evidence

1. **Arrowhead ink.** `computeSvekResultGeometry` passes
   `includeArrowheadInk: false`, a *documented workaround* for a suspected
   arrowhead-ink bug — the leading candidate. Flipping it to `true` changes
   this fixture's extent **not at all** (357.86168 either way). Dead.
2. **Text measurement.** `DriverTextSvg.java:126-127` computes the emitted
   `textLength` as `stringBounder.calculateDimension(font, text).getWidth()`
   — the very value `LimitFinder#drawText` folds. They cannot differ. Dead.
3. **`labelShield`.** `SvekEdge.java:353-356` sets it to 0 or 7 (gated on
   `LinkMiddleDecor`), never 1, and 0 here — confirmed independently because
   the reservation is `calculateDimension + 2*labelShield` (`:440-441`) and
   equals 113. Dead.
4. **`Display.create0`'s wrapper chain.** `Display.java:692-701`'s
   `getCreole` returns
   `new SheetBlock2(sheetBlock1, sheetBlock1, UStroke.withThickness(1.5))`.
   That 1.5 stroke looks promising and is not it: `SheetBlock2.drawU` wraps
   in `UGraphicStencil`, which overrides **`drawHline` only** (creole `----`
   rules, which a one-line label has none of), then draws the block. No
   extra shape. Dead.
5. **Composite shield.** `InnerStateAutonom.java:203-205` returns
   `Margins.NONE`. Dead.
6. **A formula-level `+1` in the margin layer — REOPENED.** Rejected earlier
   on the grounds that "8 fixtures report exact would break", which was
   **unsound**: the harness reports every NODE, and those 8 are very likely
   leaf states. On these three fixtures the composite is the ONLY mismatched
   node in its scope — every leaf beside it is exact. That pattern fits a
   composite-specific formula error and contradicts a leaf-level one.

### The number you must not adopt

Corrected fold (356.337) + 15 + **21** = 392.337 against jar's 392.335 —
fits to 0.002. **`21` has no upstream source.**
`calculateDimensionSlow` is `MARGIN*2 + 2*MARGIN_LINE + marginForFields` =
20, and `marginForFields` is 5 or 0, never 1. Taking 21 because it lands the
fixture is fitting, which this port forbids (`CLAUDE.md`: "Never fit a value
— keeping whatever shrank the error is forbidden *especially* when it
shrinks"). It would also be a third uncited constant in that file.

## 6. The corpus context

Composite width deltas vary widely across the corpus — `-36.000`,
`-10.000`, `-3.000`, `+0.191`, `+2.550`, `+5.788`, and `+0.527` on this
family. So the 0.527 is **not** a universal constant, and other fixtures'
mismatches are other mechanisms. Do not expect one fix to move them all.

Harness baseline, `npx tsx scripts/measure-composite-declared-size.ts`:

```
fixtures 271 · declarations 2642 · exact 2454 · mismatched 160
lastDigitOnly 28 · unmatchedFixtures 4 · dirtyFixtures 91
```

`lastDigitOnly` is a separate bucket for one-unit-in-the-6th-decimal
differences (e.g. 3.555555 vs 3.555556) — formatting, not size. These three
fixtures' HEIGHTS land there and are not this mission's target.

## 7. Files that matter

**Port side**

- `src/diagrams/state/layout-ink-extent.ts:391` — the fold, mechanism (A)
- `src/diagrams/state/layout-ink-extent.ts#computeSvekResultGeometry` — the
  composite's ink walk (`labelInk: true`, `includeArrowheadInk: false`)
- `src/diagrams/state/state-composite-autonom.ts:196-205` — composite sizing
- `src/diagrams/state/state-transition-label.ts` — `attachTransitionLabel`,
  `transitionLabelAnchor`, `computeReservedLabelBox`
- `src/core/klimt/drawing/LimitFinder.ts#drawText` — the correct rule
- `src/core/svek/SvekResult.ts` — `INK_DELTA`, `JAR_INK_MARGIN`,
  `svekDimension`, `svekInkShift`
- `src/core/svek/IEntityImage.ts` — `ENTITY_IMAGE_MARGIN(_LINE)`
- `scripts/measure-composite-declared-size.ts` — the exact oracle

**Upstream** (grep all of `src/main/java/net/`, never just
`net/sourceforge/plantuml/` — that misses `net/atmp/`)

- `svek/SvekResult.java`, `svek/InnerStateAutonom.java`, `svek/SvekEdge.java`
- `svek/SvekNode.java:224` — the shield/dimension area, **Batch 1's target**
- `svek/GroupMakerState.java`, `svek/GeneralImageBuilder.java`
- `klimt/drawing/LimitFinder.java`, `klimt/drawing/svg/DriverTextSvg.java`
- `klimt/creole/Display.java`, `klimt/creole/SheetBlock2.java`
