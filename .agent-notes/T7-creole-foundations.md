# T7 — creole `Sheet`/`CreoleMode`/`CreoleContext`/`LineBreakStrategy`/
`XRectangle2D` foundations

## Observation: neither `SheetBlock1` nor `SheetBlock2` ever actually
constructs an `XRectangle2D` — it's a return-type-only dependency in
batch 3a's scope

- **Context**: Fit-checking `XRectangle2D` against how `SheetBlock1`/
  `SheetBlock2` use it, before deciding how much of the Java class to port.
- **Finding**: `SheetBlock1#getInnerPosition(CharSequence, StringBounder)`
  (`SheetBlock1.java:202-204`) is `return null;` unconditionally.
  `SheetBlock2#getInnerPosition` (`SheetBlock2.java:118-120`) just
  delegates to `block.getInnerPosition(...)`, i.e. also always `null` for
  this batch's reachable code. `XRectangle2D` appears in both files ONLY
  as the method return type — never `new XRectangle2D(...)`.
- **Impact**: T8 does not need to build any `XRectangle2D` construction
  logic to port `SheetBlock1`/`SheetBlock2` faithfully — `getInnerPosition`
  is a straight `return null` in both. Real construction sites live in
  `MethodsOrFieldsArea.java` (SI1 scope, not this mission) and
  `TextBlockLineBefore.java` (already ported, T2a/T7's predecessor).
- **Confidence**: High — read both Java methods directly.

## Observation (CORRECTED by T7b): `XRectangle2D#intersect(XLine2D)` was
wrongly dropped as "unreachable" — "not yet ported" is not the same as
"unreachable", and the task was reversed

- **Context**: T7 originally ported `XRectangle2D.java` (104 lines) but
  omitted `intersect(XLine2D)`, reasoning that its only Java-side caller
  (`wbs/WBSLink.java:86-87`) belongs to "a diagram type this port has not
  built" and is therefore unreachable. **That reasoning was wrong and the
  maintainer caught it in review (T7b).**
- **Why it was wrong**: WBS is a live, registered upstream diagram type —
  `DiagramType.java:46` enumerates `WBS`, `:206` parses `@startwbs`, `:257`
  maps `SName.wbsDiagram`, and the `wbs/` package has 15 files. More
  decisively: this port's own `.claude/catalog.md:56` already lists
  `'wbs'` in this port's `DiagramType` union as a roadmap target. A method
  whose only caller is a diagram type this project intends to build is
  **not yet reached**, not **unreachable** — those are different claims,
  and only the latter justifies dropping ported code (per `CLAUDE.md`'s
  "The long tail is the deliverable" / "'Not ported yet' is never a
  reason to drop code" — this mission's ADR-8).
- **Fix (T7b)**: Ported `XLine2D.ts` (klimt/geom/XLine2D.java, 159 lines)
  in full — constructor, `line` factory, `getMiddle`, accessors, `getP1`/
  `getP2`, `withPoint1`/`withPoint2`, static `ptSegDistSq`, `intersect`,
  `drawU` (`UDrawable`), `getAngle`. Reinstated
  `XRectangle2D#intersect(XLine2D)`, faithfully ported from
  `XRectangle2D.java:77-101`. See `src/core/klimt/geom/XLine2D.ts` and
  `src/core/klimt/geom/XRectangle2D.ts`'s own doc comments.
- **Lesson for future agents**: before dropping a member because its
  Java-side caller lives in an unported area, check whether that area is
  on THIS port's own roadmap (the catalog, `DiagramType` enum, or an
  explicit "won't ever build" note) — do not conflate "not yet reached in
  this port's build order" with "structurally unreachable".
- **Confidence**: High — reasoning corrected directly by the maintainer;
  verified `DiagramType.java` line numbers and `.claude/catalog.md:56`
  directly.

## Observation: no pre-existing `XRectangle2D`-equivalent anywhere in this
port

- **Context**: Task instruction — check for an existing rectangle type
  under `src/core/klimt/geom/` before creating a new one.
- **Finding**: `src/core/klimt/geom/` has no `XRectangle*`/`Rectangle*`
  file. `find`/`grep` across the whole `src/` tree for `Rectangle` turned
  up only `USymbolRectangle.ts` (a decoration symbol, unrelated),
  `URectangle.ts` (`klimt/shape/URectangle.ts` — a DRAWABLE shape/UShape,
  Java's `net.sourceforge.plantuml.klimt.shape.URectangle`, a completely
  different upstream class from `klimt.geom.XRectangle2D`), and
  `driver-rectangle-svg.ts` (the SVG drawing driver for `URectangle`).
  None of the three is a value-object bounding-box type. `MinMax`
  (`klimt/geom/MinMax.ts`) is the closest CONCEPTUALLY adjacent type (an
  accumulator bounding box) but has a different shape (min/max corners,
  not x/y/width/height) and a different Java origin
  (`klimt.geom.MinMax.java`, not `XRectangle2D.java`) — using it in place
  of `XRectangle2D` would NOT be faithful to `SheetBlock1`/`SheetBlock2`'s
  actual return type.
- **Impact**: Created `src/core/klimt/geom/XRectangle2D.ts` as a genuinely
  new file; no substitution risk.
- **Confidence**: High — grepped `src/` for `Rectangle` and inspected each
  hit's Java origin.

## Observation: `CreoleContext` has zero callers anywhere in this port
today — ported anyway per the task's explicit dependency list

- **Context**: `CreoleContext` backs `legacy/CreoleParser.java`'s
  (the FULL creole parser) ordered-list numbering. This port's
  `legacy/StripeSimple.ts`/`legacy/CreoleStripeSimpleParser.ts` never
  construct a `CreoleContext` — consistent with `StripeStyleType.ts`'s
  existing doc comment that numbered lists are out of L1 scope.
- **Impact**: Zero risk of behavior change (nothing imports it yet); it's
  purely additive infrastructure for whichever future task ports
  `legacy/CreoleParser.ts` or wires ordered-list numbering into
  `StripeStyle`. Included in the coverage report since it's imported by
  its own new test file; not reachable from any production code path yet.
- **Confidence**: High — grepped `src/core/klimt/creole/` for
  `CreoleContext` before adding it; zero hits pre-T7.

## Observation: `Array.isArray` narrowing quirk on a `readonly Stripe[]`
overload union required an explicit cast, not a TS bug in my code

- **Context**: `Sheet.add` mirrors Java's two overloads
  (`add(Stripe)`/`add(List<Stripe>)`) as one TS implementation signature
  taking `Stripe | readonly Stripe[]`.
- **Finding**: `Array.isArray(x)`'s built-in type predicate is
  `x is any[]`, which — combined with a `readonly Stripe[]` member of the
  union — does not cleanly narrow the ELSE branch back down to `Stripe`
  under this project's `strict`/`isolatedDeclarations` tsconfig; `tsc`
  reports the else-branch argument as assignable neither way without an
  explicit `as Stripe`/`as readonly Stripe[]` cast at each branch.
- **Impact**: Used explicit casts at both branches (documented inline via
  the overload shape itself, not a suppressed error) rather than
  restructuring the public API away from Java's two-overload shape.
  Future overloaded-array-vs-single-item ports in this codebase should
  expect the same and reach for the same fix rather than widening the
  narrowing logic.
- **Confidence**: High — reproduced directly via `tsc --noEmit`, fixed,
  re-verified clean.

## Nothing dropped

`Sheet`, `CreoleMode`, `CreoleContext`, `LineBreakStrategy` are ported in
full — every field/method from their respective Java files has a TS
counterpart. `XRectangle2D` is ALSO now ported in full, including
`intersect(XLine2D)` (T7b — see the corrected observation above).
