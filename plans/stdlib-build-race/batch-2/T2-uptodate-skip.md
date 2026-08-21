# T2 — A content-derived up-to-date skip

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **No `src/`** — stop 2.

This is half of D3's fix. The other half is T4's lock, and **neither closes the
race alone** — say so in your note rather than claiming the race is fixed.

## The risk this task introduces
A skip that is too permissive silently serves stale build output to the tests
that consume it. That is this repo's most expensive recurring failure class:
the stale cache that reported false conformance (`object`: 0/80 reported vs
23/80 real). There is direct local precedent to avoid —
`tests/helpers/build-stdlib-globalsetup.ts`'s own comment records that
`copy-assets.mjs#isUpToDate` is **file-COUNT based** and that this was part of
the SI12 breakage; those `isUpToDate(expectedCount)` implementations still
exist in `packages/*/scripts/copy-assets.mjs`. Do not copy that pattern.

## Task
1. Add a predicate that decides whether `generated/` is already correct for the
   current inputs, derived from **content** — a hash over the build inputs and
   the emitted manifest. **Never a file count. Never an mtime.** (D4; violating
   this is stop 5.)
2. When it returns true, `buildPackage` must skip **without calling
   `freshGeneratedDir`**, so no `rmSync` happens.
3. **If the hash cannot be computed for any reason, REBUILD.** Never skip on
   uncertainty. A redundant rebuild costs seconds; a wrongly-skipped one
   corrupts an oracle.
4. Log the skip decision so a future recurrence is readable from run output
   (Phase 4 detectability requirement).
5. TDD: tests first, in `tests/unit/build-stdlib-packages.test.ts`.

Read-only git only; no commits.

## Write-set
- `scripts/build-stdlib-packages.ts`
- `tests/unit/build-stdlib-packages.test.ts`
- `.agent-notes/sre-T2.md`

## Read-set
- `scripts/build-stdlib-packages.ts:38-70` — `freshGeneratedDir`, `buildPackage`
- `.agent-notes/sre-T0.md` — the proven mechanism
- `plans/stdlib-build-race/decisions.md` — D3, D4
- `packages/stdlib-tupadr3/scripts/copy-assets.mjs:72` — the count-based
  predicate NOT to imitate

## Interface contracts
Export the predicate and report `{ predicateName: string, signature: string }`.
T4 wraps it so the second lock holder re-checks **inside** the lock.

## Acceptance
- Given inputs whose content hash matches the emitted manifest, when the build
  runs, then it SKIPS and performs **no `rmSync`** — assert on the filesystem
  (e.g. an inode or a sentinel file surviving), not on a log line.
- Given any input content change, when the build runs, then it rebuilds.
- Given a hash that cannot be computed, when the build runs, then it REBUILDS.
- Given the skip path, then the decision reads no file count and no mtime —
  assert this by construction, and say in the note how you assured it.
- Given the build output, then it is byte-identical to before this change for
  an unchanged tree.

## Observability
The skip/rebuild decision must be logged with its reason. No SLIs, no traces —
this is a build script, not a service.

## Rollback
Reversible: one script plus its tests, one commit.

## Quality bar
Four gates green, coverage >= 90/90/90. TDD. `npm test` under 60.3 s on a
settled machine. Complexity hook: extract a NAMED helper, never widen an
exemption.

## Boundaries
- **Always:** rebuild when uncertain; assert the absence of `rmSync` on the
  filesystem.
- **Never:** touch `src/`; skip on a count or an mtime; claim the race is
  fixed by this task alone; run git write commands.

## Report (<=350 tokens)
The predicate name and signature; how you assured it is content-only; the
byte-identity check; the four gates.
