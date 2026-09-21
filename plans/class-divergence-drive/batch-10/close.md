# Batch 10 close — superseded by T38

This batch's close procedure is not a separate task file. `T38-mission-
close-out.md` performs the standard batch-10 close (its Task step 1
mirrors `batch-9/close.md`'s 13 steps exactly, producing
`measurements/b10.json` and the `after batch 10` `fixtures.md` column) AND
extends it into the mission-wide close-out (`measurements/final.json`,
the `DIVERGENCES.md`/`oracle/accepted-divergences.json` audit,
`planning/next-missions.md` filings, the new `planning/mission-index.md`
row, `docs/parity-report.md` regeneration, and the `README.md`
close-out section) — see [`T38-mission-close-out.md`](T38-mission-close-out.md).

T38 is self-contained: read it, not this file, before executing batch
10's close. This file exists only so nothing looks for a missing
`close.md`.
