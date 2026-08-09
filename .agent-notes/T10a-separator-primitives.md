# T10a — AbstractAtom / AtomWithMargin / StripeStyle / CreoleHorizontalLine / StripeRaw

## Observation: `CreoleHorizontalLine`'s real (non-empty-line) path is
blocked on TWO unported dependencies, not one — `Display` (already
documented) AND `ISkinSimple.getPragma()` (a second, smaller gap this task
surfaced)

- **Context**: Porting `CreoleHorizontalLine#getTitle()`'s `line.length()
  > 0` branch (java: `skinParam.sheet(...).createSheet(Display
  .getWithNewlines(skinParam.getPragma(), line))`).
- **Finding**: `SheetBuilder.ts`'s own doc comment already documents
  `Display` (796 lines) as "T9c's own target, gated on this file" — known.
  What was NOT previously surfaced: `skinParam.getPragma()` is also not on
  `ISkinSimple.ts` (T9a's own doc comment explicitly omits `getPragma():
  Pragma` for "zero callers reachable from this task" — that reasoning no
  longer holds now that T10a has a real, live call site). Widening
  `ISkinSimple.ts` is outside this task's write-set (5 files, none of them
  `ISkinSimple.ts`), so the cited seam names `Display.java` as the primary
  blocker and leaves the `getPragma()` gap as a secondary note in the same
  comment rather than silently fixing it out-of-scope.
- **Resolution**: `getTitle()`'s `line.length() === 0` fast path (the ONLY
  shape reachable today — see next observation) is fully ported and
  tested. The `length() > 0` branch throws a cited, labelled seam
  (`blockedOnDisplay`, mirroring `legacy/CreoleParser.ts`'s own
  `blockedOnSibling` pattern) rather than being silently dropped or
  stubbed to wrong output.
- **Impact for whoever ports `Display` (T9c) or wires this file (T10g)**:
  de-seaming `getTitle()` needs BOTH `Display.getWithNewlines` AND
  `ISkinSimple.ts` widened with a `getPragma()` member (or an equivalent
  seam) — and, per `SheetBlock1.ts`'s own established `AtomOps` pattern,
  `CreoleHorizontalLine`'s constructor will need an extra, LAST-positioned
  `atomOps: AtomOps` parameter so `getTitle()` can construct a real
  `SheetBlock1`. Full call shape documented in `CreoleHorizontalLine.ts`'s
  own doc comment.
- **Confidence**: High — read `CreoleHorizontalLine.java`,
  `Display.java#getWithNewlines`, and `ISkinSimple.ts`'s own doc comment
  directly before deciding.

## Observation: `CreoleHorizontalLine`'s non-empty-line label mechanism is
reachable ONLY as a cited seam today, by construction of an EARLIER task
(T9a) — not a gap this task introduced

- **Context**: Verifying whether `CreoleHorizontalLine`'s ported surface
  is actually exercised by anything today, per the task's "nothing routes
  through your code yet" framing.
- **Finding**: `CreoleStripeSimpleParser.ts#classifyStripeLine` (T9a) only
  ever produces `StripeStyleType.HORIZONTAL_LINE` for an EMPTY captured
  label (`--...--`/`==...==`/`..'..`/bare `====`, all with nothing between
  the delimiters) — a NON-empty capture classifies as `LITERAL` instead
  (that file's own doc comment: a jar-verified, deliberate divergence, not
  an oversight). This means `CreoleHorizontalLine`'s `line` parameter is
  ALWAYS empty for any value this port can currently produce, so the
  entire reachable-today surface (the `length() === 0` fast path) is
  fully faithful, fully tested, and needs no seam at all — the seam is
  isolated to a branch nothing in this port can reach yet regardless of
  T10a's own choices.
- **Confidence**: High — read `CreoleStripeSimpleParser.ts`'s doc comment
  and `classifyStripeLine` body directly.

## Observation: `getHorizontalLine()`'s own titled-line branch is
unreachable BY CONSTRUCTION today, given `getTitle()`'s unconditional
throw — a per-file coverage gap with a real cause, not an undertested path

- **Context**: `CreoleHorizontalLine.ts`'s per-file branch coverage sits
  at 84.6% (vs. this project's 90% branch floor) when measured in
  isolation; the project's actual configured gate (`vitest.config.ts`,
  no `perFile` flag) is a GLOBAL aggregate, which the full suite clears
  (98.78% lines / 94.73% branches / 98.61% functions, `npm test` exit 0).
- **Finding**: `drawU()` always calls `this.calculateDimension(...)`
  (which reaches `calculateDimensionSlow` -> `getTitle()`) BEFORE calling
  `getHorizontalLine()`. For a non-empty `line`, `calculateDimensionSlow`
  throws via the SAME `getTitle()` seam `getHorizontalLine()` would also
  hit — so `getHorizontalLine()`'s own `tb = this.getTitle()` line
  (java-equivalent of `getHorizontalLine`'s title branch) can never
  actually execute via any public entry point today: execution always
  throws one call earlier. This is provably unreachable, not merely
  untested — confirmed by tracing both call paths (`drawU` and
  `calculateDimensionSlow`) into the same unconditionally-throwing
  `getTitle()`.
- **Resolution**: documented in-line at the branch itself
  (`CreoleHorizontalLine.ts`, inside `getHorizontalLine()`) rather than
  forcing an artificial test to "cover" a branch that cannot run. Becomes
  reachable and testable the moment the `Display` seam above is
  unblocked.
- **Confidence**: High — traced both call paths directly; confirmed via
  `coverage-final.json` branch map that the specific branch id sits at 0
  hits with all other branches in the file covered.

## Observation: `StripeStyle#getHeader`'s two list-header branches need
the unported OOP `Atom` layer AND this port's wholly-missing `HColor`
color model — a genuinely large, separable chain, not a small sibling

- **Context**: Porting `StripeStyle#getHeader(fontConfiguration,
  context)` faithfully, per this task's own instruction and the ADR-8
  corollary ("port it or STOP and report; do not drop").
- **Finding**: `LIST_WITHOUT_NUMBER` needs `new Bullet(fontConfiguration,
  order)` (`klimt/creole/atom/Bullet.java`, 84 lines), which itself needs
  `HColor` (`fontConfiguration.getColor()`, `color.bg()`) — a color model
  this port does not have ANYWHERE (`Position.ts`'s own doc comment:
  "`HColor` is not ported anywhere"; `ISkinSimple.ts` already omits
  `getIHtmlColorSet()` for the identical reason). `LIST_WITH_NUMBER` needs
  `AtomTextUtils.createListNumber` (`klimt/creole/legacy/AtomTextUtils
  .java`, 161 lines), which needs the concrete legacy `AtomText` OOP class
  — `atom/Atom.ts`'s own doc comment documents that class as deliberately
  NOT re-ported for this port's reachable scope — plus an unported
  `DelayedDouble` callback type. Neither is a small sibling; both reach
  into the SAME two foundational gaps (`HColor`, the OOP `Atom`/`AtomText`
  hierarchy) this whole batch (ADR-9) has already ruled out re-building.
- **Resolution**: both branches throw a cited, labelled seam
  (`blockedOnAtomLayer`) rather than silently returning `null` (which
  `legacy/CreoleParser.ts`'s own `bulletHeader` helper already does for
  the SAME upstream method, justified there by "bullet lists are out of
  L1 scope everywhere else" — a lighter-weight, already-accepted pattern
  this task deliberately did NOT reuse, choosing the stricter cited-throw
  form instead since `StripeStyle` is the REAL upstream class, not a
  reduced ad-hoc stand-in). `context.getLocalNumber(order)`'s
  counter-advancing side effect is still executed before the
  `LIST_WITH_NUMBER` throw, matching upstream's own evaluation order
  (java:64) — pinned by a dedicated test.
- **Impact**: no `StripeStyleType` producer in this port constructs a
  `StripeStyle` with either LIST_* type today (`StripeStyleType.ts`'s own
  doc comment: bullet lists are out of L1 scope, `classifyStripeLine`
  never produces one), so this is a build/test-time signal only.
- **Confidence**: High — read `Bullet.java`, `AtomTextUtils.java`
  (`createListNumber`) directly; grepped `src/` for `HColor`/`AtomText`,
  zero hits confirming both are genuinely absent everywhere in this port.

## Nothing else dropped

`AbstractAtom`, `AtomWithMargin`, `StripeRaw` are ported in full — every
member has a faithful TS counterpart with no seam at all.
`CreoleHorizontalLine`'s `create` factory, constructor, `drawU`,
`calculateDimensionSlow`'s empty-line fast path, and `getStartingAltitude`
are fully ported and reachable; only the non-empty-line label mechanism is
seamed (two observations above). `StripeStyle`'s constructor, all three
getters, and `getHeader`'s NORMAL/HEADING/HORIZONTAL_LINE/TREE fallthrough
are fully ported and reachable; only the two list-header branches are
seamed (observation above). `Bullet.java`/`AtomTextUtils.java`/
`Neutron.java`/`Display.java` were NOT added to this task's write-set —
each is cited at its exact seam site rather than silently widened in or
silently dropped.
