# T-exit — exit bar (D10)

1. `measurements/final.json` (probe), `final-classify.json`, `final-survey.
   json`, `final-eng/` on the branch head; diff against `b0*`.
2. Fill the README `## Status` table: one row per D10 clause with the
   measurement and met/miss. A miss is acceptable only with every short row
   mechanised in `fixtures.md`.
3. `fixtures.md`: every row has a `final` (stop otherwise — set `open -> add3
   (<mechanism>)` where the mechanism is known and unfixed).
4. `npm run parity:dashboard`; `npm run catalog`; four gates; commit
   `chore(add2-exit): D10 exit bar — <pins> pinned, Σ <score>`.
5. The harness-parity test (D4) is green on the final head.

Write-set: `README.md`, `measurements/final*`, `fixtures.md`,
`docs/parity-report.md`, `docs/catalog.md`. Observability: N/A. Rollback:
Reversible.
