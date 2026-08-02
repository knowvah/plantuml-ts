# Mission: si10-usecase-actor-routing

**Status:** DONE 2026-08-02 · **Branch:** `main` (maintainer practice)
**Created:** 2026-08-01 · **Predecessors:** svg-sprite-nanoparser (closed), SI9 (closed)

## Objective

The CLASS engine sizes its `usecase` and `actor` leaves through
`measureUsecase`/`measureActor` — the **analytic substitute** — while the
description engine routes the same USymbols through the faithful
`EntityImageDescription` path. Two engines, two answers for one shape. This
mission moves the class engine onto the faithful path and removes the one
description-engine guard that measurement now shows is inert.

## Scope — maintainer-approved 2026-08-01, do not widen

**In:**
1. Class engine's usecase/actor leaves route to the faithful path.
2. The multi-line `<$sprite>` branch of `hasUnroutedUsecaseMarkup` is removed.
3. `sprites` is threaded into the class-engine call (approved as an addition
   2026-08-01 — it is in scope at the call site today and simply not passed).

**Out:** the `<latex>` branch, and full retirement of `measureUsecase`.
`DIVERGENCES.md` is not touched.

### The mission-index row's "analytic substitute retired" clause is NOT achievable here

`measureUsecase` has **two** live callers, not one. Closing the class-engine
caller leaves the description engine's `<latex>` route, and **Probe B below
proves that route is load-bearing.** `usecase-footprint.ts` and
`footprintBoxes` therefore SURVIVE this mission. T5 re-scopes that clause in
`planning/mission-index.md` rather than restating it.

## The measurements that shaped this mission (taken 2026-08-01 — do not re-derive)

| probe | `widened` | reading |
|---|---|---|
| baseline | 0 | 351 total, 320 conformant (91.2%) |
| multi-line `<$sprite>` branch disabled | **0** | histogram IDENTICAL to baseline |
| BOTH branches disabled | **2** | `<latex>` is load-bearing |

Per-fixture, `bootstrap-0` and `ruziru-69-xixo434` both report
`delta 0, conformant true` **with and without** the sprite guard. **The
0.029321in widening that guard exists to prevent no longer reproduces** —
`svg-sprite-nanoparser`'s two-channel architecture closed it.

**Probe A is not vacuous:** instrumenting the predicate showed the branch
fires on 4 real displays — `"<$bi-globe>\nbi-globe"` (in both named
fixtures) and two `<$maxime>` link displays.

**Reachability of the class-engine path, instrumented:**

| input | `measureUsecaseOrActor` reached? |
|---|---|
| `class C` + `usecase` (no `allowmixing`) | **no** — routes to the description engine |
| `class C` + `actor a1` | **yes** (`kind=descriptive`) |
| explicit `allowmixing` + both | **yes, twice** |

Fixtures must therefore use `allowmixing` or a bare `actor`.

## Quality gates

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx jiti scripts/measure-description-size-deltas.ts` | 320/351, **widened 0** | **stop** |
| `npx jiti scripts/vendor-stdlib.ts --verify` | 34,587 files verbatim | stop |
| svg class/object/state goldens | byte-identical | stop |
| svg-description ratchet (54 fixtures) | all zero-diff | stop |

Baseline at mission start: **471 test files / 11,358 tests**, all green.
Goldens measure **395** today (312 class + 24 object + 59 state); the "389"
figure in older briefs is stale drift, not a regression.

**`jiti`, not `tsx`** — `tsx` is not a dependency of this repo. Note
`oracle/goldens/svg-class/README.md` still says `npx tsx` for the parity
survey; that reference is stale, use `npm run svg:survey`'s `jiti` form.

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 | Description engine: faithful entry point + drop the inert guard | [x] |
| [2](batch-2/overview.md) | T2 | Class engine routes to it, with sprites threaded | [x] |
| [3](batch-3/overview.md) | T3 | Author the missing fixtures and MEASURE the gap | [x] |
| [4](batch-4/overview.md) | T4 | Close the mission; register the SI9-extension follow-up | [x] |

**Every batch is sequential, and batch 4 is one task, not two.** T2 needs
T1's exported entry point; T3 can only measure once T2's routing exists; and
closing the mission and registering the follow-up BOTH write
`planning/mission-index.md`, so they are one task, not a parallel pair. This
mission is small enough that serialising costs little and removes the
shared-worktree hazard entirely.

## Documents

- [`decisions.md`](decisions.md) — the four ADRs. **Read before any task.**
  ADR-2 (who owns the routing decision) and ADR-4 (what the fixtures are
  allowed to claim) are the two that constrain more than deletion.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/component-map.md`](diagrams/component-map.md)
- [`diagrams/data-flow.md`](diagrams/data-flow.md)

## Stop conditions

**Standard**

1. A task needs a file outside its write-set AND outside every other task's —
   escalate, never self-approve.
2. Two consecutive gate failures on the same check, or the same location
   changed 3× without resolving it.
3. An ADR in `decisions.md` is contradicted.

**Measurement integrity**

4. **`widened` rises above 0.** This is the mission's primary signal; the
   whole premise is that this change is size-neutral.
5. Conformant drops below 320/351.
6. A ratcheted fixture drops below zero-diff, or a `golden.svg` is edited.
7. Re-pinning `size-backlog.json` or `diff-baseline.json`.

**Scope containment**

8. The `<latex>` branch of `hasUnroutedUsecaseMarkup` is touched, or
   `DIVERGENCES.md` is edited.
9. `usecase-footprint.ts` / `footprintBoxes` / `measureUsecase` are DELETED —
   they legitimately survive this mission (see ADR-1).
10. The description engine's non-usecase routing changes.

**Test integrity**

11. Weakening, skipping or deleting a test to make it pass. The tautological
    test named in ADR-3 must be REWRITTEN STRONGER, never dropped.
12. Pinning our own output as a jar oracle without labelling it (ADR-4).

## Push-forward conditions

- Internal structure, naming and helpers inside the modules a task owns.
- **Complexity/line-cap friction:** `#lizard forgives` near a function's END,
  or a ~500-line split. Do NOT edit `complexity-ignore`.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the
  correction in the journal, continue.
- A task is simpler than scoped — log why, then proceed.

## Three method rules — spec, not preamble

1. **Trace dependency cascades TWO levels** before ruling on scope.
2. **Verify any "already wired / it will just work" claim against the CURRENT
   call graph.** This mission exists because a one-level read of
   `measureUsecase`'s callers was wrong.
3. **Capture a failing command's stderr before theorising about its cause.**

## Deviation from the `/plan-mission` template

`plans/` is **tracked** in this project, not gitignored — established
practice, and `planning/mission-index.md` links into it. `.claude/` IS
gitignored, as the template expects.

---

## Mission summary (T4, 2026-08-02)

### Tasks completed vs planned

Planned as four sequential batches / four tasks (T1–T4). **Executed exactly as
planned** — no batch added, no task split. All four are `[x]`:

- **Batch 1 — T1** `4f25be0d` (entry point + inert guard removed)
- **Batch 2 — T2** `f34790d6` (class engine routed, sprites threaded)
- **Batch 3 — T3** `6bee402a` (fixtures authored, gap measured)
- **Batch 4 — T4** (this task: close the mission)

### Decisions, and what is flagged for review

All four ADRs applied as written; none contradicted. Beyond them:

- **T1 crossed its write-set** to add `src/diagrams/description/leaf-sizing-entity.ts`.
  **Authorized, not a stop:** adding the entry point pushed `leaf-sizing.ts`
  to 526 lines, over the repo's 500-line hook cap, and this README's
  push-forward conditions name "a ~500-line split" explicitly. Verified a
  **pure move** — `measureEntityLeaf`, `buildSizingEntityParams` and
  `minWidthFloorBaseline` are byte-identical to the bodies that left.
  The agent flagged it rather than proceeding silently, which is the
  required behaviour.
- **Flagged for review, deliberately NOT fixed** (both pre-existing, both
  outside every task's write-set — registered in the SI10 row):
  1. This port is **more permissive than upstream** for `actor` in a class
     diagram — upstream errors without `allowmixing`
     (`CommandCreateElementFull2.java:197-198`), this port renders. Dates
     from mission A3.
  2. **Sizing is sprite-aware, rendering is not** — scope item 3 threaded
     sprites into the sizer only; the class renderer still emits literal
     escaped text instead of resolving the sprite.

### Gate results (from `decision-journal.md`, all orchestrator-verified)

| Batch | `npm test` | typecheck | lint | size-deltas | goldens |
|---|---|---|---|---|---|
| 1 (T1) | 472 files / 11,372 | 0 | 0 | 320/351, **widened 0** | — |
| 2 (T2) | 473 files / 11,376 | 0 | 0 | 320/351, **widened 0** | **312 class byte-identical**; 449 golden+ratchet green |
| 3 (T3) | 474 files / 11,382 | 0 | 0 | unaffected (no `src/` change) | `ratchet.json` + `parity-class.json` UNCHANGED |
| 4 (T4) | see below | — | — | — | — |

`widened` stayed at **0** with an identical cause histogram at every step —
the mission's primary signal, and its whole premise was size-neutrality.

### Known issues and follow-ups

1. **The retirement clause is re-scoped, not achieved.** `measureUsecase`,
   `measureActor`, `usecase-footprint.ts` and `footprintBoxes` survive,
   reachable via `<latex>`. Probe B (`widened 2` with both arms disabled) is
   the evidence that route is load-bearing rather than permanent-by-policy.
   Full retirement needs a home for latex-bearing usecases — its own mission.
2. **SI13 registered** — authored CLASS fixtures cannot be ratcheted because
   `dot-sync-fixtures.ts`'s `GOLDEN_DIR` is description-only. T3's three
   fixtures are guarded by a dedicated pinned-diff test instead.
3. **The two permissiveness/rendering findings above**, neither actioned.
4. None of T3's three fixtures is zero-diff (9/6/3). They are characterisation
   guards against known gaps, labelled as such — not conformance claims.

### Deviations from the brief

- **The brief's stated baseline was stale.** It records 471 files / 11,358
  tests; the true pre-T1 baseline was **472 / 11,370**, because an unrelated
  sequence-diagram fix landed between planning and execution. Noted in the
  journal at batch 1 rather than silently absorbed.
- The brief's reachability table recorded `class C` + `actor a1` as simply
  "reached". True for this port — but T3 found upstream REFUSES that input.
  The table was not wrong about our routing; it never asked the upstream
  question. Corrected in the SI10 row.
- No other deviation. All four ADRs, all twelve stop conditions and the
  push-forward conditions held as written.
