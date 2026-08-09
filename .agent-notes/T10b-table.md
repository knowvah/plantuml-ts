# T10b — AtomTable / StripeTable / Pragma / BackSlash

## Observation: `getPragma()` had to be OPTIONAL, not required, to stay
additive against a SIBLING's in-flight uncommitted file

- **Context**: T9a's own `ISkinSimple.ts` doc comment explicitly cited
  `getPragma(): Pragma` as omitted for "zero callers reachable" — T10a's
  `CreoleHorizontalLine.ts` already named this as a live blocker. Adding
  it as a REQUIRED member (matching upstream's real abstract interface
  method) broke `tsc --noEmit` in FOUR pre-existing `ISkinSimple`-shaped
  test-double object literals: `CreoleHorizontalLine.test.ts`,
  `legacy/CreoleParser.test.ts`, `style/ISkinSimple.test.ts`, and
  `legacy/StripeTree.test.ts`.
- **Finding**: `legacy/StripeTree.test.ts` was `??` (untracked, brand
  new) in `git status` at the moment I hit this — T10c's own sibling
  task, actively writing it concurrently. Editing it was out of bounds
  ("Their files are not yours"); the task's write-set also does not cover
  `CreoleHorizontalLine.test.ts`/`CreoleParser.test.ts` (pre-existing,
  from T9a/T10a).
- **Resolution**: declared `getPragma?(): Pragma` (optional), matching
  this codebase's OWN established precedent for exactly this shape —
  `shape/TextBlock.ts`'s `getMagneticBorder?()` — rather than widening my
  write-set to touch 3+ files outside it (one of them a sibling's). Zero
  existing implementor needed any change; `npm run typecheck` is clean
  with no edits to any of the four files.
- **Impact for whoever wires a real `getPragma()` caller** (e.g. a future
  `CreoleHorizontalLine.ts` de-seaming, still blocked on `Display`
  regardless): call via `skinParam.getPragma?.() ?? Pragma.createEmpty()`
  or equivalent, not `skinParam.getPragma()` directly.
- **Confidence**: High — directly observed via `tsc --noEmit` before/after
  and `git status --short` on the four files.

## Observation: `Stripe.ts`'s existing TS interface is `CreoleAtom`-typed
and CANNOT represent `StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex`
— upstream's REAL `Stripe.java` is `Atom`-typed (OOP), a genuine
architecture gap this task did not silently resolve

- **Context**: Porting `StripeTable implements Stripe` faithfully.
- **Finding**: upstream `klimt/creole/Stripe.java` is `{ Atom
  getLHeader(); List<Atom> getAtoms(); }` using the OOP
  `klimt.creole.atom.Atom` (this port's `SheetBlock1.ts#Atom`). This
  port's OWN `Stripe.ts` was written by an EARLIER task (T9a) for a
  NARROWER case only — `CreoleParser.ts`'s plain-text path, whose
  `getAtoms()` is always flat `CreoleAtom[]` — and structurally cannot
  carry a composite `Atom` (a whole nested table/tree/code Atom, not
  text). `StripeTable`, `StripeTree` (T10c), `StripeCode` (T10d), and
  `StripeLatex` (T10e) ALL hit this identical shape: each is a `Stripe`
  whose `getAtoms()` returns a singleton `List<Atom>` wrapping ONE opaque
  composite `Atom`.
- **Resolution**: `StripeTable.ts` does NOT `import`/`implements
  Stripe` from `Stripe.ts` — it declares its own `getAtoms(): readonly
  Atom[]` / `getLHeader(): Atom | null` (OOP-`Atom`-typed), matching
  upstream's REAL contract exactly, documented at length in the file's
  own doc comment (the "ADR-9 adaptation" section). The CELL level (each
  cell's own flat creole-text content) DOES fit `Stripe.ts` as-is — a
  private `TableCellStripe` class implements it there, feeding
  `asAtom`'s nested `Sheet`/`SheetBlock1` exactly as `CreoleParser.ts`'s
  own local plain-text `Stripe` does.
- **Not silently decided**: I did NOT widen `Stripe.ts` (out of my
  write-set, and T10c/T10d would race on the same file concurrently).
  Reconciling the two `Stripe` shapes (a generic `Stripe<T>`, or a
  `CreoleAtom` variant wrapping an opaque `Atom`) is flagged as a real,
  separable follow-on for whoever wires `Sheet`/`CreoleParser.ts` to
  construct real instances (T10g or later) — not resolved here.
- **Impact for T10c/T10d**: expect the identical shape when porting
  `StripeTree`/`StripeCode` — they will likely need the same "don't
  `implements Stripe.ts`, match upstream's real `Atom`-typed contract
  instead" move, OR converge on whatever the eventual reconciliation
  looks like.
- **Confidence**: High — read `Stripe.java`, `Stripe.ts`,
  `SheetBlock1.ts`'s own `Atom` doc comment, and traced every upstream
  `StripeTable`/`StripeTree` `getAtoms()`/constructor body directly.

## Observation: `StripeTable.asAtom` is a real upstream CROSS-FILE
dependency `StripeTree.java` (T10c) also calls

- **Context**: Verifying `asAtom`'s only upstream caller before deciding
  visibility/signature.
- **Finding**: `grep -rn "\.asAtom("` across `~/git/plantuml` shows
  `Fission.java` (an unrelated `Neutron#asAtom()` instance method) and
  `klimt/creole/legacy/StripeTree.java:87` (`StripeTable.asAtom(
  Collections.singletonList(cell), ClockwiseTopRightBottomLeft.none())`)
  — a real, load-bearing cross-file call INTO this task's own file.
- **Resolution**: kept `static`, exported, and widened its `cells`
  parameter type to `readonly Stripe[]` (this port's `Stripe.ts`,
  CreoleAtom-flavored — the type `TableCellStripe`, T10c's own future
  tree-cell type, and any other producer already satisfy) rather than a
  `StripeTable`-private cell type, so T10c can call it without importing
  anything StripeTable-internal. Added `atomOps: AtomOps` as an extra,
  LAST-positioned parameter (upstream has none — needed because this
  port's `SheetBlock1` requires it, T8's own established constructor
  adaptation).
- **Confidence**: High — grepped upstream directly, read
  `StripeTree.java:87` in context.

## `HColor` — needed, but only as this port's existing `Paint` adaptation
(no new color class ported)

`AtomTable.java`/`StripeTable.java` both use `HColor`/`HColorScheme`/
`HColors`/`HColorSet` extensively. All of it maps onto ALREADY-PORTED
machinery: `Paint` (`src/core/paint.ts`), `Back`/`Fore`
(`klimt/{Back,Fore}.ts`, the established `HColor#bg()` -> `new
Back(paint)` adaptation), and `klimt/color/HColorSet.ts#parseSimpleColor`
(free-function color resolution, no OOP wrapper). The ONE upstream branch
with no `Paint` equivalent — `AtomTable#getLineColor`'s `instanceof
HColorScheme` resolve-against-background case (needs `ug
.getDefaultBackground()`, itself dropped by an earlier task) — collapses
to a plain getter returning the stored color unconditionally, documented
in `AtomTable.ts`'s own doc comment. No new file, no seam, no stub.

## Nothing else dropped

`Pragma` (full: `define`/`isDefine`/`undefine`/`getValue`/`isTrue`/
`isFalse`/`legacyReplaceBackslashNByNewline`/`WarningHandler`),
`PragmaKey` (full enum + `lazyFrom`/`getDefaultValue`), `BackSlash`
(full: constants, `lineSeparator`, `hiddenNewLine`,
`translateBackSlashes`/`untranslateBackSlashes`), `AtomTable` (full),
`StripeTable` (full, including both `getWithNewlinesInternal` branches)
are ported in full — every member has a faithful TS counterpart or a
documented, zero-behavior-change adaptation. Only `Pragma.getLatexEngine`
throws a cited seam (BLOCKED ON THE PROCESS SEAM — `tikz/LatexEngine
.java` spawns a native binary via `ProcessBuilder`, impossible in a
browser `src/`; mirrors `SignatureUtils.ts`'s own file-seam precedent).
`Warning`/`WarningHandler` (small, self-contained, `Pragma`'s own
prerequisite) and `PragmaKey` were added beyond the literal write-set,
flagged here rather than silently widened in — same "small sibling the
target class cannot be faithful without" precedent T8/T9a already
established for `Sea`/`Position`/`Parser`.
