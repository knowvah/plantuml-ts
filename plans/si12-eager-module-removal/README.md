# Mission: si12-eager-module-removal

**Status:** ready to execute · **Branch:** `main` (maintainer practice)
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
| [4](batch-4/overview.md) | T7 | Close the mission | [ ] |

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
