# Mission: si8-stdlib-registration

**Status:** ready to execute · **Branch:** `main` (maintainer practice)
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
| [2](batch-2/overview.md) | T2 ∥ T5 | Registry module; golden harness wiring | [ ] |
| [3](batch-3/overview.md) | T3 ∥ T6 | Registry into the walk; sprite revert | [ ] |
| [4](batch-4/overview.md) | T4 | Sync warm-up + error rewrite | [ ] |
| [5](batch-5/overview.md) | T7 | Close the mission | [ ] |

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
