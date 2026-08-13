# Architecture decisions — edge-label-box-and-class-ports

Locked before execution. If a task discovers a conflicting constraint, STOP and
log it to `decision-journal.md` rather than silently overriding.

## D1 — Reuse `computeReservedLabelBox`; do not write a second one

`state-transition-label.ts#computeReservedLabelBox` is already the correct
computation and already reproduces the oracle exactly once its input is clean.
Relocate it to a shared home (`src/core/`) and have class and description call
it. **Do not reimplement multi-line/max-width/margin logic anywhere else** —
two implementations of a box formula will drift, and this mission exists partly
because the right code was already present and unused.

Upstream backs the reuse: `SvekEdge` sizes every edge label the same way,
through `labelText.calculateDimension(stringBounder)` (`SvekEdge.java:441`).
One formula upstream ⇒ one formula here.

## D2 — Strip creole markup before measuring, do not render it

Upstream measures a real creole `TextBlock`, where `<color:…>` is a formatting
change rather than glyphs. A faithful port of that is the Phase 4h creole
track, which is out of scope.

**In scope:** strip markup to plain text before measuring, so the measured
width is the text's. That is what closes the measured gap (336 → 176 → 72) and
reproduces the oracle byte-for-byte on both corpus cases. Add a shared
`stripCreoleMarkup` next to `splitCreoleLines` rather than a per-engine regex.

**Explicitly deferred:** per-run font changes inside a label (`<size:N>` mid
string) genuinely need the TextBlock. If a corpus fixture needs it, STOP —
do not approximate it with a heuristic.

## D3 — `arrowFontSize` extends the existing bucket model, or it stops

`core/skinparam.ts#ELEMENT_BUCKET_SNAMES` omits `'arrow'`; that omission is
already documented in `class-layout-helpers.ts#CARDINALITY_FONT_SIZE`. Add
`'arrow'` to the existing model. If that turns out to require restructuring the
bucket model rather than adding to it, STOP — the mission's other two batches
do not depend on it, and 3 corpus fixtures do not justify a skinparam
refactor.

## D4 — The box goes to the engine as a FIXEDSIZE table, not as text

`graph-layout-build-edges.ts` currently sends class/description edges a
plain-text `label`, so `@knowvah/dot-engine` measures the text and reserves its
own height (a constant 16.5 for one line) instead of the declared height. Only
the state pipeline sends the `<TABLE FIXEDSIZE="TRUE" WIDTH=".." HEIGHT="..">`
form, via `labelBoxWidth`/`labelBoxHeight`.

Populate those two fields for class and description too. **Do not** reuse the
raw `labelWidth`/`labelHeight` — that was measured and rejected: it takes
`class-inheritance-interface-assoc` 202 → 13 but regresses `jecici` 143 → 159,
because the raw dims are the wrong value. The box must come from D1's helper.

## D5 — Batch 3 does not touch `graph-layout-build-constraint.ts`

`sokevu`'s missing `constraint=false` is a symptom of absent class-side `port`
modelling, not a defect in the same-container predicate. Verified: all three of
its port nodes carry `isPort: undefined` and their cluster carries
`portRanks: null`, so there is nothing for the predicate to match. Set those
two, and the constraint follows with no change to that file. If it does not,
STOP — that would mean the predicate is also wrong, which the state fixtures
say it is not.

## D6 — Movement is measured per fixture, never in aggregate

The bucket histogram cannot show movement inside a bucket; that is why
`--per-fixture` exists. Diff against a pre-batch baseline. A rise is a
regression to diagnose, not to re-baseline — and if a baseline is raised
anyway, the entry carries the mechanism, as `diff-baseline.json`'s `jecici`
entry does today.

## D7 — Add edge-label dimensions to the DOT comparator, or say why not

`parseEdges` records only `hasLabel: boolean`, so a 336-vs-72 box scores EQUAL.
That is the fourth instance of the blind-spot shape this mission line keeps
finding, and it is the gate that would have caught batch 1's bug on its own.
Close it in the close-out task, and **prove it discriminates**: disable
emission and watch it fail before trusting it to pass.
