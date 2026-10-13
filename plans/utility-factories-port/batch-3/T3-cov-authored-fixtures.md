# T3-cov: authored utility fixtures (D10)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

The 17 cached rows are the work queue **and not a ceiling** (CLAUDE.md). Author ORIGINAL fixtures
(≤ 10 lines, prefix `cov-`) with jar oracles in the flat layout wep T5-cov used
(`tests/fixtures/utility/<slug>.puml` + `<slug>.svg`, ONLY via `scripts/oracle-render.sh`), a
separate `oracle/goldens/svg-utility/authored-baseline.json` (rows = `.puml` files on disk,
disjoint from cached slugs; never-rises gate; `jar-flake` for a nondeterministic oracle proven by
three renders) and the harness walking that root (copy wep's `listAuthoredWbsSlugs`/
`readAuthoredWbsFixture` additions in `render-fixture-wbs.ts`). Fold the T1g/T1h probes in.

## Thin spots (one fixture each)
- `license`, `licence`, `LICENSE` (case/spelling arms), `version`, `about`, `authors`, `stdlib`;
- `donors`, `skinparameters`;
- `openiconic` for three glyphs incl. one with a translate; `listopeniconic` already cached;
- `colors` with a hex argument, an unknown name, `color` (singular arm);
- `emoji` with no block, an unknown block;
- `sudoku` seedless (determinism only — the jar is random: mark `jar-flake`), a base-36 seed with letters;
- `apple //e`, `Steve Jobs`, `jean canouet`, `jesuischarlie`, two more DedicationSimple sentences;
- each factory's literal on a 4-line source (refusal parity: the jar falls through to another
  factory or an error — mirror it);
- leading noise before the literal (`removeInitialNoise`).

## Write-set
`tests/fixtures/utility/**`, `tests/oracle/svg-conformance/{render-fixture-utility.ts,utility.golden.ratchet.test.ts,utility.diff-baseline.ratchet.test.ts}`,
`oracle/goldens/svg-utility/{authored-baseline.json,README.md}` (never `ratchet.json` or cached rows'
numbers), the utility package dirs (D1) except files a parallel batch-3 task owns, their unit
tests, `.agent-notes/ufp-T3-cov.md`, `plans/utility-factories-port/measurements/T3-cov/**`,
`docs/catalog.md`. Anything in `src/core/` is a stop.

## Acceptance
- Given each authored fixture, then a jar oracle exists beside it and the manifest has its row.
- Given the extended harness, then cached rows + pins = 17 AND authored rows = files on disk.
- Given the batch-3 close, then every authored row is conformant or carries a mechanism.

**Observability:** N/A. **Rollback:** Reversible (new files; manifest rows removable).
