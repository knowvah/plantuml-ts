# svg-utility conformance ratchet

Regression-proof gate for the utility factories (`PSystemBuilder.java:134-200`
single-line easter eggs, listings and the version family; mission
`utility-factories-port`), mirroring `oracle/goldens/svg-wbs/` in shape and
procedure. A fixture ratchets in once it renders byte-for-byte identical to the
jar oracle under a **deterministic** text measurer; the ratchet test then holds
it forever. See `tests/oracle/svg-conformance/utility.golden.ratchet.test.ts`.

## Population: a FIXED list, not a cache dir

The 17 rows are `UTILITY_SLUGS` (`tests/oracle/svg-conformance/
render-fixture-utility.ts`; ledger `plans/utility-factories-port/fixtures.md`),
all in `test-results/dot-cache/unknown/`. Every tool reads and writes only
those rows; the ~808 other `unknown` rows are never touched.

## Starts empty (T0b, 2026-10-13)

No utility plugin is registered (`src/index.ts`), so each row renders this
port's error banner page (or, on a path that never reaches the registry's
refusal, `src/core/dispatcher.ts`'s `ERROR_SENTINEL`, `:361-375`). Neither can
be zero-diff against a real jar render. `ratchet.json` starts at
`{ "fixtures": [] }` and `utility.golden.ratchet.test.ts` degrades to a
documented placeholder assertion in that state.

`diff-baseline.json` is the companion weighted-score baseline, seeded from a
fresh b0 measurement: all 17 rows `status: "error"` with the reason, no numeric
baseline (pinning a score against a placeholder would measure nothing).

## Authored root (T3-cov, D10)

`tests/fixtures/utility/` is a flat tree of ORIGINAL fixtures (`<slug>.puml` +
the jar's `<slug>.svg` beside it; new files carry the `cov-` prefix, the five
T1g/T1h probes keep their names) tracked by `authored-baseline.json` -- never by
`diff-baseline.json`, `ratchet.json` or the pin tools. Gates
(`utility.diff-baseline.ratchet.test.ts`, "authored" blocks): rows = the `.puml`
files on disk, disjoint from the cached `unknown` slugs; weightedScore never
rises (rendered with `surveyAssetStore()`); a nonzero row names its mechanism;
`jarError` rows are exactly the jar error pages; we error exactly where the jar
errors (2026-10-10 rule) except a `parityGap` row, which must keep reproducing
its named gap; three renders per row are byte-identical.

Render an authored oracle with `scripts/oracle-render.sh <abs dir> <abs puml>`
(absolute paths write flat). Render `license`-family rows ONE FILE PER RUN: the
GPL jar's `FlashCodeUtilsZxing#exportFlashcode` returns null when
`lock.tryLock()` fails (FlashCodeUtilsZxing.java:60, :76), so a multi-file run
draws the page 773/834/842 px high at random; single-file runs are stable.
Error-page oracles also depend on the capture minute (PSystemError.java:221-229,
see `.agent-notes/cdd5-T0e-error-page-time-decoration.md`): check a re-capture
for banner `<image>`s before trusting a score change.

Regenerate the manifest from a fresh measurement (topics and mechanisms are in
the tool; it refuses a nonzero row without a reason):

```
npx jiti plans/utility-factories-port/measurements/T3-cov/build-authored-baseline.mts <commit> [--write]
```

## No DOT-parity gate

None of these factories shells out to Graphviz; the only eligibility condition
for a pin is byte-for-byte conformance under `DeterministicMeasurer`.

## Layout

```
oracle/goldens/svg-utility/
  ratchet.json                 <- the manifest (source of truth for CI)
  diff-baseline.json           <- weighted-score baseline (see above)
  authored-baseline.json       <- authored-root baseline (tests/fixtures/utility/)
  README.md                    <- this file
  <slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- jar SVG, copied verbatim from
                                   test-results/dot-cache/unknown/<slug>/in.svg
```

## Add rule

A fixture may be added to `ratchet.json` only when it is **conformant**:
`renderFixtureUtility` (`renderSync` under the hood) with `DeterministicMeasurer`
is zero-diff (`compareSvg(ours, golden, 'deterministic').pass === true`)
against the jar's `in.svg`.

**Pinning is orchestrator-only, at batch closes.** Pin with:

```
npx jiti plans/utility-factories-port/measurements/pin-utility.mts <slug>... \
  [--repo <root>] [--goldens <dir>]
```

Per slug the tool refuses anything outside `UTILITY_SLUGS`, copies the cache's
`in.puml` and `in.svg` (renamed `golden.svg`) into `<goldens>/<slug>/`,
re-reads both copies and fails loudly unless byte-identical (a corrupt copy
aborts before `ratchet.json` changes), then appends
`{ slug, addedAt, source: "dot-cache" }`. A slug already pinned is skipped.

After every pin run the twin-row tools (both the routing and refusal gates
walk `oracle/goldens/svg-<family>/` and demand a row per golden dir):

```
npx jiti plans/utility-factories-port/measurements/repin-utility-routing.mts [--write] [--label <text>]
npx jiti plans/utility-factories-port/measurements/repin-utility-baseline.mts [--write] [--accept-rises a,b]
```

`repin-utility-routing` re-pins only `tree: dot-cache, type: unknown` rows whose
slug is in `UTILITY_SLUGS` (a re-pinned row's `reason` is dropped: it becomes
`agree` / `ok`), clones pinned twins as `tree: goldens, type: svg-utility`, and
REFUSES while any utility row still misroutes or errors on our side.
`repin-utility-routing --fix-records` is a separate mode that rewrites only the
two wrong record reasons (the HELP rows' "HelpFactory is never added" claim --
`PSystemBuilder.java:188` adds it -- and `kubuju-35-neji041`'s state-seam
copy-paste, now the `listfonts` mechanism). `repin-utility-baseline`
regenerates `diff-baseline.json` for the unpinned slugs and refuses any
weightedScore rise not named in `--accept-rises`. The same close removes the
pinned slug's `diff-baseline.json` row: the two manifests stay disjoint and
together cover the 17 slugs.

## Remove rule

Removal is **maintainer-only** (see `oracle/goldens/svg-description/README.md`).
