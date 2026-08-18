# T0 — Evidence harness, layering fitness test, baseline

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml` is
the spec); pure SVG, vitest, ESLint, `tsc` on two tsconfigs; hook-enforced
500-line file cap. This mission (`README.md`) moves shared code out of diagram
engines into `src/core/` as PURE MOVES. A move is proved by byte-identical
output on the whole fixture corpus. Nothing in `src/` moves before this ruler
exists. Existing precedent for the fitness test: `tests/architecture/
cucadiagram-base-imports.test.ts` (textual static-import scan). Existing
precedent for corpus rendering: `scripts/shape-match-report.ts:45-90,300-340`
(walks `test-results/dot-cache/<type>/<slug>/in.puml`, `DeterministicMeasurer`,
`withStdlib` + `buildStdlibAssetsStore`).

## Task

1. **`scripts/render-manifest.ts`** (tooling — YAGNI applies, keep it small):
   - `--out <file>`: walk every `in.puml` under `test-results/dot-cache/*/`
     and every `in.puml` under `oracle/goldens/**`; render each with
     `renderSync` + `DeterministicMeasurer` (+ stdlib store, same as
     shape-match-report); write JSON `{ [relativeFixturePath]: { svg:
     sha256hex } }` sorted by key. Fixtures that throw record `{ error:
     message }` (byte-identity of an error is still identity). Add `dot:
     sha256hex` ONLY if `scripts/dot-sync-report.ts`'s emitted-DOT path is
     reusable in ≤ 20 lines; else omit and journal.
   - `--diff <baseline> <current>`: print `N fixtures differ` + the list
     (added / removed / changed); exit 1 if N > 0.
   - `--only <type>[,<type>]`: restrict the walk to those dot-cache dirs
     (push-forward 6 in README).
   - `package.json`: `"manifest": "jiti scripts/render-manifest.ts"`.
2. **`tests/architecture/layering.test.ts`** (D5): scan `src/**/*.ts` (non-
   test) static imports; rule 1: no `src/core/**` → `src/diagrams/**`; rule 2:
   no `src/diagrams/X/**` → `src/diagrams/Y/**` (X ≠ Y). `ALLOWLIST:
   {from, to, why}[]` seeded with: `src/core/dispatcher.ts` (or wherever the
   registry lives — grep `diagrams/*/index.js` importers) → `src/diagrams/*/
   index.ts` (why: upstream `PSystem*Factory` dispatch); `src/diagrams/hcl/**`
   and `src/diagrams/yaml/**` → `src/diagrams/json/**` (why: CLAUDE.md
   JsonDiagram ruling — yaml/hcl render VIA `JsonDiagram`). `KNOWN_DEBT:
   {from, to, retiredBy}[]` = the edges measured now (README starting state:
   `core/edge-label-box.ts`→class T1; `core/assemble-svg.ts`→description/
   class/state/json T8; class→description ×7 files T2/T3; `state/state-render-
   colors.ts`→class T4). Assertions: (a) every offender is in ALLOWLIST or
   KNOWN_DEBT; (b) every KNOWN_DEBT entry still matches at least one real
   import (stale debt fails); (c) every ALLOWLIST `why` is non-empty.
3. **Baseline**: on the clean branch point, `npm run manifest -- --out
   test-results/shared-seam-baseline-manifest.json`; run twice, assert the
   two runs are identical (determinism). Run `for t in class state component
   usecase object; do npx jiti scripts/dot-sync-report.ts $t; done` and write
   the EQUAL counts into README.md "Starting state" (replace the SI26 numbers).
4. Tests: `tests/unit/scripts/render-manifest.test.ts` — `--diff` on two
   hand-made JSON files (identical → 0; one changed key → 1 + exit code);
   the layering test's own three assertions exercised via a fixture-free
   unit of its matcher function (export the matcher).

## Write-set

`scripts/render-manifest.ts` (new), `tests/architecture/layering.test.ts`
(new), `tests/unit/scripts/render-manifest.test.ts` (new), `package.json`
(one script line), `test-results/shared-seam-baseline-manifest.json`
(new; `test-results/*` is gitignored — journal its sha256 in decision-journal.md so it can be re-verified), `plans/shared-seam-extraction/README.md`
(starting-state numbers only).

## Read-set

- `tests/architecture/cucadiagram-base-imports.test.ts` (whole, 60 lines)
- `scripts/shape-match-report.ts:45-90,300-340`
- `scripts/dot-sync-report.ts:1-40` (modes) and its emitted-DOT helper
- `src/core/measurer-deterministic.ts` (exports only), `src/index.ts`
  (`renderSync` signature), `src/core/render-options.ts:24-35`
- `README.md` starting state; `decisions.md#d5`, `#d6`

## Architecture decisions

D5, D6 locked. The manifest is tooling: no `src/` change in this task.

## Interface contract (consumed by every later task)

- `npm run manifest -- --out <f>` / `-- --diff <a> <b>` / `-- --only class,state`
- Manifest JSON: `Record<string, { svg: string; dot?: string } | { error: string }>`
- `layering.test.ts` exports `KNOWN_DEBT` shape `{ from: string; to: string;
  retiredBy: string }` — T10 empties it; no other task edits this file.

## Acceptance criteria

- Given the branch point, when `npm run manifest -- --out a.json` runs twice,
  then `--diff a.json b.json` reports `0 fixtures differ` and exit 0.
- Given the current tree, when `layering.test.ts` runs, then it PASSES with
  KNOWN_DEBT exactly the measured edges and ALLOWLIST the two seeded rules.
- Given a KNOWN_DEBT entry whose edge is removed from the tree, when the test
  runs, then it FAILS naming the stale entry.
- Given `README.md`, then its starting-state DOT EQUAL counts are the ones
  measured now, with the commit hash.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` green. Commit
`chore(T0): render-manifest harness, layering fitness test, baseline`.

## Observability

N/A — no new observable operations (tooling + test).

## Rollback

Reversible (revert the commit; baseline JSON lives in gitignored test-results/).
