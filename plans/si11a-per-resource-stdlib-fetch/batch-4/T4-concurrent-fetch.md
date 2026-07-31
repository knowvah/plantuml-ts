# T4 — Concurrent fetch and in-flight dedup in the walk

## Context

See [batch-4/overview.md](overview.md#why-it-is-needed-at-all) and
[ADR-6](../decisions.md#adr-6).

`prefetchInner` walks a source's include targets in a `for` loop, awaiting each
one before looking at the next. With per-resource fetching that is ~21
sequential round trips for a 20-icon diagram, and latency × N is the cost model
this mission trades into.

## Task

In `src/core/include-resolver.ts`:

1. Issue the targets found in one source concurrently rather than sequentially,
   recursing into each result as it arrives.
2. Add **in-flight dedup**: today the `store.has(url)` check dedups only
   *already-completed* fetches, so two concurrent siblings naming the same target
   would both fetch it. Track in-flight requests by target and share them.
3. Preserve, under concurrency:
   - the cycle guard (`visited` is per-branch; siblings share the parent's set)
   - error propagation — a failure must surface naming its target, not be lost
     to completion ordering
   - **determinism** — final store contents identical regardless of which
     request finishes first

## The concurrency primitive is yours to choose — but record it

`Promise.all` over the line's targets, or a bounded pool. Guidance: unbounded is
fine at the measured N (a typical icon diagram is under 50 resources); if a
source can cascade past ~100 concurrent — `<awslib14/Compute/all>` is 445 KB and
can name many — add a bound and **record the number and its reasoning in the
decision journal**. A guessed bound with no rationale is not acceptable; neither
is unbounded with no consideration of the cascade.

## Write-set — write NOTHING outside these

- `src/core/include-resolver.ts` (modify)
- `tests/unit/stdlib-remote-prefetch.test.ts` (modify — extend T3's file)

## Read-set

- `src/core/include-resolver.ts` — `prefetchInner`'s loop, `PrefetchWalk`,
  `BackedIncludeStore`, and the module header's over-fetch divergence note.
  **Line numbers drift — follow the code.**
- `tests/unit/stdlib-registry-prefetch.test.ts` — SI8's cycle-guard tests
  (direct and transitive); they must still pass unchanged
- `src/core/tim/StdlibRemote.ts` — T1's per-key promise memoization, which
  already dedups at the RESOURCE layer; this task dedups at the WALK layer, and
  the two must not fight

## Architecture decisions (locked)

- [ADR-6](../decisions.md#adr-6) — request count is the acknowledged cost of
  this design; reducing wall-clock is the mitigation
- [ADR-5](../decisions.md#adr-5) — the resource-level cache already memoizes
  promises; do not add a second competing cache

## Interface contract

None produced. `prefetchIncludes`' signature is unchanged.

## Acceptance criteria

1. Given a source naming 20 distinct targets, when prefetched, then all 20
   requests are in flight before any resolves — assert with a fetcher that
   records start times and blocks until released, not with a timing heuristic.
2. Given the same target named twice in one source, when prefetched
   concurrently, then it is fetched exactly once.
3. Given one target's fetch rejects while others succeed, when prefetched, then
   the rejection surfaces and names that target.
4. Given fetches that complete in a different order across two runs (simulate by
   varying resolution order), then the resulting store's contents are identical.
5. Given a bundle that includes itself, and a transitive `A → B → A` cycle, then
   `CircularIncludeError` still fires — SI8's existing cycle tests pass
   unmodified.

## Quality bar

All four gates exit 0. 389 goldens byte-identical; ratchet's 54 zero-diff;
size-deltas 320/351 widened 0.

Criterion 4 is the one this project cares about most: CLAUDE.md forbids
non-determinism in rendering paths, and store contents feed seeds and ids.

## Observability

N/A — no new observable operations; this changes the scheduling of existing
ones. The consumer-facing metric it improves (requests-per-diagram wall clock)
is measured through the injected fetcher, per ADR-5.

## Rollback

**Reversible** — revert the commit; the walk returns to sequential. Behavior,
not contract, so nothing downstream needs coordinating.

## Boundaries

**Always:** keep `CircularIncludeError`'s chain meaningful — if concurrency
makes the reported chain nondeterministic, that is a defect, not a cosmetic
detail.

**Never:** introduce `Date.now()`, `Math.random()`, or completion-order-dependent
output (CLAUDE.md). Never make `renderSync` async. Never import a Node built-in
into `src/`.

## Method rules

1. **Trace dependency cascades TWO levels.** `prefetchInner` ← `prefetchIncludes`
   ← `render`/`renderAll`/`prepareIncludeStore` ← every async consumer. A
   scheduling change is only inert if you have checked what observes ordering.
2. **Verify the "the cycle guard still works" claim by test under
   concurrency**, not by reading the code — `visited` is threaded per-branch and
   siblings share a parent set, which is exactly where a concurrent bug hides.

## Commit

One commit: `perf(T4): fetch prefetch targets concurrently with in-flight dedup`
