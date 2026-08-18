# T10 — Retire debt, close out

## Context

All moves have landed (T1–T9). `tests/architecture/layering.test.ts` (T0)
still carries `KNOWN_DEBT` entries; per D5 a stale entry fails the test, so if
every earlier task did its job the test is ALREADY failing on debt — that is
the signal this task consumes.

## Task

1. `layering.test.ts`: `KNOWN_DEBT = []`; add an assertion that it is empty
   (so it cannot silently regrow); ALLOWLIST unchanged (registry, hcl|yaml→
   json). Run it.
2. Full evidence, clean tree: `npm run manifest -- --out /tmp/final.json` +
   `--diff` vs `test-results/shared-seam-baseline-manifest.json`; `dot-sync-report` ×5;
   `shape-match-report`; all ratchets (`npm test`). Score README exit bar
   1–5 clause by clause with the numbers.
3. `planning/next-missions.md §2`: mark executed (SI27, date, commit range);
   list the deferred families verbatim from README as the follow-on queue
   (notes family, remove/restore + hide/show, DOT graph builders, `renderer-
   group`, cluster header/levels, description JSON wiring, `LeafSizingSubject`
   → `abel/Entity`).
4. `DIVERGENCES.md`: ONLY if T1 journalled a jar-ward fixture change — record
   it; otherwise do not touch.
5. `plans/shared-seam-extraction/README.md`: append the close-out summary
   (tasks done vs planned, decisions count + flagged, gate results, known
   issues/follow-ups); tick all batch checkboxes.

## Write-set

`tests/architecture/layering.test.ts`, `planning/next-missions.md`,
`DIVERGENCES.md` (conditional), `plans/shared-seam-extraction/README.md`.

## Read-set

- `decision-journal.md` (whole), README exit bar + starting state, T0's test.

## Acceptance criteria

- Given the final tree, when `layering.test.ts` runs, then it passes with an
  empty `KNOWN_DEBT` and no offender outside ALLOWLIST.
- Given the final manifest, then `0 fixtures differ` vs baseline, or every
  difference is journalled jar-ward.
- Given `dot-sync-report` ×5, then EQUAL counts equal T0's.

## Quality bar

4 gates green. Commit `docs(T10): close shared-seam-extraction — SI27 row,
debt retired` (test change may be its own `test(T10):` commit).

## Observability

N/A.

## Rollback

Reversible.
