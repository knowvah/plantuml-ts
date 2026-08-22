# T1 — Shared mode in the build lock

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1. You are the
**sole owner** of `build-lock.ts` for this mission.

Readers currently acquire the lock in the same exclusive mode a builder does,
but a reader conflicts only with a **builder**, never with another reader.
Measured across two concurrent suites: **229.6 s of waiting to protect 35.9 s
of holding**, with a max wait of 29,724 ms against a 30,000 ms budget. T0 has
re-measured this independently — read its note for the authoritative baseline.

## Task — TDD, tests first

Add a shared (reader) mode to `acquireBuildLock`, per D1–D4.

1. **`mode` option, default `'exclusive'`** (D4). Every existing caller and
   test keeps today's semantics untouched.
2. **Reader registry** (D1): a reader atomically creates
   `<lockPath>.readers/<pid>-<seq>`. Reuse the same `wx` create-if-absent
   atomicity the writer lock relies on.
3. **Reader acquire re-checks** (D2): verify no writer → create the entry →
   **re-verify no writer appeared**. If one did: remove the entry, back off,
   retry. The retry must respect `maxWaitMs`.
4. **Writer priority** (D3): a waiting writer publishes an intent marker;
   readers arriving while it exists queue behind it, while readers already
   holding drain normally.
5. **Stale reader reclamation**: reuse the existing PID-liveness + age rules
   (`isStale`, `:196-210`). A crashed reader must not wedge the lock forever.
6. **Ownership-safe reader release**: `releaseIfOwned` (`:257`) exists because
   a reclaimed lock must not be deleted by its previous holder. The same
   discipline applies to reader entries — a reader must not remove an entry
   that is no longer its own.

## Two things that must remain true
- **Nothing may block unboundedly.** Every new wait path is bounded by
  `maxWaitMs` and throws with a message naming the path and elapsed wait, as
  the existing loop does (`:315`). A deadlock is strictly worse than the
  timeout being fixed. This is stop 2.
- **`acquireBuildLock` is not reentrant** (`tests/unit/stdlib-dts-import-specifier.test.ts:69`).
  Shared mode must not make it *look* reentrant: two shared acquisitions in one
  process are fine and expected, but a shared acquisition nested inside an
  exclusive one in the same process must not silently succeed.

## Write-set (pinned — do not write outside it)
- `scripts/build-stdlib-packages/build-lock.ts`
- `tests/unit/build-stdlib-lock.test.ts`

Do **not** touch `tests/helpers/with-stdlib-build-lock.ts` or
`scripts/build-stdlib-packages.ts` — those are T2's and T3's. Shared mode must
exist and be tested here before anything switches to it.

## Read-set
- `scripts/build-stdlib-packages/build-lock.ts` in full — especially
  `isStale` `:196-210`, `tryCreateLockFile` `:215`, `releaseIfOwned` `:257`,
  `acquireBuildLock` `:295-320`
- `.agent-notes/lsh-T0.md` — the baseline
- `.agent-notes/stdlib-lock-budget.md` — why exclusive-for-readers is the bug
- `plans/stdlib-lock-sharing/decisions.md` — D1, D2, D3, D4 in full
- `plans/stdlib-lock-sharing/diagrams/lock-modes.md` — the target sequence

## Architecture decisions (LOCKED — a conflicting finding is stop 7)
D1 (per-reader files), D2 (re-check after register), D3 (writer priority),
D4 (`mode` option defaulting to exclusive). If implementation reveals one of
these is unworkable, **stop and journal it** — do not substitute your own.

## Interface contracts
`acquireBuildLock(repoRoot: string, options?: BuildLockOptions): () => void`
— unchanged signature. `BuildLockOptions` gains
`mode?: 'shared' | 'exclusive'` (default `'exclusive'`). The returned
`release()` stays ownership-safe and idempotent-safe in both modes. T2 and T3
consume exactly this.

## Acceptance
- Given two shared acquisitions in different processes, when both are held,
  then **both proceed concurrently** — neither waits on the other. This is the
  whole point; prove it with a real two-process test, not a same-process
  simulation.
- Given a held shared lock, when a writer acquires exclusive, then the writer
  waits for the readers to drain and only then proceeds.
- Given a waiting writer (intent published), when a new reader arrives, then
  that reader queues behind the writer (D3) rather than joining the current
  readers.
- Given a reader entry whose pid is dead, when another party acquires, then the
  entry is reclaimed and does not wedge the lock.
- Given a reader whose entry was reclaimed, when it releases, then it does
  **not** delete a stranger's entry — mirroring `releaseIfOwned`. Cover this
  with a test that fails against a naive unconditional remove.
- Given every existing test in `tests/unit/build-stdlib-lock.test.ts`, then all
  still pass **unmodified in intent**. Extend the file; never loosen an
  assertion to accommodate the new mode. This is stop 3.
- Given any wait path, then it is bounded by `maxWaitMs` and throws on expiry.

## Observability requirements
Keep the existing `log()` seam meaningful: a caller reading run output should
be able to tell whether it waited on a writer, on a drain, or on the intent
marker. N/A for production SLIs.

## Rollback
**Reversible.** Default stays exclusive, so reverting restores today's
behaviour exactly. No persisted state beyond transient lock files.

## Quality bar
Four gates green, coverage >= 90/90/90, TDD. Complexity hook blocks on write:
>500 lines/file (**`build-lock.ts` is already 324 lines — you are adding to a
file with ~176 lines of headroom; if you approach the limit, extract a NAMED
module rather than widening an exemption**), >30 NLOC/function, CCN >10,
>5 params.

Report `npm test` duration with the load; wait for `corespotlightd` ~0 first.
No ceiling.

## Boundaries
- **Always:** TDD; bound every wait; preserve every existing behaviour and test.
- **Never:** touch `src/`; touch T2's or T3's files; raise `maxWaitMs` or tune a
  constant to flatter a measurement (stop 6); weaken an existing test; run any
  git write command.

## Report (<=350 tokens)
The mechanism as built; the two-process concurrent-readers proof; the
reader-release ownership test and what it fails against; how each wait path is
bounded; the four gates. No preamble.
