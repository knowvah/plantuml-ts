# Mission: si8-stdlib-registration

**Status:** DONE 2026-07-31 · **Branch:** `main` (maintainer practice)
**Created:** 2026-07-31 · **Predecessor:** `si9-authored-fixture-registration` (closed)

## Objective

SI5b delivered stdlib **resolution**: `stdlibStore(...bundles)` + `withStdlib()`
resolve `!include <bundle/thing>` today. It did not deliver **registration** —
the only store builder is `scripts/stdlib-assets-store.ts`, which imports
`node:fs` and so cannot ship to a browser. A browser consumer must hand-assemble
`BundleData[]`, eagerly, with no discovery and no lazy loading. This mission
supplies a browser-safe registration seam with per-bundle demand loading, fixes
a live defect found while planning it, and reverts the three sprite goldens to
the `!include` form a user actually writes.

## The defect found while planning (verified 2026-07-31 — do not re-derive)

`prefetchInner` (`src/core/include-resolver.ts`) gates stdlib targets on
`store.has(url)` — an **exact-key** lookup — and never consults
`IncludeStore#getPumlResource`, which is the entire point of `withStdlib`.

Probe result: `render()` + `withStdlib` returns an error card reading
*"plantuml-ts bundles no PlantUML stdlib… pass options.includeStore"* — to a
caller who passed `options.includeStore` correctly. `renderSync` works only
because it skips prefetch. **The async API is unusable with stdlib bundles
today.** All 10 `withStdlib` call sites in the repo feed `renderSync`; not one
feeds `render()`, which is why no test caught it.

That is [ADR-1](decisions.md#adr-1) and it is T1, ahead of the registry work.

## The numbers that shaped the design

Published package payloads — what a browser downloads:

| package | bundles | largest single bundle |
|---|---|---|
| `@plantuml-ts/stdlib` | 5 | `bootstrap.js` **1.06 MB** (1.8 MB total) |
| `@plantuml-ts/stdlib-aws` | 2 | `awslib14.js` **7.93 MB** |
| `@plantuml-ts/stdlib-tupadr3` | 1 | `tupadr3.js` **19.54 MB** |

Per-bundle laziness fully solves the first and makes the other two opt-in
instead of eager. It does **not** shrink them — that is
[ADR-2](decisions.md#adr-2)'s deliberate, measured deferral.

Second decisive fact: stdlib bundle files `!include` **each other**
(`assets/stdlib/c4/C4_Context.puml` contains `!include <C4/C4>`), so resolved
bundle text must re-enter the transitive walk — [ADR-4](decisions.md#adr-4).

## Quality gates

| Command | Pass | On fail |
|---|---|---|
| `npm test` | exit 0 | fix_and_rerun |
| `npm run typecheck` | exit 0 | fix_and_rerun |
| `npm run lint` | exit 0 | fix_and_rerun |
| `npm run build` | exit 0 | fix_and_rerun |
| `npx tsx scripts/measure-description-size-deltas.ts` | 320/351, widened 0 | stop |
| 389 svg-class/object/state goldens | byte-identical | stop |
| svg-description ratchet (54 fixtures) | all zero-diff | stop |

The ratchet gate is **new since SI9** and this mission can break it: the three
sprite fixtures are now pinned. See [ADR-6](decisions.md#adr-6).

## Batches

| Batch | Tasks | Theme | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 | Prefetch consults the stdlib seam | [x] |
| [2](batch-2/overview.md) | T2 ∥ T5 | Registry module; golden harness wiring | [x] |
| [3](batch-3/overview.md) | T3 ∥ T6 | Registry into the walk; sprite revert | [x] |
| [4](batch-4/overview.md) | T4 | Sync warm-up + error rewrite | [x] |
| [5](batch-5/overview.md) | T7 | Close the mission | [x] |

Batches 2 and 3 contain genuinely independent pairs — the golden harness runs
in Node under vitest and can use the existing `buildStdlibAssetsStore()`, so
the fixture work (T5, T6) needs **no registry at all**.

## Documents

- [`decisions.md`](decisions.md) — the six approved ADRs. **Read before any
  task.** ADR-2 and ADR-6 are the ones with teeth.
- [`decision-journal.md`](decision-journal.md) — appended during execution
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — the include seam, sync vs async
- [`diagrams/component-map.md`](diagrams/component-map.md) — what is touched

## Stop conditions

**Architectural — these protect constraints that outrank the mission**

1. A Node built-in (`fs`, `path`, `os`, `child_process`), `process.env`, or
   `require()` reaches `src/`. `src/` must stay browser-safe (CLAUDE.md).
2. `renderSync` would become async, or its signature change. It is public API
   and synchronous by design.
3. An ADR in `decisions.md` is contradicted.

**Oracle integrity**

4. Editing a `golden.svg` to make a test pass. Re-capturing a golden from the
   pinned jar **after its `in.puml` legitimately changed** is NOT this — see
   [ADR-6](decisions.md#adr-6) — but editing one to close a diff is a STOP.
5. Re-pinning `oracle/goldens/description/size-backlog.json`.
6. A ratcheted fixture drops below zero-diff and the proposed fix is to unpin
   it. A fixture that will not come back stays inlined, measured and recorded.

**Scope**

7. A task needs a file outside its write-set AND outside every other task's.
8. Two consecutive gate failures on the same check, or the same location
   changed 3× without resolving it.

## Push-forward conditions

- Internal structure, naming and helpers inside the new modules.
- Complexity-hook friction: `#lizard forgives` near a large function's END, or
  a ~500-line split. Do NOT edit `complexity-ignore`.
- Extra test cases beyond the stated acceptance criteria.
- **A line or path citation here is off.** Follow the code, note the correction
  in the journal, continue. A wrong line number is not a wrong mechanism.
- A task is simpler than scoped — log why in the journal, then proceed.

## Two method rules — spec, not preamble

Both were earned at cost on this mission line, and this brief is itself an
instance of the second.

1. **Trace dependency cascades TWO levels** before ruling on scope.
2. **Verify any "already fixed / already wired / it will just work" claim
   against the CURRENT call graph.** The SI8 row in `planning/mission-index.md`
   said the async fetch "must happen in a `prefetchIncludes`-style pass" — that
   pass already exists; what it lacked was stdlib awareness. Reading it as
   "build the pass" would have produced the wrong design.

## Deviation from the `/plan-mission` template

`plans/` is **tracked** in this project, not gitignored. The predecessor's
brief is on `main` and `planning/mission-index.md` links into it. Established
practice wins.

---

# Mission summary — DONE 2026-07-31

**7 of 7 tasks completed across 5 batches.** 10 commits on `main`.

## What shipped

| Task | Outcome |
|---|---|
| T1 | `prefetchInner` consults `getPumlResource`; **a shipped defect fixed** |
| T2 | `stdlibRegistry()` — per-bundle lazy registration via `import()` thunks |
| T5 | `render-fixture.ts` wires an include store; goldens can use `!include` |
| T3 | Registry wired into the transitive prefetch walk, resolved text recurses |
| T6 | All three sprite fixtures reverted to `!include`, **all zero-diff** |
| T4 | `prepareIncludeStore()` warm-up, public exports, error rewrite |
| T7 | This close-out |

## Gate results (final)

| Gate | Result |
|---|---|
| `npm test` | **459 files / 11,219 tests** pass (was 457 / 11,180) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; all four new symbols in `dist/plantuml-ts.d.ts` |
| `measure-description-size-deltas` | **320/351 (91.2%), widened 0** — unmoved |
| 389 svg-class/object/state goldens | byte-identical |
| svg-description ratchet (54) | all zero-diff, three sprite fixtures still pinned |

## Decisions flagged for review

1. **One STOP was raised and resolved by maintainer ruling** (T5). Two fixtures
   recorded `status: "error"` in `oracle/goldens/svg-description/diff-baseline.json`
   began rendering — at **0 diffs** — because T5 closed the exact harness gap
   their `reason` fields named. That manifest sits outside every task's
   write-set (stop condition 7). Approved and moved to `status: "baseline"`.
   Neither is ratchet-promotable (`parity.json` `dotEqual: false`).
2. **Two brief citations were wrong and were corrected by following the code**,
   both in T6, both caught before anything was written:
   - `<archimate/archimate>` declares **no sprites** (they are in
     `ArchimateSprites.puml`, 61 of them).
   - The capture command must **not** pass `-nometadata` — it strips the
     `<?plantuml-src?>` PI the goldens carry. Caught by validating the command
     against the existing goldens first.
3. **T2's module-unwrap contract did not survive the real packages.** The
   declared `resolve()` signature is unchanged, but "the export named after the
   bundle" yields an empty alias stub for `bootstrap`. See the journal.
4. **T4 edited two files outside its declared write-set**, both inside other
   tasks' write-sets (not a stop condition): `include-resolver.ts` (T1/T3) and
   `stdlib-resolution.test.ts` (T1, which pins the error text byte-for-byte).

## Known issues and follow-ups

- **Per-resource splitting did not ship**, deliberately and on measurement
  (ADR-2). Now tracked as **SI11** in `planning/mission-index.md` with the
  numbers and the two undecided options. A `tupadr3` consumer still pays
  19.54 MB on first use — opt-in now, rather than always.
- **The census still seeds from directive-stripped `block.lines`** while
  `render-fixture.ts` seeds from raw source. `render-fixture.ts` is the correct
  one; correcting `scripts/svg-conformance-census.ts` was outside every
  write-set here. Stated in `render-fixture.ts`'s doc comment rather than left
  as a false parity claim.
- `usecase/fepuvo-06-rugi981` still errors, on its unrelated malformed-XML
  mechanism — unchanged and correctly still recorded as an error.
- **SI10** (class-engine `measureUsecase` coupling) is untouched and open.

## Deviations from the brief

- **T1 needed a second half the brief did not name.** Accepting the target in
  `prefetchInner` alone fixes nothing observable: `BackedIncludeStore` — the
  store `render()` hands the interpreter — did not forward `getPumlResource`,
  so the identical error simply moved one layer later. Found by tracing
  callers two levels, which is the brief's own method rule 1.
- **`PrefetchWalk` and `prepareIncludeStore`'s placement were driven by the
  complexity gates**, not by taste: the registry would have made
  `prefetchInner` a 6-parameter function, and both `src/index.ts` and
  `include-resolver.ts` sat at the 500-line cap. Neither required splitting a
  module outside a write-set.
- No ADR was contradicted. `renderSync` remains synchronous with an unchanged
  signature; no Node built-in reached `src/`.
