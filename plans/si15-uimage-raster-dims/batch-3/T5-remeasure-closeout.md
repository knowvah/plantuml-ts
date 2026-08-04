# T5 — full-family re-measure, backlog pins, close-out

## Context

T1 fixed the footprint raster measurement, T3 the emission rounding, T2
swept the dead code, T4 resolved or filed the ink-offset observation. This
task verifies the whole mission's claims by measurement and closes the
books. The tracking convention (user decision 2026-07-27): when a fix
lands, delete the cleared backlog pin in the same change; `Closes #26` on
exactly one fix commit.

## Task

1. Run `npx jiti scripts/measure-description-size-deltas.ts` on the settled
   tree. Compare against the SI14 baseline (320/351, sprite bucket 5,
   widened 0). For every fixture that became conformant, delete its pin
   from `oracle/goldens/description/size-backlog.json`. `widened` must be
   0; bucket labels are hypotheses — verify a sample of newly-conformant
   fixtures actually render jar-identical before deleting their pins.
2. Confirm the final `class-usecase-inline-sprite` pin set matches what T3
   left (expected survivors: `image/@y`/`text/@y` 0.5794 descent family
   ONLY, plus whatever viewBox/width residual measurement shows). Confirm
   `class-allowmixing-usecase-mix` is untouched (2 entries).
3. Cold-tree verification: `rm -rf packages/*/assets && npm test`, TWICE;
   plus `npx jiti scripts/vendor-stdlib.ts --verify` (34,587 verbatim);
   plus typecheck/lint/build.
4. Update `planning/mission-index.md`: SI15 row → done, with the measured
   summary (what closed, what remains, T4's outcome). If T4 filed a new
   finding, add its row + verify the GH issue exists.
5. Append the mission summary to
   `plans/si15-uimage-raster-dims/README.md` (tasks completed vs planned,
   decisions count, gate results, known follow-ups) and mark all batch
   checkboxes.

## Write-set

- `oracle/goldens/description/size-backlog.json`
- `planning/mission-index.md`
- `plans/si15-uimage-raster-dims/README.md`, `decision-journal.md`
- `plans/si15-uimage-raster-dims/batch-*/overview.md` (checkboxes)

## Read-set

- `plans/si15-uimage-raster-dims/decision-journal.md` (whole)
- `oracle/goldens/description/size-backlog.json`
- `.agent-notes/si15-ink-offset.md` (T4's outcome)

## Acceptance criteria

1. Given the size-deltas run, when compared to baseline, then `widened 0`
   and every deleted pin's fixture verified conformant.
2. Given two cold-tree `npm test` runs, when run, then both exit 0 with
   identical counts.
3. Given the mission-index SI15 row, when read, then it records measured
   outcomes (numbers, not estimates) including any honest residuals.

## Quality bar

All gates green on a cold tree before the mission-complete claim.

## Boundaries

**Always:** measured numbers in all close-out docs. **Ask first:** any
follow-up scope beyond deleting cleared pins. **Never:** moving a pin
instead of deleting it; marking done with a failing gate.

## Observability

N/A.

## Rollback

Reversible.

## Commit

`docs(T5): close out SI15 — re-measured family, cleared backlog pins`
