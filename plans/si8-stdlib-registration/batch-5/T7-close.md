# T7 — Close the mission

## Context

T1–T6 are done. This task records what happened, in the places a future reader
will actually look.

## Task

### 1. `planning/mission-index.md` § SI8
Flip `todo` → `done` and write what shipped: the prefetch defect and its
mechanism, per-bundle lazy registration, the sync warm-up, the golden-harness
include fix, and the sprite-fixture outcome (reverted, or inlined-with-measurement
per fixture). State plainly what did **not** ship: per-resource splitting.

Correct the row's own framing while you are there — it asserts the async fetch
"must happen in a `prefetchIncludes`-style pass", which read as "build the
pass". The pass existed; it lacked stdlib awareness. Say so, so the next reader
does not repeat the misreading.

### 2. Record the deferred mission
Add a tracked row for per-resource stdlib loading with the measurements that
justify it (see [`overview.md`](overview.md#what-must-not-get-lost)) and the two
options ADR-2 recorded without deciding: per-resource static modules versus
runtime HTTP fetch reusing the existing `IncludeFetcher`.

### 3. `oracle/goldens/svg-description/README.md`
Only if T6 changed the fixtures. Its "Authored sprite fixtures — RATCHETED
2026-07-31" section states the sprite declarations are inlined and explains why
(`renderFixture` wires no include store). T5 and T6 falsified both halves.
SI9 rewrote that section; amend it the same way, dated — do not silently
overwrite.

### 4. Mission summary
Append a summary to [`../README.md`](../README.md): tasks completed, decisions
made and any flagged for review, gate results, known issues and follow-ups,
deviations from the brief.

## Write-set — write NOTHING outside these

- `planning/mission-index.md`
- `plans/si8-stdlib-registration/README.md`
- `oracle/goldens/svg-description/README.md` (only if T6 changed the fixtures)

## Read-set

- `plans/si8-stdlib-registration/decision-journal.md` — everything recorded
  during execution; this is the primary source for the summary
- `planning/mission-index.md` § SI8, § SI9, § SI10 — the row format, and how
  SI9's closed row reads
- `oracle/goldens/svg-description/README.md` — the sprite section as SI9 left it

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — the deferral is measured; carry the numbers

## Acceptance criteria

1. Given `planning/mission-index.md`, when SI8 is read, then it says `done`,
   names what shipped, and names per-resource splitting as explicitly out of
   scope with its measured justification.
2. Given the deferred work, then it exists as a tracked row a future mission can
   pick up — not a sentence buried in SI8's prose.
3. Given T6 changed the fixtures, then no document still claims their sprite
   declarations are inlined because the harness cannot resolve includes.
4. Given the brief's README, then it carries a mission summary with gate results
   and any follow-ups.
5. Given SI10 (class-engine `measureUsecase` coupling), then it is still listed
   as open — this mission does not touch it.

## Quality bar

All four gates exit 0 — documentation changes should not move them, and if they
do, something is wrong. 389 goldens byte-identical; 54 ratchet fixtures
zero-diff.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit. Documentation only.

## Boundaries

**Always:** amend dated sections rather than rewriting them, matching how SI9
amended `plans/svg-sprite-nanoparser/decisions.md` § ADR-5.

**Never:** retro-edit a historical measurement in `mission-index.md`. Dated
numbers were true when taken; SI9 established this (its ADR-4) and it holds here.

## Method rules

1. **Trace dependency cascades TWO levels** — before editing the goldens README,
   check what cites the section you are changing.
2. **Verify every number you write from the journal**, not from memory.

## Commit

One commit: `docs(si8): close the mission; record the per-resource deferral`
