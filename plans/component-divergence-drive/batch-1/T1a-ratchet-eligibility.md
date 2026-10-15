# T1a — description ratchet eligibility from per-type survey files (D4)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T1a`.

## Context
- The svg-description golden ratchet only admits a row whose `dotEqual` is true in the LEGACY
  `tests/oracle/svg-conformance/parity.json`. That file dates from 2026-09-21 and is stale; the
  per-type `parity-<type>.json` files are current.
- Where the stale read happens:
  - `tests/oracle/svg-conformance/description.golden.ratchet.test.ts:73,185-207`
  - the Add rule in `oracle/goldens/svg-description/README.md:54-62`
  - dsw's pin script (`measurements/pin-description.mts`, which reads `legacyDotEqual`)
- The ratchet's TYPES are component/usecase only. dsw left 56 conformant unknown-DESCRIPTION rows
  and 2 conformant c4 rows with no byte-exact home, and skipped 10 conformant rows
  (`plans/description-svek-wrappers/measurements/b4-pin-dryrun.txt`).

## Task
1. TDD. Change the ratchet test's eligibility check to read `parity-<type>.json` (the tightened
   `dotEqual`). Keep the guard that a known non-dotEqual row exists (`:196-207`): pick a real one
   from the per-type file and name it.
2. Extend the eligible types to:
   - `unknown` rows whose `oracle/goldens/svg-conformance/routing-baseline.json` `ourType` is
     `DESCRIPTION`
   - `c4`
   The golden layout `oracle/goldens/svg-description/<type>/<slug>/` already keys by type. Confirm
   that `renderFixture` renders unknown/c4 rows the way the survey does, and quote the dispatch.
3. Update the README Add rule to say the same thing.
4. Update `measurements/pin-description.mts` to match:
   - read the per-type `dotEqual`
   - use the TYPES from step 2
   - for unknown rows, apply the routing-baseline `ourType` filter
   Its dry run must print, for each of the 10 dsw-skipped rows, why it is or is not now eligible.
5. Do NOT pin anything. Pinning is the close's step 9.

## Write-set
- `tests/oracle/svg-conformance/description.golden.ratchet.test.ts`
- `oracle/goldens/svg-description/README.md`
- `plans/component-divergence-drive/measurements/pin-description.mts`
- a unit test for any pure helper you extract (`tests/unit/oracle/**`)

## Acceptance
- Given the current 89 pins, when the ratchet runs with the new eligibility, then all 89 stay green.
  If a pin is now ineligible, report it; do not drop it (stop 6).
- Given the pin script's dry run against `plans/description-svek-wrappers/measurements/b5-eng`, then
  it lists the candidates per type (component, usecase, unknown-DESCRIPTION, c4), and a reason for
  each of the 10 previously skipped rows.
- Given a row that is `conformant` but `dotEqual: false` in its per-type file, then it is not
  eligible, and a test pins that.

**Observability:** the ratchet pin count is an SLI; report the dry-run candidate count.
**Rollback:** Reversible.
