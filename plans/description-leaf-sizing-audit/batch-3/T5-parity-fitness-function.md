# T5 — Parity fitness function

## Context

`architecture.md`: "Express every architectural constraint as a
lint/import check/test — not code review." The renderer/sizer parity gap
recurred FOUR times under code review. This test is the constraint made
executable.

## Task

A test that fails when a `resolveElement*` is referenced from a renderer
module and from no sizer module, unless it is allow-listed with a reason.

## Write-set

- `tests/architecture/sizer-renderer-parity.test.ts` (new; create the
  directory if absent)

## Read-set

- `planning/sizer-renderer-parity.md` — the `size-neutral` rows seed the
  allow-list verbatim
- `decisions.md#adr-3` — including its KNOWN LIMIT
- `src/core/theme-element-resolve.ts` — the resolver list

## Acceptance criteria

- Given a `resolveElement*` referenced from `renderer-*.ts` or
  `EntityImageDescription*.ts` but from no sizer module, when the test
  runs, then it FAILS naming the resolver
- Given an allow-listed resolver, then the entry carries a written reason
  string, and an entry with an empty reason fails the test
- Given a resolver added to `theme-element-resolve.ts` in future and
  wired only to the renderer, then this test fails (verify by temporarily
  adding one, then removing it)
- Given the test file's doc comment, when read, then it states plainly
  that this covers **only resolver-shaped** instances — `wrapWidth`, the
  creole lexer and the use-case point fit would ALL have passed it — so
  it is a partial guard, not proof of parity
- Given the whole suite, then `npm test` passes

## Observability

This task IS the guard. It adds no runtime signal; it adds a CI signal.

## Rollback

Reversible — a test-only addition. If it proves flaky against the
module-name heuristic, prefer TIGHTENING the file globs over deleting the
test; a deleted guard is how instance #5 happens.

## Quality bar

All four gates. The test must fail for the right reason before it passes
— write it red first (`testing.md` TDD), with a deliberately unwired
resolver, and record that you saw it fail.

---

## Amended by the orchestrator after T4, 2026-07-28

This spec was written before Batches 1–2 ran. Three findings change it.

### 1. The allow-list seed MOVED — reseed from the table as it stands now

T4 changed two verdicts, and the totals hid it (5/6/9 before and after,
but membership swapped): `actorStyle` went `size-neutral` → `GAP`, and
`inkSprites` went `GAP` → `size-neutral`. **Read the current
`planning/sizer-renderer-parity.md`, not this brief's earlier summary of
it.** Allow-listing a row that is now a GAP would encode the very defect
the guard exists to catch.

### 2. There must be a KNOWN_GAPS list, separate from the allow-list

Six GAPs are proven and UNFIXED until Batch 4 — including
`resolveElementShadowing` and `resolveElementLineThickness`, both
referenced from a renderer module and from no sizer module. A guard that
simply fails on that shape would be red from birth, and the pressure would
be to allow-list them, which relabels a known defect as "size-neutral" and
loses it.

So the test needs TWO lists with different meanings:

- `SIZE_NEUTRAL` — this genuinely cannot affect geometry, with the reason
  string copied verbatim from the table row.
- `KNOWN_GAPS` — this IS a real gap, is ledgered, and is expected to fail
  until its Batch-4 task lands. Each entry cites its ledger line.

`KNOWN_GAPS` must behave as a **shrink-only ratchet**, exactly like
`size-backlog.json`: the test fails if the set GROWS, and an entry whose
gap is fixed must be deleted in the same commit as the fix. An entry may
never be moved from `KNOWN_GAPS` to `SIZE_NEUTRAL` to quiet a failure.

### 3. Name it for what it measures, and state the 1-of-4 figure

Per T3: call the guard **resolver-reachability**, not "parity". Put the
figure in the assertion message itself, not only in the doc comment — the
message is what a future engineer reads at 2am:

> only 1 of the 4 historical parity defects was resolver-shaped; wrapWidth,
> the creole lexer and the use-case point fit would all have passed this
> check.

### 4. Reachability is not use — T4 proved it

`inkSprites` reached `BoxSizingOpts` and was read NOWHERE, while the
feature it was meant to deliver was already carried by a different channel
(`sprites` → `inlineFootprintBox`). A reference is not a use. If the test
can cheaply distinguish "assigned" from "read" it should; if it cannot,
the doc comment must say that a threaded-but-unread value passes this
guard, so nobody mistakes green for wired.
