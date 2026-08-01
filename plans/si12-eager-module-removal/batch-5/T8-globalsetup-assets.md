# T8 — `globalSetup` populates `packages/*/assets/` before any worker spawns

Added mid-mission, maintainer-approved 2026-08-01 under stop condition 1.

## Context

`packages/*/assets/` is gitignored and populated only by each package's
`scripts/copy-assets.mjs`, normally as `prepack`. Batch 2 left three test
files touching it concurrently in parallel vitest workers:

| file | role | introduced |
|---|---|---|
| `tests/unit/stdlib-packages.test.ts` | WRITES (`beforeAll` → `copy-assets.mjs`) | T4 |
| `tests/unit/stdlib-package-files.test.ts` | WRITES (`npm pack` → `prepack`) | pre-existing |
| `tests/integration/stdlib-remote-e2e.test.ts` | READS (baseline sum) | T5 |

**Mechanism.** `copy-assets.mjs#copyBundleAssets` does `rmSync(destDir)` then
an incremental `copyFileSync` loop. Its `isUpToDate()` guard is file-COUNT
based, so it short-circuits only when the copy is ALREADY COMPLETE; during
any partial state it returns false. Cold dir → worker A begins copying →
worker B sees an incomplete count → B `rmSync`s A's partial tree → a
concurrent reader sums whatever exists at that instant.

**Evidence.** Reproduced 3/3 with `rm -rf packages/{stdlib-aws,stdlib-tupadr3}/assets`
then running the three files together: two files fail, and T5's baseline
comes out 8,195,997 / 7,399,179 / 8,315,921 B instead of 19,850,300 B.
Batch 2's gates passed only because the tree was warm from an earlier
`npm pack`. **CI is cold.**

**Ruled out.** Not T5 arithmetic (its warm figure was verified three ways and
matches the brief's ~19.9 MB projection); not T4's ceilings (they pass warm);
not `generated/` (already serialized in `globalSetup`).

## Task

1. `tests/helpers/build-stdlib-globalsetup.ts` — after `buildStdlibPackages()`,
   populate `packages/{stdlib-aws,stdlib-tupadr3}/assets/` by invoking each
   package's own `copy-assets.mjs`. `globalSetup` completes before any worker
   spawns, so no test can observe a partial tree. Do NOT reimplement the copy —
   call the existing script, which is the CC BY-ND-safe byte-for-byte path.
2. `tests/unit/stdlib-packages.test.ts` — drop the now-redundant `beforeAll`
   `execFileSync` calls to `copy-assets.mjs` (and the `execFileSync` import if
   it becomes unused). The eager-module imports it also does stay as they are.

Extend the existing file header comment to cover assets alongside
`generated/`, in the same voice — it is the canonical explanation of this
failure class for future readers.

## Write-set — write NOTHING outside these

- `tests/helpers/build-stdlib-globalsetup.ts` (modify)
- `tests/unit/stdlib-packages.test.ts` (modify)

`packages/*/scripts/copy-assets.mjs` is NOT in scope — do not "fix" the race
inside the script with a lock file. `globalSetup` removes the concurrency
instead, which is the fix the `generated/` precedent already established.

## Read-set

- `tests/helpers/build-stdlib-globalsetup.ts` — all of it, especially the
  header documenting the identical `generated/` race (SI11a T8)
- `packages/stdlib-aws/scripts/copy-assets.mjs` — `isUpToDate`, `copyBundleAssets`
- `tests/unit/stdlib-packages.test.ts` — the `beforeAll`
- `tests/unit/stdlib-package-files.test.ts` — its `npm pack` invocation, which
  triggers `prepack` and must stay safe (it will: after `globalSetup` the copy
  is complete, so `isUpToDate()` short-circuits and nothing is deleted)

## Acceptance criteria

1. Given a COLD tree (`rm -rf packages/{stdlib-aws,stdlib-tupadr3}/assets`),
   when the full suite runs, then it is green — **verified 3× consecutively**,
   not once.
2. Given each cold run, then `stdlib-remote-e2e.test.ts` logs an asset
   baseline of exactly **19,850,300 B** and a reduction of **99.693%**.
3. Given `stdlib-packages.test.ts`, then it no longer shells out to
   `copy-assets.mjs`.
4. Given `stdlib-package-files.test.ts`, then its `npm pack` per package is
   unchanged and still the only `npm pack` invocation per package.

## Quality bar

All four standard gates exit 0, plus the 3× cold full-suite run above.
`npx jiti scripts/vendor-stdlib.ts --verify` still 34,587 files verbatim.
Use `jiti`, never `npx tsx`.

## Observability

This task restores the trustworthiness of the mission's headline measurement.
A wrong-but-green baseline is the failure mode it exists to prevent.

## Rollback

**Reversible** — revert the commit. Test-harness only.

## Boundaries

**Always:** invoke the existing `copy-assets.mjs` rather than reimplementing
the copy — `awslib14` is CC BY-**ND** and a re-encode would void the grant.

**Never:** modify or re-encode asset content; add a lock file to
`copy-assets.mjs`; add a second `npm pack` per package; weaken, skip or delete
a test; run a git mutation — the orchestrator commits.

## Method rules

1. **Verify on a COLD tree.** A warm-tree pass proves nothing here — that is
   exactly how batch 2 shipped this defect.
2. **Capture a failing command's stderr before theorising.**

## Commit

`fix(T8): populate packages/*/assets in globalSetup to close a worker race`
