# svg-wbs conformance ratchet

Regression-proof gate for the wbs diagram engine (`src/diagrams/wbs/`, not
yet built — mission `wbs-engine-port`), mirroring `oracle/goldens/svg-salt/`
in shape and procedure. A fixture ratchets in once it renders byte-for-byte
identical to the jar oracle under a **deterministic** text measurer; the
ratchet test then holds it forever. See
`tests/oracle/svg-conformance/wbs.golden.ratchet.test.ts`.

## Starts empty (T0b, 2026-10-12)

No wbs plugin is registered yet (`src/index.ts`'s `registry.register(...)`
list has no wbs plugin), so every fixture renders through
`src/core/dispatcher.ts`'s `ERROR_SENTINEL` (`:361-375`) today — a fixed
300x60 "Error: unknown diagram type" placeholder, never a real wbs diagram.
There is nothing to ratchet until the wbs plugin lands
(`plans/wbs-engine-port/`). `ratchet.json` starts at `{ "fixtures": [] }` and
`wbs.golden.ratchet.test.ts` degrades to a documented placeholder assertion in
that state (its tamper case stays a placeholder until a pin exists), exactly
as `salt.golden.ratchet.test.ts` did at its own T0b.

See `oracle/goldens/svg-wbs/diff-baseline.json` (and `tests/oracle/
svg-conformance/wbs.diff-baseline.ratchet.test.ts`) for the companion
weighted-score baseline: every one of the 204 cached fixtures is recorded
`status: "error"` today, not a numeric baseline, because pinning a weighted
score against a fixed, content-free placeholder would measure nothing about
wbs fidelity. 28 of them are additionally jar-side error pages
(`oracle/goldens/stock-error-pages.json`'s `wbs/*` keys; 2026-10-10
error-page rule: jar errors + we error = conformant). Their `reason` starts
`jar-crash:` (2 rows, empty stock message, the jar's
`IllegalArgumentException` crash page) or `jar-error:` (26 rows, the stock
message quoted).

## No DOT-parity gate (D7)

Unlike class/description, wbs lays its tree out itself
(`WBSDiagram#getTextBlock`, `wbs/WBSDiagram.java:95`; `Fork`, `ITFComposed`,
`ITFLeaf`) — it never shells out to Graphviz (the only `svek` reference under
`wbs/` is `WBSLink.java:46`'s `ExtremityArrow` import), so it never emits a
`svek-N.dot` dump and has no DOT oracle to compare against. There is
therefore no `parity-wbs.json` DOT-eligibility check in
`wbs.golden.ratchet.test.ts`, unlike `class.golden.ratchet.test.ts`'s AC3 —
the **only** eligibility condition for a pin here is byte-for-byte
conformance under `DeterministicMeasurer`. (`tests/oracle/svg-conformance/
parity-wbs.json` is the survey's output, not a gate input.)

## Why a deterministic measurer, not production

Same rationale as `oracle/goldens/svg-class/README.md`: production
(`renderSync`) measures text with `jarMeasurer` (AWT font metrics via the
cached jar) by default, a pre-existing, already-documented apples-to-oranges
gap, not evidence of a rendering bug. `render-fixture-wbs.ts
#renderFixtureWbs` is a thin wrapper around `renderSync` itself, so
`DeterministicMeasurer` is injected as the `measurer` argument by the
ratchet/diff-baseline tests, exactly the way the SVG parity survey does
(`scripts/svg-parity-survey.ts`).

## Layout

```
oracle/goldens/svg-wbs/
  ratchet.json                 <- the manifest (source of truth for CI)
  diff-baseline.json           <- weighted-score baseline (see above)
  README.md                    <- this file
  <slug>/
    in.puml                    <- fixture source (committed, offline)
    golden.svg                 <- committed jar SVG, copied verbatim from
                                   test-results/dot-cache/wbs/<slug>/in.svg
```

No `<type>` subdirectory level (every entry here is type `wbs`) and no
`unknown` tree (a class-specific router-repair mechanism, cdd5-T2/D4).

## Add rule

A fixture may be added to `ratchet.json` only when it is **conformant**:
rendering the fixture's `in.puml` through `renderFixtureWbs`
(`render-fixture-wbs.ts`, `renderSync` under the hood) with
`DeterministicMeasurer` produces an SVG that is zero-diff
(`compareSvg(ours, golden, 'deterministic').pass === true`) against the
jar's `in.svg`. A jar-error row is conformant when both sides render an error
page that compares zero-diff. There is no second (DOT-parity) condition.

**Pinning is orchestrator-only, at batch closes (D7).** No fixture is pinned
by T0b — the harness starts at 0 pins by design. A close confirms the
conformance condition above from a fresh measurement, then pins with the
tool:

```
npx jiti plans/wbs-engine-port/measurements/pin-wbs.mts <slug>... \
  [--repo <root>] [--goldens <dir>]
```

`--repo` defaults to the git toplevel, `--goldens` to `oracle/goldens/svg-wbs`
(resolved against `--repo`). Per slug the tool copies
`test-results/dot-cache/wbs/<slug>/in.puml` and `in.svg` (renamed
`golden.svg`) into `<goldens>/<slug>/`, re-reads both copies and fails loudly
unless they are byte-identical to the cache, then appends
`{ slug, addedAt, source: "dot-cache" }` to `ratchet.json`. A slug already in
`ratchet.json` is reported as already pinned and left alone. Every slug's
cache files are checked before anything is written.

After every pin, run the twin-row tool — both the routing and refusal gates
walk `oracle/goldens/svg-wbs/` and demand a row per golden dir:

```
npx jiti plans/wbs-engine-port/measurements/repin-wbs-routing.mts [--write] [--label <text>]
npx jiti plans/wbs-engine-port/measurements/repin-wbs-baseline.mts [--write] [--accept-rises a,b]
```

`repin-wbs-routing` refuses (no ledger excuse) while any unpinned
`dot-cache/wbs` row still misroutes or errors on our side; `repin-wbs-baseline`
regenerates `diff-baseline.json` for the unpinned slugs and refuses any
weightedScore rise not named in `--accept-rises`. The same close removes the
pinned slug's `diff-baseline.json` row: the two manifests stay disjoint and
together cover the 204 cached slugs.

## Remove rule

Removal is **maintainer-only** — see `oracle/goldens/svg-description/
README.md`'s identical rule; the same rationale applies verbatim.
