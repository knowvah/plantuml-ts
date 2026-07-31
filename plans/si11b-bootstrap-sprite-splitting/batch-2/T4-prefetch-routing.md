# T4 — Route the sprite scan into the prefetch walk

## Context

See [ADR-4](../decisions.md#adr-4) and [ADR-5](../decisions.md#adr-5).

**This is where the mission's value lands.** T1 produces fragments, T2 finds
the names, T3 declares the options — but until this task, nothing fetches a
sprite. Today `!include <bootstrap/bootstrap>` pulls all 1,085,342 B through
the include seam during prefetch, and `matchSpriteCommand` then registers all
2,078 sprites at parse time.

The lever is the include **payload**, not the sprite registry: fetch only the
referenced fragments and hand parsing a smaller payload. Parsing is untouched
— it simply sees fewer `sprite` blocks.

## Task

In `src/core/include-resolver.ts`:

1. When the include target resolves to a **sprite-split** bundle, do not fetch
   the whole `.puml`. Instead: `scanSpriteNames(source)` (T2), union with
   `options.sprites` (T3, ADR-5b), intersect with the manifest's name list,
   and fetch only `sprites/<name>.puml` for each.
2. Assemble the fetched fragments into the include payload, in **sorted name
   order** so the result is independent of completion order.
3. A referenced name absent from the manifest raises a **named** error
   identifying the sprite (ADR-5a) — never a silently missing icon.
4. Reuse SI11a's machinery: `remoteStdlib`/`resolveResource` and the existing
   concurrent walk with its in-flight dedup. **Do not add a second cache or a
   second concurrency primitive.**

## Write-set — write NOTHING outside these

- `src/core/include-resolver.ts` (modify)
- `tests/unit/sprite-split-prefetch.test.ts` (create)

`src/core/include-resolver.ts` is **AT the 500-line cap** — budget lines
before writing. If satisfying the cap would require splitting a file outside
this write-set, STOP and report.

## Read-set

- `src/core/include-resolver.ts` — `prefetchInner`'s stdlib branch and its
  three-channel comment, `stdlibContentFor`, `PrefetchWalk` (incl. `inFlight`),
  `dedupeInFlight`. **Line numbers drift — follow the code.**
- `src/core/sprite-prefetch.ts` — T2's `scanSpriteNames`
- `src/core/tim/StdlibRemote.ts` — SI11a's `remoteStdlib`, its per-key promise
  memoization, and `StdlibResourceFetchError`
- `tests/unit/stdlib-remote-prefetch.test.ts` — SI11a's T3/T4 walk
  expectations, which must keep passing
- [ADR-4](../decisions.md#adr-4), [ADR-5](../decisions.md#adr-5)

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — prefetch-driven; the registry stays sync
- [ADR-5](../decisions.md#adr-5) — named error for a miss, PLUS the
  `options.sprites` escape hatch. **A whole-file fallback is explicitly
  rejected** — it silently restores the 1.06 MB this mission removes.
- [ADR-3](../decisions.md#adr-3) — path is `sprites/<name>.puml` by convention

## Interface contract

None produced. `prefetchIncludes`' signature is unchanged; only what the
stdlib channel does internally changes.

## Acceptance criteria

1. Given `!include <bootstrap/bootstrap>` and three `<$name>` references, when
   prefetched against a split registration, then **exactly 3** fragments are
   fetched — assert the fetcher's call count and the requested names, not that
   it rendered.
2. Given a sprite name supplied only in `options.sprites`, then it is fetched
   too, even though the scan cannot see it (ADR-5b).
3. Given a referenced name absent from the manifest, then the error **names
   the sprite** and no request is made for it.
4. Given **no** split registration, then behavior is identical to the eager
   path — assert SI11a's existing walk tests still pass unmodified.
5. Given fetches completing in a different order across two runs, then the
   assembled payload is **byte-identical** — CLAUDE.md forbids
   completion-order-dependent output, and payload text feeds parsing.

## Quality bar

`npm run typecheck`, `npm run lint`, and `npx vitest run
tests/unit/sprite-split-prefetch.test.ts tests/unit/stdlib-remote-prefetch.test.ts
tests/unit/stdlib-registry-prefetch.test.ts` all clean. Do NOT run the full
`npm test`.

Criterion 4 is the regression guard for every existing consumer. Criterion 5
is the one this project cares most about.

## Observability

N/A — no new observable operations; this changes which bytes are fetched. The
consumer-facing metric it improves (bytes and requests per diagram) is
measured at the injected `IncludeFetcher`, per SI11a's ADR-5.

## Rollback

**Reversible** — revert the commit; the walk returns to whole-file loading.
Behavior, not contract, so nothing downstream needs coordinating.

## Boundaries

**Never:** make `renderSync` async, import a Node built-in, add a second cache
or concurrency primitive, reorder the three stdlib channels, or fall back to
whole-file loading. Never require real network egress in a test — inject a
fetcher over local files.

## Method rules

1. **Trace dependency cascades TWO levels:** `stdlibContentFor` ←
   `prefetchInner` ← `prefetchIncludes` ← `render`/`renderAll`/
   `prepareIncludeStore`. SI11a's T1 was incomplete until the SECOND consumer
   of the store was traced.
2. **Verify the "sprites still register" claim end-to-end against a REAL
   fragment**, not against the design —
   `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml`
   uses `<$bi-globe>` and is the shape to model.

## Commit

One commit: `feat(T4): fetch only the sprites a diagram references`
