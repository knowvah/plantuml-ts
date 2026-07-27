# T4 — Re-baseline the size backlog (batch-end)

## Context
`oracle/goldens/description/size-backlog.json` pins each non-conformant
fixture's `maxSizeDeltaIn` (shrink-only; absent slug ⇒ conformant required). T1–
T3 change ~18 fixtures' sizes — some flip to conformant (delete their entries),
some improve (tighten their pins). Two may surface as re-pins to be resolved in
Batch 2 (`zotiru-33` scoped MinimumWidth; `fariba-82` residual) — leave those
pinned at their true delta with the `_doc` noting they are Batch-2 follow-ups,
NOT regressions.

## Task
Run the measurement harness on the post-T1–T3 tree, regenerate the backlog
(preserve/refresh the `_doc`), and confirm the ratchet holds. Deleted entries =
newly conformant fixtures.

## Read-set
- `scripts/measure-description-size-deltas.ts` — the harness (per-fixture JSON +
  summary; exit 2 on widened).
- `oracle/goldens/description/size-backlog.json` — current pins + `_doc` format.

## Write-set
- `oracle/goldens/description/size-backlog.json`

## Procedure
1. `npx tsx scripts/measure-description-size-deltas.ts > /tmp/run.jsonl`.
2. Regenerate the backlog from the non-conformant rows (mirror the `_doc`
   convention; note the S1L-b flips and any Batch-2-bound re-pins with reasons).
3. Re-run the harness → exit 0 (zero widened).
4. `npx vitest run tests/oracle/description-parity.ratchet.test.ts` → 351 pass.

## Acceptance criteria
- Given the Batch-1 code, when the harness runs, then exit 0 and
  `dexigu-24`/`kenece-24`/`zifaji-87` are ABSENT from the backlog (conformant).
- Given the parity ratchet, when run, then all 351 pass — no error diagrams,
  structure EQUAL, every size pin holds.
- Given `dot-sync-report.ts component usecase`, then structural EQUAL is
  unchanged (262/262 + 90/90).

## Commit
`chore(description): re-baseline size-backlog after S1L-b core (T4)`.
