# cdd2-T17: canvas 1 px at its origin (R-1..R-9, Q-11)

## Observation: the class ink walk needs a Y reservation, and it has no carrier
- **Context**: jubobo, bejeli, gabejo, julixi, rulite and xosiza are each
  1px too TALL.
- **Finding**: in each one the bottom classifier has its body hidden
  (`hide members` / `hide empty members` / `hide fields`+`hide methods`). A
  hidden body is `TextBlockUtils.empty(0, 0)`
  (`BodierLikeClassOrObject.java:249-250`) and draws no `UEmpty`. The
  header's marged blocks then stop short of the bottom edge: the name ends
  at `(hh + stereoH + nameH) / 2`, the circle at `(hh + circleH) / 2`
  (`HeaderLayout.java:98-109`). So `LimitFinder#drawRectangle`'s
  `y + h - 1` is the max. `addRectInk` uses a fixed `y + h`.
- **Probe**: plumbing a `bodyInkHeight` (the header's max Y when the body is
  hidden) closed all six to conformant. lecelo fell 7 -> 5. No fixture
  rose. The probe was reverted: the carrier needs `MeasuredClassifier`
  (`class-layout-helpers.ts`), `inkBodyFields` (`class-geo-builders.ts`) and
  `class-scale-geo.ts`, and all three are outside T17's write-set.
  `headerInkReservation` already computes `maxY`.
- **Impact**: R-5 (julixi/rulite, "dot-engine 5.6e-5") and R-4 (xosiza,
  "absorbLayoutEpsilon rounding") were both misattributed. The sub-pixel
  excess sat on top of a real 1px ink term.
- **Confidence**: High (six fixtures; the probe measured zero rises).

## Observation: gatula is the jar's 2dp dot-SVG scrape, not an ink term
- **Context**: R-2 had predicted `bodyInkWidth: 0` for an empty class body.
- **Finding**: the Java says otherwise. An empty shown body still reserves
  a 12px `UEmpty` per compartment (`MethodsOrFieldsArea.java:83-86`), and
  `qux`'s name block reaches `x + w`. The jar's `x` is 155.42, ours is
  155.425. `DotStringFactory.java:388-396` takes node positions from
  graphviz's `-Tsvg` `points=` text: `dot -Tsvg svek-1.dot` prints `149.42`
  for `sh0008`, while the exact value is 149.425. So the jar's max X is
  209.995 and ours is 210.0.
- **Impact**: the fix would quantise positions to 2dp. `layout-epsilon.ts`
  records that change as rejected, and D6 forbids it. dot-engine's value
  is exact, so no graphviz issue was filed.
- **Confidence**: High.

## Observation: description leaves in the class engine get the class box ink rule
- **Context**: cacoma (`component comp3`) and daxeno (`<<Database>>` empty
  package) did not match the jar's canvas.
- **Finding**: `tryMeasureDescriptionLeaf` sets no `symbolInk`, so the leaf
  falls through to `addRectInk`, whose `(x-1, y-1)` / `(x+w, y+h)` corners
  are `EntityImageClass`'s. `USymbolComponent2` draws one `URectangle`, with
  corners `(x-1, y-1)` / `(x+w-1, y+h-1)`. Walking `EntityImageDescription`
  gives `{-1, -1, 81, 43}` for comp3.
- **Probe**: attaching a walk-measured `symbolInk` closed cacoma. daxeno
  fell 92 -> 1; its remaining diff is the styled namespace title's
  `text/@y` Δ0.889, a separate mechanism. gujigi rose 576 -> 578 because
  the probe walked with the wrong params (no opts; `package` sizes through
  `measureFolderLeaf`). A real fix needs a general
  `measureEntityLeafInk(node, font, {opts, sprites, measurer})` in
  `core/svek/image/leaf-sizing-entity.ts`, which is outside the write-set.
- **Confidence**: High for cacoma and the 91 daxeno diffs. gujigi shows the
  params must match.

## Observation: sijisi has no canvas diff left
- Canvas 201x223 matches. What remains is the `rectangle` description leaf,
  drawn as a class box with a badge: `core/usymbol-shapes.ts` registers
  icons only for database/component/actor/usecase. The rectangle-cluster
  title is also left-aligned where the jar centres it.
