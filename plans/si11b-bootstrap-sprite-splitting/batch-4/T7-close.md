# T7 — Close the mission

## Context

T1–T6 are done. This task records the outcome in the two places a future
reader looks: the mission index, and this brief.

## Task

### 1. `planning/mission-index.md` — update the SI11b row

Flip **SI11b** to `done` and record:

- What shipped: the derived per-sprite fragments and name manifest, the MIT
  allowlist, the `<$name>` scan, per-sprite routing in the prefetch walk, the
  packaging gate, and the collision-warning seam.
- **T6's MEASURED payload**, not this brief's ~98.7% projection.
- What did NOT ship, per [ADR-6](../decisions.md#adr-6): the manifest floor
  (7,289 B gzip) dominating at small N; request count rather than bytes being
  the ceiling here — the inverse of SI11a; and sprite NAMES remaining a flat
  global namespace, now warned about but still last-write-wins.
- **That ADR-1 overturned the mission's founding premise:** SI11b was recorded
  as requiring a vendored-file transform and an SI5b carve-out. It required
  neither — fragments are derived output and `vendor-stdlib --verify` was
  never touched. Say so plainly; the SI11b row itself asserted the opposite,
  and a future reader will otherwise inherit the wrong constraint.

### 2. Mission summary

Append to [`../README.md`](../README.md): tasks completed vs planned,
decisions made and any flagged for review, gate results, known issues and
follow-ups, deviations from the brief.

## Write-set — write NOTHING outside these

- `planning/mission-index.md`
- `plans/si11b-bootstrap-sprite-splitting/README.md`

## Read-set

- `plans/si11b-bootstrap-sprite-splitting/decision-journal.md` — everything
  recorded during execution; **the primary source for the summary and for
  T6's measured numbers**
- `planning/mission-index.md` § SI11a, § SI11b — the row format, and how a
  closed row reads
- [ADR-6](../decisions.md#adr-6) — what must be stated

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — carry the measured numbers; state what is
  not solved

## Acceptance criteria

1. Given `planning/mission-index.md`, when SI11b is read, then it says `done`,
   names what shipped, and carries **T6's measured** result — not ~98.7%.
2. Given the same file, then it states plainly that ADR-1 overturned the
   "requires transforming a vendored file" premise the row previously carried.
3. Given this brief's README, then it carries a mission summary with gate
   results, decisions flagged for review, and follow-ups.
4. Given SI11a's row, then it is **unchanged** — dated numbers were true when
   taken.
5. Given SI10 (class-engine `measureUsecase` coupling), then it is still
   listed as open — this mission does not touch it.

## Quality bar

All four gates exit 0 — documentation changes should not move them, and if
they do, something is wrong. 389 goldens byte-identical; 54-fixture ratchet
zero-diff.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit. Documentation only.

## Boundaries

**Always:** amend dated sections rather than rewriting them, matching how
SI11a and SI9 did it.

**Never:** retro-edit a historical measurement in `mission-index.md`. Dated
numbers were true when taken.

## Method rules

1. **Trace dependency cascades TWO levels** — check what cites the SI11b row
   before rewriting it.
2. **Verify every number you write from the journal**, not from memory or from
   this brief's projections.

## Commit

One commit: `docs(si11b): close the mission; record the measured win`
