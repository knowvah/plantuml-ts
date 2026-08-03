# SI14 — share the measurement object, not the measured number

## Objective

The class engine's `usecase`/`actor` leaves are **sized** by the faithful
`EntityImageDescription` tree (SI10) and then **drawn** by a hand-rolled
`<ellipse>` whose label sits at the constant `cy - 2 + fontSize/3`. Everything
the drawing needs beyond width/height — above all the fitted ellipse's CENTRE —
is discarded at the sizer boundary.

Upstream never has this problem, because upstream never shares measurement
*numbers*. It shares the **object** (`IEntityImage extends TextBlock`; the fit is
computed once in the constructor and read by both `calculateDimension` and
`drawU`) and the **measurer** (`ug.getStringBounder()`). This port already
implements both — in the description engine
(`description/renderer-entity.ts:387`). The class engine is the sole holdout.

This mission brings the class engine's USymbol leaves onto that same mechanism,
and retires the second, data-based copy of the ellipse fit
(`description/usecase-footprint.ts`) in favour of the object-based one
(`core/svek/image/Footprint.ts`) that measures by drawing.

**Not a plumbing exercise.** If a task finds itself threading a new number
through a call chain, that is the signal it has taken the wrong approach — stop
and journal it.

## Branch

`feature/si14-usymbol-measurement-sharing`, branched from `main`.
Merge with a **merge commit**, not a squash (per-task commit IDs are referenced
throughout the journal).

## Batches

| Batch | Tasks | Status |
|---|---|---|
| [batch-1](./batch-1/overview.md) | T1 fragment-emission seam · T2 retire `usecase-footprint.ts` | [ ] |
| [batch-2](./batch-2/overview.md) | T3 carry measurer on class geo | [ ] |
| [batch-3](./batch-3/overview.md) | T4 draw usecase/actor via `drawU` | [ ] |
| [batch-4](./batch-4/overview.md) | T5 remove atom pre-resolution · T6 diagnose `ry` | [ ] |

## Documents

- [decisions.md](./decisions.md) — ADR-1…ADR-4, all maintainer-approved 2026-08-03
- [diagrams/component-map.md](./diagrams/component-map.md) — which components move
- [diagrams/data-flow.md](./diagrams/data-flow.md) — the two call sequences, before and after
- [decision-journal.md](./decision-journal.md) — appended during execution

## Quality gates

Run **all** of these between every batch. Fix-and-rerun on failure; stop after
two consecutive failures of the same gate.

```sh
npm test                                              # exit 0
npm run typecheck                                     # exit 0
npm run lint                                          # exit 0
npm run build                                         # exit 0
npx jiti scripts/vendor-stdlib.ts --verify            # 34,587 files verbatim
npx jiti scripts/measure-description-size-deltas.ts   # 320/351, widened 0
```

Plus: **449 golden + ratchet tests** byte-identical (312 class + 24 object +
59 state + 54 description). Any movement in a golden that this mission does not
explicitly intend means the change reached further than planned.

Run the test gate on a **cold tree** at least once before the final batch closes
(`rm -rf packages/*/assets && npm test`, twice) — warm gitignored assets have
previously hidden a worker race.

## Stop conditions

Stop and journal; do not self-approve.

1. `widened` rises above 0 in the size-delta gate.
2. A golden `.svg` would need editing, or a ratcheted fixture drops below
   zero-diff.
3. Re-pinning `size-backlog.json` or `diff-baseline.json`.
4. Weakening, skipping, or deleting a test to make it pass. Tests may be
   rewritten **stronger**, never dropped.
5. **T1 requires modifying `svg-graphics-core.ts` emission behavior** — this is
   ADR-2's explicit boundary and was a STOP in a prior mission.
6. Changing which measurement path a `<latex>` display takes (ADR-3), or editing
   `DIVERGENCES.md`.
7. T6 proposing any rendering-code change (it is diagnosis-only).
8. A task needing a file outside its own write-set **and** outside every other
   task's.
9. The same location or approach failing the same check three times
   consecutively.

## Push forward without asking

- Naming, comment wording, and file organisation within a declared write-set.
- Splitting a function to satisfy the complexity hook (`// #lizard forgives --
  <reason>` near the function's end for pre-existing violations; never edit
  `complexity-ignore`).
- A task turning out simpler than specified — log why in the journal first.

## Conventions

- Agents **never** run git mutations. The orchestrator commits, one commit per
  task, message `type(TN): description` per `~/.claude/rules/commits.md`.
- `plans/` is **tracked** in this repo. Do not gitignore it.
- Every diagram in this brief is PlantUML in a ` ```plantuml ` fence.
- `src/` is browser-safe: no Node built-ins, no `process.env`, no `Date.now()`
  or `Math.random()` in rendering paths.
