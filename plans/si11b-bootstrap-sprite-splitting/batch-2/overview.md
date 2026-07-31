# Batch 2 — Route the scan into prefetch; ship the fragments

Two tasks, parallel. Disjoint write-sets; neither consumes the other.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Route the `<$name>` scan into the prefetch walk | typescript-pro | `src/core/include-resolver.ts`, `tests/unit/sprite-split-prefetch.test.ts` | T2, T3 | [ ] |
| T5 | Ship fragments + the split subpath in `@plantuml-ts/stdlib` | typescript-pro | `packages/stdlib/**`, `tests/unit/sprite-package-files.test.ts` | T1 | [ ] |

## Where the mission's value lands

**T4 is the task that makes this mission real.** Until it lands, the splitter
produces fragments nobody fetches and the scan finds names nobody uses — the
same relationship SI11a's T3 had to its T1/T2.

## Batch exit criteria

- All quality gates green, `vendor-stdlib --verify` still verbatim
- A 3-sprite diagram fetches **exactly 3** fragments — proven by call count
- With no split registration, behavior is **identical** to the eager path
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

## Two packaging traps T5 must avoid — both cost SI11a a stop

1. **A package whose `files` array omits the fragments passes every local test
   and 404s for every consumer after publish.** Resolve the globs (via
   `npm pack --dry-run --json`), never eyeball the array.
2. **Only ONE test file may invoke `npm pack` per package, and no test may
   rebuild the generated tree.** SI11a spent a stop-condition-13 escalation on
   two nested races: concurrent `npm pack` runs whose `prepack` hooks deleted
   the asset tree from under each other, and three test files each calling
   `buildStdlibPackages()` while others imported from it. The generated tree
   is now built once in vitest `globalSetup`
   (`tests/helpers/build-stdlib-globalsetup.ts`) — **do not add a
   `beforeAll` rebuild.**

## Sequencing note for the orchestrator

Both can move `npm test`. Run gates after both return and attribute any
failure before committing — commit per task, not per batch.
