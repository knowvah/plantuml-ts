# Mission — Sizer/Footprint parity

Retire two scoped substitutes in favour of the upstream mechanisms this
port already has, closing two of the previous mission's four narrowings.

## Objective

`bodyenhanced-atom-seams` closed at 320/351 leaving two narrowings open,
and filed a remedy — "add declared-vs-ink and per-element-vs-default side
channels to `Sea`/`SheetBlock1`". **Planning found that remedy wrong on
both counts**, because upstream solves each problem somewhere else:

| narrowing | filed remedy (WRONG) | what upstream actually does |
|---|---|---|
| box + `<img>` | thread the diagram-default font | `AtomImg.create` **hardcodes** `UFontFactory.monospace(14)` (`AtomImg.java:106-107`) |
| usecase + sprite | add an ink channel to `AtomOps` | draws through `Footprint`, a point-collecting `UGraphic`, inside `TextBlockInEllipse` |

Upstream's `AtomImg` has no ink concept and `SheetBlock1.initMap` stacks on
plain `sea.getHeight()`. **One resolved value per atom is FAITHFUL.** The
gap was never in the creole pipeline; it was in two substitutes we built
around it.

This mission deletes both substitutes and both dead seams.

## Branch

`feat/sizer-footprint-parity` — branch BEFORE the first edit. Merge
`--no-ff` (per-task commit IDs are cited from ledgers).

## Quality gates — ALL must pass before every commit

```sh
npm run typecheck
npm test          # baseline 449 files / 11023 tests
npm run build
npm run lint      # run SEPARATELY — several minutes; chaining looks like a hang
```

Ratchets — a regression in any is a STOP:

```sh
npx tsx scripts/measure-description-size-deltas.ts    # widened 0; conformant >= 320/351
npx tsx scripts/dot-sync-report.ts component usecase class   # 262 / 90 / 708 EQUAL
npx tsx scripts/measure-class-size-deltas.ts          # 219/708, widened 0
npx vitest run tests/architecture/sizer-renderer-parity.test.ts   # green
```

Plus the SVG golden sets (svg-description 48, svg-class 310, svg-object 22,
svg-state 57) and the 22-fixture diff-count baseline (no rise).

Baseline: main @ `e7ad87ab`, **320/351 (91.2%)**, zero widened.

**CLOSED 2026-07-30.** Narrowing #3 closed; narrowing #2 single-line closed,
multi-line still guarded with a corrected diagnosis. See
`decision-journal.md` and `plans/s1l-leaf-sizing/ledger.md`.

## Success is already measured

T5 measured the cost of unguarding by experiment, then reverted. Those
numbers are this mission's acceptance criteria:

| fixture | widens by, if the guard is removed today |
|---|---|
| `jecici-56-bimu826` | **0.398264in** |
| `bootstrap-0`, `ruziru-69-xixo434` | **0.029321in** |

Done = all three route unguarded at **widened 0**.

## Batches

| # | Focus | Tasks | Status |
|---|---|---|---|
| 1 | `<img>` fallback constant + delete the font seam | T1 [x] | [x] |
| 2 | Delete the resolver ink fields (routing half → T3) | T2 [x] | [x] |
| 3 | Widen the guards, perf, close | T3 [x], T4 [x] | [x] |

Sequential. T1 and T2 have disjoint write-sets but **overlapping call
graphs** (both alter atom resolution), and that is not enough for
parallelism — a lesson the previous mission paid for.

## Index

- [decisions.md](decisions.md) — ADR-1..4
- [batch-1/overview.md](batch-1/overview.md) · [batch-2](batch-2/overview.md) · [batch-3](batch-3/overview.md)
- [diagrams/component-map.md](diagrams/component-map.md) · [data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md)

## Method constraints — inherited, earned

- **"Not ported yet" is NEVER "unreachable."** Every PlantUML diagram type
  is in scope. "No caller today" is not a reason to drop a member.
- **Verify an "already fixed" claim against the CURRENT call graph.** Three
  premises went stale exactly that way last mission.
- **A scoped substitute may already exist — check before building one.**
  This whole mission exists because two were built anyway.
- **Beware silent filters.** Planning briefly concluded `Footprint` was
  dormant because a `grep -v` exclusion hid the one line that disproved it.
  A prior mission lost hours to a zsh glob failing the same way.
- **Disjoint write-sets are necessary but NOT sufficient** — call graphs
  must be disjoint too.

## Stop conditions

- A file outside the task's write-set needs changing
- Two consecutive quality-gate failures on the same check
- An ADR here is contradicted by what the code shows
- **A seam slated for deletion turns out to have a live consumer** — that
  means ADR-1 or ADR-2's premise is wrong, and the deletion must not proceed
- Any size pin WIDENS, or any diff-count baseline RISES

## Push forward without asking

- Purely stylistic choices with no behavioural effect
- An obvious fix to a self-explanatory error
- A file split to respect the 500-line cap or CCN 10
