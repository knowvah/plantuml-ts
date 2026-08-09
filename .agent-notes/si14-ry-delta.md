## Observation: `class-usecase-inline-sprite` ellipse `ry`/`rx` delta — root cause found

- **Context**: SI14 T6, diagnosis-only task. Fixture
  `oracle/goldens/svg-class/class-usecase-inline-sprite` pins a survivor diff
  on `svg/g[1]/g[2]/ellipse[1]/@ry` (actual 13.4846 vs expected 13.0625,
  Δ0.4221) and `@rx` (50.8964 vs 48.968, Δ1.9284), left unmoved by T4
  ("T6's job"). Fixture: a usecase whose label is `<$Gear> Configure`, a
  monochrome inline sprite (3-col × 2-row grid) followed by plain text.

- **Mechanism**: `UImage.ts`'s `getWidth()`/`getHeight()` return the
  **declared/scaled** dimensions (the same float value
  `creole-atoms-measure.ts#measureInlineAtom` computed for label sizing —
  e.g. `3.230769`/`2.153846` for this sprite, `spriteScale = fontSize/13`
  applied to the 3×2 grid). Upstream's `UImage.java#getWidth/getHeight`
  return something structurally different: the RASTERIZED PNG'S NATIVE
  PIXEL COUNT, unscaled by the CSS/SVG placement scale, **minus one**
  (`image.getImage().getWidth() - 1`). For this sprite the native raster is
  3×2 pixels (one pixel per grid cell — the `scale` factor only stretches
  the `<image width= height=>` SVG attributes, it does not enlarge the PNG
  raster itself), so upstream's `getWidth()/getHeight()` here are `2`/`1`,
  not `3.230769`/`2.153846`. `Footprint.MyUGraphic.drawImage`
  (`Footprint.ts:107-112`, faithfully ported from `Footprint.java:141-146`)
  calls `image.getWidth()/getHeight()` to record the drawn image's corner
  points for the ellipse fit — so this port's `Footprint` correctly calls
  the right method, but the method itself answers a different question than
  upstream's does.

- **Origin**: `src/core/klimt/shape/UImage.ts:34-40` (`getWidth`/`getHeight`
  return `this.f.width`/`this.f.height` — the single scaled-declared value
  `UImage.build()` was constructed with, per that file's own doc comment: "the
  SAME scaled width/height `creole-atoms.ts#measureInlineAtom` used to size
  the label during layout"). This is a documented, deliberate T7 scope
  reduction ("NOT a port of upstream's klimt.shape.UImage... a minimal,
  scoped shape") that collapsed upstream's two independent notions —
  declared/scaled placement size vs. native raster pixel count minus one —
  onto one pair of numbers reused for both layout (`Sea.add`/`doAlign`,
  correctly) and footprint/ink measurement (`Footprint.drawImage`,
  incorrectly).

- **Causal chain (arithmetic reaching 13.4846 and 13.0625)**:
  Instrumented the real footprint points feeding
  `Footprint.getEllipse`/`ContainingEllipse` for this fixture (both text and
  image atoms are on one row, sprite first): image atom corners
  `(0, 11.846154)`–`(3.230769, 14)` [our declared W×H], text atom corners
  `(3.230769, -1.611111)`–`(63.955769, 12.388889)`. Confirmed alpha (the
  ellipse aspect ratio, `textDim.height/width = 14/63.955769`) is
  `0.21890128394022312`, not clamped, and matches jar's own implied alpha
  (back-derived from golden `rx`/`ry`: `0.218894`) to golden's own decimal
  precision — i.e. alpha itself is not the divergence. The minimal enclosing
  circle for these 8 (squashed) points is a pure **2-point diameter** case:
  it is entirely determined by the diagonal pair `(0, 14)`
  (image bottom-left) and `(63.955769, -1.611111)` (text top-right) — every
  other point is interior. `width = 2r = dist(P1,P2)` in squashed space
  = `95.79289`, `height = 2r·alpha = 20.96919`; after `bigger(6)` and
  halving: `rx = 50.8964`, `ry = 13.4846` — exactly the pinned "actual"
  values.

  Substituting ONLY the image atom's footprint corners with upstream's real
  raster-minus-one dims (`W=2, H=1`, keeping its Sea-assigned top-left
  `(0, 11.846154)` unchanged — that position formula is independently
  correct, see Ruled out #4/#5) and re-running the identical
  `ContainingEllipse`/`SmallestEnclosingCircle` code on the resulting 8
  points reproduces jar's numbers to 5 decimal places: `width=91.93606`
  (target from golden: `2×(48.968−3) = 91.936`), `height=20.12492` (target:
  `2×(13.0625−3) = 20.125`) → `rx=48.96803` (golden `48.968`),
  `ry=13.06246` (golden `13.0625`). Independently reproduced on a MINIMAL
  sprite-only fixture (no text at all): jar gives `rx=4.25, ry=3.8333`
  (declared box `2.5×1.66667` after un-padding); solving the same 2-point
  right-triangle equation (`alpha=2/3` exact, from the 2×3 sprite grid) for
  integer raster dims gives `W=2, H=1` → `diag = √(2² + (1/(2/3))²) =
  √(4+2.25) = 2.5` exactly, `height = 2.5×2/3 = 1.66667` exactly — both
  match jar bit-for-bit. `2+1=3, 1+1=2` = the sprite's native 3×2 grid,
  confirming the "raster pixel count minus one" formula precisely.

- **Ruled out** (with evidence):
  1. **Alpha clamping** ([0.2, 0.8], `TextBlockInEllipse.ts:35-36`) —
     instrumented actual value `0.21890128394022312`, nowhere near either
     boundary; also `height/width` is a construction identity
     (`ContainingEllipse.ts#getHeight = 2·radius·alpha`, byte-identical to
     `ContainingEllipse.java`) so it cannot itself be the source of a
     magnitude mismatch.
  2. **Text metric mismatch** (width/height/textLength) — width formula
     independently jar-verified (`measurer-deterministic.ts`'s own doc-
     comment table); height read directly from upstream
     `StringBounderFromWidthTable.java:71` (`height = size`, unconditional)
     — identical to this port's `WidthTableMeasurer.measure`; golden's own
     `text/@textLength = 60.725` matches ours exactly (not a pinned diff).
  3. **Descent formula** (`font.size/4.5`) — read upstream
     `StringBounder.java:47-50`'s DEFAULT `getDescent` (inherited by
     `StringBounderFromWidthTable`, which has no override) — identical
     value (`3.1111`) to this port's `WidthTableMeasurer.getDescent`.
     Controlled experiment: a text-only usecase ("Configure", no sprite)
     renders **byte-identical** to the jar on both sides
     (`rx=45.9391, ry=12.8995`) — proves the descent/height/"1.5"-constant/
     alpha/circle-fit chain is exactly correct with a single atom. (The
     "3.1111 vs 2.9531" descent divergence commit 1406e139 documented is a
     real but separate, smaller, production-AWT-only phenomenon — not
     reproducible against this deterministic golden, and shifts the whole
     text box uniformly rather than changing its spread.)
  4. **Multi-atom composition generally** (`Sea.doAlign`/`translateMinYto`,
     `Sea.ts`) — byte-identical port of `Sea.java` (line-by-line
     comparison). Controlled experiment: two SAME-height text atoms on one
     line (`"<b>Config</b>ure"`) ALSO render byte-identical to jar
     (`rx=45.9391, ry=12.8995`). Rules out "more than one atom" as the
     mechanism — a raster image atom must be present.
  5. **Sprite declared-width formula** (`spriteScale`,
     `creole-atoms-measure.ts`) — independently jar-verified in that file's
     own doc-comment table; cross-checked against this exact golden:
     `image/@x=143.5501`, `text/@x=146.7809`, difference `3.2308` exactly
     matches the declared sprite width used for the Sea cursor advance
     (`Sea.add`, unaffected by the `UImage` bug) — confirms the
     MEASUREMENT-side declared width is correct; only the
     FOOTPRINT-drawing value is wrong.
  6. **SVG-sprite ink box** (`SpriteSvg.ts#svgInkBox`, `Footprint.drawPath`)
     — this fixture's sprite is a monochrome grid sprite that rasterizes to
     a PNG `<image>`, dispatched through `Footprint.drawImage`
     (declared/`UImage` box), never `Footprint.drawPath` (ink box) — that
     code path is structurally unreachable here. Ruled out by inspection of
     `Footprint.ts`'s `draw()` dispatch (`shape instanceof UImage` vs
     `UPath`).
  7. **D9 Amendment 1 emission rounding** (`image/@width`/`@height`
     `3.2308→3`, `2.1538→2`) — a separate, already-pinned diff at the FINAL
     SVG-emission call site (`renderer-classifier-rows.ts`), which runs
     after `Footprint`'s in-memory fit, not before it; structurally
     disjoint call sites. (The coincidence that the correct fit values,
     2/1, are exactly the emission-rounded values minus one, is upstream's
     `UImage.getWidth()=rasterPixels−1` quirk, not the D9 rounding —
     confirmed by deriving 2/1 independently from the 2-point diameter
     equation, not by subtracting one from the emission constants.)
  8. **Stale golden** — re-ran the pinned oracle jar fresh
     (`-DPLANTUML_DETERMINISTIC_TEXT=true`) against
     `oracle/goldens/svg-class/class-usecase-inline-sprite/in.puml`; output
     matches the checked-in `golden.svg` byte-for-byte on the ellipse
     attributes.
  9. **Stereotype merge** (`TextBlockUtils.empty(0,0)` vs the
     `EMPTY_TEXT_BLOCK` sentinel not short-circuiting `mergeTB`) — traced
     structurally: an empty(0,0) block's `drawU` is a no-op, contributes no
     footprint points regardless of `TextBlockVertical` wrapping; direct
     instrumentation of the actual footprint point set (`ContainingEllipse
     .append` monkey-patch) confirmed exactly 8 points (image + text
     atoms only, nothing else).

- **Does one mechanism cover the whole cx/rx/ry/text-x family, or does it
  split?** `rx`/`ry` are both fully and exactly explained by this one
  mechanism (verified to 5 decimal places by direct substitution). `cx` and
  the downstream `image/@x`/`text/@x` (T4's already-diagnosed "off-by-1.93
  `rx` propagates to off-by-2.00 label `x`") depend on the SAME
  `ContainingEllipse`-computed total width via
  `TextBlockInEllipse.calculateDimensionSlow` → the usecase entity's
  reserved width in the class-layout pass → the entity's final x-position
  → `cx`. Since that total width is now shown to collapse to jar's exact
  value once the `UImage` fix lands, `cx`/`image-x`/`text-x` are very
  likely downstream of this SAME one root cause too — but this task did not
  re-run the full layout pipeline with the fix applied (diagnosis-only,
  no source changes permitted), so the layout-propagation leg of that claim
  is inference from the dependency structure, not independently reproduced
  the way `rx`/`ry` were. The fix task (not this one) should re-measure
  `cx`/`image-x`/`text-x` after landing the `UImage` change rather than
  assume they clear to zero.

- **Classification**: plantuml-ts defect (documented scope-reduction gap in
  `UImage.ts`, not a `@knowvah/dot-engine` finding — the dot-engine is not on this
  code path at all — and not an irreducible/upstream-platform divergence:
  upstream's behavior is fully specified and reproducible in TS). Proposed
  fix shape (NOT applied — diagnosis-only task): give `UImage` a second,
  optional pair of fields carrying the native raster pixel dims (e.g.
  `rasterWidth`/`rasterHeight`, populated only for atoms with a real raster
  backing — `resolveSpriteAtom`/`resolveImgAtom` in
  `render-atoms.ts`), and have `Footprint.MyUGraphic.drawImage` use
  `(rasterWidth ?? width) - 1` / `(rasterHeight ?? height) - 1` instead of
  the declared `width`/`height` — mirroring upstream's `UImage.java`
  two-notion split precisely, without disturbing the (already-correct)
  declared-dimension path used by `Sea`/layout/final SVG emission. This
  fix belongs to a follow-up task with a code write-set (this task's
  write-set is `.agent-notes/` only); it should re-measure the full
  `cx`/`rx`/`ry`/`image-x`/`text-x`/`image-width`/`image-height` diff set
  on `class-usecase-inline-sprite` afterward, not just `ry`.

- **Confidence**: High for `rx`/`ry` (mechanism reproduced numerically to 5
  decimal places on two independent fixtures, both cross-checked against a
  freshly-run pinned oracle jar). Medium for the `cx`/`image-x`/`text-x`
  propagation claim (structurally well-supported, not independently
  re-measured end-to-end).
