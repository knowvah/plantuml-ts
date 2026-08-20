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

## Current state (sequence-oracle-harness / T3, 2026-08-20)

**0 fixtures pinned — ZERO fixtures are conformant.** This ratchet ships
empty on purpose, not as a placeholder. The numbers below come from T2's
diff-baseline measurement over the full committed corpus
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
- **Distribution: min 10 · median 12 · max 139 · total 16462 diffs.** 1010
  of 1138 (88.8%) sit at exactly 12 — a fixed per-diagram floor, not
  per-fixture drift.
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
