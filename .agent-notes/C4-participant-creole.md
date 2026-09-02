## Observation: `bodobu-73-noli773`'s `<<createRequest>>` is a MESSAGE label, and the guillemet rewrite is not in the seam

- **Context**: `plans/sequence-creole` C4, whose brief names that fixture as
  the reference for "its stereotype row reads `«createRequest»`".
- **Finding**: the fixture declares no participant stereotype at all — its
  whole body is `A->B: <<createRequest>>`, a message label, which C3 already
  routed through `sequenceCreoleRuns`. No participant-scoped change can reach
  it. The rewrite it wants lives one level ABOVE the atom engine:
  `CreoleParser#createSheetSlow` calls
  `createStripes(skinParam.guillemet().manageGuillemet(cs.toString()), ...)`
  (`klimt/creole/legacy/CreoleParser.java:175`) on EVERY display line before
  classification, and `Guillemet.GUILLEMET.manageGuillemet`
  (`text/Guillemet.java:76-87`) rewrites `<<x>>` to `«x»` with the
  `\<\<\s?((?:\<&\w+\>|[^<>])+?)\s?\>\>` pattern. `sequence-creole.ts` calls
  `buildLineAtoms` directly and never performs that step, so every sequence
  label keeps its raw `<<...>>`.
- **Impact**: this is a one-place fix in `sequence-creole.ts` (hide, then
  guillemet, then classify) and it reaches messages, participants, notes and
  frames at once — i.e. it belongs to the seam, not to any one cutover.
  `src/core/edge-label-box.ts#applyGuillemet` is the existing port of the
  pattern, but it hardcodes `«`/`»` where the seam would need
  `theme.colors.guillemetStart`/`guillemetEnd` (`skinparam guillemet`,
  `Guillemet#fromDescription`). C4 did NOT make this change: the file is
  outside its write-set.
- **Confidence**: High — fixture read, both Java methods read, and the port's
  own output confirmed to carry the literal `<<createRequest>>`.

## Observation: a weightedScore rise can be caused by CORRECT `<a>` wrappers at an unchanged child count

- **Context**: same task. `ripura-92-vacu541` was the one fixture that became
  a ratchet rise (268 -> 308) rather than being one already.
- **Finding**: it still short-circuits at `svg/g[1][childCount]`, and its
  counts are 10 (ours) against 12 (jar) BOTH before and after — so the C2 note
  ("a rise is benign iff `|ours - jar|` fell") does not classify it. The
  actual mechanism is one level down: `compare.ts:396-406` charges a
  `[childCount]` short-circuit `sumUnits(actual) + sumUnits(expected)`, and
  `sumUnits` counts NODES AND ATTRIBUTES. This fixture's participants are
  `participant "[[http://www.address.com Line 1 Line 2]]"`, so routing the row
  through creole turns the label into a url-bearing atom, which
  `sequence-text.ts` wraps in `linkWrap` — four `<a>` elements of EIGHT
  attributes each. The jar emits those same four `<a>` with the same eight
  attributes; ours went from wrong-shape to right-shape at an unchanged child
  count, and the charge rose because the subtree got BIGGER.
- **Impact**: the benign-rise test is not "did `|ours - jar|` fall" but "did
  the subtree grow by elements the jar also has". A fixture whose row gains a
  correct wrapper or a correct style attribute will rise while short-circuiting
  even when nothing about it got worse. Read the emitted shape, not the count.
- **Confidence**: High — both sides' `<a>` blocks compared attribute by
  attribute, and the child count measured at both refs.

## Observation: `----` inside a participant body is a 10px rule, and this port draws it as 14px of text

- **Context**: same task, reconciling `bugabo-85-veki716`/`jozomu-87-tajo507`
  against the jar.
- **Finding**: the jar renders a `HORIZONTAL_LINE` stripe as
  `<line x1="10" y1="40" x2="94.087" y2="40">` spanning the WHOLE box (not the
  text area) inside a stripe whose line box is 10 tall, derived from
  `CreoleHorizontalLine` + `SheetBlock2`'s stencil. `sequence-creole.ts`'s
  named remainder keeps the line literal, so this port emits `<text>----</text>`
  in a 14-tall row. Net on `bugabo-85-veki716`: text block 46 against the jar's
  42, box 60 against 56, and every row below the rule 4px low. The rows ABOVE
  it are exact (heading baseline 21 ≡ the jar's 31 less this port's 10px
  document margin).
- **Impact**: a sequence horizontal rule needs a geo kind that carries a
  `<line>` plus its own row height — the same follow-on
  `.agent-notes/C1-sequence-creole-seam.md` files for `<image>`-bearing atoms,
  and it is the residual behind those two fixtures rather than a placement bug.
- **Confidence**: High — jar SVG read element by element and the row heights
  reconciled to the pixel (18 + 10 + 14 + 14 padding = 56).

## Observation: a head's stripes are CENTRE-aligned, and this port already agreed by accident

- **Context**: same task, checking whether a heading row's x needed new code.
- **Finding**: `SheetBlock1#initMap` right-shifts each stripe by
  `(maxWidth - stripeWidth) / getCoef(stripe)` (`:145-158`), where `getCoef`
  reads the STRIPE's own cell alignment and CENTER is 2. A stripe's alignment
  is not defaulted to LEFT in practice: `CreoleParser#createStripes` passes
  `lastStripe instanceof StripeSimple ? lastStripe.getCellAlignment() :
  this.horizontalAlignment` (`:110-113`), so the FIRST stripe inherits the
  component's alignment (CENTER for a participant head) and every later stripe
  inherits the previous one's. `jozomu-87-tajo507` proves it: the 58.05-wide
  heading sits at x=23.019 inside a 70.087-wide block starting at 17, i.e.
  shifted by exactly half the 12.037 difference.
- **Impact**: this port's `cx - width / 2` per row (the parent mission's D4) IS
  that rule for the head, so no alignment machinery was needed. It would stop
  being equivalent the moment a `<left>`/`<right>` cell-alignment tag reaches a
  sequence label, which `manageCellAlignment` (`StripeSimple.java:168-192`) is
  not ported for.
- **Confidence**: High — read `SheetBlock1#getCoef` and
  `CreoleParser#createStripes`, and reproduced the shift arithmetic.
