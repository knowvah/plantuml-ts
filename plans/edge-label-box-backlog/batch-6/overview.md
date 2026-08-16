# Batch 6 — gated fixes for M3 and M4

All tasks are **gated on a Batch 1 diagnosis** and none may run without one.
Their write-sets were unknown at planning time — deliberate, not an oversight:
a fix whose write-set could be declared in advance would not have needed a
diagnosis task. Both diagnoses have since landed, so the write-sets below are
now declared rather than guessed.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T11 | M3 fix: tail/head swap | `typescript-pro` | `class-dot-edges.ts`, `class-edge-label-anchor.ts` | T3 | [x] |
| T12a | M4 cause A+B: visibility strip + icon block | `typescript-pro` | `core/edge-label-box.ts`, `class-layout-edge-labels.ts` | T4 | [x] |
| T12b | M4 cause C: `<<x>>` → `«x»`, class only | `typescript-pro` | `core/edge-label-box.ts`, `class-layout-edge-labels.ts`, `class-edge-label-lines.ts` (new, split), `class-edge-geo.ts` | T4, T12a | [x] |
| T12c | M4 cause D: magic arrow, both engines | `typescript-pro` | `core/edge-label-box.ts`, `class-layout-edge-labels.ts`, `class-magic-arrow.ts`, `class-edge-geo.ts`, `description/link-edge-attrs.ts` | T4, T12b | [x] |

## Why T12 became three tasks

The brief scoped T12 as one task fixing "few-px width deltas" on four slugs. T4
established M4 as **three independent sub-mechanisms over ~13 gate-failing
slugs**, each with its own upstream origin, its own engines and its own
regression risk. That is the `rules/autonomous-execution.md` "task was
mis-scoped and actually needs to be split" stop condition; the maintainer
approved the split on 2026-08-16.

The three causes are independent — T4 verified each reproduces its oracle in
isolation — so the split is by cause, not by engine.

## Concurrency

**T11 runs in parallel with the T12 chain.** Its write-set
(`class-dot-edges.ts`, `class-edge-label-anchor.ts`) is disjoint from every
T12 file.

**T12a → T12b → T12c run sequentially.** All three write
`src/diagrams/class/class-layout-edge-labels.ts`, and one-writer-per-file is
not negotiable. Order is by increasing blast radius: A+B establishes the
preprocessing seam and the `classAttributeIconSize` gate, C is a narrow string
rewrite, D spans two engines and carries two sub-cases.

## The orchestrator owns every backlog edit

No task in this batch edits `oracle/goldens/*/label-size-backlog.json`. T11 and
all three T12 tasks clear class slugs, so the four would collide on one file.
Each task instead reports the triage script's `CLEARABLE` list; the
orchestrator removes the slugs after verifying them, once per task.

This also enforces the shrink-only contract from the outside: a slug leaves a
backlog only when the instrument says it passes, never because the task that
touched it believes it should.

## Gates on running at all

- **T11 does not run** if `.agent-notes/m3-tail-head-swap.md` records STOP —
  i.e. the root cause is in edge **emission order**, which D5 assigns to the
  edge-draw-order mission. **It does not: T3's verdict is tail/head
  assignment, so T11 proceeds.**
- **No T12 task runs** if `.agent-notes/m4-single-line-width.md` leaves the
  mechanism unestablished. **It does not: T4 established all three causes with
  22/22 values reproduced exactly, validated predictively.**

## Known residue this batch will NOT close

Named, not fitted — carried into T13's accounting:

- `class/xamule-03-jeda376`'s `<size:30>to Foo >` — a per-run font change
  inside a label, which `core/edge-label-box.ts:60-64` already documents as
  needing a real creole `TextBlock` (the Phase 4h track). The slug may clear
  its bare-arrow edges and still fail `labelSizeOk` on this one label.
- The description engine's inability to represent a **mid-string** `<<x>>` —
  its parser route only lifts a post-colon stereotype.

**Batch exit:** for each task, either the fix landed with its slugs cleared and
no fixture risen, or the skip is recorded with the reason and the owning
mission named.

## Write-sets of record, corrected after execution

T12b and T12c both exceeded their declared write-sets, and both were right to.
The declared sets were drawn before the mechanisms were known, and causes C and
D each turned out to have a **render** consumer as well as a measurement one:

- **T12b** needed `class-edge-geo.ts`: `attachEdgeLabel` fed raw `rel.label`
  into `portLabelAnchor`, a second independent measure-and-draw path.
  Rewriting only the measurement left the DOT box sized for `«alias»` while
  the glyphs drawn inside it were still `<<alias>>`, and `tebore-53-tese080`
  regressed 15/15 → 14/15. Caught in orchestrator review, not by the agent,
  and only because the agent's own attribution (to the accepted dot-engine
  geometry delta) was checked rather than accepted — that ruling covers
  Smetana paths, and class diagrams shell out to real graphviz.
- **T12c** needed `class-magic-arrow.ts` and `class-edge-geo.ts` for the same
  reason on the class side, and `core/edge-label-box.ts` because
  `parseMagicArrowLabel` is now shared by both engines (D1's stated trigger).
- **T12b** also split `class-edge-label-lines.ts` out of
  `class-layout-edge-labels.ts`, which had hit the 500-line hook cap with zero
  headroom. Authorized as a pure extraction on the `DisplayNewlines.ts`
  precedent, re-exported so no import path changed. The alternative — trimming
  comments to fit, as an earlier task had done — would have destroyed the
  upstream `file:line` citations that are this mission's evidence trail.

**The generalisable lesson: a fix to a measurement is not finished until you
have checked whether the same string is also drawn.** Three tasks in this batch
faced that question and it had three different correct answers — T12a left the
rendered text alone (this port draws no visibility icon, so stripping the char
would delete information), T12b had to rewrite it (jar renders `«alias»`), and
T12c had to rewrite it for class but not description (which draws no glyph).
