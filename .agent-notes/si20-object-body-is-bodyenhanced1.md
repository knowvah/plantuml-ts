# Observation: an object's body is `BodyEnhanced1`, not `MethodsOrFieldsArea#asBlockMemberImpl`

> **PARTIAL STATUS UPDATE — the `=` separator sub-finding is CLOSED.**
> Fixed on `fix/object-separator-spacing` (`9a698e18`): the `=` branch of
> `tryStructuredObjectMember` now captures the source separator into
> `Member.typeSeparator` (canonical `' = '` maps to absent, as the class
> parser does for `': '`), and `formatObjectMemberText` reads it. The
> note's own predicted measurement held exactly — object DOT 78/80, object
> SVG census 35/80, class DOT 710 `portOk` 0, none moved, because no
> corpus fixture uses a non-canonical separator. Seven unit tests in
> `tests/unit/class/class-object-separator-spacing.test.ts` are the only
> observers. **The rest of this note — the `BodyEnhanced1` route and the
> `H`/`margin` values — stands unchanged.**

- **Context**: SI20 T0, resolving ADR-1 (the object header translate and the
  body wrapper's margin).
- **Finding**: `BodierLikeClassOrObject#getBody`'s OBJECT branch
  (`cucadiagram/BodierLikeClassOrObject.java:225-233`) returns
  `BodyFactory.create1(...)` = `new BodyEnhanced1(align, rawBody, …)`
  (`cucadiagram/BodyFactory.java:71`, the `lineFirst = true` constructor,
  `BodyEnhanced1.java:86`). It returns **before** the class construction at
  `:237-249`, which is additionally guarded by `assert type.isLikeClass()`
  (`:234-235`). So an object leaf never touches
  `MethodsOrFieldsArea#asBlockMemberImpl`.

  The wrapper an object *does* get is
  `BodyEnhancedAbstract#decorate(block, separator='_', title=null)`
  (`cucadiagram/BodyEnhancedAbstract.java:111-113`):
  `new TextBlockLineBefore(thickness, TextBlockUtils.withMargin(block, 6, 4))`
  — byte-identical in shape to `MethodsOrFieldsArea.java:83-86`, reached by a
  completely different route. **The margin of 4 transfers from class to
  object as a coincidence of two independent constructions, not as shared
  code.** A port that copies `asBlockMemberImpl` gets the right number for
  the wrong reason and will drift the first time either construction changes.
- **Impact**: Two consequences that only this route has:
  1. **`MinimumWidth > 0` suppresses every object port.**
     `BodyEnhanced1#getArea` wraps its result in
     `TextBlockUtils.withMinWidth(area, minClassWidth, align)` when
     `style.value(PName.MinimumWidth) > 0` (`BodyEnhanced1.java:182-184`),
     and `TextBlockMinWidth` does **not** implement `WithPorts`
     (`klimt/shape/TextBlockMinWidth.java:45`). `BodyEnhanced1#getPorts`'s
     `area instanceof WithPorts` test (`:230`) fails, and it returns an empty
     `Ports`. Jar-confirmed with `skinparam minClassWidth 300` on a
     two-object/one-`::`-edge fixture: the node stays
     `RECTANGLE_HTML_FOR_PORTS` (`getShapeType()` keys only on
     `getPortShortNames().size()`, `svek/image/EntityImageObject.java
     :249-254`) but its `<TABLE>` has one row and **no `PORT=` attribute**,
     while the edge still names `sh0006:p2c1743a…->sh0007:p987bcab…`.
     The class path has no analogue — class's body is a
     `TextBlockLineBefore`, never a `TextBlockMinWidth`.
  2. A body containing a block separator / tree / table produces
     `blocks.size() > 1` and a `TextBlockVertical` (`BodyEnhanced1.java:177-
     180`), which is where the multi-block port offset would come from — a
     shape object shares with class only through `TextBlockVertical`, not
     through `MethodsOrFieldsArea`.
- **Confidence**: High — every claim is a quoted method body, and both
  behaviors were reproduced against the pinned oracle jar via
  `scripts/oracle-render.sh`.

## Observation: `formatObjectMemberText` normalizes the `=` separator; `formatMemberText` does not

- **Context**: same task, resolving ADR-2 (is the object election input
  `Member.getDisplay(false)`?).
- **Finding**: On the **visibility character** the two agree exactly —
  `parseObjectField` strips the leading char before either branch
  (`src/diagrams/class/class-object-commands.ts:346-369`), mirroring
  `Member`'s constructor (`cucadiagram/Member.java:129-136`), so `-alpha` →
  `"alpha"`, `+gamma` → `"gamma"`, `- spaced` → `"spaced"`, matching the
  jar's rendered text.

  On the **`=` separator** they diverge. `tryStructuredObjectMember`'s
  `^(\w+)\s*=\s*(.+)$` branch stores no `typeSeparator`, so
  `formatObjectMemberText` (`class-object-map-sizing.ts:207`) re-emits a
  canonical `" = "`: `a=1` → `"a = 1"` where jar's `getDisplay(false)` is
  `"a=1"`. The class path is correct here — `formatMemberText` uses
  `member.typeSeparator ?? ': '` (`class-layout-helpers.ts:210`).
- **Impact**: Invisible to every current gate. `DeterministicMeasurer`
  measures a space as width 0, so node widths and the emitted DOT match the
  jar exactly (`183.76250000000005` on both sides for a
  `aaaaaaaaaaaaaaaaaaaa=1` member); only the SVG `<text>` content differs,
  and only a real-font renderer would show it. It also does not change the
  election: `getScore`'s `.*\bshortName\b.*`
  (`cucadiagram/MethodsOrFieldsArea.java:228-235`) matches `"a = 1"` and
  `"a=1"` identically for shortname `a`. A future fix is a one-field change
  (carry `typeSeparator` through `tryStructuredObjectMember` and read it in
  `formatObjectMemberText`), but it needs its own SVG-census measurement —
  do not fold it into a port-band change.
- **Confidence**: High — jar SVG text compared against ours on four authored
  controls.
