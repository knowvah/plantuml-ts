# T5-cov: authored wbs fixtures for the corpus's thin spots

Prepend [../task-preamble.md](../task-preamble.md).

The 204 cached rows are the work queue **and not a ceiling** (CLAUDE.md). Author ORIGINAL
fixtures (no third-party markup) with jar oracles where the corpus is thin, in the flat layout
sep T5-cov used (`tests/fixtures/wbs/<slug>.puml` + `<slug>.svg`, rendered ONLY by
`scripts/oracle-render.sh`), a separate `oracle/goldens/svg-wbs/authored-baseline.json`
(rows = `.puml` files on disk, disjoint from cached slugs; never-rises gate; `jar-flake`
status for a nondeterministic oracle, proven by three renders) and the harness walking that
second root (`listAuthoredWbsSlugs`, `readAuthoredWbsFixture`, relative-include store — copy
`render-fixture-salt.ts`'s additions). Fold any T4a probes into the same manifest.

## Thin spots (one fixture each, ≤ 25 lines, prefix `cov-`)
- old `"label" as code` syntax (5 corpus rows) for both New and Old command orders;
- `title` + `caption` + `legend` + `header`/`footer` chrome; `scale 2`; a root `<style>`
  `Margin`; `mainframe`;
- `Width auto` in `<style>` with siblings of different widths; per-level selectors
  (`:depth(n)`), `rootNode`/`leafNode`/`boxless` selectors, a stereotype-scoped style;
- a boxless (`_`) root; a PSEUDO (marker-only) node with children; a `_` leaf under `Width auto`;
- left-side children at level 1 (the `WElement.java:70-80` quirk) and deeper;
- links: default colour, `#color`, `<<stereo>>` with an arrow style, a link whose line
  crosses a box; `No such node` error page;
- max depth 10 (corpus max is 9); a 40-node tree (performance sanity, memoised layout);
- multiline items with `;<<stereo>>`, a quoted first line, an END on the first line;
- `{{wbs}}` embedded in a class legend and in an activity action (the nested seam);
- `skinparam monochrome true` and `skinparam backgroundColor` (the ColorMapper seam);
- the three stock-error shapes (one-root, bad tree, syntax error) as explicit probes.

## Write-set
`tests/fixtures/wbs/**`, `tests/oracle/svg-conformance/{render-fixture-wbs.ts,wbs.golden.ratchet.test.ts,wbs.diff-baseline.ratchet.test.ts}`,
`oracle/goldens/svg-wbs/{authored-baseline.json,README.md}` (never `ratchet.json` or the cached rows'
numbers), `src/diagrams/wbs/**` except files a parallel batch-5 task owns (stop-and-report
there), `tests/unit/wbs/**`, `.agent-notes/wep-T5-cov.md`, `plans/wbs-engine-port/measurements/T5-cov/**`,
`docs/catalog.md`. Anything in `src/core/` is a stop.

## Acceptance
- Given each authored fixture, then a jar oracle exists beside it and the manifest has its row.
- Given the extended harness, then cached rows + pins = 204 AND authored rows = files on disk.
- Given the batch-5 close, then every authored row is conformant or carries a mechanism.

**Observability:** N/A. **Rollback:** Reversible (new files; manifest rows removable).
