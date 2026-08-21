# Batch 3 — The cross-process lock (SERIAL)

The second half of D3's fix, and the batch where the race should finally close.
It follows T2 because the lock must re-check T2's predicate **inside** the
critical section, and because both write `scripts/build-stdlib-packages.ts`.

**The failure mode to fear here is not the race — it is the cure.** A lock with
no stale recovery, or an unbounded wait, converts a 1-in-7 flake into a
permanent hang on every future run. That is strictly worse than the bug, and it
is stop 6.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Cross-process lock with stale recovery and a bounded wait | typescript-pro (sonnet) | `scripts/build-stdlib-packages.ts`, `tests/unit/build-stdlib-lock.test.ts`, `.agent-notes/sre-T4.md` | T2 | [ ] |
