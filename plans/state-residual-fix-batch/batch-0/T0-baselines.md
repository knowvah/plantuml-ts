# T0 — Baselines and allow-list

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch` off `main`. A faithful TypeScript port of
PlantUML; the Java at `~/git/plantuml` is the spec. This mission applies five
fixes SI29 diagnosed but never applied. You pin the measurement origin.

Both baselines are **gitignored** (`test-results/*` with a
`!test-results/dot-cache/` negation) — they live on disk, not in git, and are
re-pinned by the orchestrator after each batch's gate passes.

## Task
1. Run `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`
   and write the result to `test-results/state-declared-size-baseline.jsonl`.
   Record its `sha256` and its `summary` line in your report. Expected at the
   branch point: `273/2660/2563/60/37/0/42` — if it differs, say so loudly and
   do not proceed.
2. Run `npx jiti scripts/render-manifest.ts --out
   test-results/render-manifest-baseline.json`. Record its `sha256` and the
   fixture count (expected 2017).
3. Re-measure the 11 target fixtures individually and record each target row
   verbatim (fixture, scope, axis, index, ours, jar, deltaPx) in
   `.agent-notes/si31-T0.md`:
   `joleju-94-maru748` (6 rows), `zacajo-09-tamu628` (1),
   `jetuse-93-gopi146` (1), `pacami-67-dafe414` (1), `tofezi-64-koda860` (1),
   `xojudi-20-keco020` (1), `decede-10-buvu414` (1), `gokife-89-boja382` (1),
   `pavuzo-79-zodu430` (1 — scope2 width idx2, −2.460 px),
   `fovafu-44-mifu394` (1 — its scope2 WIDTH row; its scope2 height row is the
   G14 sub-pixel band and is not a target, but record it so T4 can prove it
   did not grow), `kejabo-83-vinu490` (1).

   Also record `fovafu-44-mifu394`'s current entry in
   `oracle/goldens/state/size-backlog.json` (currently `0.108618`) — T4 must
   remove or tighten it, never loosen it.
4. Seed `plans/state-residual-fix-batch/expected-moves.txt` with a header
   explaining the file's contract and an empty per-batch section for each of
   Batches 1–6. Do NOT pre-populate slugs — each batch appends its own, with
   a jar-side account, when its gate runs.
5. Also record in `.agent-notes/si31-T0.md`, for T3's later use, the current
   harness rows of SI29 T9's nine regression fixtures — the ones an
   unconditional +1 px regressed: `kenuci-20-cane702`, `nelupe-49-xova546`,
   `sizife-41-buje191`, `lasasi-13-nona547`, `lonuti-97-voko521`,
   `sapelo-46-jafe280`, `soxene-95-domu248`, `pexiku-77-japi217`,
   `nivanu-50-zajo916`. These are T3's guard list.

Read-only git only; no commits.

## Write-set
As in the batch overview. Nothing under `src/` or `tests/`.

## Read-set
- `plans/state-residual-fix-batch/README.md#the-exit` — the target row table
- `plans/state-declared-size-fix/findings/CLOSE-OUT.md:140-160`
- `plans/state-declared-size-fix/scripts/harness-diff.py` and
  `manifest-diff.py` — read their argv contract; reuse by path, do not copy
  or rewrite them
- `plans/creole-exposant-port/expected-moves.txt` — the format precedent

## Interface contracts
`expected-moves.txt`: one bare fixture slug per line; `#` comments; blank
lines ignored. `manifest-diff.py` reads it as the allow-list.

Report back, as JSON: `{ harnessSha256, harnessSummary, manifestSha256,
manifestFixtureCount, targetRows: [...], guardRows: [...] }`.

## Acceptance
- Given the newly-written baselines, when `harness-diff.py` runs baseline vs a
  fresh measurement, then it prints `OK: 0 rows went exact, 0 rows appeared or
  grew`.
- Given the newly-written manifest baseline, when `manifest-diff.py` runs
  baseline vs a fresh manifest, then it prints `OK: 0 expected moves, 0
  unexpected`.
- Given `.agent-notes/si31-T0.md`, then all 16 target rows, all 9 guard
  fixtures' current rows, and `fovafu-44`'s backlog pin are recorded.

## Observability
N/A — no new observable operations. This task *establishes* the mission's
measurement surface; it adds none to the product.

## Rollback
Reversible. Both baselines are gitignored and regenerable from the tree by
re-running the two commands.

## Quality bar
The four gates must be green before you finish (`npm test`, `npm run
typecheck`, `npm run lint`, `npm run build`) — you change no source, so they
should be green on arrival; report it if they are not, because that means the
branch point is not clean.

## Report (<=400 tokens)
The JSON above, plus anything that differed from the expected summary line.
