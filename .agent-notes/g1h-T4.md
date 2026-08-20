# G1H T4 — sequence cause census

## Observation: 88.8% of the corpus fails on ONE signature — the root `<svg>`
- **Context**: classifying all 16462 `Diff` records the shared comparator
  emits over the 1138 measurable sequence fixtures.
- **Finding**: all **1012** fixtures sitting at exactly 12 diffs share a
  single, identical set of 12 `path`s — not "about the same", literally one
  distinct path-set across all 1012:
  `svg/@background`, `svg/@contentStyleType`, `svg/@height`,
  `svg/@preserveAspectRatio`, `svg/@version`, `svg/@viewBox[2]`,
  `svg/@viewBox[3]`, `svg/@width`, `svg/@xmlns:xlink`, `svg/@zoomAndPan`,
  `svg/defs[1][childCount]`, `svg/g[1][childCount]`.
  Every one is on the root element or its two immediate children. Six are
  root attributes the jar emits and we do not; four are root
  width/height/viewBox numbers; two are child counts.
- **Impact**: The `svg/g[1][childCount]` diff is a STRUCTURAL mismatch, and
  `compareNodes` returns on those ("stop recursing into children"). So for
  those 1012 fixtures the **entire diagram body is never compared**. Their
  diff count of 12 is not a measure of body fidelity — it is the cost of
  reaching the body and stopping. Body divergence for 88.8% of the corpus is
  currently unmeasured, and closing the root-chrome gap will make counts RISE
  sharply as the comparator starts descending. That is a real risk for T2's
  ratchet, which fails on a rise: the first person to emit `xmlns:xlink` and
  friends will trip 1012 fixtures at once. It is progress, not regression,
  and the baseline should be re-measured deliberately when it happens.
- **Confidence**: High — computed by committed code
  (`sequence-diff-census.ts`), path-sets tallied over the full corpus.

## Observation: `format-units` is empty, and that is the correct result
- **Context**: D5 fixes six buckets; one of them found nothing.
- **Finding**: `format-units` = **0** across all 16462 diffs. No pair of
  values in the corpus is numerically equal modulo a CSS unit suffix, and no
  pair differs only by letter case. This matches D2's own note: our unitless
  fractional `width` vs the jar's `166px` does NOT surface as a unit
  mismatch, because `width` is in `NUMERIC_ATTRS` and `parseFloat("166px")`
  is `166`, so it is compared numerically and lands in `geometry`.
- **Impact**: The bucket is implemented and pinned by synthetic-`Diff` tests
  regardless. A future agent will be tempted to widen its predicate to make
  it non-zero — that is fitting, and forbidden. Zero is the measurement.
- **Confidence**: High (computed; independently re-derived from the raw diff
  dump before the classifier existed).

## Observation: `other` is 52% by design of the bucket names, not by evasion
- **Context**: `other` = 8636 / 16486.
- **Finding**: its composition is fully enumerated and dominated by two
  things, neither of which any of the other five names honestly covers:
  6824 **absent root attributes** (`contentStyleType`/`preserveAspectRatio`/
  `version`/`xmlns:xlink`/`zoomAndPan` ×1140 each, `background` ×1124, all
  `actual: ""`), and 1420 **tag substitutions** (`rect` where the jar has
  `text`, etc.). The rest: `fill` 202, text content 110, `stroke-width` 50,
  `stroke` 22, `stroke-dasharray` 5, `marker-end`/`class`/`id` 1 each.
- **Impact**: `missing-element`/`extra-element` were kept strictly about
  ELEMENTS — read off `[childCount]`, the only place the comparator counts
  nodes. Folding absent *attributes* into `missing-element` would drop
  `other` to ~11% and make the census read far better while mislabelling
  6824 records. A positional comparator also cannot say whether a tag
  substitution is an element we invented or one we skipped, so it is not
  guessed at either. If a later mission wants an attribute-presence
  dimension, that is a second axis on the same records, not a seventh bucket.
- **Confidence**: High (composition summed to 8624 of the pre-restore 16462
  exactly, matching the classifier's own total; the +24 from the two restored
  fixtures lands 12/12 on the same plateau paths — see the seam note below).

## Observation: the census is a CLI, not a suite test, for a measured reason
- **Context**: acceptance asks for byte-identical output on a re-run.
- **Finding**: a full census pass costs **~9-11 s** for 1138 fixtures.
  Running it twice inside `npm test` would add ~20 s to a ~56 s suite and
  break the 60.3 s ceiling. So generation lives in a `/* v8 ignore */` CLI
  block (same pattern as `compare.ts`'s), and the suite pins determinism over
  a 12-fixture REAL-corpus slice plus reproducibility of the committed
  artifact on that slice. The full-corpus double run was verified out of
  band: two consecutive regenerations both hash to
  `9950e499d6c2b981c3fe12217a362cf96a96d1887342f3e798f19ddc1588adfb`.
- **Impact**: `diff-census.json` deliberately carries no timestamp and no
  commit sha — either would break byte-identity. Regenerate with
  `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`.
- **Confidence**: High (both hashes captured from `shasum -a 256`).

## Observation: T2's Spotlight confound reproduced exactly
- **Context**: measuring the `npm test` wall clock with two sibling agents
  running.
- **Finding**: first run read load1 **50.25** with `corespotlightd` at 164%
  and `mds_stores` at 45% -> vitest Duration 59.70 s / wrapped 60.72 s, i.e.
  apparently AT the ceiling. Polling to spotlight 0% / load1 ~9 and re-running
  twice gave 55.96 s and 56.35 s (wrapped 56.95 s / 57.36 s).
- **Impact**: the 3.7 s apparent regression was entirely load. T2's note
  predicted this; treat any wall clock taken under load1 > ~12 in this repo
  as unusable. T4's own additions cost ~0.5 s (39 tests, 127 ms of test time).
- **Confidence**: High (three runs, two clocks, load captured each time).

## Observation: the census must render with the SAME include store as the gate
- **Context**: T2 re-pinned `diff-baseline.json` after wiring the vendored
  stdlib include store into the ratchet (T5's `svg-conformance-census.ts:168,
  234` had it; the ratchet did not). Baseline went 1138+3 -> **1140+1**.
  Regenerating the census changed nothing: it still emitted 1138+3.
- **Finding**: mechanism, not mystery. `censusForFixture` called
  `renderFixtureSequence(markup, new DeterministicMeasurer())` with **no third
  `options` argument**, so `buildBlockUmls` resolved
  `!include <tupadr3/common.puml>` and `!include <logos/centos>` against an
  empty `IncludeStore` and threw; both fixtures were captured as error
  outcomes and never reached the classifier. Ruled out: a stale baseline read
  (re-read at 1140/1 that run), caching (two regenerations from disk), and
  classifier behaviour (neither fixture reaches it). Fixed at the origin by
  mirroring the ratchet's `sequenceIncludeStore()` seam into this module.
- **Impact**: the general rule this is the third instance of — **every
  surface that renders the sequence corpus must share one render
  configuration**, or the surfaces measure different populations and cannot
  be cross-checked. There are now three such surfaces (the ratchet, T5's
  census script, this cause census), each carrying its OWN duplicated copy of
  the seam because `render-fixture.ts#fixtureIncludeStore` is private. Three
  copies of a correctness-critical constant is a latent divergence; a
  follow-on should export it once from a shared test helper. Do not let a
  fourth copy be written.
- **Confidence**: High (mechanism traced to the missing argument, fix
  verified by the population going 1138+3 -> 1140+1 in one step).

## Observation: the 2 restored fixtures land exactly on the plateau
- **Context**: checking whether the stdlib include path produces a different
  divergence shape, as the orchestrator asked.
- **Finding**: it does not. `nereka-67-deco609` and `tuzaga-87-gene496` each
  diff at 12 with buckets `{missing-element 1, extra-element 1, geometry 4,
  other 6}` — the 834-strong dominant plateau signature — and their sorted
  diff PATH sets are byte-for-byte the shared 12-path root-chrome set, not
  merely the same shape. Resolving a stdlib include changes what the diagram
  contains, and changes nothing about where we diverge from the jar, because
  comparison still halts at `svg/g[1][childCount]` before reaching any of it.
  The plateau is now **1012 / 1140 fixtures (88.8%)** — the share is
  unchanged.
- **Confidence**: High (paths extracted directly from `compareSvg` output for
  both fixtures and compared against the plateau set).
