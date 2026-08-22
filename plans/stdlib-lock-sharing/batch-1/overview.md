# Batch 1 — Shared mode in the lock (SERIAL)

One task, sole owner of `build-lock.ts`. This is the mission's substance.

Split was considered and rejected: reader registry, writer priority and stale
reclamation all touch the same acquire/release loop, so two tasks would have
to write one file and run strictly serially anyway — with a broken
intermediate state between them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Shared mode: reader registry, writer intent/drain, stale reclaim, ownership-safe reader release (TDD) | typescript-pro (sonnet) | `scripts/build-stdlib-packages/build-lock.ts`, `tests/unit/build-stdlib-lock.test.ts` | T0 | [x] |
