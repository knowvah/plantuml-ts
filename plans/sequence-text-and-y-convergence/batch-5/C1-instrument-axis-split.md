# C1 — split the distance instrument by axis

## Context

`scripts/sequence-geometry-distance.ts` buckets by attribute NAME, so `points`
and `d` — the second and fifth largest line items — fold both axes into one
number. Split on index parity, which is exact because points are `x,y` pairs:

```
points Y   287 405   (76.1%)
points X    90 187   (23.9%)
```

**The per-attribute table the previous mission gated on understated the Y axis
by roughly 287 000.** A Y mission gated on that table cannot see three quarters
of its own largest component (D7).

> **Refreshed 2026-09-02.** The illustrative numbers above are from planning.
> `points` is now 1 676 411 in total and the flat Y/X split is roughly even
> (2 031 467 against 1 931 743), which is why the parity split matters MORE
> now, not less: with `points` and `d` folded in, no flat table can say which
> axis dominates. Measure, do not match.

## Task

Report `points` split by axis, and report `d` as explicitly mixed rather than
silently folded in.

## Write-set

- `scripts/sequence-geometry-distance.ts`
- `tests/unit/scripts/sequence-geometry-distance.test.ts`

## Read-set

- `scripts/sequence-geometry-distance.ts` — `attributeOf` and `distanceOf`.
- `tests/oracle/svg-conformance/compare.ts:310-340` — where `@points[i]`
  paths are constructed, which is what makes the parity split exact.

## Acceptance criteria

- Given a `@points[0]` diff, when bucketed, then it lands in an X bucket; given
  `@points[1]`, a Y bucket.
- Given a `@d[i]` diff, when bucketed, then it is labelled explicitly as mixed
  and is NOT counted toward either axis total.
- Given the corpus at head, when measured, then the split is RECORDED, not
  matched against a pin. The planning-time figures (`points Y` 287 405,
  `points X` 90 187) are **stale** — `plans/sequence-creole/` landed between
  the checkpoint and this batch and `points` is now 1 676 411 in total. Report
  the new split and state it as the number C2 derives against.
- Given the report, then it prints a per-axis subtotal alongside the existing
  per-attribute table.

## Observability

This task IS an observability change. It must not alter total distance.

## Rollback

**Reversible.** Instrument only; no rendering behaviour.

## Quality bar

All four gates. Total distance must be unchanged by this task.

## Commit

`feat(C1): split the distance instrument by axis`
