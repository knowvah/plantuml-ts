# T4 — Close the mission and register what it deliberately did not do

## Task

### 1. `planning/mission-index.md` — the SI10 row

Flip `todo` → `done`, matching the surrounding rows' dense single-row prose.
Record:

- **What shipped:** class-engine `usecase`/`actor` sized via the description
  engine's faithful `EntityImageDescription` path; `sprites` threaded into a
  call site that had it in scope and never forwarded it; the inert multi-line
  `<$sprite>` guard removed; the path's first-ever fixtures authored.
- **The measurements**, from the journal — the three probes, T3's per-fixture
  deltas, and `widened 0` throughout.
- **Re-scope the "analytic substitute retired" clause — do NOT restate it.**
  `measureUsecase`, `measureActor`, `usecase-footprint.ts` and
  `footprintBoxes` all SURVIVE, reachable via `<latex>`, and Probe B
  (`widened 2` with both branches off) is the evidence that route is
  load-bearing rather than merely permanent-by-policy. Say plainly that the
  row's original promise was not achievable as written and why.
- **What did NOT change and why:** the `<latex>` branch; `DIVERGENCES.md`;
  the description engine's non-usecase routing.
- **The finding worth carrying:** the class-engine coupling was invisible to
  every gate because ZERO of 310 class goldens contain `usecase`, `actor` or
  `allowmixing` — the same hole `svg-sprite-nanoparser` shipped a
  render-nothing regression through. State whether T3's fixtures measured
  zero-diff or a gap, using T3's real numbers.

### 2. Register the follow-up

Add a row for extending SI9's authored-fixture registration to the CLASS
corpus: `dot-sync-fixtures.ts`'s `GOLDEN_DIR` is hardcoded to
`oracle/goldens/svg-description` and `authoredFixtures` expects
`<type>/<slug>/`, while class goldens are `oracle/goldens/svg-class/<slug>/`.
Until that is fixed, authored class fixtures cannot obtain a
`parity-class.json` entry and so can never satisfy the class ratchet's
DOT-EQUAL eligibility rule — T3's fixtures are guarded by a dedicated test
instead. Note that SI9 solved exactly this for description and its own row
already flags the general shape of the gap.

### 3. Mission summary

Append to [`../README.md`](../README.md): tasks completed vs planned,
decisions and anything flagged for review, gate results, known issues and
follow-ups, deviations from the brief.

## Write-set — write NOTHING outside these

- `planning/mission-index.md` (the SI10 row + ONE new follow-up row)
- `plans/si10-usecase-actor-routing/README.md` (append a summary)

## Read-set

- `plans/si10-usecase-actor-routing/decision-journal.md` — **the primary
  source for every number you write**
- `planning/mission-index.md` § SI9, § SI10, § SI11a/SI11b — row format and voice
- [`../decisions.md`](../decisions.md) ADR-1 and ADR-4

## Acceptance criteria

1. Given `planning/mission-index.md`, when SI10 is read, then it says `done`,
   names what shipped, carries the measured numbers, and RE-SCOPES the
   "retired" clause with Probe B as the reason.
2. Given the index, then exactly one new follow-up row exists for the
   SI9-extension gap.
3. Given every other row, then it is UNCHANGED — verify with a line-level
   diff, not by reading. **If your tool set has no Edit, a whole-file rewrite
   will silently drift neighbouring rows; check `git diff --numstat` and
   confirm only the intended lines moved.**
4. Given this brief's README, then it carries a summary with gate results and
   follow-ups.
5. Given every number written, then it traces to a decision-journal line.

## Quality bar

All four gates exit 0. Documentation should not move them. **If your tool set
has no shell, say so plainly rather than claiming the gates passed** — the
orchestrator will run them.

## Observability

N/A — documentation.

## Rollback

**Reversible** — documentation only.

## Boundaries

**Always:** amend dated sections rather than rewriting them.

**Never:** retro-edit a historical measurement; write a number you did not
read from the journal; claim a gate result you did not observe; restate the
"retired" clause as achieved; run ANY git mutation.

## Method rules

1. **Trace TWO levels** — check what cites the SI10 row before rewriting it.
2. **Verify every number from the journal**, not from memory or this brief's
   projections.

## Commit

`docs(si10): close the mission; re-scope the retirement clause`
