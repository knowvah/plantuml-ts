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
| [2](batch-2/overview.md) | Golden ratchet · cause census · cross-type wiring | T3, T4, T5 | [ ] |
| [3](batch-3/overview.md) | Close-out | T6 | [ ] |

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
