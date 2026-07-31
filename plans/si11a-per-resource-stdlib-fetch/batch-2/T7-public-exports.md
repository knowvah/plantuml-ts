# T7 — Public exports and the consumer recipe

## Context

See [ADR-4](../decisions.md#adr-4) and [ADR-7](../decisions.md#adr-7).

`package.json`'s `exports` map has a single `"."` entry, so `src/index.ts` is
the only surface a consumer of the built library can reach. T1's module is
useless until it is published there.

This task also writes the recipe, because ADR-4 deliberately provides **no
default `baseUrl`** — a consumer who is not told where to point will assume the
feature is broken.

## Task

1. Export from `src/index.ts`, beside the existing SI5b/SI8 re-exports:
   `remoteStdlib`, `StdlibResourceFetchError`, and the types
   `StdlibRemoteManifest`, `RemoteBundle`.
2. Write `docs/stdlib-remote.md` — the consumer recipe:
   - self-hosted: copy the package's assets into your own static dir, point
     `baseUrl` at it
   - CDN: point `baseUrl` at jsDelivr/unpkg **yourself**, with the version
     pinned; state explicitly that plantuml-ts ships no default and operates no
     CDN
   - hand-built manifest (ADR-7) — a third party with their own icon set
   - the three failure modes and what a consumer does about each

**`src/index.ts` is AT the 500-line cap.** Expect the complexity hook to block
the first edit. The push-forward condition covers a `#lizard forgives` or a
~500-line split, but do NOT split a module outside this write-set — SI8 solved
the same problem by consolidating two duplicated call sites into one helper.
Budget the lines before writing.

## Write-set — write NOTHING outside these

- `src/index.ts` (modify — exports only)
- `docs/stdlib-remote.md` (create)

## Read-set

- `src/index.ts:48-61` — the existing re-export block and the comment explaining
  WHY each symbol is re-exported. **Line numbers drift — follow the code.**
- `src/core/tim/StdlibRemote.ts` — T1's output and its doc comments
- [`../decisions.md#adr-4`](../decisions.md#adr-4),
  [`#adr-6`](../decisions.md#adr-6), [`#adr-7`](../decisions.md#adr-7)

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — **no default `baseUrl`**; document recipes
  instead. Adding a default to make the docs shorter is a STOP.
- [ADR-7](../decisions.md#adr-7) — the manifest is public and hand-constructible;
  the docs must show that, not just the generated path.
- [ADR-6](../decisions.md#adr-6) — the docs state what this does NOT solve, with
  the measured numbers.

## Interface contract

Publishes T1's symbols. No downstream task consumes it; T9 references the docs.

## Acceptance criteria

1. Given the built package, when `dist/plantuml-ts.d.ts` is inspected, then
   `remoteStdlib`, `StdlibRemoteManifest`, `RemoteBundle` and
   `StdlibResourceFetchError` all appear with their doc comments — verify in the
   EMITTED file, not by reading `src/index.ts`.
2. Given `docs/stdlib-remote.md`, then it shows a self-hosted recipe AND a
   pinned-CDN recipe, and states plainly that there is no default `baseUrl` and
   no plantuml-ts-operated CDN.
3. Given the docs, then they include a hand-built-manifest example with no
   `@plantuml-ts` package involved (ADR-7).
4. Given the docs, then they state the measured costs from ADR-6: the manifest
   floor (49.6 KB gzip tupadr3 / 8.3 KB awslib14), ~N requests per diagram, the
   `awslib14` `*/all.puml` aggregators up to 445 KB, and that bootstrap is
   unaffected.
5. Given `src/index.ts`, then it is ≤ 500 lines.

## Quality bar

All four gates exit 0. 389 goldens byte-identical; ratchet's 54 zero-diff;
size-deltas 320/351 widened 0 — exports and docs move none of them.

## Observability

This task carries the mission's consumer-facing observability guidance
(ADR-5): the docs must state that the injected `IncludeFetcher` is where a
consumer adds metrics/retry/auth, and what to watch — fetch error rate,
requests-per-diagram, p95 resource latency. There is no runbook because there is
no service.

## Rollback

**Reversible** — revert the commit. Exports are additive, so reverting cannot
break a caller that predates them.

## Boundaries

**Never:** give `baseUrl` a default value or a fallback URL, in code OR in a
doc example presented as a default. Never split a module outside this write-set
to satisfy the line cap.

## Method rules

1. **Trace dependency cascades TWO levels.** `src/index.ts` is the package's
   only public surface and is also imported by tests and `demo/`; check what a
   new export name might shadow.
2. **Verify the `.d.ts` emit against the CURRENT build** — `npm run build` runs
   API Extractor, and the types entry is `dist/plantuml-ts.d.ts`, not
   `dist/index.d.ts`.

## Commit

One commit: `feat(T7): publish the remote stdlib API and its consumer recipe`
