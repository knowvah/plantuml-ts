# T1 halt — the plan cannot satisfy its own per-task gate

**Status**: Batch 1 stopped before commit. T1's code is complete and correct;
the *plan* is what fails. Two independent defects, both measured.

## Defect A — `colors.frame` is not contained (stop condition 3)

`decisions.md` D3 and `batch-1/T1-frame-contract.md` both assert that
`theme.colors.frame` "appears only at `theme.ts:212,272,347`", and D3's
containment argument rests entirely on that claim.

Measured — `grep -rn "colors\.frame" src tests scripts` returns **7** sites:

| site | kind |
|---|---|
| `src/core/theme.ts:212` | the type member |
| `src/core/theme.ts:272` | light default (changed by T1) |
| `src/core/theme.ts:347` | dark default (changed by T1) |
| `src/diagrams/sequence/renderer.ts:243,244,314,332` | consumers — fine |
| `tests/unit/theme.test.ts:405` | relative assertion — passes either way |
| **`tests/unit/measurer.test.ts:61`** | `expect(defaultTheme.colors.frame).toBe('#999999')` |
| **`tests/unit/measurer.test.ts:136`** | `expect(darkTheme.colors.frame).toBe('#666666')` |

The last two are stale regression assertions pinning the exact values D3
deliberately corrects. They fail:

```
FAIL tests/unit/measurer.test.ts > defaultTheme > has correct frame color
FAIL tests/unit/measurer.test.ts > darkTheme  > has correct frame color
Tests  2 failed | 11636 passed | 1 todo (11639)
```

`tests/unit/measurer.test.ts` is in **no task's write-set** in this mission.
That is **stop condition 1** verbatim, and the false premise underneath D3 is
**stop condition 3** ("an architecture decision is contradicted by what the
code actually says — amend the decision first; never silently override").

## Defect B — required `FrameGeo` fields deadlock the batch order

T1's locked interface contract makes `tabText` / `tabTextWidth` / `tabWidth` /
`tabHeight` **required** on `FrameGeo`, and explicitly forbids making them
optional. Every existing construction site therefore fails to typecheck:

```
src/diagrams/sequence/sequence-layout-events.ts(176,9): TS2739  <- T5 owns
tests/unit/sequence/renderer.test.ts(716,11):          TS2739  <- T6 owns
tests/unit/sequence/renderer.test.ts(734,11):          TS2739  <- T6 owns
tests/unit/sequence/renderer.test.ts(751,11):          TS2739  <- T6 owns
```

The README's per-task gate is `npm run typecheck / pass: exit 0 /
on_fail: fix_and_rerun`. There is **no fix inside T1's write-set**:

- populating the fields is `sequence-layout-events.ts` — that is **T5**,
  two tasks later, in the next batch;
- the three test literals are `tests/unit/sequence/renderer.test.ts` — that
  is **T6**, in Batch 3.

So T1's gate cannot go green until Batch 3. Batch 1's own gate ("the four
per-task gates") is unsatisfiable as written. This is a decomposition defect:
the contract-first split (types in B1, producers in B2, consumers in B3) is
incompatible with a per-task `typecheck exit 0` gate when the new fields are
required.

## What T1 actually produced (complete, uncommitted)

`git status --porcelain` shows exactly the five declared files, nothing else:

- `src/diagrams/sequence/frame-style.ts` (new) — all 12 constants, each with
  its verified `plantuml.skin:NNN` / `ComponentRoseGroupingHeader.java:NN`
  citation, plus `groupingHeaderDisplay()`
- `src/diagrams/sequence/ast.ts` — the `FrameEvent` / `FrameGeo` additions
- `src/diagrams/sequence/scale-geo.ts` — `scaleFrame` scales the three
  lengths, passes colour tokens and text through
- `tests/unit/sequence/frame-style.test.ts` (new) — 12 tests
- `src/core/theme.ts` — both `colors.frame` defaults to `#000000`

Gates: `lint` PASS, `build` PASS, `typecheck` FAIL (4, all Defect B),
`vitest tests/unit` FAIL (2, both Defect A).

## Options for the human (each needs a decisions.md amendment)

1. **Add `tests/unit/measurer.test.ts` to T1's write-set** and update the two
   assertions to `#000000`, citing `plantuml.skin:117`. Amend D3 to record the
   real 7-site census. Closes Defect A. Minimal and self-contained.
2. For Defect B, either:
   - **(a) Move the construction sites forward** — reassign the three
     `renderer.test.ts` FrameGeo literals from T6 to T5, and accept that T1
     alone commits with `typecheck` red, restored green at the Batch 2 gate.
     No batch ends red. Requires amending the per-task gate to a per-batch one
     for Batch 1.
   - **(b) Merge T1 into T5** as one "interface + all its call sites" unit
     (`rules/parallelism.md`), collapsing Batches 1 and 2. Keeps every gate
     per-task, at the cost of a larger task and losing T2/T3/T4's clean
     dependency on a landed T1.
   - **(c) Relax the contract** to optional fields with a documented
     `tabText ?? ''` fallback. Rejected here because T1's brief forbids it and
     it weakens the type contract T4/T6 rely on — listed only for completeness.

**Recommendation: 1 + 2(a).** It is the smallest change that keeps the locked
contract intact, keeps T2–T5 parallel, and leaves no batch red.

Nothing has been committed. The working tree holds T1's five files.
