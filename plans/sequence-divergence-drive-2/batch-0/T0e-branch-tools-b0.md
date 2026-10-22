# T0e — branch, tools, b0

Agent: orchestrator (main checkout). Commit:
`chore(sdd2-T0e): branch, tools and b0 reference`.

## Steps
1. `git switch -c feat/sequence-divergence-drive-2` from main `b34120ea9`
   (or the current main tip — journal which). Commit the brief first:
   `docs(sdd2): mission brief`.
2. Copy sdd1's tools: `cp -R plans/sequence-divergence-drive/tools/
   plans/sequence-divergence-drive-2/tools`; drop `classify-scratch.mts`.
   In `pin-goldens.mts` set `MISSION = 'sequence-divergence-drive-2'`;
   update the usage comments' paths; fix `pin-goldens.test.mts` to match.
   Run the tools' own tests (`npx vitest run --config $T/vitest.config.mts`).
3. `npx tsx $T/svg-hashes.mts $M/b0-hashes.json` (pre-split reference, both
   paths).
4. `bash $M/gates.sh b0-gates`; `npx tsx $T/classify.mts $M/b0-classify.json`;
   survey sequence into `$M/b0-survey.json` (record wall-clock + `uptime` —
   the stop-17 reference); `bash $M/chain.sh b0-eng`.
5. Check b0 against planning: zero 419 · paint 4 · geometry 539 · structural
   166 · error 13 · Σ 73273. Any difference: journal it with its mechanism
   (main drift since `b34120ea9`), b0 stays the reference.
6. Seed `fixtures.md`: one row per non-zero b0 row, `family` from the batch
   specs' target lists (research reports name the slugs); rows no spec names
   get `T5?`.

## Write-set
`plans/sequence-divergence-drive-2/**` (tools, measurements, ledger,
journal).

## Acceptance
- Given the tools copy, then its tests pass and `pin-goldens.mts` writes
  `sequence-divergence-drive-2` provenance.
- Given b0, then the cohort counts match planning or the delta is journaled.
- Given `fixtures.md`, then every non-zero b0 row has a family.

Observability: N/A. Rollback: Reversible.
