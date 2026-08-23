# svg-sequence conformance ratchet

Regression-proof gate for sequence diagrams (`src/diagrams/sequence/`),
mission `sequence-oracle-harness`. Sequence has its own dedicated upstream
engine and port pipeline (`parseSequence` -> `layoutSequence` ->
`renderSequence`, `src/diagrams/sequence/{parser,layout,renderer}.ts`), so —
like class/object/state before it — this ratchet uses a sequence-scoped
render helper, `tests/oracle/svg-conformance/render-fixture-sequence.ts
#renderFixtureSequence`, rather than reusing another family's helper. A
fixture ratchets in once it renders byte-for-byte identical to the jar oracle
under a **deterministic** text measurer; the ratchet test then holds it
forever. See `tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts`.

## Why a deterministic measurer, not production

Same rationale as `oracle/goldens/svg-class/README.md`,
`oracle/goldens/svg-object/README.md`, `oracle/goldens/svg-description/
README.md` and `oracle/goldens/svg-state/README.md`: production
(`renderSync`) always measures text with `jarMeasurer` (AWT font metrics via
the cached jar), a pre-existing, already-documented apples-to-oranges gap
(D12), not evidence of a rendering bug.

## Why there is no AC3 (DOT-equal eligibility) here

Class/object/state gate promotion on a second condition beyond zero-diff:
the fixture's DOT emission must also be structurally `EQUAL` against the
oracle DOT (`parity-<type>.json`). Sequence emits no DOT at all — confirmed,
not assumed: D1 (`plans/sequence-oracle-harness/decisions.md`) verified
`compareSvg`/`normalizeSvg` are engine-agnostic and reused unchanged, and no
`parity-sequence.json` exists in this directory (only `parity-class.json`,
`parity-object.json` and `parity-state.json` do). This is the identical
DOT-less situation `json.golden.ratchet.test.ts` already documents for
json/yaml/hcl (ADR-3: "the jar emits no DOT for this family, so the
DOT-equal eligibility gate the siblings use cannot be computed"). The **Add
rule** below has one condition, not two, for the same reason.

## Layout

```
oracle/goldens/svg-sequence/
  ratchet.json                 <- the manifest (source of truth for CI)
  README.md                    <- this file
  <slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, copied verbatim from
                                   test-results/dot-cache/sequence/<slug>/in.svg
```

Sequence fixtures have no `<type>` subdirectory level (mirrors svg-class/
svg-object/svg-state, not svg-description's `<type>/<slug>/`) — every entry
here is drawn from the `sequence` dot-cache bucket. `in.puml` and
`golden.svg` are committed copies so the ratchet test runs fully offline —
no dependency on `test-results/dot-cache/` at test time. Unlike the other
families, sequence's dot-cache tree is itself committed (D4), so this is a
convenience for a small, hand-picked promotion set, not the mechanism that
makes the suite offline.

## Current state (sequence-root-chrome / T4, 2026-08-23)

**0 fixtures pinned — ZERO fixtures are conformant.** This ratchet ships
empty on purpose, not as a placeholder. The numbers below come from
`sequence-root-chrome`'s T4 re-measurement over the full committed corpus
(`oracle/goldens/svg-sequence/diff-baseline.json`,
`sequence.diff-baseline.ratchet.test.ts`):

- **Corpus: 1141 fixtures**, captured at
  `test-results/dot-cache/sequence/<slug>/`, all committed and all
  `data-diagram-type="SEQUENCE"`-stamped by the jar itself (the admission
  gate — see decisions.md D3's amendment). 1427 candidates were rendered by
  the classifier; 285 were rejected because the classifier over-selects (a
  bare `A -> B` line anywhere makes `populate-corpus.py`'s pattern match
  non-sequence diagrams too). One further candidate,
  `xobebi-29-jilu859`, is excluded as structurally unrepresentable: it is
  `newpage`/multi-page, so the jar writes two SVGs and a single-`in.svg`
  cache entry cannot hold it.
- **Baselined: 1138 numeric + 3 errors.** The 3 error entries
  (`nereka-67-deco609`, `tuzaga-87-gene496`, `nuvoja-46-dezu541`) carry
  `status: "error"`, `diffCount: null` and a reason; all three are
  `!include` stdlib-bundle resolution failures (the documented architecture
  boundary — `src/` vendors no PlantUML stdlib), not sequence-render
  defects.
- **SUPERSEDED 2026-08-23 by `sequence-root-chrome`.** The two bullets that
  stood here described `diffCount` before that mission, and are kept in git
  history rather than restated: they read "min 10 · median 12 · max 139 ·
  total 16486" with "1012 of 1140 measurable fixtures (88.8%) at exactly
  12". Both the numbers and the quantity changed.
- **The gated quantity is now `weightedScore`, not `diffCount`.**
  `compareSvg` short-circuits in three places (node-type
  `compare.ts:144-152`, tag `:172-183`, childCount `:347-355`), charging 1
  for each however large the subtree it skips — so the count is **not
  monotonic in wrongness** and a better-aligned document could score worse.
  Each short-circuit now carries a `weight` equal to the skipped subtree's
  size, and the ratchet gates on the sum. `diffCount` is retained as an
  informational field. Rationale and the monotonicity proof:
  `plans/sequence-root-chrome/decisions.md` D5.
- **Distribution: weightedScore min 57 · median 318 · max 565254 ·
  total 1068757**, measured 2026-08-23 at `7d3361c7` over the 1140
  measurable fixtures — down 13.2% from 1231360 for the same corpus scored
  before the chrome fix. Informational `diffCount` now runs min 4 ·
  total 19676, and **833 fixtures sit at exactly 5**: four root geometry
  values plus `svg/g[1][childCount]`.
- **The chrome half is closed.** The six absent root attributes and
  `svg/defs[1][childCount]` are gone from every fixture. The body is still
  **not** comparable: `g[1][childCount]` short-circuits until child counts
  MATCH, which is rebuild-scale work. A known consequence is that adding
  correct content can raise `weightedScore` until the counts line up — nine
  fixtures did exactly that (`plans/sequence-root-chrome/decisions.md` D7).
- **ZERO fixtures reach 0 diffs.** Nothing is `[PROMOTION READY]`, so there
  is nothing this task could promote even if it wanted to. This ratchet
  ships with `fixtures: []` and a `describe.skipIf(fixtures.length === 0)`
  guard on every assertion block in
  `sequence.golden.ratchet.test.ts`, so the promotion path — the manifest
  schema, the AC1/AC2 test shape, the Add rule below — exists, is tested
  (via its own deferred-branch placeholder assertions), and cannot be
  improvised later, ad hoc, by whoever first gets a fixture to zero. That is
  the entire purpose of this task: not to promote anything, but to make sure
  promotion is never invented under time pressure.

Promotion out of the diff-baseline and into this ratchet is **manual** and
belongs to the future rebuild mission that works the diff-baseline's ranked
queue down toward zero — not to this harness-building task, which makes
zero `src/` changes (D6) and therefore cannot itself produce a zero-diff
fixture.

## Add rule

A fixture may be added to `ratchet.json` only when:

1. **Conformant** — rendering the fixture's `in.puml` through
   `renderFixtureSequence` with `DeterministicMeasurer` produces an SVG that
   is zero-diff (`compareSvg(ours, golden, 'deterministic').pass === true`)
   against the jar's `in.svg`.

(There is no second, DOT-equal condition — see "Why there is no AC3" above.)

To add a slug:

1. Confirm the condition above, e.g. via
   `npx vitest run tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
   and check for a `[PROMOTION READY]` log line naming the slug.
2. Copy `test-results/dot-cache/sequence/<slug>/in.puml` and `in.svg` into
   `oracle/goldens/svg-sequence/<slug>/` (renaming `in.svg` to
   `golden.svg`).
3. Append `{ slug, addedAt, source: "dot-cache" }` to `ratchet.json`.

## Remove rule

Removal is **maintainer-only** — see `oracle/goldens/svg-description/
README.md`'s identical rule; the same rationale applies verbatim.
