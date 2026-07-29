# svg-description conformance ratchet

Regression-proof gate for the description/deployment engine (component +
usecase, both routed through the unified engine — see `.claude/catalog.md`).
A fixture ratchets in once it renders byte-for-byte identical to the jar
oracle under a **deterministic** text measurer; the ratchet test then holds
it forever. See `tests/oracle/svg-conformance/description.golden.ratchet.test.ts`.

## Why a deterministic measurer, not production

Production (`renderSync`) always measures text with `jarMeasurer` (AWT font
metrics via the cached jar), which is why the survey in
`tests/oracle/svg-conformance/parity.json` shows near-universal `diverged`
verdicts even for fixtures whose DOT is `EQUAL` — that gap is the
pre-existing, already-documented D12 apples-to-oranges gap (see
`tests/integration/description.test.ts`), not evidence of a rendering bug.

This ratchet instead renders through the description engine's low-level
pipeline (`parseDescription` -> `layoutDescription` -> `renderDescription`)
with `DeterministicMeasurer` injected into *both* stages — the same system
both sides of the comparison use to measure text — isolating true emission
regressions from text-metrics noise. See
`scripts/svg-conformance-census.ts` for the census that discovers
zero-diff candidates this way.

## Layout

```
oracle/goldens/svg-description/
  ratchet.json                 <- the manifest (source of truth for CI)
  README.md                    <- this file
  <type>/<slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, copied verbatim from
                                   test-results/dot-cache/<type>/<slug>/in.svg
```

`in.puml` and `golden.svg` are committed copies so the ratchet test runs
fully offline — no dependency on the gitignored, regenerable
`test-results/dot-cache/` tree at test time. `dot-cache` remains the
*source* fixtures are copied from when adding a new slug, not something the
ratchet test itself reads.

## Add rule

A fixture may be added to `ratchet.json` only when **both** hold:

1. **Conformant** — rendering the fixture's `in.puml` through the
   low-level pipeline with `DeterministicMeasurer` injected into both the
   layout and render stages produces an SVG that is zero-diff
   (`compareSvg(ours, golden, 'deterministic').pass === true`) against the
   jar's `in.svg`.
2. **DOT-EQUAL** — the fixture's DOT emission is structurally `EQUAL`
   against the oracle DOT (`tests/oracle/svg-conformance/parity.json`,
   `fixtures[].dotEqual === true`). This is enforced by the suite itself,
   not just documented — see the "eligibility" describe block in
   `description.golden.ratchet.test.ts`.

To add a slug:

1. Confirm both conditions above (e.g. via
   `npx tsx scripts/svg-conformance-census.ts <type>` and `parity.json`).
2. Copy `test-results/dot-cache/<type>/<slug>/in.puml` and `in.svg` into
   `oracle/goldens/svg-description/<type>/<slug>/` (renaming `in.svg` to
   `golden.svg`).
3. Append `{ slug, type, addedAt, source: "dot-cache" }` to
   `ratchet.json`.

## Remove rule

Removal is **maintainer-only**. A locked fixture is a promise that this
codebase does not regress on it; removing one is a deliberate decision to
retract that promise (e.g. the fixture turns out to have been wrongly
classified as conformant, or its golden SVG was captured from a bad jar
build) and must be reviewed as such, not done inline while working on an
unrelated change.

## Known gap (T18 finding, still open after T19)

The T18 seed set was 3 component + 1 usecase, all single-element/simple
fixtures. T19 added one more single-element usecase fixture
(`kevipe-39-gaji640`, unblocked by fixing the `#line.dashed` inline
style-override consumption gap — see the mission decision journal). As of
T19 there is still **no conformant package/cluster fixture, no conformant
multi-edge fixture, and no conformant fixture using a NAMED CSS color**
(e.g. `#orange`) — the corpus has such fixtures, but none render zero-diff
yet under `DeterministicMeasurer`. Structural feature gaps (legend,
title/header/footer, `newpage`, clusters, multi-edge, `<img>`, monospace
creole) are tracked as F2/F5+; named-CSS-color-to-hex normalization
(`orange`->`#FFA500`) is tracked separately (see T19's report — it needs a
`src/core/theme.ts`-level fix, out of the description-engine write-set). Do
not force-add a non-conformant fixture to close either gap; widen coverage
only once a fixture in one of these categories actually reaches zero-diff.

## Known gap #2 (`bodyenhanced-atom-seams` T1 finding, 2026-07-29)

T1 enumerated 22 candidate fixtures ahead of the `decorate`/`BodyFactory`
port (ADR-1/ADR-4 of the `bodyenhanced-atom-seams` mission): the 11
known-affected folder/package + widened fixtures, plus 11 separator-bearing
fixtures found by scanning `test-results/dot-cache/{component,usecase}`
for creole block-separator lines (`--`/`==`/`..`/`__`, both titled and
bare — see `BodyEnhancedAbstract#isBlockSeparator`). **Zero of the 22 reach
zero-diff under `DeterministicMeasurer` today.** None were pinned.

- **Folder/package fixtures (8 of 11 group-1 targets)** fail with a
  `[childCount]` structural bail inside the package/folder cluster's own
  `<g>` — the same pre-existing gap this section already documents above
  (no conformant package/cluster fixture yet).
- **Separator-bearing fixtures (all 11 titled + bare)** fail because
  `src/diagrams/description/` has no `decorate`/`TextBlockLineBefore`
  equivalent at all (grep-verified: that logic exists only under
  `src/diagrams/class/`). The separator line's width is never contributed
  to the body's sizing, so the whole entity box comes out undersized and
  every downstream child position cascades (diffs from 3 to 388 per
  fixture, first divergence typically `svg/@height` or a rect/text `@x`).
- `usecase/bootstrap-0` and `usecase/ruziru-69-xixo434` additionally error
  in this harness independent of conformance: `render-fixture.ts` (unlike
  `scripts/svg-conformance-census.ts`) wires no stdlib `includeStore`, so
  `!include <bootstrap/bootstrap>` cannot resolve. Moot for pinning either
  way — both are `dotEqual=false` in `parity.json`, AC3-ineligible.
- `usecase/fepuvo-06-rugi981` (titled separator) additionally has a
  malformed-XML jar golden (`comment is not well-formed`) and is also
  `dotEqual=false` — ineligible regardless.

Full per-fixture list, diff counts, and the exact grep methodology are in
`.agent-notes/T1-svg-goldens.md`. Batch 2+ of `bodyenhanced-atom-seams`
should re-run this same 22-fixture check after the `decorate` port lands —
that is the population expected to start going green.
