# Mission: sequence-oracle-harness (G-1 prerequisite)

**Build the measurement surface that must exist before any sequence
greenfield rebuild can be scored.** Not the rebuild. Every state/class mission
(SI28–SI32) was gated by DOT-parity ratchets plus `render-manifest` /
`harness-diff` / `manifest-diff`. **None of that transfers to sequence**, and
the DOT ratchet cannot be made to: the jar emits no DOT for sequence at all.
Today there is no `test-results/dot-cache/sequence/` and no
`oracle/goldens/svg-sequence/`; sequence is verified by 4 unit-test files and
one integration test. A greenfield rebuild against that is unscoreable.

**Branch:** `feat/sequence-oracle-harness` (from `main` at or after `c7751ee1`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The exit

A future G-1 rebuild mission has the same *class* of gate SI32 had: a
committed jar-oracle corpus, a monotone-improvement ratchet that fails on
regression, and a reproducible account of where the port diverges.

- `test-results/dot-cache/sequence/` exists, committed, one entry per fixture
  the jar renders.
- `oracle/goldens/svg-sequence/diff-baseline.json` pins a starting diff count
  per fixture; the ratchet FAILS on any rise.
- `oracle/goldens/svg-sequence/ratchet.json` exists and is **empty** — the
  promotion path is built and tested, and admits nothing.
- `oracle/goldens/svg-sequence/diff-census.json` classifies every diff into
  fixed buckets, computed by committed code, reproducible byte-for-byte.
- `scripts/svg-conformance-census.ts` and `oracle-freshness.test.ts` know
  about sequence.

**Explicit non-goals.** Admitting any fixture to the golden ratchet. Fixing
any rendering defect. Touching `src/`.

## Why this is an EXTENSION, not a new harness

The repo already has a DOT-less SVG-conformance ratchet family. `json`, `yaml`
and `hcl` are already in it, and `json.golden.ratchet.test.ts`'s own doc
comment states the reason (ADR-3): *"the jar emits no DOT for this family, so
the DOT-equal eligibility gate the siblings use cannot be computed."*
Sequence's situation is identical. `compare.ts` and `normalize.ts` are
engine-agnostic — `compareSvg(actual, reference, toleranceClass,
toleranceOverride?)` (`compare.ts:385`) and `normalizeSvg(svgString)`
(`normalize.ts:231`) take plain strings, and normalize's three plantuml
adaptations (style resolution, `data-*` stripping, comment/PI skipping) are
jar-wide, not per-engine. **Writing a second comparator is stop 4.**

See [decisions.md](decisions.md) D1–D7.

## Two interactions a naive plan would miss

**1. Capturing the corpus breaks the standing manifest gate.**
`manifest-diff.py:38` computes `moved` over `set(base) | set(now)` where
`base.get(k) != now.get(k)`. An ADDED key differs from its absent baseline
value, so all ~473 new sequence fixtures land in `unexpected` → exit 1. T0
therefore **re-pins `test-results/render-manifest-baseline.json` in its own
commit**; that is this mission's one intentional baseline mutation. Upside:
the manifest grows ~2017 → ~2490 and sequence rendering becomes
manifest-visible for the first time.

**2. The `npm test` ceiling must be renegotiated, not squeezed.**
Oracle suites run inside `npm test`. The suite is at ~57 s vitest-duration
against a 60.3 s stop-11 ceiling (~3 s margin), and T2 adds a suite that
renders and compares ~473 fixtures. **T2 measures and records a new ceiling**
(see its task file). Trimming coverage to fit the old one is forbidden.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Capture the corpus · build the render helper | T0, T1 | [x] |
| [1](batch-1/overview.md) | Diff-baseline ratchet, pinned | T2 | [x] |
| [2](batch-2/overview.md) | Golden ratchet · cause census · cross-type wiring | T3, T4, T5 | [x] |
| [3](batch-3/overview.md) | Close-out | T6 | [x] |

Batch 0 is parallel (disjoint write-sets); Batch 2 is parallel. T0 is the long
pole — ~473 jar renders.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: git diff --name-only -- src/
  pass: EMPTY. Any output is stop 3.
  on_fail: stop
- command: npx vitest run tests/oracle/state-dot-parity.test.ts tests/oracle/class-dot-parity.test.ts tests/oracle/description-parity.ratchet.test.ts tests/oracle/object-dot-parity.test.ts tests/architecture/layering.test.ts tests/architecture/catalog.test.ts
  pass: state 270 · class 721 · description 357 · object 80; layering green with KNOWN_DEBT []; catalog not drifted
  on_fail: stop
- command: npx jiti scripts/render-manifest.ts --out /tmp/g1h-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/g1h-manifest.json plans/sequence-oracle-harness/expected-moves.txt
  pass: "0 unexpected". After T0 only, the ~473 sequence ADDITIONS are expected
        and the baseline is re-pinned in T0's own commit.
  on_fail: stop
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only the batch's declared write-set (+ shared files below)
  on_fail: stop
```

Wall-clock: report `npm test` each batch. Ceiling is **60.3 s** — measured and
confirmed by T2, not inherited. Exceeding it is stop 11.

*Method (T2, 2026-08-20).* Four consecutive `/usr/bin/time -p npm test` runs on
an idle tree at commit `35a7e06e`, after waiting out the Spotlight reindex of
T0's 1141 new corpus files (`suggestd` + `corespotlightd` were at ~120% CPU,
load1 11.7; polled down to load1 3.8 before the first run — measuring through
that spike is what made T1's 61.5–62.6 s reading unusable). All four green,
15959 tests, coverage 96.52 / 90.47 / 96.94.

| | run 1 | run 2 | run 3 | run 4 |
|---|---|---|---|---|
| vitest `Duration` | 55.42 s | 55.73 s | 55.82 s | 55.56 s |
| wrapped `real` | 56.44 s | 56.75 s | 56.80 s | 56.54 s |

Range 55.42–55.82 s vitest `Duration` (spread 0.40 s); **4.5 s headroom** from
the worst run to the 60.3 s ceiling. The ceiling is therefore **unchanged**:
T2's suite adds 1150 tests but only ~1.7 s of test time, and the whole-run wall
clock did not rise measurably against the 56.15 s pre-T2 idle baseline — the
new file packs into an existing worker rather than extending the critical path.
The brief anticipated a rise that measurement did not find; 60.3 s is kept
rather than re-tightened so the gate does not flake on a busier machine.

## Stop conditions

1. A task must write a file outside its write-set that no task owns. Shared,
   pre-declared: `test-results/render-manifest-baseline.json`,
   `expected-moves.txt`, `decision-journal.md`, this brief.
2. Two consecutive gate failures on the same check.
3. **Any `src/` file is modified.** Zero tolerance (D6). The
   `width="371.513"` vs `166px` divergence is measured here, never fixed here.
4. **A second SVG comparator or normalizer appears.** Consume `compare.ts` /
   `normalize.ts` (D1).
5. `manifest-diff.py` reports unexpected movement of a NON-sequence fixture.
6. A DOT-parity ratchet falls, or an existing svg-conformance golden count
   drops.
7. `layering.test.ts` needs an ALLOWLIST entry or `KNOWN_DEBT` becomes
   non-empty.
8. A numeric constant without a `~/git/plantuml` `file:line`.
9. A finding contradicts a locked decision (D1–D7).
10. Same location changed 3× consecutively without the check clearing.
11. `npm test` exceeds the current ceiling (60.3 s before T2; T2's recorded
    value after).
12. The complexity hook blocks and the only way through is widening an
    exemption (forbidden — extract a named helper).
13. A fixture is promoted into `ratchet.json`. The golden ratchet ships empty;
    promotion belongs to the rebuild mission.

## Push forward (journal the call)

Helper filenames and module shape · extracting a helper for the complexity
hook · a fixture the jar cannot render (record it with its reason and
continue — do NOT halt) · bucket naming within D5's fixed set · probes under
`scripts_scratch/T<N>/`, deleted before commit · minor/patch dep bumps · a
fixture whose diff count is surprisingly low (record as `[PROMOTION READY]`
and continue; do NOT promote — stop 13).

## Index

- [decisions.md](decisions.md) — D1…D7 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- **Source record:** `planning/sequence-deepdive.md` "Prerequisites"
  (2026-08-20) · `planning/mission-guide.md` G-1 · `planning/next-missions.md`
- Precedents: `description.diff-baseline.ratchet.test.ts` (the ratchet shape),
  `json-family-ratchet.ts` (the DOT-less family), `render-fixture-state.ts`
  (the helper shape), SI32 `plans/state-anchor-clip-retire/` (gate discipline,
  tracked-baseline lesson).

## Close-out (2026-08-20)

**Every number below was re-measured by the orchestrator this session** —
`test-results/dot-cache/sequence/` counted on disk, `diff-baseline.json` and
`diff-census.json` re-parsed with a script rather than quoted from a task
report, and all four gates re-run on the committed tree. Where a figure
disagrees with the journal, that is flagged explicitly (none did on the
substance; two runs disagreed with each other on wall-clock, mechanism
below).

**Corpus: classified vs admitted.** `populate-corpus.py`'s classifier claims
**1427** candidates (D3 amendment: `sequence` is `TYPE_PATTERNS[0]` and its
first-match rule over-selects). Of those, T0's capture pass rendered **1426**
(1 hard failure: `xobebi-29-jilu859`, `@startuml file4` + `newpage` — a
multi-page diagram the single-`in.svg` cache slot structurally cannot hold —
verified again this session: its `.puml` sits in `tests/corpus/sequence/` but
has no directory under `test-results/dot-cache/sequence/`). Of the 1426
rendered, the jar's own `data-diagram-type="SEQUENCE"` stamp — the D3
amendment's admission gate, not the classifier — admits **1141**, rejects
**285** (`DESCRIPTION` 95, `CLASS` 71, `STATE` 47, `UNKNOWN` 46 — parse
errors, `TIMING` 22, `ACTIVITY` 4). Re-verified directly:
`test-results/dot-cache/sequence/` holds exactly **1141** directories;
`grep -L 'data-diagram-type="SEQUENCE"' .../*/in.svg | wc -l` is **0** — every
survivor is genuinely stamped SEQUENCE. The corpus carries exactly **one**
`svek-*.dot` pair, `dasutu-58-saje713/{svek-1,svek-2}.dot` — re-confirmed by
`find … -name 'svek-*.dot'` returning only those two paths — produced by a
`{{ object … }}` note dispatching through `EmbeddedDiagram.java`'s bare-`{{`
→ nested-OBJECT path, kept deliberately as faithful, reproducible jar output
per the corrected D3 amendment footnote, not deleted to make an invariant
read "zero".

**Diff-baseline (`oracle/goldens/svg-sequence/diff-baseline.json`), re-parsed
with Python, not grep'd from a report.** **1141** fixtures pinned. **1** error
(`nuvoja-46-dezu541`, `!includedef 'macro'` — not a stdlib bundle, so the
include-store fix below does not touch it), **1140** measurable. Distribution:
min **10**, max **139**, sum **16486**, median **12**. **1012 of 1140 (88.8%)**
sit at exactly 12 diffs — re-confirmed the plateau is one identical path-set
(`compare.ts:353` stops recursing on the `svg/g[1][childCount]` structural
mismatch, so those 1012 fixtures never reach a body comparison). These figures
match the journal's **post-fix, re-pinned** state (2026-08-20, "T2 (resumed)"
and "T4 (resumed)" rows) — the mission's two intermediate readings (1138+3
errors pre-fix, then a stale 1138+3 census) are superseded, not disagreed
with; nothing here diverges from what the journal already corrected.

**Census (`oracle/goldens/svg-sequence/diff-census.json`), re-parsed the
same way.** 1140 fixtures classified, 1 error, six bucket totals:

| Bucket | Count |
|---|---|
| `missing-element` | 873 |
| `extra-element` | 1317 |
| `geometry` | 5124 |
| `text-metrics` | 536 |
| `format-units` | 0 |
| `other` | 8636 |

Sum **16486** — matches the diff-baseline sum exactly, confirming the two
committed artifacts describe the same population. `format-units` = 0 is a
measurement (D2: the unitless fractional `width` normalizes numerically, so
it never surfaces as a unit-suffix mismatch). `other` at 52% is dominated by
6824 absent root SVG attributes and 1420 tag substitutions, per D5's rule
against inventing a seventh bucket to shrink it.

**Wall-clock — one confound caught live, mirroring T2/T3/T4/T5's Spotlight and
sibling-`npm test` confounds.** First timed run on this docs-only tree read
`Duration 58.49s` / wrapped `real 59.53s` — within 1.7s of the 60.3s ceiling.
`ps`/`uptime` at that moment showed **load average 51.82**, driven by
`webstorm` at **534.8% CPU** (an IDE indexing pass, not this task or any
sibling agent — this mission has no other agents running). Polled down to
load1 ≈ 8–9 over ~90s and re-ran: `Duration 55.15s` / wrapped `real 56.16s`,
**623 files / 16001 passed + 1 skipped + 1 todo**, coverage
**95.44 / 90.47 / 96.94 / 96.52**. This is the number to trust — it matches
Batch 2's own clean gate reading (`Duration` in the same range, `623` files)
almost exactly, and 4.15s of headroom remains under the 60.3s ceiling T2 set.
**Third distinct wall-clock confound this mission** (Spotlight reindex on
T0's corpus landing; concurrent-sibling `npm test` racing on
`coverage/.tmp`; now a third-party IDE CPU spike) — worth a standing note for
any future mission run on this machine.

**Parity ratchets, re-run in isolation (a combined multi-file run
double-counted one file's overhead assertion and was discarded rather than
trusted).** `state` **270/270**, `class` **721/721**, `description`
**357/357**, `object` **80/80** — all unchanged from SI32. `layering.test.ts`
**9/9**, `KNOWN_DEBT` still `[]`. `catalog.test.ts` **2/2**, not drifted.
Combined: 6 files / 1439 tests, matching Batch 2's own combined-run total.

**Zero fixtures promoted; `src/` untouched.**
`git diff --name-only main..HEAD -- src/` run this session:

```
(empty)
```

`oracle/goldens/svg-sequence/ratchet.json` re-read this session:
`{"fixtures": []}` — the golden ratchet ships empty, exactly as D2 and stop
13 require. No `golden.svg` exists under `oracle/goldens/svg-sequence/`.

**Four gates, re-run this session on the committed tree:**

| Gate | Result |
|---|---|
| `npm test` | exit 0, 623 files / 16001 passed + 1 skipped + 1 todo, coverage 95.44/90.47/96.94/96.52, `Duration` 55.15s / wrapped `real` 56.16s (ceiling 60.3s) |
| `npm run typecheck` | exit 0 (both tsconfigs) |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 — the 3 pre-existing `[unplugin:dts]`-adjacent `node:*`/`NodeJS` TS2591/TS2503 notes reproduced, not a failure |

**What this mission did NOT do.** No rendering defect was fixed — every
divergence measured (root-chrome attributes, the `width` unit normalization,
the 88.8% comparison-halt plateau) is recorded, not repaired. No fixture was
promoted to the golden ratchet — it ships with an empty `fixtures` array by
design (D2, stop 13). Not one line under `src/` was touched — confirmed by
the empty `git diff` above, on every batch gate and again here. This mission
built the measurement surface a G-1 rebuild needs to be scored; it did not
build, fix, or grade the rebuild itself.

**Follow-ons carried forward (not to be left in the journal only):**
1. **The include-store seam is duplicated in three places** — the ratchet
   (`sequence.diff-baseline.ratchet.test.ts`), `scripts/svg-conformance-
   census.ts:168`, and `tests/oracle/svg-conformance/sequence-diff-
   census.ts` — because `render-fixture.ts#fixtureIncludeStore` is private.
   This exact divergence already caused one measurement disagreement
   mid-mission (T2 vs T5's error counts, 3 vs 1). Exporting it once removes
   the recurrence risk; scope as its own small task before a fourth copy
   gets written.
2. **`tests/integration/stdlib-remote-e2e.test.ts` — OPEN, undiagnosed
   intermittent, not a flake.** T2 saw 2 test failures in 1 of 7 runs
   (`Cannot find module .../stdlib-tupadr3/generated/tupadr3.remote.js`),
   reproducing in neither the other 6 of its own runs nor any orchestrator
   gate run this mission (including this close-out's runs). T2 ruled out its
   own write-set, the sole caller of `buildStdlibPackages`, `prepack`, and a
   controlled `npm run build && npm test` re-run — all negative — but could
   not state a positive mechanism. Per `rules/diagnosis.md`, this stays
   recorded as in-progress. The next person to see it should instrument
   `globalSetup` completion vs. worker spawn ordering under load, which no
   pass this mission tested.

**What the rebuild mission (G-1) now inherits:** a committed 1141-fixture
jar-SVG corpus with a mechanical, jar-authored admission gate; a pinned
per-fixture diff-count baseline with a ratchet that fails on any rise and
explains, in its own failure message, why a mass rise on the 1012-fixture
plateau is progress rather than regression; a reproducible six-bucket cause
census computed by committed, unit-tested code; and a ranked queue by that
census — root-chrome attributes (873+1317+part of 5124+8636) first, since
closing `compare.ts:353`'s short-circuit is the one change that unlocks body
comparison for 88.8% of the corpus at once.
