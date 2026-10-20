# T-exit — exit bar (D10)

1. On the branch head: `npx tsx $T/classify.mts $M/final-classify.json`;
   `npm run svg:survey -- sequence --out $M/final-survey.json`; every other
   engine into `$M/final-eng/`. Diff each against `b0*`.
2. Add a `## Status` table to `README.md`: one row per D10 clause (pins vs
   250; paint-only rows pinned / open-with-mechanism / open-without) plus
   survey conformant, Σ ws b0 → final, cohort counts b0 → final, and
   all-engine conformant losses (must be 0). A miss on pins is acceptable
   only when every open paint-only row has a mechanism and an sdd2 owner.
3. `fixtures.md`: every row has a `final` — `pinned (<commit>)` or
   `open -> sdd2 (<mechanism, Java file:line>)`. A row with neither is a
   stop.
4. `npm run parity:dashboard`; `npm run catalog`; `bash $M/gates.sh final`;
   commit `chore(sdd1-exit): D10 exit bar — <pins> pinned, Σ <score>`.

Write-set: `README.md`, `measurements/final*`, `fixtures.md`,
`docs/parity-report.md`, `docs/catalog.md`.

Acceptance:
- Given `final-classify.json`, then pins = `ratchet.json` length and every
  pinned slug is zero-diff on both paths.
- Given the all-engine diff b0 → final, then 0 conformant losses.
- Given `fixtures.md`, then no row lacks a `final`.

Observability: N/A (measurement task). Rollback: Reversible.
