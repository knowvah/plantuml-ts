# T2 — Readers acquire shared

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1.

T1 has landed shared mode on `acquireBuildLock` (`mode: 'shared' |
'exclusive'`, default `'exclusive'` — D4). `withStdlibBuildLock` is the single
entry point all 8 converted reader test files use, so switching it to shared
mode is what actually collects the measured win: 573 reader acquisitions
across two concurrent suites stop serialising against each other.

## Task
1. `withStdlibBuildLock` acquires in **shared** mode by default.
2. Keep the `BuildLockOptions` passthrough working — a caller (including the
   lock's own tests) must still be able to override `lockPath`, `maxWaitMs`,
   and now `mode`.
3. Extend `tests/unit/with-stdlib-build-lock.test.ts` to cover: shared is the
   default; an explicit `mode` override still wins; sync and async callbacks
   both release correctly in shared mode; release on throw still holds.

**Do not edit any of the 8 consumer test files.** They call this helper, which
is exactly why the mode switch is one file (D4). If you find yourself needing
to edit one, the helper's API is wrong — stop and journal it.

Read-only git only; no commits.

## Write-set
- `tests/helpers/with-stdlib-build-lock.ts`
- `tests/unit/with-stdlib-build-lock.test.ts`

## Read-set
- `tests/helpers/with-stdlib-build-lock.ts` — `:33-40`, the overloads and the
  `acquireBuildLock` call
- `scripts/build-stdlib-packages/build-lock.ts` — T1's new `mode` option
- `.agent-notes/lsh-T0.md` — the baseline this change is meant to move
- `plans/stdlib-lock-sharing/decisions.md` — D4

## Architecture decisions (LOCKED — conflict is stop 7)
- **D4** — mode is an option defaulting to exclusive. The helper opts *in* to
  shared; it does not change the library default.

## Interface contracts
`withStdlibBuildLock<T>(fn: () => T, options?: BuildLockOptions): T` and its
Promise overload — **signature unchanged**. Only the default mode it requests
changes. The 8 consumer files must not need edits; that is the contract.

## Acceptance
- Given a call with no options, when it acquires, then the mode is shared.
- Given two shared sections in different processes, when both run, then
  neither waits on the other.
- Given an explicit `{ mode: 'exclusive' }`, when it acquires, then exclusive
  wins over the new default.
- Given a callback that throws (sync) or rejects (async), when it fails, then
  the reader entry is still released.
- Given the 8 consumer test files, then `git diff` shows them unmodified.

## Observability requirements
N/A — no new observable operations beyond T1's `log()` seam.

## Rollback
**Reversible.** One default changes; reverting restores exclusive readers.

## Quality bar
Four gates green, coverage >= 90/90/90. Report `npm test` duration with the
load; wait for `corespotlightd` ~0. No ceiling. **If the suite gets faster,
report it — but do not lower SI35's 120 s per-test timeouts in this task**;
that is T4's call once the measurement is in.

## Boundaries
- **Always:** keep the signature and the passthrough intact.
- **Never:** touch `src/`; edit a consumer test file; edit `build-lock.ts`
  (T1's) or `build-stdlib-packages.ts` (T3's); run any git write command.

## Report (<=250 tokens)
The change; the two-process proof that readers no longer block each other;
confirmation the 8 consumer files are untouched; the four gates. No preamble.
