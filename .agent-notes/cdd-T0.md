# cdd-T0 — baseline + ELK ledger (class-divergence-drive, batch 0)

Written 2026-09-21.

## Observation: the ELK ledger entries are invisible to the dashboard join
- **Context**: writing the 7 `svg-class/<slug>` entries D10 mandates into
  `oracle/accepted-divergences.json`, then rendering the class survey
  through `npx jiti scripts/svg-parity-dashboard.ts --in
  tests/oracle/svg-conformance/parity-class.json --out <scratch>`.
- **Finding**: the ledger section prints `_(none matched)_`.
  `ledgerRows` (`scripts/svg-parity-dashboard.ts:161-171`) calls
  `matchesEntry(e, f.slug)` with the BARE survey slug
  (`cadutu-02-lazu601`), while every ledger id — the retired
  `bipudo` entry, the unit test's own injected sample at
  `tests/unit/scripts/svg-parity.test.ts:314`, and D10 — is
  `svg-<type>/<slug>`. The join never matched anything; it was only ever
  exercised with an empty `entries` array.
- **Impact**: `docs/parity-report.md` (`npm run parity:dashboard`,
  `scripts/parity-dashboard.ts`) has NO ledger join at all, and the one in
  `svg-parity-dashboard.ts` needs `svg-${f.type}/${f.slug}` (or both
  forms) before any declared divergence shows up anywhere. Out of T0's
  write-set; filed in `planning/next-missions.md` §5. T38 step 4 says
  "`match.id` still resolves" — read that as "the slug still exists in
  the corpus" until the join is fixed.
- **Confidence**: High (reproduced on the real ledger and the real
  `parity-class.json`).

## Observation: the two unpinned `oracle/goldens/svg-class/` dirs are authored, by design
- **Context**: T0 step 3 expected 318 golden dirs vs 314 pins.
- **Finding**: 316 dirs, 314 pins. The two extras,
  `class-actor-bare-no-allowmixing` and
  `class-inheritance-interface-assoc`, hold `in.puml` + `golden.svg`, come
  from no dot-cache slug, and are owned by
  `tests/oracle/svg-conformance/class-usecase-actor.test.ts`, which
  explains why they are outside `ratchet.json`'s manifest.
- **Impact**: not drift; no T38 action. The 3 `authored` pins in
  `ratchet.json` are a different set.
- **Confidence**: High.

## Observation: the mission tools run under `jiti`, not `tsx`
- **Context**: every `plans/class-divergence-drive/**` spec says
  `npx tsx tools/<x>.mts`.
- **Finding**: `tsx` is not installed (`node_modules/.bin` has `jiti`,
  `vitest`); every existing script and the diagnosis seed use `npx jiti`.
  `plans/` is also outside vitest `include`, both tsconfigs, the eslint
  paths and prettier, so the tools are checked only by their own
  `tools/README.md` recipe.
- **Impact**: read `npx tsx` as `npx jiti` in every close.md.
- **Confidence**: High.

## Observation: `npm run svg:survey class` writes the WRONG file
- **Context**: T0 step 1 / every `close.md` step 2 says `npm run
  svg:survey class` and then diffs `parity-class.json`.
- **Finding**: a positional type arg with no `--out` is the "single-job"
  path (`scripts/svg-parity-survey.ts:422-430`): it writes to
  `PARITY_OUT` = `tests/oracle/svg-conformance/parity.json`, the LEGACY
  component+usecase pin that the golden ratchets read for DOT
  eligibility. `parity-class.json` is untouched. I overwrote `parity.json`
  with class rows and restored it with `git checkout`.
- **Impact**: the class survey is `npm run svg:survey -- class --out
  tests/oracle/svg-conformance/parity-class.json` (~16 s wall, 6
  workers). A bare `npm run svg:survey` surveys every type into its own
  file but takes minutes. Check `git status tests/oracle/svg-conformance/`
  after every survey.
- **Confidence**: High.

## Observation: the census prints two passes; the ratchet metric is the SECOND block
- **Finding**: `npx jiti scripts/svg-conformance-census.ts class` prints
  a `jar`-measurer histogram FIRST (0 zero-diff, by construction) and the
  `DeterministicMeasurer (ratchet metric)` block second (414 zero-diff at
  baseline). `tail -6` reads the wrong block. It does not rewrite
  `census-class.json` unless the JSON mode flag is passed
  (`svg-conformance-census-json.ts`); `docs/parity-report.md`'s census
  column reads the committed JSON (2026-09-20, `993cc2ae`).
- **Confidence**: High.
