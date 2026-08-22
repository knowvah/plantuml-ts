# T1 — Fix the `:429` omission and name the constant

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/test-budget-invariant`. **You write no `src/`** — stop 1.

`tests/unit/stdlib-packages.test.ts` has two sibling tests in one `describe`,
both calling `npmPackDryRun` (which holds the build lock **and** spawns
`npm pack --dry-run`):

- `:408-428` — `packages/$packageDir stays under $ceilingMb MB`, budget
  **120,000 ms**, runs 1048 ms quiet, has never failed.
- `:429` — `packages/stdlib-all ships a LICENSE...`, **no third argument**, so
  it inherits vitest's 5,000 ms default. Runs 187 ms quiet. **This is the test
  that fails under concurrent load.**

SI35 raised the budget on one and missed the adjacent one. The 5x slower
sibling survives because it has 24x the budget.

## Task
1. Give `:429` an explicit budget, using the constant from step 2. Add a short
   comment saying **why** it needs one — it holds the build lock and spawns a
   subprocess, so its budget must exceed the lock's own `maxWaitMs` or the
   lock's error can never surface (see `diagrams/budget-invariant.md`).
2. Extract the **42** occurrences of `120_000`/`120000` to **one named
   constant** in a shared test helper (name and file are yours — push-forward).
   Its doc comment must carry the derivation: lock `maxWaitMs` 30,000 +
   measured worst critical section 20,029 ms (`.agent-notes/lsh-T4.md`) +
   margin. **The value stays 120,000** (D3).
3. **Verify, do not assume,** which of the 42 sites are SI35-era lock-pressure
   budgets. `tests/unit/class/class-geo-builders.test.ts` carries exactly one
   and is very likely unrelated — check it, and if it is unrelated, **leave it
   alone and journal that decision**.

The 10 files carrying `120_000`, by count: `stdlib-eager-omission` (12),
`stdlib-all-exports` (11), `stdlib-packages` (4), `stdlib-package-files` (4),
`stdlib-dts-import-specifier` (3), `stdlib-remote-e2e` (3),
`sprite-package-files` (2), `class/class-geo-builders` (1),
`build-stdlib-packages` (1), `build-stdlib-lock` (1).

Read-only git only; no commits.

## Write-set
- A new shared test helper holding the constant (your naming)
- The test files above that genuinely carry an SI35-era budget
- `.agent-notes/tbi-T1.md`

Do **not** touch `tests/architecture/*` — that is T3's and T4's.

## Read-set
- `tests/unit/stdlib-packages.test.ts:400-440` — the two siblings and the
  existing 120,000 comment, which already documents the failure mode
- `scripts/build-stdlib-packages/build-lock.ts` — `DEFAULT_MAX_WAIT_MS`
- `.agent-notes/lsh-T4.md` — max hold 20,029 ms
- `plans/test-budget-invariant/decisions.md` — D3, D4
- `plans/test-budget-invariant/diagrams/budget-invariant.md`

## Architecture decisions (LOCKED — conflict is stop 7)
- **D3** — one named constant; **the value stays 120,000**. Lowering it, or
  proposing to, is **stop 2**.
- **D4** — no global `testTimeout` in `vitest.config.ts`. Adding one is
  **stop 4**.

## Interface contracts
Export one constant (name yours) of type `number`, value `120_000`, from a file
under `tests/helpers/`. T3 imports it to derive its threshold comparison, so
it must be importable from `tests/architecture/`.

## Acceptance
- Given `:429`, when it runs, then it declares an explicit budget from the
  shared constant, with a comment stating why.
- Given a grep for `120_000`/`120000` across `tests/`, then the only remaining
  literal is the constant's own definition, plus any site proven unrelated and
  journaled.
- Given the constant, then its doc comment states the derivation and cites
  `.agent-notes/lsh-T4.md`.
- Given `git diff`, then `vitest.config.ts` is unmodified.
- Given every existing test, then all still pass unmodified in intent.

## Observability requirements
N/A — test infrastructure, no production SLIs.

## Rollback
**Reversible.** A constant and its call sites; reverting restores the literals.

## Quality bar
Four gates green. Complexity hook blocks on write: >500 lines/file,
>30 NLOC/function, CCN >10, >5 params. Report `npm test` duration with the
load (`uptime` **and** `ps -Aceo pcpu,comm | grep -E
'suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent'`); wait for both
daemon families **and** the 1-minute load average to settle first. No ceiling.

## Boundaries
- **Always:** verify a site is SI35-era before rewriting it; keep the value at
  120,000.
- **Never:** touch `src/`; lower the value; add a global `testTimeout`; touch
  `tests/architecture/*`; weaken a test; run any git write command.

## Report (<=250 tokens)
The `:429` fix; the constant's name, location and derivation; the count of
sites converted and any site deliberately left alone with the reason; the four
gates. No preamble.
