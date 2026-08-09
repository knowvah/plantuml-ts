# T10c — AtomTree / StripeTree (+ Skeleton2)

## Observation: `AtomTree`/`Skeleton2` port clean; the real finding is in
`StripeTree` — `../Stripe.ts`'s `getAtoms(): readonly CreoleAtom[]` cannot
represent `StripeTree`'s real return value, and this is the first task to
hit that concretely (T9a only seamed the whole branch, never constructing
anything)

- **Context**: Writing `StripeTree#getAtoms()` (upstream:
  `Collections.singletonList(marged)`, `marged` a nested
  `AtomWithMargin<AtomTree>`).
- **Finding**: `../Stripe.ts` (T9a) declares `getAtoms(): readonly
  CreoleAtom[]` — faithful only for `StripeSimple`'s flat text/inline/latex
  run. `CreoleAtom` (`atom/Atom.ts`) has no variant for a measured/drawn
  sub-block, so `StripeTree` cannot honestly `implements Stripe` against
  today's interface. `T9a-creoleparser.md` already found the SAME shape for
  `StripeTable`/`EmbeddedDiagram` ("pulling in the OOP Atom/AtomTable/
  HColor machinery `atom/Atom.ts` deliberately did not re-port") but
  stopped at "seam the whole branch" — never wrote a `getAtoms()` body, so
  never confronted the type concretely.
- **Resolution**: `StripeTree.ts` is typed against upstream's REAL contract
  (`getAtoms(): readonly Atom[]`, the OOP `Atom` from `SheetBlock1.ts`) and
  does NOT declare `implements Stripe`. Documented in the file's own module
  doc comment rather than cast away (`as Stripe` would misrepresent
  conformance, forbidden by `security.md`'s "never cast as X directly").
- **Impact**: `../Stripe.ts` is shared, cross-cutting infrastructure —
  T10b's concurrent `StripeTable` needs the identical widening. Flagged for
  T10g (the task that reinstates every `lastStripe instanceof Stripe*`
  check together) rather than patched unilaterally; outside this task's
  write-set.
- **Confidence**: High — read `Stripe.ts`, `atom/Atom.ts`, and
  `StripeTable.java`/`StripeTree.java`'s real `getAtoms()` bodies directly.

## Observation: `analyzeAndAdd` is blocked on a CONCURRENT sibling
(T10b's `StripeTable`), not an unported dependency — a distinct shape from
the ADR-8 corollary's forbidden reasoning

- **Context**: `StripeTree#analyzeAndAdd`'s first statement
  (`StripeTable.getWithNewlinesInternal(line)`) and per-line atom build
  (`StripeTable.asAtom(...)`) both call static helpers on `StripeTable`,
  which did not exist in `src/` when this file was written (`git status`
  showed no `StripeTable.ts`/`AtomTable.ts` at task start; T10b landed them
  partway through this task, in `src/core/klimt/creole/atom/AtomTable.ts`
  + presumably `StripeTable.ts` not yet observed).
- **Finding**: this is NOT "not ported yet" in the ADR-8 corollary's
  forbidden sense — `StripeTable.java` IS being ported, by a named sibling,
  in the same batch, right now. It is a genuine ordering/concurrency gap,
  not a scope judgment.
- **Resolution**: `analyzeAndAdd` throws a cited `blockedOnStripeTable`
  seam (mirrors `CreoleParser.ts`'s `blockedOnSibling`/`StripeStyle.ts`'s
  `blockedOnAtomLayer` shape — no shared helper is exported anywhere in
  this batch, each file declares its own) rather than importing a
  sibling's in-flight, uncommitted file (forbidden — "their files are not
  yours"). Since the seam is the METHOD'S FIRST statement, no partial
  faithful execution is possible before the throw (contrast `StripeStyle
  .ts#getHeader`'s `LIST_WITH_NUMBER` branch, whose independent counter
  side effect IS executed before its own seam throw).
- **Impact**: the constructor calls `analyzeAndAdd` unconditionally (no
  branch), so EVERY construction attempt throws today — `getAtoms`/
  `getLHeader` are therefore unreachable by construction, matching
  `CreoleHorizontalLine.ts#getHorizontalLine()`'s established, documented-
  in-line precedent (T10a) rather than forcing artificial coverage.
  `CreoleParser.ts`'s own "a tree line" seam already throws before ever
  reaching this constructor, so this is a build/test-time signal only.
- **Follow-on for whoever lands `StripeTable.ts`**: once it exists, replace
  `blockedOnStripeTable`'s throw with the real per-line loop (java:80-90),
  AND resolve the `Stripe.ts` interface gap above in the same change (or a
  companion change) so `getAtoms()`'s return type is honest either way.
- **Confidence**: High — read `StripeTree.java`/`StripeTable.java` line by
  line; `git status` at task start showed neither `StripeTable.ts` nor
  `AtomTable.ts` present.

## Nothing else dropped

`AtomTree` (constructor, `calculateDimensionSlow`, `getStartingAltitude`,
`drawU`, `addCell`) and the newly-added `Skeleton2` (`add`, `draw`,
`getMotherOrSister`, `getXStartForLevel`/`getXEndForLevel`, `Entry#drawHline`/
`#drawVline`) are ported in full — every member has a faithful TS
counterpart with no seam at all, 100% line/branch/function coverage on both
files individually. `StripeTree`'s constructor field assignment + `AtomTree`/
`AtomWithMargin` construction order, `getLHeader` (always `null`), and
`computeLevel` (exported standalone, exhaustively tested) are fully ported;
only `analyzeAndAdd`'s per-line body is seamed (above), and `getAtoms()`'s
implementation is written but unreachable by construction (above).
`Skeleton2.ts` was added beyond the literal two-file write-set (T10a/T8's
established "small, genuinely required, cited" precedent) — a direct,
required dependency of `AtomTree#drawU`/`#calculateDimensionSlow` with a
single consumer, not a large separable follow-on (55 real lines).
