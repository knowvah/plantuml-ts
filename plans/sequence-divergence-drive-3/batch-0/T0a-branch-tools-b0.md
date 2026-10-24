# T0a — branch, tools, b0

Agent: orchestrator (main checkout). Commits: `docs(sdd3): mission brief`,
then `chore(sdd3-T0a): branch, tools and b0 reference`.

## Steps
1. `git switch -c feat/sequence-divergence-drive-3` from main (`5f954eeff`
   or the current tip — journal which; never a branch whose base moved since
   planning without journaling the drift). Commit the brief first; it
   includes the planning edit to `planning/next-missions.md` (LaTeX
   diagnosis item) if still uncommitted on main.
2. Copy sdd2's tools: `cp -R plans/sequence-divergence-drive-2/tools/.
   $T` (drop `node_modules`; re-link it as sdd2 did) and
   `cp plans/sequence-divergence-drive-2/measurements/{gates,chain,mkwt}.sh $M`.
   Rename every `sequence-divergence-drive-2`/`sdd2` path, branch and prefix
   to sdd3 (`MISSION = 'sequence-divergence-drive-3'` in `pin-goldens.mts`;
   its test's expected `$comment`; `mkwt.sh` branch + `sdd3-` prefix).
3. `svg-hashes.mts`: render the ratchet path with `sequenceFixtureOptions()`
   and `renderSync` with `{ assetStore: surveyAssetStore(), includeStore:
   fixtureIncludeStore() }` (the survey's stores); add an `--all` mode that
   hashes `renderSync` for every fixture under `test-results/dot-cache/*/`
   (all engines), keyed `<type>/<slug>`. Run the tools' own tests
   (`npx vitest run --config $T/vitest.config.mts`).
4. `npx tsx $T/svg-hashes.mts $M/b0-hashes.json` and
   `npx tsx $T/svg-hashes.mts --all $M/b0-hashes-all.json`.
5. `bash $M/gates.sh b0-gates`; `npx tsx $T/classify.mts $M/b0-classify.json`;
   survey sequence into `$M/b0-survey.json` (record wall-clock + `uptime` —
   the stop-15 reference); `bash $M/chain.sh b0-eng`. Wait for load < 8.
6. Check b0 against planning (`$M/planning-classify.json`): zero 1042 ·
   geometry 52 · structural 32 · paint-only 17 · Σ 3800. Any difference:
   journal it with its mechanism; b0 stays the reference.
7. Seed `fixtures.md` from `$M/planning-open-rows.tsv` (see its header).

## Write-set
`plans/sequence-divergence-drive-3/**`.

## Acceptance
- Given the tools copy, then its tests pass and `pin-goldens.mts` writes
  `sequence-divergence-drive-3` provenance.
- Given `--all`, then every cached fixture of every engine has a hash or a
  recorded error line, and a rerun on the same tree is identical.
- Given b0, then the cohort counts match planning or the delta is journaled.

Observability: N/A. Rollback: Reversible.
