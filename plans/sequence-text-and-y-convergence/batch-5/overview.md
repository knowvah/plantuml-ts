# Batch 5 — the Y axis, and close-out

> **HARD CHECKPOINT.** Do not begin this batch autonomously. Phase C's
> derivation reads numbers that only exist once A6 has recorded them (D6), and
> the correct grouping of vertical terms is not knowable before then. Report
> after batch 4 and wait.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| C1 | split the instrument by axis | typescript-pro | `sequence-geometry-distance.ts`, tests | A6 | [ ] |
| C2 | DERIVE every vertical term from the Java | typescript-pro | `findings/vertical-terms.md` | C1 | [ ] |
| C3 | APPLY what C2 proved, as one change | typescript-pro | per C2 | C2 | [ ] |
| C4 | adjudicate, re-pin once, close out | typescript-pro | baselines, census, README | C3 | [ ] |

C1 and C2 are sequential: C2's derivation is written against an axis-split
table.

## Why C3 is one task and not five

The probe that motivated this brief applied the vertical document margin —
correctly derived, upstream-cited — **alone**, and total distance ROSE by
35 145 while diff count FELL by 6 447. Top edges moved onto the jar's; every
bottom edge and extent moved off. The document was already 10 short, so +10 top
and +5 bottom overshot.

That is the third time this engine has shown a compensating-error pair: Batch
3's head row exposed this very margin, Batch 5's origin exposed clipped exo
arrows, Batch 7's constraint solve scored worse until the label font landed
with it. **The Y axis is a batch structure, not a constant**, and C3 lands the
terms C2 proved together or not at all.
