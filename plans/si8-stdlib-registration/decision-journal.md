# Decision Journal — si8-stdlib-registration

Append one row per non-trivial judgment call. "Non-trivial" means: a reasonable
developer might have chosen differently.

Also log here: quality-gate results per batch, any brief line-number correction,
every measurement the brief asks you to record, and every STOP with its full
output.

**T3 must record the `RenderOptions` field name it chose — T4 reads it from
here.**

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | planning | Mission brief created | SI8 raised by the maintainer 2026-07-30; planned 2026-07-31 after SI9 closed |
| 2026-07-31 | planning | **The SI8 row's central claim was checked and found misleading** | It said the async fetch "must happen in a `prefetchIncludes`-style pass", which reads as "build that pass". `prefetchIncludes` already exists (`src/core/include-resolver.ts`, used by `render()`); what it lacked was stdlib awareness. Reading it literally would have produced a duplicate pass — ADR-4 rejects exactly that |
| 2026-07-31 | planning | **A live defect was found while planning and became T1** | Probe: `render()` + `withStdlib` returns an error card telling the caller to pass `options.includeStore` — which they did. Mechanism: `prefetchInner` gates stdlib targets on exact-key `store.has(url)` and never consults `getPumlResource`. `renderSync` is unaffected only because it skips prefetch, and all 10 in-repo `withStdlib` call sites feed `renderSync`, which is why no test caught it |
| 2026-07-31 | planning | ADR-2's deferral is measured, not asserted | Published payloads: `@plantuml-ts/stdlib` 1.8 MB (largest bundle `bootstrap.js` 1.06 MB), `awslib14.js` 7.93 MB, `tupadr3.js` 19.54 MB. Per-bundle laziness fully solves the first and makes the other two opt-in; it cannot shrink a single 19.54 MB bundle. Splitting needs a new generated package shape (6,849 tupadr3 files; 29,101 across assets) — a packaging mission, not a seam mission |
| 2026-07-31 | planning | ADR-4 rests on a verified fact about real bundles | `assets/stdlib/c4/C4_Context.puml` contains `!include <C4/C4>` — stdlib bundle files include each other in the same `<bundle/thing>` form, so resolved text must re-enter the transitive walk. A sibling pass would have to duplicate the walk, cycle guard and over-fetch policy |
| 2026-07-31 | planning | The fixture work was found to be independent of the registry | The golden harness runs in Node under vitest and can use `buildStdlibAssetsStore()` exactly as the census does, so T5/T6 need no registry. That turned a 7-deep chain into 5 batches with two parallel pairs |
| 2026-07-31 | planning | Seed risk on the sprite revert was bounded before scoping T6 | Changing `in.puml` changes the raw-source seed, which feeds uid/gradient/shadow ids. Checked: the three goldens contain no gradients, no filters and no `url(#…)`, and their ids are sequential `ent0001…` — so the seed is not observable in these three |
| 2026-07-31 | T1 | **The fix needed a SECOND half the task file did not name: `BackedIncludeStore.getPumlResource`** | Tracing `prefetchIncludes`' callers two levels (README method rule 1) showed `render()` passes the `BackedIncludeStore` prefetch builds straight into `buildBlockUmls` — it is the interpreter's store, not prefetch scratch space. It extends `MapIncludeStore`, which declares no `getPumlResource`, so widening `prefetchInner`'s accept condition alone would have moved the identical `StdlibNotBundledError` from prefetch to `IncludeExecutor#load` one layer later, with acceptance criterion 1 still failing. Both halves are in the commit; both are inside the declared write-set |
| 2026-07-31 | T1 | Criterion 3 (`renderSync` byte-identical) was verified empirically, not argued | `git stash` of `src/core/include-resolver.ts`, rendered the same source pre- and post-change, `cmp` — byte-identical. Additionally pinned in-suite as `render(...) === renderSync(...)`, which was confirmed true for this input before being asserted |
| 2026-07-31 | T1 | `#lizard forgives` added to `fetchInclude` — a function this task does not otherwise touch | The complexity hook blocked the first edit to this file on a **pre-existing** violation (36 NLOC / 9 CCN) that only surfaced because T1 edits a different function in the same file. README push-forward condition ("complexity-hook friction") covers this; `complexity-ignore` was NOT edited. The comment states the pre-existing status and why the branches are irreducible (four distinct remediation messages: CSP / CORS / HTTP / generic) |
| 2026-07-31 | T1 | Batch 1 quality gates: **all green** | `npm test` 457 files / 11180 tests passed (includes the 389 svg goldens and the 54-fixture svg-description ratchet); `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run build` exit 0; `measure-description-size-deltas` **320/351 (91.2%), widened 0**, improved 5. `git status` after the commit shows only the two write-set files |
| 2026-07-31 | T2 | **The module-unwrap shape in the task file does not survive the real generated packages** | T2 said "a named export matching the bundle (`{ bootstrap }`)". Verified against `packages/`: `stdlib/generated/bootstrap.js` emits TWO bundles in one chunk — `bootstrap` (`aliasOf: 'bootstrap1.13.1'`, `files: {}`) and `bootstrap1_13_1` (concrete) — and export identifiers are mangled to valid JS, so the bundle named `bootstrap1.13.1` is exported as `bootstrap1_13_1`. Taking the export named after the bundle yields an empty alias stub. The registry therefore harvests EVERY `BundleData`-shaped export and keys by the `name` FIELD lowercased. The declared `resolve(bundle): Promise<BundleData \| undefined>` signature is UNCHANGED — only the unwrap differs, which the task file itself asked to be designed from real output |
| 2026-07-31 | T2 | Alias chains resolve without the registry knowing what an alias is — **T3 must follow this order** | `resolve('bootstrap')` returns the alias stub; the caller reads `aliasOf` and calls `resolve('bootstrap1.13.1')`, which is already cached from the same chunk (no second `import()`, no separate registration entry). Alias SEMANTICS stay in `StdlibStore.ts#resolveBundle` with its cycle guard, per T2's "must not duplicate alias resolution". Consequence T3 must respect: a bundle name is only addressable AFTER its chunk loads — speculatively loading chunks to discover names would mean loading everything to resolve one thing. Verified end-to-end against `packages/stdlib/generated/{c4,bootstrap}.js`: `<bootstrap/bootstrap>` resolves through the alias with one `import()` |
| 2026-07-31 | T2 | Batch 2 / T2 gates: **all green** | `npm test` 458 files / 11195 tests; typecheck, lint, build exit 0; size-deltas 320/351, widened 0. Two of my own first-draft test expectations were wrong (both keyed on the export identifier rather than the `name` field) and were corrected — the design was right, the tests were not |
| 2026-07-31 | T5 | The census-parity claim was false in **two** ways, not one | Beyond the missing include store, `render-fixture.ts` seeds from the RAW block source while the census seeds from `['@startuml', ...block.lines, '@enduml']` (directive-stripped, which diverges shadow/gradient/uid ids). `render-fixture.ts` is the CORRECT one — its own inline comment says so and cites `UmlSource.seed()`. Fixing the census is outside T5's write-set, so per the task's criterion 3 both deltas are now stated explicitly in the doc comment instead of the word "exactly" |
| 2026-07-31 | T5 | The assets store is built LAZILY, not on first render | `buildStdlibAssetsStore()` costs ~888 ms (measured) and walks the whole `assets/stdlib/` tree. Deferring it to the first `<bundle/thing>` lookup means fixtures with no stdlib include — every fixture before T6 — pay nothing, while still satisfying criterion 4 (built at most once). Measured: plain fixture 14 ms, first include render 1098 ms, second 203 ms. This is delta 2 against the census, which builds eagerly; same store, same contents |
| 2026-07-31 | **T5 — STOP (condition 7)** | **`oracle/goldens/svg-description/diff-baseline.json` needs updating and is outside EVERY task's write-set** | See the STOP block below the table. Awaiting maintainer input; T5's code change is complete and verified but is NOT committed, because the suite is red until the manifest is reconciled and this project requires all four gates green before a commit lands on main |

## STOP — T5, stop condition 7 (2026-07-31)

**What happened.** T5 gave the golden harness an include store. Two fixtures
recorded in `oracle/goldens/svg-description/diff-baseline.json` as
`status: "error"` now render, so
`description.diff-baseline.ratchet.test.ts`'s AC3 fails — **by design**: an
error→measurable transition "must never be silently treated as 0 diffs".

**This was predicted by the manifest itself.** Both `reason` fields name the
exact mechanism T5 closes:

> "render-fixture.ts wires no stdlib includeStore (unlike
> scripts/svg-conformance-census.ts), so `!include <bootstrap/bootstrap>`
> cannot resolve and rendering throws before any comparison runs."

**Measured this run** (`test-results/dot-cache`, `DeterministicMeasurer`):

| fixture | before | now |
|---|---|---|
| `usecase/bootstrap-0` | error (no include store) | renders, **diffCount 0** |
| `usecase/ruziru-69-xixo434` | error (same mechanism) | renders, **diffCount 0** |
| `usecase/fepuvo-06-rugi981` | error (malformed XML) | **still errors** — unchanged, unrelated mechanism |

Both reach **zero-diff against the jar oracle**. They are still NOT
promotable to `ratchet.json`: `parity.json` records `dotEqual: false` for
both, which the recorded reasons already anticipated ("ineligible
regardless").

**Full failing output.**

```
FAIL tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts
 > svg-description diff-count baseline ratchet — recorded errors
 > usecase/bootstrap-0: still errors as recorded
 > usecase/ruziru-69-xixo434: still errors as recorded

usecase/bootstrap-0: recorded as status "error" (...) but rendering/
comparison SUCCEEDED this run with diffCount=0. An error-to-measurable
transition is a real change and must never be silently treated as "0 diffs"
or skipped -- move this fixture to status "baseline" in diff-baseline.json
with a freshly measured diffCount, measuredAt, and measuredAgainstCommit.
```

Every other suite passes: 8 of 9 svg-conformance files green, including the
54-fixture description golden ratchet and the 389 class/object/state goldens.

**Why this is a STOP and not a push-forward.** `diff-baseline.json` is in no
task's write-set. T5's says "No fixture, no golden, and no `ratchet.json`
change"; T6's says explicitly "Do **not** touch `parity.json` or
`diff-baseline.json`". That is stop condition 7 exactly. It is also a pinned
oracle baseline, the category stop conditions 4–6 reserve to the maintainer.

**The fix the test itself prescribes** — move both fixtures to
`status: "baseline"`, `diffCount: 0`, `measuredAt: "2026-07-31"`,
`measuredAgainstCommit: <this commit>`, keeping a `reason` note that si8 T5
closed the harness gap. Roughly 8 changed lines in one JSON file.

**Blocked until resolved.** T5's code change is complete and verified but
uncommitted: `npm test` is red, and this project requires all four gates
green before anything lands on main.

### STOP resolved — maintainer approved the manifest update (2026-07-31)

Both fixtures moved to `status: "baseline"`, `diffCount: 0`,
`measuredAt: "2026-07-31"`, `measuredAgainstCommit: "a7b6c73"` (the T2
commit the measurement was taken against), each carrying a `reason` that
records si8 T5 as the cause and restates the `dotEqual=false` ineligibility.
Committed together with `render-fixture.ts` per the maintainer's choice.
`usecase/fepuvo-06-rugi981` untouched — still errors on its unrelated
malformed-XML mechanism, as recorded.

One further measurement, checked for attribution and found **NOT** T5's:
`usecase/jecici-56-bimu826` logs `[IMPROVED] 143 -> 133`. Re-measured with
T5 stashed and it falls to 133 there too, so it is pre-existing drift, not
a consequence of wiring the include store. Recorded rather than silently
banked as a T5 improvement.

Batch 2 gates after the fix: `npm test` 458 files / 11195 tests, typecheck /
lint / build exit 0, size-deltas 320/351 widened 0, all 9 svg-conformance
suites green (522 tests).

## Batch 3

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | **T3** | **The `RenderOptions` field is named `stdlibRegistry`** — T4 reads this row | Matches the factory (`stdlibRegistry()`) and sits beside `includeStore` / `fetcher`. Optional, so reverting cannot break a caller that never set it |
| 2026-07-31 | T3 | Bundles are folded into the store under the **exact include key** | `IncludeExecutor#load` tries `store.get(what)` FIRST and consults `getPumlResource` last. Folding in at the exact key means this walk's copy wins over a base that might resolve the same name differently, and it is the channel the interpreter reaches soonest. Asserted directly in the test file, not just via `render()` — a bundle folded in where neither channel looks is the silent-failure shape si8 exists to remove |
| 2026-07-31 | T3 | `prefetchInner`'s constant state was grouped into a `PrefetchWalk` record | The registry would have been a 6th parameter, over the complexity hook's cap. `fetcher`/`store`/`registry` never vary across the recursion while `source`/`visited`/`chain` do, so grouping is the honest split rather than a `#lizard forgives`. Chosen over a forgive because the parameter count reflected a real grouping |
| 2026-07-31 | T3 | `render`/`renderAll` share a `prefetchFor` helper — driven by the 500-line cap | Threading a 4th argument pushed `src/index.ts` to 504 lines. The push-forward condition allows a ~500-line split, but a new module would be outside T3's write-set; extracting the two identical call sites into one helper removed the duplication AND the 4 lines. `src/index.ts` is at exactly 500 |
| 2026-07-31 | T3 | Transitivity was verified against the REAL bundle, not a mirror of its shape | `prefetchIncludes` over `!include <C4/C4_Context>` with the actual `packages/stdlib/generated/c4.js`: the 21,410-char C4_Context folds in, and the 67,422-char `<C4/C4>` its first line names is prefetched by the same walk |
| 2026-07-31 | **T6** | **The brief's archimate include target was wrong** | It said `!include <archimate/archimate>`. That resolves to `Archimate.puml`, which declares **0 sprites** — they live in a sibling, `ArchimateSprites.puml` (61 sprites, including the `$application-component-svg` this fixture draws). Measured through the assets store before writing the fixture. Followed the code per the push-forward condition; fixture uses `<archimate/ArchimateSprites>` |
| 2026-07-31 | **T6** | **The brief's capture command was wrong: `-nometadata` must NOT be passed** | The committed goldens carry a `<?plantuml-src …?>` PI, which `-nometadata` strips. Caught by validating the command against the EXISTING goldens first: with `-nometadata` the capture differed at char 7,204; without it, all three reproduced byte-for-byte from their unmodified inputs. Verified before re-capturing anything, so no golden was ever written from an unvalidated command |
| 2026-07-31 | T6 | **All three fixtures returned to zero-diff — none stayed inlined** | Measured via `renderFixture` + `DeterministicMeasurer` + `compareSvg(…, 'deterministic')`, the ratchet's own path: `sprite-svg-bootstrap-0` 0 diffs / 6 `<path>` / 0 `<image>`; `sprite-svg-archimate-0` 0 diffs / 2 / 0; `sprite-svg-multiline-0` 0 diffs / 4 / 0 — reproducing the SI9 README table exactly. The predecessor's byte-identity claim was re-verified per fixture rather than cited: each new golden is identical to its predecessor apart from the `<?plantuml-src?>` blob and a shifted `data-source-line` (the include replaces 8 inline lines), both of which the comparator strips |
| 2026-07-31 | Batch 3 | Gates: **all green** | `npm test` 459 files / 11210 tests; typecheck, lint, build exit 0; size-deltas 320/351 widened 0; all 9 svg-conformance suites green (522 tests) including the 54-fixture ratchet with the three sprite fixtures still pinned, and the 389 class/object/state goldens |

## Batch 4

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | T4 | The warm-up is named **`prepareIncludeStore`** and lives in `include-resolver.ts`, re-exported from `index.ts` | It wraps `prefetchIncludes` and belongs beside it; putting it there also kept `src/index.ts` under the 500-line cap without splitting a module outside any write-set. It takes an `IncludeWarmupOptions` (not `RenderOptions`) to avoid a circular import — `RenderOptions` satisfies it structurally, so a caller passes theirs straight in. `render`/`renderAll` now call it too, so the published warm-up and the internal prefetch cannot drift |
| 2026-07-31 | T4 | `registrySupplied` is an **optional** third constructor parameter on `StdlibNotBundledError` | The message must branch on whether a registry was in play, but `IncludeExecutor#load` also constructs this error and that file is in **no** task's write-set. Defaulting to `false` keeps that call site compiling untouched and gives it the correct message (the sync path never has a registry). A required parameter would have forced an edit outside every write-set — stop condition 7 — for no behavioral gain |
| 2026-07-31 | T4 | **Two files outside T4's declared write-set were edited** — logged, not a STOP | `src/core/include-resolver.ts` (hosts the warm-up, passes the new flag) is in T1's and T3's write-sets; `tests/unit/stdlib-resolution.test.ts` (pins the error text byte-for-byte, so the rewrite required updating it) is in T1's. Stop condition 7 fires only when a file is outside its own write-set AND outside every other task's; neither is. Found by grepping for assertions on the current message text before changing it, per the task's method rule 1 |
| 2026-07-31 | T4 | Criterion 5 was verified in the **emitted** `.d.ts`, not assumed | `dist/plantuml-ts.d.ts` (the `types` entry; there is no `dist/index.d.ts`) carries `prepareIncludeStore`, `stdlibRegistry`, `StdlibChunkLoadError` and `IncludeWarmupOptions` with their doc comments — so the three-failure-mode guidance that is this mission's observability deliverable actually reaches consumers |
| 2026-07-31 | Batch 4 | Gates: **all green** | `npm test` 459 files / 11219 tests; typecheck, lint, build exit 0; size-deltas 320/351 widened 0. Criterion 4 (the ten in-repo `withStdlib` call sites feeding measurement gates) holds: the size-delta script, census, dot-sync-report and parity ratchet all still build stores the old way and none moved |
