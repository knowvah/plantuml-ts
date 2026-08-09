# T10d — StripeCode

## Observation: `Neutron.create`'s ONLY upstream call site is
`Fission.java#getSplitted` — already ported, so `Neutron.ts` would
duplicate `Fission.ts`, not add coverage (ADR-9 verdict)

- **Context**: deciding whether `Neutron.ts` (128 lines) is required to
  faithfully port `StripeCode#getNeutrons()` (java:119-122,
  `Arrays.asList(Neutron.create(this))`).
- **Finding**: grepped `~/git/plantuml` for `Neutron.create(` and
  `.getNeutrons()` — `Neutron.create`'s only caller anywhere upstream is
  `Fission.java:74` (`for (Neutron n : atom.getNeutrons())`), and
  `getNeutrons()` itself is called from nowhere except that same line.
  `Fission.ts#getSplitted` (T8, jar-verified) already carries this exact
  decomposition as `getNeutronsForAtom` (`Fission.ts:131-148`), bound to
  `CreoleAtom` instead of the OOP `Atom` hierarchy. For `StripeCode`
  specifically: `Neutron.create(this)` dispatches on `instanceof AtomText`
  (java:56) — `StripeCode` never is one, so it always takes the generic
  branch (`new Neutron(null, UNKNOWN, this)`), which is verbatim
  `Fission.ts`'s own default for a non-`'text'` atom
  (`getNeutronsForAtom`'s `atom.kind !== 'text'` branch, `Fission.ts:132`).
- **Resolution**: `Neutron.ts` NOT ported. `StripeCode.getNeutrons()`
  throws (`UnsupportedOperationException`), matching `AbstractAtom.ts`/
  `SheetBlock1.ts`/`SheetBlock2.ts`'s established T8/T10a precedent —
  reachability is blocked by the SAME `getAtoms()`/`CreoleAtom` typing gap
  below, not by a missing algorithm.
- **Confidence**: High — read `Neutron.java`, `Fission.java`, `Fission.ts`
  in full; grepped `~/git/plantuml` for every `Neutron`/`getNeutrons`
  call site.

## Observation: `getAtoms()`'s real return type (`List<Atom>`, OOP) cannot
satisfy `../Stripe.ts`'s current `CreoleAtom[]`-narrowed signature — same
fork the concurrent sibling `StripeTree.ts` (T10c) independently hit

- **Context**: porting `StripeCode#getAtoms()` (java:65-67,
  `Collections.<Atom>singletonList(this)`).
- **Finding**: `../Stripe.ts`'s `getAtoms(): readonly CreoleAtom[]` is
  faithful only for `StripeSimple`'s flat text/inline/latex runs. A
  multi-line monospaced code block has no `CreoleAtom` representation.
  Cross-checked `StripeTree.ts` (written concurrently by T10c) and found
  the identical documented conclusion: do not declare
  `implements Stripe`/`StripeRaw`; type `getAtoms()`/`getLHeader()`
  against `Atom` (`../SheetBlock1.js`) instead. `../Stripe.ts` is shared
  infrastructure outside this task's write-set (also needed by T10b's
  `StripeTable`) — widening it is flagged for T10g.
- **Resolution**: `StripeCode` does not declare `implements Stripe`/
  `StripeRaw`. `getAtoms(): readonly Atom[]` returns `[this]`;
  `getLHeader(): Atom | null` returns `null` (also happens to satisfy
  `CreoleAtom | null` since it's unconditionally `null`). Unlike
  `StripeTree`, `StripeCode` has NO other blocked member — every method
  is fully reachable and tested today.
- **Confidence**: High — read `../Stripe.ts`, `StripeTree.ts`, `Sea.ts`
  directly; confirmed `Sea`/`Position` key their map by `CreoleAtom`
  (would need the union widened to accept a self-referencing compound
  atom).

## Observation: `adjustColorForBackground` is a pre-existing `HColor` gap,
not a new blocker

`drawU`'s upstream body calls `fontConfiguration.adjustColorForBackground
(ug)` — needs `HColor`, which `Position.ts`/`ISkinSimple.ts`/
`StripeStyle.ts` already document as unported anywhere in this port. This
port's `FontConfiguration` (`UText.ts`) already carries an already-
resolved `color: string | null`, so there is no operation left to call;
`drawU` draws with `this.fontConfiguration` as-is. Not a new seam —
same documented gap, re-confirmed here.

## Nothing else dropped

`StripeCode`'s constructor, `getLHeader`, `addAndCheckTermination`,
`isTerminated`, `calculateDimensionSlow` (max width / summed height),
`getStartingAltitude`, `drawU` (per-line y-cursor + descent-adjusted
translate) are ported in full and are all reachable/tested today —
`StripeCode` has zero throwing seam except `getNeutrons()` (ADR-9,
above), unlike its concurrent siblings `StripeTree`/`StripeTable`.
