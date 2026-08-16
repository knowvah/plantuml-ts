# Batch 6 — gated fixes for M3 and M4

All tasks are **gated on a Batch 1 diagnosis** and none may run without one.
Their write-sets were unknown at planning time — deliberate, not an oversight:
a fix whose write-set could be declared in advance would not have needed a
diagnosis task. Both diagnoses have since landed, so the write-sets below are
now declared rather than guessed.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T11 | M3 fix: tail/head swap | `typescript-pro` | `class-dot-edges.ts`, `class-edge-label-anchor.ts` | T3 | [ ] |
| T12a | M4 cause A+B: visibility strip + icon block | `typescript-pro` | `core/edge-label-box.ts`, `class-layout-edge-labels.ts` | T4 | [ ] |
| T12b | M4 cause C: `<<x>>` → `«x»`, class only | `typescript-pro` | `class-layout-edge-labels.ts` | T4, T12a | [ ] |
| T12c | M4 cause D: magic arrow, both engines | `typescript-pro` | `class-layout-edge-labels.ts`, `description/link-edge-attrs.ts` | T4, T12b | [ ] |

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
