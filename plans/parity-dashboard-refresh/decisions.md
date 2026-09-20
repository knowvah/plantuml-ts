# Architecture decisions (locked)

All approved by the maintainer 2026-09-20. Contradicting one is stop 3.

## D1 — Unified dashboard at the published path
Context: `docs/parity-report.md` is what `docs-site/copy-reports.mjs`
publishes as `/parity`. Decision: new `scripts/parity-dashboard.ts` writes
that same file; the DOT table becomes one section. Consequences: nav,
README link, `.gitignore` and copy-reports keep working unchanged.

## D2 — Compose, never render
Decision: the dashboard reads only committed JSON and prints each
artifact's `measuredAt`/`generatedAt` in the row it feeds; it never invokes
a renderer or the jar. Consequence: regeneration is sub-second and needs no
oracle; staleness is visible per cell instead of hidden behind one date.

## D3 — Two SVG columns
Context: `DeterministicMeasurer` IS `WidthTableMeasurer`
(`src/core/measurer-deterministic.ts` header) and the survey already uses
it (`svg-parity-survey.ts:264`), so the old "AWT metrics / D12" preamble is
false. The survey (`renderSync`) and the ratchet/census (`renderFixture*`
helpers) differ by RENDER PATH. Decision: report both, labelled by path;
the preamble names the delta; the AWT sentence is deleted, not reworded.

## D4 — Per-type survey files
Decision: `parity-<type>.json` for every surveyed type; `parity.json` stays
component+usecase (four golden ratchets read it for DOT eligibility).
Consequence: additive; no ratchet test changes.

## D5 — Census `--json`
Decision: `svg-conformance-census.ts --json <path>` writes
`tests/oracle/svg-conformance/census-<type>.json` (committed). Consequence:
the dashboard reads conformant counts from disk, per D2.

## D6 — One capture script
Context: the activity capture (`.agent-notes/aoh-T0.md`) was a hand loop
with two findings: the jar exits 200 while still writing a valid SVG, and a
named block writes `<name>.svg`. Decision: `scripts/capture-oracle-cache.ts
<type>` reads `tests/visual/data/<type>.json`, renders through
`scripts/oracle-render.sh`, judges success from files present, and adopts a
lone differently-named `.svg` as block 0. Consequence: no fourth hand loop.

## D7 — Row universe
Decision: rows = the 28 `tests/visual/data/*.json` buckets, alphabetical;
`unknown` stays as an accounting row; upstream `DiagramType` members with
neither a bucket nor an engine (HELP, BPM, JCCKIT, COMPOSITE, CREOLE, MATH,
LATEX, DEFINITION, FLOW, SPRITES, CRASH) go in one footnote.

## D8 — Every `n/a` carries a reason
Vocabulary: `no engine (Dn todo)` · `no DOT stage (non-svek)` ·
`no oracle captured` · `no ratchet yet` · `engine, unclassifiable corpus` ·
`accounting bucket`. A bare `n/a` is a generator failure. Adding a word is
a push-forward; log it.

Added during execution (journal rows 12, 20): `no survey yet` ·
`no census yet` · `no diff-baseline yet` · `no data-diagram-type
classification`. Added after close at the maintainer's request (row 30):
`plantuml-ts only` — every cached jar SVG of the type is PlantUML's own
"Diagram not supported by this release" page (`PSystemUnsupported.java:62`,
reached via `PSystemBuilder.java:284`), so the port draws a diagram the
pinned jar declines and no cell can compare anything; it replaces the
oracle count and every comparison cell, and is keyed on the page text, never
a type name, so pinning a supporting jar flips it back by itself.

## D9 — Drift gate as a unit test
Decision: `tests/unit/scripts/parity-dashboard.test.ts` rebuilds the
markdown from the JSON on disk and asserts equality with the committed
`docs/parity-report.md`. Consequence: every re-pin commit must regenerate
the report; the July staleness becomes a test failure. Flagged as the
contestable decision; approved.

## D10 — Re-pin order
Decision: routing and refusal baselines are re-pinned by the orchestrator
BEFORE the capture commit for the five new trees. Locked by the standing
finding [[new-corpus-tree-trips-two-gates]].
