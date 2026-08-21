# Batch 2 — Implement the approved option (SERIAL)

**Gate cleared 2026-08-21: the user approved option D** — extend the
existing cross-process build lock to cover readers. Not the ADR's
recommendation (that was A); the user chose D because it closes the two
`npm pack` tests, which A and B structurally cannot reach. The decision is
recorded in `decision-journal.md` and attributed there to the user.

T3 and T4 are now written against option D with pinned write-sets. The two
are **serial**: T4 converts the call sites through the helper T3 builds.

Accepted trades, disclosed in ADR-003 before the choice: up to 30 s of
reader-side tail latency under contention, and a new coupling from test
files to `build-lock.ts`. Two orchestrator-verified hazards are pinned into
T3's brief — the lock steals itself after 60 s while `release()` does not
check ownership, and acquisition blocks the worker's event loop
synchronously.

**Count correction:** ADR-003's option D row says 10 files. The true
in-worker set is **8** (census rows #11–#18); the ADR double-counted the two
pack tests, which are already among the 8.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Lock helper + ownership-safe `release()`, TDD | typescript-pro (sonnet) | `tests/helpers/with-stdlib-build-lock.ts`, `tests/unit/with-stdlib-build-lock.test.ts`, `scripts/build-stdlib-packages/build-lock.ts`, `tests/unit/build-stdlib-lock.test.ts` | T2 + user approval | [x] |
| T4 | Convert the 8 in-worker consumers + fitness function | typescript-pro (sonnet) | the 8 census files #11-#18, plus `tests/architecture/stdlib-read-lock.test.ts` | T3 | [x] |
