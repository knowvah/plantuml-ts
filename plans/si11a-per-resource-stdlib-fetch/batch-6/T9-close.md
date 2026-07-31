# T9 — Close the mission

## Context

T1–T8 are done. This task records the outcome in the two places a future reader
looks: the mission index, and this brief.

## Task

### 1. `planning/mission-index.md` — replace the SI11 row

The index carries one **SI11** row written before the split. Replace it with:

- **SI11a** — `done`. What shipped: the remote manifest shape, the registry's
  per-resource path, per-resource routing in the walk, concurrent fetch, the
  packaging gate, the public API and recipe. Carry **T8's measured numbers**,
  not the brief's projections. State what did NOT ship, per
  [ADR-6](../decisions.md#adr-6): request count, the `awslib14` `*/all.puml`
  aggregators up to 445 KB, nothing for bootstrap, and the manifest floor.
- **SI11b** — `todo`, blocked-by SI11a (done). Bootstrap per-sprite splitting:
  1.06 MB in ONE file, 2,078 sprites, so per-resource splitting is a no-op.
  Record the three things that make it a distinct mission:
  1. it requires **transforming a vendored file**, needing an explicit carve-out
     from SI5b's checksummed-file-copy rule (bootstrap is MIT, so licensing
     permits it — but the carve-out must be documented and confined to MIT
     bundles, never AWS);
  2. sprites are **not resolved through the include seam** — `SpriteRegistry` is
     a per-diagram `Map` read synchronously at measure/render time, so loading
     must be prefetch-driven off a `<$name>` scan, not demand-driven at lookup;
  3. it builds on SI11a's manifest/asset shape.

Say plainly that SI11 was **split on 2026-07-31**, so a reader who remembers the
original ID finds both halves.

### 2. Mission summary

Append to [`../README.md`](../README.md): tasks completed vs planned, decisions
made and any flagged for review, gate results, known issues and follow-ups,
deviations from the brief.

## Write-set — write NOTHING outside these

- `planning/mission-index.md`
- `plans/si11a-per-resource-stdlib-fetch/README.md`

## Read-set

- `plans/si11a-per-resource-stdlib-fetch/decision-journal.md` — everything
  recorded during execution; the primary source for the summary and for T8's
  measured numbers
- `planning/mission-index.md` § SI11, § SI8, § SI9 — the row format, and how a
  closed row reads
- [`../decisions.md#adr-6`](../decisions.md#adr-6) — what must be stated

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — carry the measured numbers, state what is not
  solved

## Interface contract

None produced.

## Acceptance criteria

1. Given `planning/mission-index.md`, when SI11a is read, then it says `done`,
   names what shipped, and carries T8's **measured** result — not the brief's
   projected 99.7%.
2. Given the same file, then **SI11b exists as its own row** with its
   blocked-by, its three distinguishing constraints, and its measured
   justification (1.06 MB, 2,078 sprites, one file).
3. Given a reader who knows only "SI11", then the index tells them it was split
   and where both halves are.
4. Given this brief's README, then it carries a mission summary with gate
   results, decisions flagged for review, and follow-ups.
5. Given SI10 (class-engine `measureUsecase` coupling), then it is still listed
   as open — this mission does not touch it.

## Quality bar

All four gates exit 0 — documentation changes should not move them, and if they
do, something is wrong. 389 goldens byte-identical; 54-fixture ratchet
zero-diff.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit. Documentation only.

## Boundaries

**Always:** amend dated sections rather than rewriting them, matching how SI9
and SI8 did it.

**Never:** retro-edit a historical measurement in `mission-index.md`. Dated
numbers were true when taken.

## Method rules

1. **Trace dependency cascades TWO levels** — check what cites the SI11 row
   before replacing it.
2. **Verify every number you write from the journal**, not from memory or from
   this brief's projections.

## Commit

One commit: `docs(si11a): close the mission; register SI11b`
