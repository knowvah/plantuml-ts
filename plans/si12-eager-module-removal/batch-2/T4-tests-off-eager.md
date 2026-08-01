# T4 — Move the tests off the eager modules, and lower the ceilings

## Context

See [ADR-5](../decisions.md#adr-5).

Two test files bind to the eager modules T1 removed:
`stdlib-packages.test.ts` imports `stdlib-aws/generated/awslib14.js`,
`awslib.js` and `stdlib-tupadr3/generated/tupadr3.js` in a `beforeAll` and
runs VERBATIM round-trip cases against them; `stdlib-package-files.test.ts`
asserts those files exist and caps package size.

**This task carries the criterion the whole mission is checked by.** The
packaging gate's size ceilings are the only automated thing that would notice
this mission silently not working. Left at their current values they pass
vacuously at half the size.

## Task

1. `stdlib-packages.test.ts` — the awslib14/tupadr3 VERBATIM round-trip cases
   read the shipped `assets/` bytes instead of an eager `BundleData`. Keep
   asserting disk bytes == committed manifest sha256. `stdlib`'s own cases and
   the C4 `renderSync` case are unchanged.
2. `stdlib-package-files.test.ts` — drop the eager-`.js`-exists assertions,
   update `exportSubpaths` to the batch-2 contract, and **lower the size
   ceilings**.

## Write-set — write NOTHING outside these

- `tests/unit/stdlib-packages.test.ts` (modify)
- `tests/unit/stdlib-package-files.test.ts` (modify)
- `tests/unit/sprite-package-files.test.ts` (modify) — **added mid-mission**,
  maintainer-approved 2026-08-01 under stop condition 1. This SI11b test does
  `spec.modules.map(...)` at ~line 179 and stops typechecking now that ADR-2
  made `modules` optional; it is the identical narrowing error this task
  already fixes in `stdlib-package-files.test.ts`. Fix the narrowing only —
  nothing else in that file is in scope.

`packages/**` is T3's. Do not "fix" a failing export assertion by editing the
package — if the two disagree, the contract in
[`batch-2/overview.md`](overview.md) wins and you report the mismatch.

## Read-set

- `tests/unit/stdlib-packages.test.ts` — `ROUND_TRIP_CASES`, the `beforeAll`
  importing the generated modules, `PACK_CEILINGS`
- `tests/unit/stdlib-package-files.test.ts` — `exportSubpaths` (~line 94),
  the eager-file list (~lines 216-218), `ceilingMb` (~line 156)
- `assets/manifests/<bundle>.json` — the committed sha256 map the round-trip
  asserts against
- [`batch-2/overview.md`](overview.md) — the export map contract

Line numbers drift — follow the code and report corrections.

## Acceptance criteria

1. Given the VERBATIM round-trip, then the awslib14 and tupadr3 cases read
   bytes from the shipped `assets/` tree and still assert
   `sha256(bytes) == manifest entry` — the guarantee is unchanged, only its
   source is.
2. Given the packaging gate, then the size ceilings are **LOWERED** to match
   measured reality (sketch: aws ~10 MB, tupadr3 ~24 MB — measure, add
   headroom, comment what the ceiling protects). A ceiling left at the old
   value is a failed task, not a passing one.
3. Given the gate, then `npm pack --dry-run --json` still resolves every asset
   path for both packages.
4. Given the suite, then no test references `awslib14.js`, `awslib.js` or
   `tupadr3.js`.
5. Given the PNG-bearing awslib14 fixture (`Analytics/Analytics.puml`), then
   it is still covered — it is the binary-content case.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/stdlib-packages.test.ts tests/unit/stdlib-package-files.test.ts`
clean. Do NOT run the full `npm test`.

**Only ONE test file may invoke `npm pack` per package** and **no test may
rebuild the generated tree** — it is built once in `globalSetup`. SI11a lost a
stop-condition escalation to both races.

## Observability

**This task owns the mission's only automated regression signal.** The
ceilings are the detection mechanism for "the eager modules came back" and for
on-call failure mode #2 (assets stop shipping). Record the measured sizes in
the decision journal.

## Rollback

**Reversible** — revert the commit. Test-only.

## Boundaries

**Never:** raise or delete a ceiling (stop condition 10 — lowering is
required); weaken the sha256 round-trip to a looser check; add a `beforeAll`
that rebuilds the generated tree; require network egress; run a git mutation.

## Method rules

1. **Trace TWO levels:** `ROUND_TRIP_CASES` feeds an `it.each`, and the
   `beforeAll` module imports feed several describes — removing an import
   affects every case that closes over it.
2. **Verify the new byte source against the committed manifest**, not against
   the old eager module's string.

## Commit

`test(T4): read the shipped assets instead of the removed eager modules`
