# T3 — Builder acquires exclusive explicitly; fitness function holds

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1.

T1 has landed `mode: 'shared' | 'exclusive'` defaulting to `'exclusive'`
(D4), so `buildStdlibPackages()` already gets exclusive semantics without any
edit. This task makes that **explicit and self-documenting**, and confirms the
fitness function still does its job now that readers use a different mode.

## Task
1. `scripts/build-stdlib-packages.ts:293` — pass `{ mode: 'exclusive' }`
   explicitly, with a short comment stating why the builder is the one caller
   that must exclude everyone: it `rmSync`s the tree readers are reading.
   This is deliberately redundant with the default. State in the comment that
   it is redundant-by-intent, so a future reader does not "simplify" it away
   and silently inherit a changed default.
2. `tests/architecture/stdlib-read-lock.test.ts` — verify the fitness function
   still fails when a bare canonical-tree read is added to any of the 8
   consumer files. **Demonstrate it**: temporarily inject such a read, quote
   the failure, revert, quote the pass. If the mode change altered the call
   shape the check keys on, update the check — but it must remain a real
   check, not a weakened one.

Read-only git only; no commits.

## Write-set
- `scripts/build-stdlib-packages.ts`
- `tests/architecture/stdlib-read-lock.test.ts`

## Read-set
- `scripts/build-stdlib-packages.ts:274-302` — the doc comment and the
  critical section
- `tests/architecture/stdlib-read-lock.test.ts` — the existing check
- `scripts/build-stdlib-packages/build-lock.ts` — T1's `mode` option
- `plans/stdlib-lock-sharing/decisions.md` — D3, D4

## Architecture decisions (LOCKED — conflict is stop 7)
- **D3** — writer priority: the builder must not starve behind arriving
  readers. If the builder's call site needs anything to make that work, say so
  rather than working around it.
- **D4** — default is exclusive; this task makes the builder's intent explicit
  rather than changing behaviour.

## Interface contracts
No API change. `buildStdlibPackages()` keeps its signature and semantics.

## Acceptance
- Given the builder, when it acquires, then the mode is exclusive and the call
  site says so in as many words.
- Given a bare canonical-tree read injected into any of the 8 consumer files,
  when the fitness test runs, then it **fails** — quoted, then reverted and
  quoted passing.
- Given the builder and a held shared lock, when the builder acquires, then it
  waits for the readers to drain (T1's behaviour, confirmed from this side).
- Given `git diff`, then no consumer test file is modified.

## Observability requirements
N/A — no new observable operations.

## Rollback
**Reversible.** An explicit argument and a comment.

## Quality bar
Four gates green. Report `npm test` duration with the load; wait for
`corespotlightd` ~0. No ceiling.

## Boundaries
- **Always:** demonstrate the fitness function failing, don't assert that it
  would.
- **Never:** touch `src/`; edit `build-lock.ts` (T1's) or the helper (T2's);
  weaken the fitness check to accommodate the new call shape; run any git write
  command.

## Report (<=250 tokens)
The builder change; the quoted red/green proof of the fitness function; the
four gates. No preamble.
