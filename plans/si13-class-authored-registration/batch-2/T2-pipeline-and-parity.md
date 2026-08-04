# T2 — pipeline run, parity regeneration, drift report, eligibility

Orchestrator-inline procedure (long local ops + ADR-2/ADR-3 judgment).

## Steps

1. **Cache + aggregate.** `npx jiti scripts/dot-sync-report.ts class`.
   Verify on stderr/output that all five authored slugs are enumerated,
   obtain jar DOT into `test-results/dot-cache/class/<slug>/`, and appear
   in the aggregate — NOT silently skipped (SI9 ADR-2's hazard was
   `ensureCanonical`'s any-`.svg` early return + `buildAgg`'s tag filter;
   SI9 made freshness per-slug — VERIFY the fix covers the class path
   live; stop condition 6 if any slug is dropped). Local canonicals:
   768 SVGs exist for 718 corpus fixtures; the five authored ones need
   fresh canonicals + `data-diagram-type` tags.
2. **Survey.** `SVG_PARITY_CONCURRENCY=2 npx jiti
   scripts/svg-parity-survey.ts --out
   tests/oracle/svg-conformance/parity-class.json class`. Confirm the JSON
   summary; expected 723 rows (718 + 5).
3. **Drift breakdown (ADR-2, before committing).** Diff old vs new
   parity-class.json with a scratchpad script: rows moved, deltas
   shrank/grew, `dotEqual` flips, verdict transitions (full matrix).
   ANY true→false flip or verdict downgrade on a pre-existing row → STOP
   (condition 4). Upgrades/shrinks: journal the breakdown, proceed.
4. **Eligibility (ADR-3).** For each of the five authored fixtures:
   record fresh `dotEqual` + verdict from the new parity, and the current
   diff count via `renderFixtureClass` + `DeterministicMeasurer`
   (scratchpad script or the pinned test's own numbers). Any fixture with
   zero diffs AND `dotEqual: true` → append to
   `oracle/goldens/svg-class/ratchet.json` with `source: "authored"` and
   today's `addedAt`; expected outcome is zero additions — record
   honestly either way. `class-missing-label-URL-SVG-0`'s state is
   UNKNOWN today — this step produces its first measurement.
5. **Doc comment.** Correct `class.golden.ratchet.test.ts`'s stale
   "`parity-class.json` … currently an unsurveyed placeholder" comment to
   describe the surveyed reality and the authored-registration path.
6. Full gates; commit (one commit; parity + conditional ratchet + doc
   comment are one logical unit — the registration landing).

## Write-set

- `tests/oracle/svg-conformance/parity-class.json`
- `oracle/goldens/svg-class/ratchet.json` (only if a fixture qualifies)
- `tests/oracle/svg-conformance/class.golden.ratchet.test.ts` (doc comment
  only — and AC counts if a ratchet add changes suite counts)

## Acceptance criteria

1. Given the fresh parity-class.json, when read, then all five authored
   slugs have entries with real surveyed values.
2. Given the drift breakdown, when journaled, then it has the SI9-style
   counts and zero regressions (or the mission stopped).
3. Given `npm test` (real exit code), when run, then exit 0 — including
   the class ratchet suite over whatever manifest resulted.

## Rollback

Reversible — revert the commit; local caches are gitignored.

## Commit

`feat(T2): survey authored class fixtures into parity-class.json`
(body carries the drift breakdown summary and eligibility outcomes).
