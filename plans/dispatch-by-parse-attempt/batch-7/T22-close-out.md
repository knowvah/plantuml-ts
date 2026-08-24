# T22 — re-pin baselines, record divergences, close out

## Context

Final task. The mission ([README](../README.md)) replaced regex routing with
upstream's parse-attempt dispatch and, in doing so, made every corpus fixture a
test of command-table coverage.

## Task

Four things.

**1. Re-pin baselines.** Any ratchet or diff baseline this mission legitimately
moved gets re-pinned **with its mechanism recorded**. A baseline moved without
a stated mechanism is [stop condition 2](../README.md#stop-conditions), not a
re-pin.

**2. Record divergences.** Where the routing and refusal decisions are correct
but our error *page* differs from the jar's, add a `DIVERGENCES.md` entry.
These are accepted ([push-forward](../README.md#push-forward-without-asking)),
not defects — but they must be written down, not left implicit.

**3. Write the mission summary** at the bottom of `README.md`, following the
shape `plans/routing-heuristic-repair/README.md` uses: a per-batch table, the
exit bar clause by clause with ✅/❌, and a **Residual** section giving every
unclosed item a named mechanism and a destination.

**4. Update `planning/next-missions.md`** — correct its "≥13 engines" sizing of
this mission (`:611-620`), which this mission's own exploration disproved, and
file any follow-on the residual names.

## Write-set

- ratchet / diff baseline JSONs
- `DIVERGENCES.md`
- `plans/dispatch-by-parse-attempt/README.md` (summary appended)
- `plans/dispatch-by-parse-attempt/decision-journal.md`
- `planning/next-missions.md`

## Read-set

- `decision-journal.md` — every row this mission wrote
- `plans/routing-heuristic-repair/README.md` — the close-out shape to follow
- all four SLI readings from T12 and batches 4–6

## Acceptance criteria

1. *Given* every moved baseline, *when* reviewed, *then* each carries a
   journaled mechanism; none is a bare re-pin
2. *Given* the exit bar, *when* summarised, *then* each clause is marked met or
   not met, and every unmet clause names why and where it goes next
3. *Given* the residual, *when* listed, *then* every item carries a mechanism
   and a destination mission — never "hard" or "out of scope" without evidence
4. *Given* `planning/next-missions.md`, *when* read after this task, *then* its
   sizing of this mission matches what was measured
5. *Given* all four gates, *when* run on the full branch, *then* all pass

## Observability

Final reading of all four SLIs, recorded in the summary.

## Rollback

Reversible — documentation and baselines only.

## Quality bar

All four gates green on the full feature branch. The summary must be honest
about what was **not** achieved; the predecessor mission's close-out is the
standard — it recorded its own exit bar as unmet on one clause, deliberately,
with the reason.

## Boundaries

- **Always:** give every residual a mechanism and a destination
- **Never:** re-pin a baseline without a mechanism; claim an unmet clause as
  met; run Prettier

## Commit

`docs(T22): close out dispatch-by-parse-attempt`
