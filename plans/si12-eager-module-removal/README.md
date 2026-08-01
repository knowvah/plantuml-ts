# Mission: si12-eager-module-removal

**Status:** DONE 2026-08-01 · **Branch:** `main` (maintainer practice)
**Created:** 2026-08-01 · **Predecessors:** SI11a, SI11b (both closed)

## Objective

`@knowvah/plantuml-stdlib-aws` and `-tupadr3` ship each bundle's content
**twice** — an eager inlined `BundleData` module and the raw `.puml` assets —
and no consumer uses both. This mission stops emitting the eager half for
those two packages only. `@knowvah/plantuml-stdlib` keeps its eager path.

## The numbers that shaped the decision (measured 2026-08-01 — do not re-derive)

| package | unpacked | eager module | remote manifest | assets | target |
|---|---|---|---|---|---|
| `plantuml-stdlib` | 2.9 MB | 1.8 MB | — | 1.1 MB | **unchanged** |
| `plantuml-stdlib-aws` | 16.7 MB | 8.4 MB | ~0.07 MB | 8.2 MB | **8.3 MB** |
| `plantuml-stdlib-tupadr3` | 40.8 MB | **20.49 MB** | **0.43 MB** | 19.9 MB | **20.3 MB** |

A remote consumer installs 40.8 MB to use a 0.43 MB manifest and then fetches
content from a CDN. **Assets cannot be the half that goes** —
`docs/stdlib-remote.md`'s pinned-CDN recipe points `baseUrl` straight at
`.../plantuml-stdlib-tupadr3@<v>/assets/tupadr3/`, so jsDelivr serves them out
of the published tarball.

`plantuml-stdlib` keeps eager because at 2.9 MB it is not the problem, and it
carries C4/archimate/bootstrap — the bundles most likely to be wanted offline.

## Quality gates

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx jiti scripts/vendor-stdlib.ts --verify` | 34,587 files verbatim | **stop** |
| `npx jiti scripts/measure-description-size-deltas.ts` | 320/351, widened 0 | stop |
| 389 svg-class/object/state goldens | byte-identical | stop |
| svg-description ratchet (54 fixtures) | all zero-diff | stop |

Baseline at mission start: **468 test files / 11,317 tests**, CI green in
~4 min against a 10 min soft budget.

**`jiti`, not `tsx`** — `tsx` is not a dependency of this repo; `npx tsx`
silently fetches an unpinned copy. CI uses `jiti` and so should you.

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 | Generator stops emitting eager modules | [x] |
| [2](batch-2/overview.md) | T2 ∥ T3 ∥ T4 ∥ T5 | Consumers: stdlib-all, manifests, tests, measurement | [x] |
| [5](batch-5/overview.md) | T8 | Close the cold-tree asset race (added mid-mission) | [x] |
| [3](batch-3/overview.md) | T6 | Docs | [x] |
| [4](batch-4/overview.md) | T7 | Close the mission | [x] |

**Batch 5 runs before batch 3.** It was added mid-mission after batch 2's
warm-tree gates missed a cold-tree race that corrupts T5's measured figure —
the figure T6 and T7 quote. See [`batch-5/overview.md`](batch-5/overview.md).

**T1 runs alone.** The generated tree is built ONCE in vitest `globalSetup`,
so the moment the generator stops emitting eager modules every test reading
them fails. Running consumers in parallel with it would have them testing
against a tree changing underneath them.

## Documents

- [`decisions.md`](decisions.md) — the five approved ADRs. **Read before any
  task.** ADR-3 (measurement re-base) and ADR-4 (`stdlib-all`) are the two
  that change behavior beyond deletion.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — eager vs remote registration

## Stop conditions

**Standard**

1. A task needs a file outside its write-set AND outside every other task's —
   escalate, never self-approve.
2. Two consecutive gate failures on the same check, or the same location
   changed 3× without resolving it.
3. An ADR in `decisions.md` is contradicted.

**Vendored-asset and licensing integrity**

4. Any file under `assets/stdlib/` changes, or `vendor-stdlib --verify` stops
   reporting 34,587 files verbatim.
5. **`assets/` stops shipping in any package's `files`.** The one thing that
   must not break: the jsDelivr recipe resolves `baseUrl` against the
   published tarball, and per-sprite loading (SI11b) depends on it.
6. The task modifies or re-encodes `awslib14` asset content. Ceasing to
   PRODUCE a re-encoding is fine; producing a new one is the CC BY-**ND**
   hazard SI11b's ADR-2 exists for.

**Scope containment**

7. **`packages/stdlib`'s five eager modules stop being byte-identical.** They
   are out of scope; drift means the generator refactor leaked past its target.
8. T5's asset-byte baseline differs materially from the ~20.49 MB eager module
   it replaces. Same content in two encodings should be close; a large gap
   means content is missing, not re-based.

**Oracle and release integrity**

9. Editing a `golden.svg`, re-pinning `size-backlog.json` / `diff-baseline.json`,
   or a ratcheted fixture dropping below zero-diff.
10. Weakening, skipping or deleting a test to make it pass. **Lowering the size
    ceilings is REQUIRED; raising or removing one is a stop.**
11. **Publishing.** `npm publish` is maintainer-gated and out of scope.
12. A test requiring real network egress.

## Push-forward conditions

- Internal structure, naming and helpers inside the modules a task owns.
- **Complexity/line-cap friction:** `#lizard forgives` near a function's END,
  or a ~500-line split. Do NOT edit `complexity-ignore`.
- **Choosing the exact ceiling numbers.** The sketch is aws → ~10, tupadr3 →
  ~24; measure the real figure, set it with headroom, comment what it protects.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the
  correction in the journal, continue.
- A task is simpler than scoped — log why, then proceed.

## Three method rules — spec, not preamble

1. **Trace dependency cascades TWO levels** before ruling on scope.
2. **Verify any "already wired / it will just work" claim against the CURRENT
   call graph.**
3. **Capture a failing command's stderr before theorising about its cause.**

## Deviation from the `/plan-mission` template

`plans/` is **tracked** in this project, not gitignored — established
practice, and `planning/mission-index.md` links into it. `.claude/` IS
gitignored, as the template expects.

---

## Mission summary (T7, 2026-08-01)

### Tasks completed vs planned

Planned as four batches / seven tasks (T1–T7). **Executed as five batches /
eight tasks** — batch 5 (T8) was added mid-mission, not in the original
brief. All eight tasks are `[x]`:

- **Batch 1 — T1** (generator stops emitting eager modules)
- **Batch 2 — T2 ∥ T3 ∥ T4 ∥ T5** (stdlib-all re-export, package manifests,
  test updates, re-measured baseline)
- **Batch 5 — T8** (added mid-mission: closes the cold-tree asset race that
  corrupted batch 2's headline measurement)
- **Batch 3 — T6** (docs)
- **Batch 4 — T7** (this task: close the mission)

### Decisions made, and what is flagged for review

All five ADRs in `decisions.md` were applied as written; none was
contradicted or amended. Beyond the ADRs, the decision journal records:

- **Two scope escalations under stop condition 1, both maintainer-approved,
  neither self-approved:**
  1. T1 (batch 1): its generator change broke
     `tests/unit/sprite-package-files.test.ts` (an SI11b file, `spec.modules`
     narrowing, `error TS18048`) outside every SI12 task's write-set. Resolved
     by extending T4's write-set rather than opening a new task, since it is
     the identical narrowing fix T4 already makes in the sibling
     `stdlib-package-files.test.ts:241`.
  2. Batch 2 → batch 5 (T8): a cold-tree asset race corrupted T5's headline
     measurement (see "Known issues" below). Resolved by adding batch 5
     rather than reverting T4's `beforeAll` or halting.
- **Flagged for review, not actioned (per journal, both explicitly outside
  every task's write-set):**
  - T3: both `plantuml-stdlib-aws`/`-tupadr3` READMEs' opening claims
    ("packaged as `BundleData` values") were made false by T1 and were
    corrected. A **pre-existing, unrelated** README import-convention
    mismatch (`plantuml-ts` unscoped vs `@knowvah/plantuml-ts`) was left
    unfixed — cosmetic and out of scope for this mission.
  - T8: `ASSET_BEARING_PACKAGES` is a hardcoded pair rather than derived from
    `PACKAGE_SPECS.remoteModules`, because no exported "packages with a
    `copy-assets.mjs`" list exists to reuse and deriving one would have
    expanded T8's write-set into `package-specs.ts`. A reasonable developer
    might have derived it dynamically instead.

### Gate results (from `decision-journal.md`)

| Batch | `npm test` | typecheck | lint | build | Notes |
|---|---|---|---|---|---|
| 1 | `stdlib-eager-omission` 23/23; 395 svg goldens + 54-fixture ratchet zero-diff | **RED by design**, 2 errors (both `spec.modules` narrowing — one expected T4 breakage, one the escalation above) | 0 | build:stdlib 0 | `vendor-stdlib --verify` 34,587 verbatim; `packages/stdlib` byte-identical (sha256, 12/12) |
| 2 | 470 files / 11,349 tests (baseline 468/11,317; +2 files, +32 tests) | 0 | 0 | 0 | `vendor-stdlib --verify` 34,587 verbatim; size-deltas 320/351 widened 0; write-set containment exact — **warm-tree only, see Known issues** |
| 5 (T8) | 3× consecutive **cold** runs (each preceded by `rm -rf packages/*/assets`), all 470/11,349 green, baseline 19,850,300 B / 99.693% every run, plus one independent orchestrator cold run, same figures | 0 | 0 | 0 | Committed `105c1309`; `vendor-stdlib --verify` 34,587 verbatim |
| 3 (T6) | 470 files / 11,349 tests | 0 | 0 | 0 | Write-set contained to `docs/stdlib-remote.md` alone; docs moved no gate |
| 4 (T7) | **cold** run (preceded by `rm -rf packages/*/assets`): 470 files / 11,349 tests, baseline 19,850,300 B / 99.693% | 0 | 0 | 0 | Run by the orchestrator — T7's agent has no shell. `vendor-stdlib --verify` 34,587 verbatim; size-deltas 320/351 widened 0. Documentation moved no gate |

### Known issues and follow-ups

1. **Mid-mission defect, the most significant finding of the mission.**
   Batch 2's gates passed **warm** and shipped a **cold-tree worker race**
   that corrupted the mission's own headline measurement.
   `copy-assets.mjs`'s `isUpToDate()` guard is file-COUNT based and
   short-circuits only when the asset tree is already complete, so during any
   partial state a parallel vitest worker mid-copy or mid-read of
   `packages/*/assets/` had its tree `rmSync`'d out from under it by another
   worker. Cold runs read 8,195,997 / 7,399,179 / 8,315,921 B
   (99.256% / 99.176% / 99.267%) instead of the true 19,850,300 B / 99.693%.
   Caught by an **orchestrator cold-tree check**, not by batch 2's own warm
   gates. Diagnosed to that exact mechanism and fixed in the added batch 5
   (T8, commit `105c1309`); re-verified 3× cold plus one independent
   orchestrator cold run, all converging on 19,850,300 B / 99.693%. Same
   failure class as an SI11a race that `build-stdlib-globalsetup.ts`'s own
   header already documents.
2. **T3's README import-convention mismatch** in both stdlib-aws and
   stdlib-tupadr3 READMEs (`plantuml-ts` unscoped vs `@knowvah/plantuml-ts`)
   is pre-existing, unrelated to this mission's scope, and left unfixed —
   cosmetic, out of scope. A dedicated cleanup PR should fix it.
3. **T8's `ASSET_BEARING_PACKAGES`** is a hardcoded two-entry list rather than
   derived from `PACKAGE_SPECS.remoteModules`. Fine today (only two packages
   ever carry `assets/`), but will drift silently if a third remote-module
   package is added without updating this list by hand.
4. **The brief's "389 svg goldens" gate figure** (see the Quality gates table
   above) measures **395** today (312 class + 24 object + 59 state) — this is
   drift accumulated since the brief was written, not a regression; nothing
   was re-pinned to correct it.

### Deviations from the brief

- **Batch 5 (T8) was not in the original brief.** It was added mid-mission,
  maintainer-approved under stop condition 1, after the batch-2 warm-tree
  gates were found to miss the cold-tree asset race described above. It runs
  **before** batch 3 in execution order, even though it is numbered 5.
- T4's write-set was extended mid-batch-1 to cover
  `tests/unit/sprite-package-files.test.ts` (see "Decisions made" above) —
  the only write-set change from the original task specs.
- No other deviation: all five ADRs, all twelve stop conditions, and all
  five push-forward conditions in this README were exercised or held exactly
  as written; none was contradicted.

### SI10 — unchanged, still open

This mission does not touch `SI10` (retire `measureUsecase`'s class-engine
coupling in `class-layout-leaf-shapes.ts:14,27`). It remains `todo` in
`planning/mission-index.md`, exactly as it was before this mission started.
