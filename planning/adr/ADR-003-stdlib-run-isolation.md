# ADR-003: stdlib `generated/`-tree run isolation for the changed-inputs residual

## Status

**Accepted 2026-08-21 — option D**, by the user, at the mission's stop-3
decision gate.

The user chose **D** (extend the existing build lock to cover readers) over
this ADR's recommendation of **A**, on the grounds that D closes the two
`npm pack` tests, which A and B structurally cannot reach. The trades D
carries — up to 30 s of reader-side tail latency under contention, and a new
coupling from test files to `build-lock.ts` internals — were disclosed in the
options table below before the choice was made, and are accepted.

The recommendation of A is left standing below exactly as written, rather
than rewritten to match the decision. A future reader should be able to see
what was recommended, what was chosen, and that the two differed.

Two corrections were made after acceptance and are recorded in
`plans/stdlib-run-isolation/decision-journal.md`:

- **D's file count is 8, not the 10 stated in the options table.** The table
  counted "the 8 concurrent-reader tests **and** the 2 pack tests"; the pack
  tests are census rows #11 and #15, already inside the 8.
- **Two hazards D inherits from a lock designed for a builder, not a
  reader.** `isStale` reclaims a live holder's lock after
  `staleAgeMs` = 60 s while `release()` is an unconditional `rmSync`, so a
  long-held reader lock can be stolen *and* then delete a stranger's lock;
  and acquisition uses a synchronous sleep, which blocks a vitest worker's
  event loop for up to `maxWaitMs` = 30 s. Both are pinned into T3's brief.

## Context

`stdlib-build-race` (SI34) closed the unchanged-inputs race with a
content-hash skip plus a cross-process lock, and documented one residual it
left open: if a second run's inputs genuinely change mid-run, that run still
`rmSync`s `packages/<pkg>/generated/` (a fixed, gitignored, repo-absolute
path) while a first run's in-flight workers may still be importing from it
(`scripts/build-stdlib-packages.ts:49-54`, reached via `writeOutputs:150`).

**T0 measured it rather than deducing it.** Reproduced 2/5 runs (40%), mean
attempts to fail **21,325.5**, `silentCorruptionObserved: false`. SI34's
original bug reproduced 5/5 at mean 700.6 — this residual's exposure is
**~30x narrower**. The signature is
`ENOENT: no such file or directory, open '<repo>/packages/stdlib-tupadr3/generated/tupadr3.remote.js'`.

**T1's census** (independently spot-verified): **21** total consumers of
`packages/<pkg>/generated/`; **8** are concurrent readers inside default
vitest workers; **8** are seam-eligible; **13** are immovable — 4
`package.json` + 4 `tsconfig.json` (D2: published surface), the 2
`npm pack --dry-run` tests (`sprite-package-files.test.ts:81`,
`stdlib-package-files.test.ts:57`, both run with `cwd` set to the real
package directory — filesystem-resolved, unredirectable in-process), and 3
build-race-harness files (immovable by design, env-gated, existing precisely
to contend on the real path).

SI34's refusal to relocate the tree cited **two** import sites. The real
number is 21 consumers / 8 concurrent readers. That correction is why this
question was re-opened.

**Locked constraints** (`plans/stdlib-run-isolation/decisions.md`):

- **D2** — `main`/`types`/`exports`/`files` for all four packages are
  sacred; no option may change them without saying so explicitly and
  obtaining user approval.
- **D3** — `npm pack` resolves against the real package directory and cannot
  be redirected. Every option must state its effect on the two pack tests.
  Full isolation is therefore probably impossible; the honest goal is
  reducing the number of concurrent readers of the shared path, not
  eliminating them.
- **D4** — no agent may re-adopt the previously-declined per-run isolated
  directory unilaterally. This ADR presents options; the user decides.

## Options

| Option | Mechanism | Exposure closed | Consumers touched | Published surface | Pack tests | `npm test` cost | Reversibility |
|---|---|---|---|---|---|---|---|
| **A. Read seam + lock-scoped snapshot** | `globalSetup` copies the four `generated/` trees to a per-process directory **inside the build lock's critical section** (see the amendment below — this is not optional). 6 of the 8 concurrent readers resolve via one new helper, defaulting to canonical, overridable per process. The producer script is untouched. | 6/8 (75%) of concurrent readers permanently removed from canonical-path contention | ~8 files: `globalSetup`, 1 new helper module, 6 reader test files | **No** | Untouched — still exposed to the narrow residual, exactly as today | **Measured: 3.9–6.5 ms**, once per vitest process (2.3 MB, 24 files) | Trivial — the helper defaults to canonical; deleting the override and reverting 8 files restores current behaviour exactly |
| **B. Per-run isolated output directory** (the declined option) | Producer writes to a per-run directory instead of canonical | **Collapses into Option A once D3 is honoured** — see the finding below | Same as A, once corrected | **No**, once corrected | Same as A | Same as A | Same as A |
| **C. Accept permanently** | Document the residual; change no code | None — the residual remains at its measured, 30x-narrower rate | 0 | No | Untouched | 0 | Trivial — revisit at any time |
| **D. Extend the existing build lock to cover readers** | The 8 concurrent-reader tests **and** the 2 pack tests wrap their canonical-path section in the already-exported `acquireBuildLock()` / `release()` (`build-lock.ts:264`) | 10 of 10 canonical-touching in-worker consumers, **including the 2 pack tests A and B cannot reach** | 10 files, all newly coupled to `build-lock.ts` internals | No | **Closed** — pack call and read wrapped in the same lock as the writer | Uncontended: sub-ms per acquire. **Contended: up to `maxWaitMs` = 30 s tail latency per reader** if a real rebuild is in flight — a new risk class not present today | Trivial to unwrap, but the tail-latency behaviour it introduces is a new class of symptom, not merely a reverted one |

## Finding on Option B — the crux of the original refusal

D3 forces `packages/<pkg>/generated/` to stay populated, complete, and at its
canonical path at all times: the 2 pack tests resolve `npm pack` against
`cwd: join(PACKAGES_DIR, packageDir)` — real filesystem resolution,
unredirectable — and the 4 `tsconfig.json` files type-check the real on-disk
tree.

**The producer therefore cannot be relocated away from canonical.** Some
process must still build it, on the same schedule as today, for those
immovable consumers. "A per-run isolated directory", once D3 is honoured,
cannot mean *the writer no longer writes canonical*; it can only mean *build
canonical exactly as today, then additionally produce an isolated copy for
the consumers that do not need cwd-based resolution*. That is precisely
Option A's mechanism.

**Consequence: neither A nor B ever needs to touch `main`, `types`,
`exports`, or `files`.** The 2026-08-21 refusal's stated premise — that
relocating `generated/` changes what the packages publish — does not survive
the pack-test constraint, because the canonical tree is never relocated, only
supplemented. The refusal's one surviving legitimate basis was a cost/benefit
judgment made against the two import sites then known. That judgment is worth
revisiting now that the real count is 8 concurrent readers.

## Amendment — a correctness gap in Option A as first drafted

*Added by the orchestrator after verifying the lock's scope; recorded here
rather than silently corrected, because it changes the shape of the work.*

Option A was first drafted as "`globalSetup` copies immediately after its own
canonical build, still inside that process's before-any-worker-spawns
guarantee". **That guarantee is intra-process and does not make the copy
safe.** `acquireBuildLock`'s release happens in a `finally` at
`scripts/build-stdlib-packages.ts:301`, immediately after the build loop and
before `buildStdlibPackages()` returns to its caller. A snapshot taken by the
caller "right after the build" is therefore taken **outside** the lock, and
run B may legally acquire it and `rmSync` canonical *while run A is copying*.

The result would be a **torn snapshot**: a stable-looking but silently
incomplete tree that run A then reads from for its entire suite. That is
strictly worse than the present failure, which is at least loud (`ENOENT`).

The copy must happen **inside** the lock's critical section. `acquireBuildLock`
is already exported (`build-lock.ts:264`), so this is achievable, but it is
not a pure caller-side change: it needs either a new exported
build-and-snapshot entry point or an explicit lock acquisition around both
operations. **Any implementation of A or B must carry this constraint.**

## Gap noted regardless of the option chosen

No option here proposes a fitness function asserting the invariant this
residual is about — *a reader of `packages/*/generated/` never observes a torn
write*. Whichever option is approved, batch 2 should add one: a CI-runnable
check (even a cheap unit test asserting the helper or lock wrapper is present
at every seam-eligible call site) rather than relying on code review to keep
6–10 call sites honest.

## Recommendation

**Option A**, implemented with the lock-scoping amendment above. Reasoning,
stated so a reader can disagree with it:

- The residual is not purely theoretical **for this repository**. This
  project's normal operating mode is multi-agent autonomous batches, and this
  mission's own batch 0 had to be amended mid-flight to stop two agents
  running `npm test` concurrently in one worktree — the exact two-process
  precondition T0's harness forces synthetically. "Two processes calling
  `buildStdlibPackages()` against one checkout" is a background condition
  here, not an edge case invented to justify work.
- A removes 75% of concurrent-reader exposure for a bounded, reversible,
  non-coupling cost: no new coordination primitive, no change to lock
  semantics, no published-surface risk, ~8 files, and a measured 3.9–6.5 ms
  once per process. It defaults to exactly today's behaviour if the override
  is absent.
- D closes 2 more files but at materially higher architectural cost: a new
  dependency edge from 10 test files into internal build-lock machinery (a
  coupling smell per `~/.claude/rules/architecture.md`), plus a genuinely new
  failure mode — up to 30 s of reader-side blocking under contention — that
  does not exist today. That trade is worth paying only if A proves
  insufficient in practice.
- **C is defensible on the numbers alone** — 30x narrower exposure, zero
  silent corruption observed across ~100k+ combined attempts — and would be
  the recommendation if this project ran single-process. It is not
  recommended here because of the multi-agent concurrency evidence above, not
  because "B was declined so something must replace it".

A reader could reasonably choose C on cost-conservatism grounds, or D for
completeness against the pack tests. The evidence narrows the field; it does
not compel a unique answer.

## Consequences

**If A is approved.** Easier: future test files needing the generated tree get
a documented seam instead of a hand-rolled path join. Harder: the snapshot
must be lock-scoped (see the amendment), and a stale or mutated copy becomes a
new failure mode to guard with a test. The pack-test and harness exposure
remains as a documented, D3-mandated ceiling — this option does **not** close
the residual entirely, and must not be described as though it does.

**If C is approved.** Nothing changes. The residual is documented in
`plans/stdlib-build-race/README.md` and `planning/next-missions.md` (D5), and
this ADR stands as the record of why it was left open, with the exposure
measurement that justifies the choice.
