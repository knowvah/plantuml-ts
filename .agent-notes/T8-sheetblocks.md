# T8 — SheetBlock1/SheetBlock2/Ports/WithPorts

## Observation: `SheetBlock1`'s real algorithm needs `Sea`/`Position`
(altitude-stacking), NOT just word-wrap — the mission's dependency audit
missed this

- **Context**: Sizing `SheetBlock1.java` before porting it, per the task's
  "port its actual algorithm, do not approximate" instruction.
- **Finding**: `overview.md`'s dependency table marks `Fission`, `atom/Atom`,
  `StripeSimple` "PRESENT" — true, but those are a DIFFERENT, DATA-ONLY
  architecture (`CreoleAtom` union, E2r/L1) than the OOP `Atom`
  (`calculateDimension`/`drawU`/`getStartingAltitude`/`getNeutrons`) that
  `SheetBlock1.java`'s REAL stacking engine (`Sea.java` 218,
  `Position.java` 115) is built on. `Sea`/`Position` were absent from the
  audit entirely.
- **Resolution**: Ported `Sea`/`Position` faithfully (1:1 with the Java —
  x-cursor accumulation, `doAlign`'s `-height + startingAltitude`,
  `translateMinYto`, `MinMax` folding), but generic over `CreoleAtom` +
  an injected `AtomOps` callback bundle (`calculateDimension`/
  `getStartingAltitude`/`drawU`) instead of upstream's virtual dispatch —
  the SAME adaptation `Fission.ts#getSplitted`'s `measureAtomWidth`
  parameter already established for this exact CreoleAtom/OOP-Atom
  mismatch. `SheetBlock1`'s constructor gains this `atomOps` as an EXTRA,
  LAST-positioned parameter (upstream has no equivalent).
- **Word-wrap**: reused `Fission.ts#getSplitted` UNCHANGED — it is already
  a verified-faithful behavioral port of `Fission.java`+`Neutron.java`'s
  algorithm (E2r/L3), just data-oriented. Building a second, OOP-flavored
  copy would have been the actual "invisible divergence" ADR-7 warns
  against, not fidelity.
- **Confidence**: High — read `Sea.java`, `Position.java`,
  `Fission.java`(real, OOP), `Neutron.java`, `atom/Atom.java`,
  `AbstractAtom.java`, `legacy/AtomText.java` in full before deciding.

## Files created beyond the literal write-set (flagged, not silently done)

- `src/core/svek/PortGeometry.ts` — `Ports`'s own upstream sibling
  (`svek/PortGeometry.java`), used ONLY by `Ports`/`SvekNode` in the Java.
- `src/core/klimt/creole/Sea.ts`, `src/core/klimt/creole/Position.ts` —
  `SheetBlock1`'s own upstream siblings (`Sea.java`/`Position.java`), used
  ONLY by `SheetBlock1.java` (grep-verified: `new Sea(` and `new
  Position(` have exactly one call site each in `~/git/plantuml`, plus
  `Position` itself and `AtomTable.java`, out of scope). All three are
  additive, upstream-named 1:1 ports of files the target classes cannot
  be faithful without; none touch any file outside this set. Per the
  quality bar's own allowance ("splitting into a sibling module is fine
  and precedented") — reported here rather than widened silently.

## Dropped as genuinely unreachable (not reflexive — evidence below)

1. **`Sea#doAlignTikz`/`doAlignTikzBaseline`/`findFirstAtomText`,
   `Sea#getMaxY`'s TIKZ branch, `AtomText#drawU`'s `SPECIALTXT` branch
   (N/A here)** — all gated on `stringBounder.matchesProperty("TIKZ")`.
   This port's `StringBounder` interface has NO `matchesProperty` member
   at all (a T3 decision, `StringBounder.ts`'s own doc comment) — TIKZ is
   an OUTPUT FORMAT, and `CLAUDE.md`'s own Architecture Notes declare this
   a "pure SVG renderer" with `parse → layout → render (SVG string)`, no
   other backend. Unlike the WBS case (a diagram TYPE on this port's own
   roadmap, `.claude/catalog.md`), TIKZ has no such roadmap entry anywhere
   — this is a foundational architecture decision, not a scheduling gap.
2. **`Position#drawDebug`** — upstream's ONLY call site
   (`SheetBlock1.java:216`) is ITSELF commented out (`//
   position.drawDebug(ug);`), i.e. dead in the Java, not merely unreached.
   Its dependencies (`HColors`, `URectangle.build(XDimension2D)`) also
   don't exist anywhere in this port's color model. Lower confidence than
   item 1 (a missing primitive, not an architecture line) — trivial to add
   once `HColor` lands.
3. **`SheetBlock1(Sheet, LineBreakStrategy, Style)` constructor overload**
   — needs `Style`/`PName`, which don't exist anywhere in this port
   (matches `ClockwiseTopRightBottomLeft.ts`'s own prior precedent for the
   identical gap, `marginForDocument(StyleBuilder)`). Verified via `grep
   -rn "new SheetBlock1("` that T9's actual target call site
   (`Display.java:699`) uses the 5-arg non-Style overload, which IS
   ported; the Style-overload's other real callers (`FtileBoxOld.java`,
   activity-diagram `vcompact`/`gtile`) are unported diagram
   families — when one of them lands, the gap re-opens as ITS prerequisite.
4. **`getCoefForAlignment`'s `alignment == null -> 0` guard** — not a drop
   of upstream behavior, a simplification once ported: this port's
   `HorizontalAlignment` is a non-optional string union, and BOTH real
   callers (`SheetBlock1#getCoef`) already resolve to a defined value
   before this function is ever reached (`duckCellAlignment(key) ??
   this.sheet.getHorizontalAlignment()`) — the branch was unreachable
   under this port's own type invariants, so the guard was removed rather
   than kept as untestable dead code (see `code-principles.md`'s
   "no error handling for states that cannot occur").

## `Ports.encodePortNameToId`'s MD5 — a scoped reimplementation, not a
`SignatureUtils.java` port

`SignatureUtils.java` (the Java class `getMD5Hex` lives on) has ~15 other
responsibilities (SHA-512, PBKDF2 salting, file hashing, a TeaVM native
fallback) with callers entirely outside svek/Ports (`UmlSource`,
`SvgGraphics`, `Version`, ...). Porting it whole would have silently
widened this task's write-set far past `Ports.ts`. Instead, `Ports.ts`
carries a minimal, self-contained RFC 1321 MD5 hex-digest function scoped
to the ONE thing `encodePortNameToId` needs, verified byte-correct against
the standard RFC 1321 §A.5 test vectors (own test file).

## Nothing else dropped

`Ports`, `WithPorts`, `PortGeometry`, `Sea`, `Position`, `SheetBlock1`
(3 of 4 constructor overloads), `SheetBlock2` are ported in full — every
other field/method has a TS counterpart. `TextBlockLineBefore.getPorts`/
`getInnerPosition` are reinstated faithfully (duck-typed against the
optional `WithPorts`/`getInnerPosition` capability rather than widening
`TextBlock.ts`, which stays untouched — out of this task's write-set).
