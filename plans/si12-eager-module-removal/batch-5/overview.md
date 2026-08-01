# Batch 5 — Close the cold-tree asset race

One task, added mid-mission (maintainer-approved 2026-08-01 under stop
condition 1). **Runs before batch 3**, because T6 and T7 quote T5's measured
figure and that figure is only trustworthy once this lands.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | `globalSetup` populates `packages/*/assets/` | typescript-pro | `tests/helpers/build-stdlib-globalsetup.ts`, `tests/unit/stdlib-packages.test.ts` | T4, T5 | [ ] |

## Why this exists

SI12 introduced a race that batch 2's warm-tree gates could not see.
`packages/*/assets/` is gitignored and populated only by each package's
`copy-assets.mjs` (`prepack`). Before this mission exactly ONE test file
touched it. Batch 2 added a second writer (T4's `beforeAll`) and a reader
(T5's baseline sum) — three files across parallel vitest workers.

Reproduced 3/3 on a cold tree: two test files fail, and T5's baseline — the
mission's headline evidence — comes out **8,195,997 / 7,399,179 /
8,315,921 B** across runs instead of **19,850,300 B**, reporting
99.256% / 99.176% / 99.267% instead of 99.693%.

`copy-assets.mjs`'s `isUpToDate()` guard is file-COUNT based, so it
short-circuits only when the copy is already complete; during any partial
state it returns false and the script `rmSync`s a tree another worker is
mid-copy or mid-read of.

This is the same failure class, with the same fix, that `generated/` already
carries — see `build-stdlib-globalsetup.ts`'s own header documenting the
SI11a T8 instance.

## Batch exit criteria

- **Cold** full suite green 3× in a row (`rm -rf packages/*/assets` first)
- T5's logged baseline is `19,850,300 B` / `99.693%` on every cold run
- All four standard gates exit 0; `vendor-stdlib --verify` still 34,587
