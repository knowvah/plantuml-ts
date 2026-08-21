# Batch 1 — Commit the repro, env-guarded (SERIAL)

T0's harness lives in scratch. This batch turns it into a committed artifact so
the race cannot silently return, and captures its **pre-fix failure** — the
last moment that failure is observable, since Batch 2 and 3 remove the cause.

The test is skipped by default (D4). `npm test` sits at ~57 s against a 60.3 s
ceiling, and a real two-process race test is both slow and timing-dependent;
neither belongs in every run.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Commit the repro as an env-guarded test; record its pre-fix failure | typescript-pro (sonnet) | `tests/integration/stdlib-build-race.test.ts`, `tests/helpers/stdlib-build-race-{writer,reader}.ts`, `.agent-notes/sre-T1.md` | T0 | [x] |
