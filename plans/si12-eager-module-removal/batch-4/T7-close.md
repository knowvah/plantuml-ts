# T7 — Close the mission

## Task

### 1. `planning/mission-index.md` — the SI12 row

Flip to `done` and record:

- What shipped: eager modules removed for `-aws`/`-tupadr3`, `.` re-exporting
  the manifests, `stdlib-all` re-exporting both kinds, the packaging ceilings
  lowered, and the measurement re-based.
- **MEASURED before/after unpacked sizes for both packages**, from the journal.
- **T5's re-measured reduction**, not SI11a's 99.702%.
- What did NOT change and why: `packages/stdlib` keeps its eager path (2.9 MB,
  and it carries the bundles most likely to be wanted offline); `assets/` still
  ships everywhere because the CDN recipe and SI11b's per-sprite loading both
  resolve against it.
- That this is **breaking by taxonomy with zero published consumers**, so no
  deprecation window was warranted.

### 2. Mission summary

Append to [`../README.md`](../README.md): tasks completed vs planned,
decisions made and any flagged for review, gate results, known issues and
follow-ups, deviations from the brief.

## Write-set — write NOTHING outside these

- `planning/mission-index.md`
- `plans/si12-eager-module-removal/README.md`

## Read-set

- `plans/si12-eager-module-removal/decision-journal.md` — **the primary source
  for every number you write**
- `planning/mission-index.md` § SI11a, § SI11b, § SI12 — the row format
- [ADR-3](../decisions.md#adr-3) — why the measurement changed basis

## Acceptance criteria

1. Given `planning/mission-index.md`, when SI12 is read, then it says `done`,
   names what shipped, and carries the MEASURED sizes and T5's figure.
2. Given SI11a's and SI11b's rows, then they are **unchanged** — dated numbers
   were true when taken, and SI11a's 99.702% was measured against a denominator
   that no longer exists.
3. Given this brief's README, then it carries a summary with gate results,
   decisions flagged for review, and follow-ups.
4. Given SI10, then it is still listed as open — this mission does not touch it.

## Quality bar

All four gates exit 0.

## Observability

N/A.

## Rollback

**Reversible** — documentation only.

## Boundaries

**Always:** amend dated sections rather than rewriting them.
**Never:** retro-edit a historical measurement; write a number you did not
read from the journal.

## Method rules

1. **Trace TWO levels** — check what cites the SI12 row before rewriting it.
2. **Verify every number from the journal**, not from memory or this brief's
   projections.

## Commit

`docs(si12): close the mission; record the measured sizes`
