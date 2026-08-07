# T8 — Re-partition all 26 fixtures by true mechanism

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java). Batch 1
produced seven findings files, one per classifier bucket, each holding a
per-fixture mechanism record on
[findings/SCHEMA.md](../findings/SCHEMA.md).

The classifier buckets those files are named after are **first-match labels,
not causes** (ADR-3). The whole point of this mission is that they cut across
the real mechanism boundaries: the historical triage claims 4 of the nine
`container-cluster` fixtures are actually sprite-caused, and no single Batch 1
agent could see that from inside its own bucket.

You are the first reader with all 26 records in one context. Your output is
what the **fix mission** batches on, so its quality determines whether that
mission assigns the right files to the right agents.

## Task

Produce `findings/SYNTHESIS.md`: a re-partition of all 26 fixtures by true
mechanism, with the fix mission's batching already implied by it. **No source
changes** (ADR-2).

1. **Read all seven findings files.** Build the full record set.
2. **Group by mechanism, not by bucket.** Two fixtures belong to one group iff
   one code change at one origin fixes both. Use `sharedCauseWith` as input,
   but verify the grouping is consistent — if T1 claims a shared cause with a
   T2 fixture and T2 does not reciprocate, resolve it (re-read both records;
   if genuinely contradictory, flag it rather than picking a side).
3. **Check the identical-delta pairs are reconciled.** `kovaxi-11`/`zidebi-71`
   (0.772), `lesori-32`/`ravodu-50` (0.2429), `loroto-06`/`toxine-81` (0.0833).
   Each pair either shares a group or carries an evidenced refutation. A pair
   that is neither is an incomplete diagnosis — flag it.
4. **Compute write-set overlap between groups.** Two groups whose
   `proposedWriteSet` intersect cannot be parallel tasks in the fix mission.
   State the overlap explicitly — this is the single most actionable output
   for the next planner. `oracle/goldens/description/size-backlog.json` is
   touched by every group and is a known serialization point; name it once
   rather than flagging it per pair.
5. **List unresolved fixtures separately** with their `nextStep`. Do NOT fold
   them into a group or invent a mechanism to place them.
6. **List proposed divergences separately** (ADR-6) for maintainer ruling.
7. **Sanity-check the count.** 26 fixtures in, 26 out, each appearing exactly
   once across groups + unresolved + proposed-divergence.

## Write-set

- `plans/s1l-tail-diagnosis/findings/SYNTHESIS.md` — the deliverable
- `plans/s1l-tail-diagnosis/README.md` — tick the batch checkboxes only
- `plans/s1l-leaf-sizing/ledger.md` — **append** a close-out section; do not
  rewrite existing entries

Nothing under `src/` (ADR-2).

## Read-set

- All seven files in `plans/s1l-tail-diagnosis/findings/`
- `plans/s1l-tail-diagnosis/decisions.md` — ADR-3 and ADR-5 govern here
- `plans/s1l-tail-diagnosis/findings/SCHEMA.md`
- `oracle/goldens/description/size-backlog.json` — confirm the 26 slugs match
  the live non-conformant set minus the 4 excluded

## Interface contract

`SYNTHESIS.md` must open with a table the next planner can batch from
directly, before any prose:

```markdown
| Group | Mechanism (1 line) | Origin file:line | Fixtures | proposedWriteSet | Overlaps with |
|---|---|---|---|---|---|
```

Then, below it: unresolved fixtures, proposed divergences, and the
bucket-label → mechanism-group provenance map (which old label scattered
into which new groups — this is the evidence that ADR-3 was the right call,
or that it wasn't).

## Acceptance criteria

- **Given** the seven findings files, **when** synthesis completes, **then**
  all 26 fixtures appear exactly once across groups, unresolved, and
  proposed-divergence lists.
- **Given** two groups with intersecting `proposedWriteSet`, **when**
  recorded, **then** the overlap is named in the `Overlaps with` column so the
  fix mission cannot batch them in parallel by mistake.
- **Given** each identical-delta pair, **when** checked, **then** it either
  shares a group or carries an evidenced refutation; anything else is flagged
  as incomplete.
- **Given** a contradiction between two records' `sharedCauseWith`, **when**
  found, **then** it is flagged explicitly rather than silently resolved.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path appears.

## Quality bar

```sh
npm test
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only                                 # no src/ path
```

Capture `$?` directly; never pipe a gate.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Revert = delete `SYNTHESIS.md` and the ledger append.

## Boundaries

**Always:** preserve honest gaps — an unresolved fixture stays unresolved.
**Ask first:** if the synthesis implies the mission's scope was wrong (e.g.
most fixtures collapse into one mechanism, or the 26 turn out to be 20
mechanisms), surface that before writing the fix-mission recommendation.
**Never:** modify `src/`; invent a mechanism to place an unresolved fixture;
rewrite existing ledger entries; declare a divergence.

## Commit

`docs(T8): re-partition the description size tail by mechanism`.
