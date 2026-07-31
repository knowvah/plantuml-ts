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
