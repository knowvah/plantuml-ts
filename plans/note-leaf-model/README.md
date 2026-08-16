# Mission: a note is a leaf, not a parallel array

## Objective

Upstream has ONE entity collection. A note is created by the same call a
class is:

```java
final Entity entity = diagram.reallyCreateLeaf(location, quark, display, LeafType.NOTE, null);
```
`command/note/CommandFactoryNote.java:197`

and `GeneralImageBuilder#createEntityImageBlock` dispatches it by leaf type
alongside every other leaf — `LeafType.NOTE → new EntityImageNote(leaf)`
(`:118-119`), `LeafType.TIPS → new EntityImageTips(leaf, bibliotekon)`
(`:219-220`).

The class engine instead carries `NoteGeo[]` **parallel to**
`ClassifierGeo[]`. The state engine does not: it folds notes into
`StateNodeGeo` as `kind: 'note'`, which is upstream's shape. So state
mirrors upstream and **class is the divergence**.

## What the investigation changed about that framing

Three findings that make this smaller in one place and bigger in two, and
that a reader should have before scoping anything:

**1. The DOT is ALREADY unified.** `layout.ts:249` — "classifiers + notes
flattened into root graph, D5". Notes are ordinary nodes in the class DOT
today. The divergence is entirely in the POST-layout geometry model, which
means the 712-fixture DOT-parity gate should not move at all and is a
strong invariant to hold this mission against.

**2. Our `NoteGeo` conflates two upstream leaf types.** `LeafType.NOTE` and
`LeafType.TIPS` are separate upstream, dispatched to different image
classes. `note-layout-tip.ts` (40 of the 96 references) is the TIPS half.
A faithful re-mirror has to keep them distinct, not merge them further —
folding our one `NoteGeo` into the classifier collection unchanged would
preserve a conflation upstream does not have.

**3. The two-array shape encodes a real ordering dependency.**
`layout.ts:267` — "classifiers computed FIRST, `mapNoteGeos` needs their
positions + row text to resolve member-tip (`::member`) note connectors."
Upstream has no such phase problem because it resolves the Opale connector
at DRAW time inside `EntityImageNote#drawU`, not during layout. So this is
not a type merge: **the ordering dependency has to be removed first**, by
moving Opale resolution to draw time the way upstream does. Batch 2 is that,
and it is the load-bearing batch.

## Scope

96 references across 14 files, all inside `src/diagrams/class/`. Sequence
has its own unrelated `NoteGeo` (`sequence/ast.ts:180`) — a name collision,
not shared code, and out of scope. Activity's `computeNoteGeo` is a local
function, also unrelated.

The state engine is NOT touched: it already has the target shape, and its
role here is as the reference implementation.

## This mission moves NO fixture

Every batch's exit bar is byte-identical output. Notes participate in
document order, uid assignment and ink extent, so a moved fixture means the
restructure changed one of those — which is the failure mode, not a result.

| Signal | Baseline | Bar |
|---|---|---|
| `shape-match-report.ts` | 776 / 25695 | **exactly unchanged** |
| Class DOT-parity | 100% EQUAL | unmoved (the DOT is already unified) |
| svg-class / svg-object pins | all hold | all hold |
| `npm test` | 14291 | unchanged, no expectation moved |

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Make NOTE vs TIPS explicit; pin the note-order invariant | — | [x] |
| [2](batch-2/overview.md) | Move Opale resolution to draw time (retires the phase dependency) | B1 | [x] |
| [3](batch-3/overview.md) | Fold notes into the leaf collection; sweep and close | B2 | **retired** — see note below, not pending |

Batch 2 is the one that matters. If it cannot be done byte-identically,
Batch 3 is not reachable and the mission should stop there with the
mechanism recorded — a correct diagnosis of why the phase split is load
bearing is a better outcome than a forced merge.

**Batch 3 status: RETIRED, not pending.** It stopped before T4 (see the
Batch 3 rows of `decision-journal.md`) because the faithful fold cannot be
byte-identical — jar's leaf document order is `bibliotekon` insertion order,
which this port's declaration-order + host-interleave gets wrong on 19+
fixtures. The fold was re-scoped and completed as its own mission,
**`leaf-draw-order`** (`plans/leaf-draw-order/`, branch
`feat/leaf-draw-order`, commit range `a1c721e3..e1f4c869`), whose gate is
document-order movement (`note-order-report --vs-jar`) rather than
byte-identity. That mission is complete (same=678→718, order-only=47→7,
`--check-order` moved=80 offenders=0) but not yet merged to main, pending a
human ruling on one residual regression (daxeno-00). The `[ ]`-shaped
checkbox above is intentionally not ticked `[x]` — this brief's own
byte-identical bar was never met, by design; it is retired, not done.

## Branch

`feat/note-leaf-model` off `main`. Merge with a **merge commit, never
squash**. Agents share this worktree: **no agent runs any git command**.

## Quality gates

Run all four between every batch. **Never pipe `npm test`.**

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx tsx scripts/shape-match-report.ts
  pass: 776 / 25695 EXACTLY
  on_fail: stop
- command: npx tsx scripts/dot-sync-report.ts class
  pass: 100% EQUAL, unmoved
  on_fail: stop
```

## Stop conditions

- **Any rendered output changes.** See above.
- A class or object pin breaks. Never re-baseline one to fit the
  restructure.
- Batch 2 cannot preserve byte-identical output — stop and record why the
  layout-time Opale resolution is load bearing.
- The state engine would have to change. It is the reference here; if it
  needs to move, the target shape is wrong.
- `NoteGeo`'s NOTE and TIPS halves turn out not to be separable — that
  would contradict finding 2 and needs a ruling, not a workaround.
- Two consecutive gate failures on the same check. The cap bounds edits,
  not investigation: diagnose until you can state the mechanism, then STOP
  with the full `~/.claude/rules/diagnosis.md` artifact.

## Push forward without asking when

- The choice is purely stylistic and does not change behaviour.
- A task is simpler than estimated (log why).
- A stale comment or cross-reference is found — fix it in place.

## Index

- [decisions.md](decisions.md) — the confirmed architecture decisions
- [diagrams/model.md](diagrams/model.md) — upstream's model vs both engines'
- [decision-journal.md](decision-journal.md) — appended during execution
- `src/diagrams/state/renderer-note.ts` + `state/layout.ts` — the reference
  implementation. **Read these before Batch 3**; state already did this.

## Session summary — 2026-08-15 (autonomous run, branch `feat/note-leaf-model`)

- **Tasks:** 4 of 5 completed (T1, T2, T3, and T5's tooling half); T4 not
  started — **STOPPED** on a brief stop condition, see the Batch 3 rows of
  `decision-journal.md`. Batches 1 and 2 met every clause of their exit
  bars; Batch 2's verdict is the mission's pivot and it is POSITIVE (draw-
  time resolution is byte-identical; `mapNoteGeos` reads no classifier).
- **Decisions:** 12 journal rows; 3 flagged for review — the re-pinned
  baseline (brief numbers were stale on day one), the corner-case behaviour
  change outside the corpus (moves toward jar, jar-verified), and the Batch
  3 STOP + recommended `leaf-draw-order` follow-on.
- **Quality gates:** typecheck / lint / build / `npm test` (14313 passed, 1
  todo) all exit 0 after every batch; `shape-match-report` and class
  `dot-sync-report` diff-empty against `baseline/`; `note-order-report
  --check` identical (97 note fixtures, whole-SVG sha).
- **Known issues / follow-ups:** `leaf-draw-order` (jar's `bibliotekon`
  insertion order — 19 ORDER-ONLY fixtures, packaged-first classifier
  order); a hidden host swallows its member-tip notes (renderer skips
  hidden classifiers before `renderHostedNotes`, jar draws the tip); the
  single-line / `top|bottom` `::member` note grammar divergence
  (`.agent-notes/note-leaf-model-b1.md`). Branch left unmerged pending the
  ruling.
