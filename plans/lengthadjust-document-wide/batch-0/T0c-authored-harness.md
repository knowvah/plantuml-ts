# T0c — the authored gate (render helper, ratchet test, baseline builder)

Agent: `typescript-pro` (sonnet), worktree `lad-T0c` off the T0b merge.
Commit: `test(lad): authored lengthAdjust gate — projection + never-rises baseline`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d5--authored-gate-shape](../decisions.md) first.

## Task
Copy the utility authored-harness pattern over the new root, then seed the
baseline.

1. `tests/oracle/svg-conformance/render-fixture-lengthadjust.ts`: copy the
   authored half of `render-fixture-utility.ts` (`AUTHORED_UTILITY_ROOT`,
   `listAuthored*Slugs`, `readAuthored*Fixture`, `renderAuthored*`,
   `measureAuthored*`) over `tests/fixtures/lengthadjust/`, rendering through
   `renderSync` with `DeterministicMeasurer` and `surveyAssetStore()`. Add the
   projection: `rootGroupAttributes(svg): Map<string,string>` (the first
   `<g …>` after `<defs>`), `textLengthPresence(svg): boolean[]` (one entry
   per `<text>` in document order), and `measureAuthoredLengthAdjust(slug)`
   returning `{ score, diffCount, rootExact, textLengthMatch, weErrored }`.
2. `tests/oracle/svg-conformance/lengthadjust.authored.ratchet.test.ts`: copy
   `utility.diff-baseline.ratchet.test.ts`'s authored half. Per row of
   `oracle/goldens/svg-lengthadjust/authored-baseline.json`: score ≤ baseline;
   `rootExact` and `textLengthMatch` never true→false; rows with
   `textLength: 'exact'` must have `textLengthMatch === true` when the
   baseline says so; invariant "rows = `.puml` files on disk, each with its
   `.svg`"; 3-render determinism.
3. `plans/lengthadjust-document-wide/tools/build-authored-baseline.mts`
   (`npx jiti … <commit> [--write]`): measures every row, prints the diff
   against the current JSON, writes on `--write`. A row whose
   `textLength` is `'baseline'` needs a `reason`; the 12 D2 rows
   (`{board,files,packet,chart}-{default,glyphs,onechar}`) get: "emitter
   writes no textLength (pre-existing; owner: the engine's own drive)".
   A row that is `rootExact: false` at b0 gets `reason: "pending <task>"`
   from the owner table in this file: class/object → T1b, state → T1c,
   json/yaml/hcl → T1d, activity → T2a, component/usecase → T2b, mindmap →
   T2c, wbs → T2d, salt → T2e, board/files/packet/chart → T2f.
4. Seed with `--write` at the T0b merge sha; paste the counts into your
   hand-back (expected per Amendment 1: 32 `default`/`onechar` rows
   `rootExact`, plus the 8 json/yaml/hcl/files `none`/`glyphs` rows whose
   oracle ignores the skinparam — except files' root may still differ by the
   svgRoot route (owner T2f); 24 `none`/`glyphs` rows not; `textLengthMatch` true on the 52 exact rows' `none`
   variants only where the engine strips today — report what you measure).

## Interface outputs (consumed by every later task and the close)
`authored-baseline.json`: `{ measuredAt, commit, rows: [{ slug, engine,
variant, score, diffCount, rootExact, textLength: 'exact' | 'baseline',
textLengthMatch, reason? }] }`.

## Write-set
`tests/oracle/svg-conformance/render-fixture-lengthadjust.ts`,
`tests/oracle/svg-conformance/lengthadjust.authored.ratchet.test.ts`,
`oracle/goldens/svg-lengthadjust/authored-baseline.json` (+ a 5-line
`README.md` there), `plans/lengthadjust-document-wide/tools/
build-authored-baseline.mts`, `tests/unit/oracle/lengthadjust-projection.test.ts`.

## Read-set
`tests/oracle/svg-conformance/render-fixture-utility.ts:70-230`,
`utility.diff-baseline.ratchet.test.ts:1-120`,
`plans/utility-factories-port/measurements/T3-cov/build-authored-baseline.mts`,
`tests/oracle/svg-conformance/compare.ts` (`compareSvg`, `weightedScore`),
`src/core/klimt/document-shell.ts:139-162`.

## Acceptance
- Given a row, when measured, then root `<g>` attributes and per-`<text>`
  `textLength` presence are compared to the oracle and the score recorded.
- Given the b0 seed, then the measured `rootExact` set is reported row by
  row (expected above), and the 13 baseline rows carry `textLength:
  'baseline'` with the emitter reason.
- The render helper calls `renderSync` with the options object built by ONE
  local function (`authoredRenderOptions()`), so T1e can add the internal
  jar-compatible flag in one place.
- Given an oracle whose `<text>` count differs from ours, then
  `textLengthMatch` is false (vectors of different length never match).
- Given a later run with an unchanged tree, then the test is green and three
  renders of any row are byte-identical.
- Given a projection unit test, then a hand-written SVG pair with one
  `textLength` removed reports `textLengthMatch: false` and a pair differing
  only in attribute order reports `rootExact: true`.

Observability: N/A. Rollback: Reversible.
