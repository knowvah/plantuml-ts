# T0b — sequence pin tool and the `pinned` status

Agent: `typescript-pro`, worktree `sdd1-T0b` (from `$M/mkwt.sh T0b` after
T0a step 1). Commit: `feat(sdd1-T0b): pin tool for the sequence golden
ratchet`.

## Context
The sequence golden ratchet (`tests/oracle/svg-conformance/sequence.golden
.ratchet.test.ts`) ships empty and skips. add1 built the activity equivalent:
`plans/activity-divergence-drive/tools/pin-goldens.mts` (231 lines) + its test
(204). Three gaps on the sequence side, verified at planning:
- the golden ratchet renders WITHOUT `fixtureIncludeStore()` (`:77`), so a
  pinned `!include` fixture would throw although the pin tool measured it
  zero-diff;
- `sequence.diff-baseline.ratchet.test.ts` knows only `baseline` and `error`
  (`:271-272`) — a pinned row must be excluded the way activity's test does
  (`activity.diff-baseline.ratchet.test.ts:42-70`);
- `scripts/repin-sequence-baselines.ts` must leave `pinned` rows alone.

## Task
1. Port add1's `pin-goldens.mts` to sequence: render with
   `renderFixtureSequence` + `DeterministicMeasurer` + `fixtureIncludeStore()`
   (the ratchet's seam), refuse any non-zero-diff slug naming its first diff,
   copy `in.svg`/`in.puml` to `oracle/goldens/svg-sequence/<slug>/
   {golden.svg,in.puml}` and re-read for byte equality, APPEND to
   `ratchet.json` (never re-sort), flip the diff-baseline row to
   `status: "pinned"`, and add the routing/refusal clone rows exactly as add1
   does (add1-b1 journal row 17).
2. Port the test: drive the tool against a temp copy of the goldens tree
   (no real pin — no fixture is zero-diff at b0).
3. Golden ratchet: pass `includeStore: fixtureIncludeStore()` to
   `renderFixtureSequence`.
4. Diff-baseline ratchet + re-pin script: add the `pinned` status (excluded
   from the rise check, kept in the file), mirroring activity's.

## Write-set
`plans/sequence-divergence-drive/tools/{pin-goldens.mts,pin-goldens.test.mts}`,
`tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts`,
`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`,
`scripts/repin-sequence-baselines.ts`.

## Read-set
`plans/activity-divergence-drive/tools/pin-goldens.mts` + `.test.mts`
(whole); `tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts`
(whole, ~150); `sequence.diff-baseline.ratchet.test.ts:1-80,260-300`;
`activity.diff-baseline.ratchet.test.ts:30-80`;
`scripts/repin-sequence-baselines.ts:1-60`;
`oracle/goldens/svg-sequence/README.md` "Add rule".

## Interface contracts (outputs)
CLI: `npx jiti $T/pin-goldens.mts <source-tag> <close-label> <slug...>`;
exit non-zero and write nothing if any slug is not zero-diff. Consumed by
every close (step 8). `diff-baseline.json` rows gain status `"pinned"`.

## Acceptance
- Given a zero-diff slug (test fixture), when pinned, then `ratchet.json`
  gains it last and `<slug>/{in.puml,golden.svg}` are byte copies.
- Given a slug with ≥ 1 diff, when pinning, then the tool exits non-zero,
  names the first diff path, and the goldens tree is unchanged.
- Given a `pinned` diff-baseline row, then the diff-baseline ratchet skips it
  and the re-pin script does not rewrite it.
- Given the current empty manifest, then both ratchet tests still pass.

Quality bar: tools vitest; `npx vitest run tests/oracle/svg-conformance/
sequence.*.test.ts`; typecheck; eslint. Boundaries: `src/` untouched; no real
pin in this task. Observability: N/A — no new observable operations.
Rollback: Reversible.
