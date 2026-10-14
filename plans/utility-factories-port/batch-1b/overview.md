# Batch 1b: sudoku, version/license, donors+skinparameters, eggs+dedication

All tasks run in parallel worktrees (disjoint write-sets); 1a and 1b may run together. None registers its plugin — T2a does, in upstream order. Close with the standard procedure (`../close-procedure.md`); with no plugin registered the survey cannot move, so the close is gates + journal + an all-engine survey proving 0 movers.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1e](T1e-sudoku.md) | `sudoku/` (DLX solver + graphics) | typescript-pro (opus) | `src/diagrams/sudoku/**` | batch 0 | DROPPED (D13) |
| [T1f](T1f-version.md) | `version/` (license, version, about/authors, stdlib) | typescript-pro (opus) | `src/diagrams/version/**` (except T0e's `stdlib-catalog.ts`) | batch 0 | [x] |
| [T1g](T1g-donors.md) | `PSystemDonors` + `PSystemSkinparameterList` | typescript-pro (sonnet) | `src/diagrams/donors/{PSystemDonors,PSystemDonorsFactory,PSystemSkinparameterList,PSystemSkinparameterListFactory}.ts`, `tests/fixtures/utility/{donors,skinparameters}.*` | batch 0 | [x] |
| [T1h](T1h-eggs.md) | eggs + dedication | typescript-pro (opus) | `src/diagrams/eggs/**` (except T1b's `PSystemColors*`), `src/diagrams/dedication/**`, `tests/fixtures/utility/{apple,rip}*` | batch 0 | [x] |
| [T1i](T1i-utility-assets.md) | utility image assets: store builder, egg images out of the bundle, harness = survey stores (added b1, journal row 25) | typescript-pro (sonnet) | see spec | T1h | [x] |

See `../batch-1a/overview.md` "As landed" for the batch-0 contracts.
