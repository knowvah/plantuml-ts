# T3 — The golden ratchet, shipped empty

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. **No `src/`** — stop 3.

Sequence has zero byte-conformant fixtures, so this ratchet admits nothing
today. It is built anyway so the promotion path exists, is tested, and cannot
be improvised later by whoever first gets a fixture to zero.

## Task
1. Write `sequence.golden.ratchet.test.ts` mirroring
   `state.golden.ratchet.test.ts`, including its `describe.skipIf` guard for
   an empty fixture list (`ratchetFixtures.length === 0`).
2. Write `oracle/goldens/svg-sequence/ratchet.json` with an **empty**
   `fixtures` array, matching the sibling schema (`slug`, `addedAt`,
   `source`).
3. Write `oracle/goldens/svg-sequence/README.md` mirroring
   `oracle/goldens/svg-state/README.md`: what the ratchet is, the layout, and
   the **Add rule** for promotion. Record the starting state from T2's report
   — fixtures baselined, how many errored, and that ZERO are conformant.
   State plainly that promotion is manual and belongs to the rebuild mission.

**Do not promote anything**, even if T2 reported a fixture at zero diffs —
that is stop 13.

## Write-set
- `tests/oracle/svg-conformance/sequence.golden.ratchet.test.ts`
- `oracle/goldens/svg-sequence/ratchet.json`
- `oracle/goldens/svg-sequence/README.md`
- `.agent-notes/g1h-T3.md`

## Read-set
- `tests/oracle/svg-conformance/state.golden.ratchet.test.ts`
- `oracle/goldens/svg-state/README.md`, `oracle/goldens/svg-json/ratchet.json`
- `.agent-notes/g1h-T2.md` — the starting numbers
- `plans/sequence-oracle-harness/decisions.md` D2, D4, D6

## Acceptance
- Given `ratchet.json`, then `fixtures` is `[]` and the schema matches its
  siblings.
- Given the suite with an empty fixture list, then it skips cleanly and does
  not fail or error.
- Given the README, then it records T2's starting numbers, states that zero
  fixtures are conformant, and documents the Add rule.
- Given T2 having reported any `[PROMOTION READY]` fixture, then it is still
  NOT promoted here, and the README says why.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: three new files, one commit.

## Quality bar
Four gates green. Report `npm test` wall-clock against the ceiling T2 set.

## Report (<=300 tokens)
Confirmation the ratchet is empty and skips cleanly; the README's recorded
starting state; any `[PROMOTION READY]` fixture you deliberately left
unpromoted.
