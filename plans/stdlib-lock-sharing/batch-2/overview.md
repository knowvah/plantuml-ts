# Batch 2 — Wire readers and the builder (PARALLEL)

Two tasks, disjoint write-sets, both depending on T1's shared mode existing.

The 8 converted consumer test files are **not** in either write-set. They call
`withStdlibBuildLock`, so the mode switch happens in one place (D4). If a task
finds itself needing to edit a consumer file, that is a signal the helper's
API is wrong — stop and journal it, do not widen the write-set.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Readers acquire shared | typescript-pro (sonnet) | `tests/helpers/with-stdlib-build-lock.ts`, `tests/unit/with-stdlib-build-lock.test.ts` | T1 | [ ] |
| T3 | Builder acquires exclusive explicitly; fitness function still holds | typescript-pro (sonnet) | `scripts/build-stdlib-packages.ts`, `tests/architecture/stdlib-read-lock.test.ts` | T1 | [ ] |
