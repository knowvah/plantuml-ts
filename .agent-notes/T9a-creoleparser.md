# T9a — SheetBuilder / CreoleParser / ISkinSimple

## Observation: the mission's own dependency audit missed the biggest gap a
THIRD time — `createStripes`'s table/tree/code/latex/embedded-diagram
branches each need a whole unported sibling class

- **Context**: Porting `CreoleParser#createStripes` (java:79-115) and
  `#createSheetSlow` (java:142-185) faithfully, per the task's "port
  in full" instruction.
- **Finding**: batch-3a/overview.md's dependency table (and ADR-8's own
  "smaller than its raw line count" section) lists `Fission`, `atom/Atom`,
  `StripeSimple`, `CreoleStripeSimpleParser` as "PRESENT" and stops there.
  It never traced `createStripes`'s OWN branches: `isTableLine` ->
  `StripeTable.java` (219 lines), `Parser.isTreeStart` -> `StripeTree.java`
  (111), `Parser.isCodeStart` -> `StripeCode.java` (124),
  `Parser.isLatexStart` -> `StripeLatex.java` (118), the
  `lastStripe instanceof StripeRaw` continuation -> `StripeRaw.java` (47),
  `createSheetSlow`'s embedded-diagram detection ->
  `EmbeddedDiagram.createAndSkip` (part of a 368-line class), and — one
  level further in — the plain-text path's `HORIZONTAL_LINE`
  classification -> `CreoleHorizontalLine.java` (112, needed by
  `StripeSimple.java`'s own `analyzeAndAdd`, NOT by `CreoleParser`
  directly, but reachable the moment a `--...--`/`==...==`-shaped line with
  an EMPTY capture is classified). Combined ~1,100 lines, several
  (`StripeTable`, `EmbeddedDiagram`) pulling in the OOP
  `Atom`/`AtomTable`/`HColor` machinery `atom/Atom.ts`'s own doc comment
  documents as deliberately NOT re-ported (data-only `CreoleAtom` instead).
  This is the SAME shape as T7/T8's own findings ("Trace the call graph,
  not the filenames") — a third instance of the identical audit gap in one
  batch.
- **Resolution**: NOT silently dropped, NOT silently stubbed to wrong
  output. Each branch is a labelled, cited, THROWING seam
  (`blockedOnSibling` helper in `CreoleParser.ts`) naming the exact unported
  Java file + line count. `createStripes`'s outer DISPATCH (which line
  shape routes where) is fully faithful — only the STRIPE CONSTRUCTION for
  table/tree/code/latex/embedded/horizontal-line is blocked. Reported here
  and in the task's final report as a genuinely large, separable follow-on
  — matching CLAUDE.md's "genuinely large AND separable earns a deferral,
  proven with measurement" bar, not an ad hoc skip.
- **Impact for whoever ports these next**: when `StripeTable`/`StripeTree`/
  `StripeCode`/`StripeLatex`/`StripeRaw` land, ALSO reinstate the THREE
  `lastStripe instanceof StripeRaw/StripeTable/StripeTree` CONTINUATION
  checks `createStripes` currently omits entirely (java:81-98) — they are
  unreachable ONLY because this file's own seam-throws prevent a
  `lastStripe` of those kinds from ever existing; once real constructors
  replace the throws, the continuation checks become live again and must
  be restored in the same change.
- **Confidence**: High — read every Java file named above directly,
  confirmed each has zero TS counterpart via `find`/`grep` across `src/`.

## Observation: `ISkinSimple` is a genuinely new interface — not a
duplicate of `skinparam.ts`/`theme.ts` — but 4 of its members are omitted
with cause, not silently ported wrong

- **Context**: Task's own instruction to check `skinparam.ts`/`theme.ts`
  before creating `ISkinSimple.ts`.
- **Finding**: `resolveSkinparam`/`Theme` are a DATA-ORIENTED flattening (a
  raw `skinparam key -> value` map merged onto a plain `Theme` object) —
  zero `getSprite`/`guillemet`/`sheet`/`getPadding` OOP capability surface,
  no `SheetBuilder` concept. Different problem, not a duplicate.
- **Finding**: 4 members omitted from `ISkinSimple.ts`, each cited in the
  file's own doc comment: `getIHtmlColorSet()` (this port's `HColorSet.ts`
  equivalent is free functions, not an OOP class — representing this
  member would mean inventing a NEW wrapper class duplicating those
  functions for zero in-scope callers, the exact "second builder"
  ADR-1/ADR-2/ADR-7 shape), `getPragma()`/`options()`/`getPathSystem()`
  (each needs unported subsystems — `skin/Pragma`, `preproc/
  ConfigurationStore`+`OptionKey`, `nio/PathSystem` — with zero callers
  reachable from this task). Every OTHER member, including several
  `CreoleParser.ts` itself never calls (`getValue`/`values`/
  `getMonospacedFamily`/`getTabSize`/`getDpi`/`copyAllFrom`), IS ported —
  an interface costs nothing to declare in full once its return types
  exist, so there was no reason to trim further.
- **Confidence**: High — grepped `src/core/klimt/color/HColorSet.ts`'s own
  exports (all free functions, no class) before deciding.

## Observation: `Display` (T9c) coupling is a value-equality cache-key
seam, not a reference

- **Context**: `CreoleParser.createSheet`'s `Map<Display, Sheet>` cache
  (java:129,131-140).
- **Finding**: `Display#hashCode`/`#equals` (java:98-110) are VALUE-based
  (compare `displayData` lists), not identity-based — two different
  `Display` objects with identical lines hit the SAME cache entry
  upstream. A plain JS `Map` keys by reference, which would silently stop
  being faithful (a distinct-but-equal `Display` would always miss and
  re-parse).
- **Resolution**: `DisplayLike.cacheKey(): string` (`SheetBuilder.ts`) is
  the seam. T9c's `Display` must implement it so that two `Display`s with
  equal `displayData` return equal keys, and reserve one sentinel key for
  `isNull` displays. Full contract documented in `SheetBuilder.ts`'s own
  doc comment.
- **Confidence**: High — read `Display.java#hashCode`/`#equals` directly.

## Observation: `CreoleMode` is stored on `CreoleParser` but not
consumable by the existing `classifyStripeLine`/`buildLineAtoms` — a real,
pre-existing integration gap, not something this task could close within
its write-set

- **Context**: `CreoleParser`'s constructor accepts/stores `creoleMode`
  (matching `CreoleParser.java`'s own field), which upstream's
  `CreoleStripeSimpleParser` constructor uses to select `NO_CREOLE` (skip
  ALL pattern classification, force NORMAL) vs. `FULL` (also enables the
  `*`/`#` bullet-list patterns).
- **Finding**: `legacy/CreoleStripeSimpleParser.ts#classifyStripeLine` and
  `legacy/StripeSimple.ts#buildLineAtoms` (both OUT of this task's
  write-set, ported by an earlier task) take NO `creoleMode` parameter at
  all — `NO_CREOLE` mode is silently unsupported (a `==Heading==`-shaped
  line always classifies as HEADING/LITERAL regardless of mode), and the
  FULL-mode-only bullet patterns are already documented as unported in
  that file's own doc comment.
- **Impact**: currently INERT — nothing calls `CreoleParser` yet (ADR-8:
  pure addition), so this gap has zero live consequence today. It becomes
  live the moment `Display`/T9c wires a real `creoleMode` (e.g.
  `SIMPLE_LINE`/`NO_CREOLE` contexts) through to `CreoleParser.createSheet`.
  Flagged for T9c / whoever wires the real routing (batch 5, ADR-6): this
  gap must close before `NO_CREOLE`/`SIMPLE_LINE` call sites are trusted.
- **Confidence**: High — grepped both files for `creoleMode`/`NO_CREOLE`/
  `SIMPLE_LINE`; zero hits.

## Nothing else dropped

`SheetBuilder`, `CreoleParser` (constructor, `isTableLine`/
`doesStartByColor`, `createSheet`'s memoization, `createSheetSlow`'s full
dispatch, `createStripes`'s full dispatch structure) are ported in full —
every member has a TS counterpart, either a real implementation or a
cited, throwing seam (never a silent drop, never a stub returning wrong
output). `Parser.ts` (klimt/creole/Parser.java) was added beyond the
literal write-set, flagged per T8's established Sea/Position/PortGeometry
precedent — small, self-contained, genuinely required for
`CreoleParser`'s own dispatch to be faithful.
