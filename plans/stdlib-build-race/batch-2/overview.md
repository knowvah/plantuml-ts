# Batch 2 — Up-to-date skip · globalSetup doc (PARALLEL)

The only parallel batch in this mission. Write-sets are disjoint: T2 owns
`scripts/build-stdlib-packages.ts`, T3 owns
`tests/helpers/build-stdlib-globalsetup.ts`.

T2 is half of the fix (D3) and lands first because the lock in Batch 3 wraps
its predicate. **T2 alone does not close the race** — Run B can still observe
Run A's partial tree, judge it stale and delete it. Do not expect T1's guarded
repro to pass after this batch; it should still fail.

T3 is independent of the outcome of the fix and would be worth doing even if
T0 had disproved the hypothesis (D5).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Content-derived up-to-date skip | typescript-pro (sonnet) | `scripts/build-stdlib-packages.ts`, `tests/unit/build-stdlib-packages.test.ts`, `.agent-notes/sre-T2.md` | T0 | [ ] |
| T3 | Correct the globalSetup doc comment | typescript-pro (sonnet) | `tests/helpers/build-stdlib-globalsetup.ts`, `.agent-notes/sre-T3.md` | T0 | [ ] |
