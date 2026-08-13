# T10g — CreoleParser consolidation (batch-3a)

## Observation: `Stripe.ts`'s widening cannot be a `CreoleAtom` union member —
it ripples into off-limits files regardless of which off-limits file

- **Context**: T10b/T10c/T10d/T10e's own notes floated two candidate
  reconciliations for "`StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex`
  cannot honestly `implements Stripe`": (a) add a `'block'` variant to
  `atom/Atom.ts`'s `CreoleAtom` union wrapping the opaque OOP `Atom`, or
  (b) a non-generic union widening of `Stripe.getAtoms()` itself.
- **Finding**: BOTH were tried and both broke `tsc` in an off-limits file.
  (a) breaks `svek/image/EntityImageDescriptionSupport.ts` (explicitly
  off-limits): three call sites (`measureAtomsWidthHeight`,
  `measureSingleAtomWidth`) narrow `CreoleAtom` by ELIMINATION after
  handling `'text'`/`'latex'`, assuming only `'inline'` remains and reading
  `atom.atom: InlineAtomToken` — a third variant widens that inferred type
  to `InlineAtomToken | Atom` and fails to assign into
  `resolveAtomImage?.(atom.atom)`. (b) breaks `SheetBlock1.ts#initMap` (not
  in this task's write-set): `stripe.getAtoms()` there is passed straight
  into `Fission.ts#getSplitted` (EXPLICITLY off-limits), which requires
  `readonly CreoleAtom[]` exactly — a uniform (non-generic) `Stripe`
  interface has no way to stay narrow for that ONE consumer while widening
  for `CreoleParser.ts`'s heterogeneous `Sheet`.
- **Resolution**: made `Stripe<A extends StripeAtom = CreoleAtom>` GENERIC
  instead. Bare `Stripe`/`Sheet` (no type argument) still means
  `Stripe<CreoleAtom>`/`Sheet<CreoleAtom>` — `SheetBlock1.ts`'s own,
  unedited `import type { Stripe }`/`import type { Sheet }` usage is
  UNCHANGED, so `Fission.ts` never sees anything but `CreoleAtom`.
  `CreoleParser.ts` alone instantiates `Sheet<StripeAtom>` for its own
  heterogeneous sheet. `atom/Atom.ts` was reverted to its original state
  (edited, then reverted, once the ripple was found) — confirmed via
  `git diff` showing zero change to that file.
- **Necessary widening beyond the literal write-set**: `Sheet.ts` (made
  generic, matching `Stripe.ts`) and `SheetBuilder.ts` (`createSheet`'s
  return type widened to `Sheet<StripeAtom>` — the only implementor is
  `CreoleParser`, so zero-impact elsewhere). Both are small, type-only
  changes, cited in each file's own doc comment, matching this batch's
  established "small necessary sibling" precedent (`Skeleton2.ts`,
  `Parser.ts`, `Warning.ts`/`PragmaKey`).
- **Confidence**: High — verified via `npm run typecheck` failing, then
  passing clean, at each design iteration; `npm run build`/`npm test`
  clean on the final shape.

## Observation: the horizontal-line and embedded-diagram seams needed the
SAME `createSimpleStripe`/`TaggedSimpleStripe` generalization, not a
separate wrapper

- **Context**: upstream's `CreoleHorizontalLine`/embedded-diagram atoms are
  each added into the SAME `StripeSimple` instance that also holds ordinary
  text atoms (java: `atoms.add(CreoleHorizontalLine.create(...))` inside
  `StripeSimple#analyzeAndAdd`) — so the cell-alignment carry-forward
  (`lastStripe instanceof StripeSimple ? getCellAlignment() : ...`,
  java:110-112) must still apply after a horizontal-line-classified line.
- **Resolution**: `createSimpleStripe`/`TaggedSimpleStripe`/`isSimpleStripe`
  in `CreoleParser.ts` were made generic over the SAME `StripeAtom`
  parameter, so a `[CreoleHorizontalLine]` singleton produces a
  `TaggedSimpleStripe<Atom>` that still carries `cellAlignment`, exactly
  like a `TaggedSimpleStripe<CreoleAtom>` plain-text line. The embedded-
  diagram branch does NOT need this (upstream's own anonymous `Stripe`
  there carries no cell-alignment state either), so it stays a plain
  object literal.

## Continuation checks reinstated (java:81-98)

- `lastStripe instanceof StripeRaw` (java:81) → `isStripeRaw`, a duck-type
  guard (`'addAndCheckTermination' in stripe && 'isTerminated' in stripe`)
  since TS interfaces have no runtime representation to `instanceof`
  against — `StripeRaw.ts`'s own doc comment already flagged this as the
  expected shape.
- `lastStripe instanceof StripeTable && isTableLine(line)` (java:91) and
  `lastStripe instanceof StripeTree && isTreeStart(trim2(line))` (java:95)
  → real `instanceof` checks (both are concrete classes now).
- Tested via `CreoleParser.test.ts`'s table/tree dispatch describe blocks:
  a continuation line does NOT add a second `Stripe` to the `Sheet` (only
  the FIRST line of a table/tree block does), and the accumulated
  dimension reflects every continuation line folded into the same
  underlying `AtomTable`/`AtomTree`.

## `StripeTree.analyzeAndAdd` — real body, ported from java:80-90

`StripeTable`(T10b) landed, so the `blockedOnStripeTable` seam is gone.
The per-cell build binds to `legacy/StripeSimple.ts#buildStripeAtoms`
(ADR-9: this port's data-oriented stand-in for constructing a real
`StripeSimple` and calling `analyzeAndAdd` on it) — verified against
`StripeStyle.ts#getHeader`'s own TREE fallthrough that the upstream
per-cell header-atom step is UNCONDITIONALLY a no-op for `StripeStyleType
.TREE`, so it is not built here (documented in `StripeTree.ts`'s own doc
comment, not silently dropped).

## `getEmbeddedType` deduplicated

`CreoleParser.ts`'s module-private copy deleted; imports `getEmbeddedType`
from `src/core/EmbeddedDiagram.ts` (T10f's own canonical home, verified
algorithmically identical to the deleted copy while T10f wrote it).

## Embedded seam wired through `createSheetSlow`

`CreoleParser`'s constructor gained `renderer: NestedDiagramRenderer`
(bundled into `CreoleParserAdapters`, alongside `atomOps`, to stay at this
project's 5-parameter ceiling). `createSheetSlow` switched from `for...of`
to a manual iterator so `processEmbedded` can hand the SAME iterator to
`EmbeddedDiagram.createAndSkip`, which advances it past the embedded
block's lines before the outer loop resumes — exactly upstream's own
`while (it.hasNext())` + shared-iterator structure. Verified via a test
that asserts the STRIPE AFTER an embedded block is the next real display
line, not a swallowed one, and that `EmbeddedDiagram`'s lazy
`getInternalTextBlock` memoization means the renderer is invoked only on
`calculateDimension`/`drawU`, not at collection time (confirmed empirically
— an early test draft asserted eager invocation and failed, corrected).

## Nothing else seamed

Every `blockedOnSibling` throw in `CreoleParser.ts` is gone. The ONE
remaining unreachable-by-construction branch (`processEmbedded`'s
`checkColor` true-arm) is upstream's own dead code (the commented-out
`checkColor()` static method) — not a new gap, documented in-line.

## Pre-existing bug fixed in-file: a literal NUL byte in `SheetBuilder.ts`

- **Context**: while widening `SheetBuilder.ts` (necessary sibling, above),
  `file`/`git diff`/`diff` all reported the file as binary.
- **Finding**: a genuine NUL byte (`0x00`) at the position of what was
  clearly meant to be a leading space in the doc comment's `` `' NULL'` ``
  example (the `isNull`-sentinel cache key `CreoleParser.test.ts`'s own
  `display()` helper uses) — present in the file since T9a, pre-dating this
  task (confirmed via `git show HEAD:...`).
- **Resolution**: fixed in the same file per `pr-workflow.md`'s
  "pre-existing violations ... 1-3 lines" rule (a single-byte doc-comment
  typo, zero behavior impact — it was never executable code). Verified
  `file` now reports UTF-8 text, `npm run typecheck`/`SheetBuilder.test.ts`
  unaffected.
- **Separately, cosmetic only**: `git diff --stat` still reports `Bin ...`
  for `CreoleParser.test.ts` (which intentionally contains a real NBSP,
  U+00A0, matching the pre-existing test's own convention) — confirmed via
  `diff -a` that the textual diff is completely ordinary; this is a locale/
  heuristic quirk of `diff`/`git` in this sandbox, not a corruption (no NUL
  byte, valid UTF-8, `npm test`/`tsc`/`eslint` all pass).

## Pre-existing, out-of-scope coverage gaps (not touched)

`StripeTable.ts#splitOnHiddenNewlineOnly` (lines ~336-349) is already
documented (T10b) as unreachable today (`Pragma
.legacyReplaceBackslashNByNewline()` always returns `true`) — pre-existing,
not part of this task's diff.
