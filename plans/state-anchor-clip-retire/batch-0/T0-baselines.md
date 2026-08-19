# T0 — Baselines, including one that survives to close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire` off `main`. A faithful TypeScript port of
PlantUML; the Java at `~/git/plantuml` is the spec. You pin the measurement
origin; you change no source.

## Task
1. `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only` →
   `test-results/state-declared-size-baseline.jsonl`. Record its `sha256` and
   `summary`. **Expected at the branch point: `273/2660/2576/47/37/0/39`.** If
   it differs, say so loudly and do not proceed.
2. `npx jiti scripts/render-manifest.ts --out
   test-results/render-manifest-baseline.json`. Record `sha256` and the fixture
   count (expected **2017**).
3. **Copy the harness pin to `tests/fixtures/si32-harness-baseline.jsonl`**,
   which is TRACKED (unlike `test-results/*`). T4 byte-diffs against it. Add a
   one-line header comment inside `.agent-notes/si32-T0.md` explaining why the
   duplicate exists, citing SI31's close-out note.
4. Record in `.agent-notes/si32-T0.md`, verbatim (fixture, scope, axis, index,
   ours, jar, deltaPx):
   - `fovafu-44-mifu394` — ALL rows. Its scope2 **width** is **exact today**
     and must stay exact; its scope2 height row (`+0.003816`, the G14 sub-pixel
     band) is not a target and must not grow.
   - The other three known ink-only movers: `tubojo-49-tudu915`,
     `fajegu-17-joba577`, `mefici-97-tudu030`.
   - Their current rendered canvas width/height, so T2 can show direction of
     travel against the jar's own `in.svg`.
5. Record the CURRENT `oracle/goldens/state/size-backlog.json` entry for
   `fovafu-44-mifu394` (`5.3e-05` after SI31 T5). It may be tightened or
   removed later, **never loosened**.

Read-only git only; no commits.

## Write-set
As in the batch overview. Nothing under `src/`.

## Read-set
- `plans/state-anchor-clip-retire/README.md#the-exit`
- `plans/state-residual-fix-batch/README.md`'s "Close-out" section — the
  methodology-gap paragraph this task exists to fix
- `plans/state-declared-size-fix/scripts/harness-diff.py` / `manifest-diff.py`
  — read their argv contract; reuse by path, never copy or rewrite

## Interface contracts
`tests/fixtures/si32-harness-baseline.jsonl` is byte-identical to the harness
pin at the branch point. T4 consumes it.

## Acceptance
- Given the newly-written baselines, when `harness-diff.py` runs baseline vs a
  fresh measurement, then `0 rows went exact, 0 rows appeared or grew`.
- Given `manifest-diff.py` baseline vs a fresh manifest, then `0 expected
  moves, 0 unexpected`.
- Given `tests/fixtures/si32-harness-baseline.jsonl`, then it is byte-identical
  to `test-results/state-declared-size-baseline.jsonl` and is NOT gitignored
  (`git check-ignore` reports nothing).
- Given `.agent-notes/si32-T0.md`, then all four fixtures' rows and the backlog
  pin are recorded.

## Observability
N/A — no new observable operations. This task establishes the mission's
measurement surface; it adds none to the product.

## Rollback
Reversible. Both `test-results/` baselines are regenerable by re-running the
two commands; the tracked copy is one file.

## Quality bar
The four gates must be green before you finish — you change no source, so they
should be green on arrival. Report it if they are not: that means the branch
point is not clean.

## Report (<=350 tokens)
`{ harnessSha256, harnessSummary, manifestSha256, manifestFixtureCount,
trackedCopyPath, fovafuRows, moverRows, backlogPin, gates }`, plus anything
that differed from the expected summary.
