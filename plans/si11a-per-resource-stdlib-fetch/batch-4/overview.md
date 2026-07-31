# Batch 4 — Concurrent fetch and in-flight dedup

One task, in its own batch because it rewrites the file T3 just changed.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Fetch the walk's targets concurrently; dedup in-flight requests | typescript-pro | `src/core/include-resolver.ts`, `tests/unit/stdlib-remote-prefetch.test.ts` | T3 | [x] |

## Why this is separate from T3

Two reasons, and neither is bookkeeping:

1. **Same file.** T3 and T4 both rewrite `prefetchInner`; they cannot share a
   batch under the one-writer-per-file rule.
2. **Different risk.** T3 is "fetch the right thing"; T4 is "fetch things at the
   same time without breaking the cycle guard, the error path, or determinism."
   A concurrency bug debugged on top of unproven routing conflates two
   mechanisms. Landing them separately keeps each diff readable and each
   revertible alone.

## Why it is needed at all

[ADR-6](../decisions.md#adr-6): per-resource loading trades one big transfer for
N small ones, so latency × N becomes the dominant cost. SI8's `prefetchInner`
awaits each target inside a `for` loop — correct and irrelevant at 1-2 includes,
pathological at 50. A 20-icon diagram is ~21 sequential round trips.

## Batch exit criteria

- All quality gates green
- 20 distinct targets are all in flight before any resolves — asserted, not
  assumed
- The same target named twice concurrently is fetched once
- `CircularIncludeError` still fires under concurrency
- Store contents are identical regardless of completion order
- 389 svg goldens byte-identical; 54-fixture ratchet zero-diff

## The determinism requirement

CLAUDE.md forbids non-determinism in rendering paths. Concurrency must not make
the store's contents — or any id derived from them — depend on which request
finished first. That is acceptance criterion 4 and it is the one most likely to
be got wrong.
