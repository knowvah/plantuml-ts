# Batch 4 — Sync warm-up + error rewrite

One task. It publishes the public surface and fixes the messages that become
wrong once a registry exists.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Async warm-up for `renderSync` callers; export the registry; rewrite errors | typescript-pro | `src/index.ts`, `src/core/tim/IncludeStore.ts`, `tests/unit/stdlib-registry.test.ts` | T3 | [ ] |

## Batch exit criteria

- All quality gates green
- A `renderSync` caller can use a lazy registry via an awaited warm-up
- The unregistered-bundle error names the bundle and never repeats the
  now-misleading "pass `options.includeStore`" advice
- Chunk-load failure stays distinguishable from bundle-not-registered
- `stdlibStore` / `withStdlib` / `BundleData` still work unchanged

## Why the error rewrite waits until here

T1 changed **when** `StdlibNotBundledError` is thrown; T4 changes **what it
says**, once there is a registry to talk about. Moving the message twice would
make both diffs harder to read, and the correct wording is not knowable until
the registry option name exists (T3 records it in the journal).

## The message that has to go

Today, verbatim:

> `Cannot resolve !include <probe/thing>: plantuml-ts bundles no PlantUML
> stdlib, so the 'probe' bundle is not available. Supply it through the include
> seam: pass options.includeStore with an entry keyed '<probe/thing>' …`

It was already wrong for `withStdlib` callers before this mission — they had
passed `options.includeStore`. With a registry it is wrong twice over.
