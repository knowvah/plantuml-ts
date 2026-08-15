# Architecture decisions (pre-made, locked)

If execution surfaces a conflicting constraint, STOP and log it in
`decision-journal.md` — do not silently override.

## D1 — State is the reference; class moves

**Context.** Both engines model notes; they disagree. Upstream's
`reallyCreateLeaf(..., LeafType.NOTE, ...)` and the leaf-type dispatch in
`GeneralImageBuilder` put notes in the same collection as every other leaf,
which is state's shape (`StateNodeGeo` with `kind: 'note'`).

**Decision.** Class adopts state's shape. State does not change.

**Consequences.** The engine with 712 DOT fixtures and hundreds of SVG pins
is the one being restructured. That is why every batch's bar is
byte-identical output rather than "tests pass".

## D2 — NOTE and TIPS stay distinct

**Context.** Upstream dispatches `LeafType.NOTE → EntityImageNote` and
`LeafType.TIPS → EntityImageTips` separately. Our single `NoteGeo` covers
both, with `note-layout-tip.ts` (40 of 96 references) as the TIPS half.

**Decision.** The folded model carries the leaf-type distinction. Do NOT
merge the two further on the way in.

**Rejected:** folding `NoteGeo` in as one kind. It would bake a conflation
upstream does not have into the very structure this mission exists to make
faithful, and it would be much harder to unpick afterwards than now.

## D3 — Opale resolution moves to draw time BEFORE the collections merge

**Context.** `mapNoteGeos` needs classifier positions and row text, so
classifiers must be built first (`layout.ts:267`). That phase split is the
reason the arrays are separate. Upstream has no such split: it resolves the
Opale connector inside `EntityImageNote#drawU`, at draw time.

**Decision.** Batch 2 moves resolution to draw time, matching upstream.
Only then does Batch 3 merge the collections.

**Rejected:** merging the arrays while keeping layout-time resolution, via
a two-pass build over one collection. It would preserve the phase coupling
under a nicer type and leave the next reader believing the model is
upstream's when the dependency is still there.

**Consequences.** Batch 2 is load bearing and carries most of the risk. If
it cannot be byte-identical, the mission stops there — with a diagnosis of
why layout-time resolution is required, which is itself a real result.

## D4 — The DOT must not move

**Context.** Notes are already flattened into the class DOT
(`layout.ts:249`). The 712-fixture DOT-parity gate therefore has no reason
to move, at any point in this mission.

**Decision.** Treat DOT-parity movement as a stop, not a finding. It would
mean the restructure reached the graph build, which is out of scope.

**Consequences.** A strong, cheap invariant available at every batch
boundary.

## D5 — Document order, uid and ink are the three things to watch

**Context.** Notes participate in all three. Class currently derives note
order from a separate array; state derives it from `creationIndex` within
one array — the mechanism its own module doc credits for reproducing jar's
interleaved document order "for free".

**Decision.** Each batch explicitly re-verifies all three, and the
close-out states the evidence for each rather than inferring it from a
green suite.

**Consequences.** These are also the likeliest sources of a silent
regression that pins would catch but tests might not, which is why
`shape-match-report` is a per-batch gate and not just a close-out check.
