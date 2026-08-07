# F3-seam — ADR-2 asset store seam for vendored sprite/emoji assets

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java), rendering
SVG synchronously with no DOM, no Node built-ins in `src/`, and no async in
`renderSync`. Two Batch-4 tasks are about to need a channel for binary/text
asset payloads that today has no home: F4-a (the jar-internal `/sprites/**`
bundle, G3b) and F4-b (Twemoji emoji artwork, G12). Both need the SAME shape
of thing — "give me the bytes for this asset key, synchronously" — and if
both build it independently they collide on `src/index.ts` and diverge on the
contract. This task exists so they don't.

This mission closes **zero fixtures** through this task. Its entire value is
downstream: it is the seam F4-a and F4-b build on.

**The precedent already exists in this codebase for a different asset class.**
`src/core/tim/StdlibStore.ts` builds exactly this shape — a synchronous,
pre-fillable resolver — for stdlib `.puml` TEXT bundles, and `src/index.ts`
already re-exports it (`stdlibStore`, `withStdlib`, `BundleData`,
`StdlibStore`) alongside the async `stdlibRegistry`. Read that file before
writing anything: it is not a template to copy verbatim (it resolves
`<bundle/thing>` PUML text, not binary sprite/emoji assets — different key
scheme, different payload shape), but its sync/async pairing IS the pattern
ADR-2 says to mirror.

## Task

Add ONE new `RenderOptions` field — `assetStore` — and a new module that
defines its shape and a construction helper, mirroring `includeStore` (sync,
always available) / `stdlibRegistry` (async, `renderSync` cannot use it).

**Why this can't wait for F4-a/F4-b to build it themselves:** `renderSync`
cannot `await` a dynamic `import()` — that rules out a lazy-only channel for
either sprite or emoji assets. Worse, the entire size-conformance measurement
harness (`scripts/measure-description-size-deltas.ts`) renders through
`renderSync` with a pre-built store, exactly like `tests/helpers/
stdlib-assets-store.ts` does for stdlib bundles today. A lazy-only asset
channel would leave G3b's and G12's own fixtures permanently unmeasurable by
the mission's own gate — not merely inconvenient, but a hole in the thing that
proves the fix worked.

This task does **not** wire any consumer. `sprite-commands.ts`'s `getSprite`
(F4-a) and `AtomEmoji.ts` (F4-b) are NOT touched here — they will read
`options.assetStore` once it exists. Do not pre-guess their exact asset key
scheme (sprite paths vs. emoji codepoints look nothing alike); keep the
interface generic enough that both can layer their own key convention on top,
the same way `stdlibStore()` layers PUML-bundle resolution on top of the
generic `IncludeStore` shape.

## Write-set

- `src/index.ts` — add the `assetStore?: AssetStore` field to `RenderOptions`
  and re-export the new module's public surface (mirrors how `stdlibStore`/
  `withStdlib`/`BundleData`/`StdlibStore` are re-exported today, per the
  existing comment at `src/index.ts:49-54` explaining WHY this file is the
  only reachable surface: `package.json`'s `exports` map has a single `"."`
  entry, no subpath exports).
- NEW `src/core/asset-store.ts` — the `AssetPayload`/`AssetStore` types and a
  construction helper.

Nothing else. In particular: no `sprite-commands.ts`, no `AtomEmoji.ts`, no
new `assets/**` directory (that's F4-a's and F4-b's own write-sets).

## Read-set

- `src/index.ts:1-140` — full file; the `RenderOptions` interface (`:88-120`)
  and the re-export block (`:49-63`) are what this task extends
- `src/core/tim/StdlibStore.ts` — full file (126 lines); the sync/async
  pairing precedent and the `withStdlib` composition pattern
- `tests/helpers/stdlib-assets-store.ts` — full file; shows where a
  test-helper re-export for a `scripts/`-implemented builder lives (per
  `~/.claude/rules/naming-conventions.md`'s shared test-utility location) —
  useful as a SHAPE precedent, not something this task must replicate (no
  asset-store BUILDER script exists yet; F4-a/F4-b build their own)
- `plans/si5b-stdlib/decisions.md` D2 — the four-package precedent this
  mission's ADR-9 (licence-gated packaging) will likely mirror in Batch 4;
  read for the shape of "additive, optional, non-breaking public API" this
  task must also follow
- `src/core/include-resolver.ts` — `IncludeFetcher`/`IncludeStore`, the OTHER
  sync/async pair `RenderOptions` already documents (`:92-119`) — the doc
  comment style this task's new field should match

## Architecture decisions

**ADR-2** governs this task entirely: "Add a dedicated asset store option
that can be filled synchronously, mirroring the existing `includeStore`
(sync) / `stdlibRegistry` (async) pair." **ADR-9(b)**: Twemoji artwork stays
behind the lazy/optional channel this seam establishes — the default bundle
must not grow. This task does not violate ADR-9(b) by existing (it adds a
type and an optional field, zero bytes of artwork), but F4-b's later use of
it must not either — note this for whoever reviews that task.

## Interface contracts

```ts
// src/core/asset-store.ts

/** One resolved vendored asset (a sprite SVG/PNG, a Twemoji artwork file).
 *  Binary-safe: `bytes` covers both text formats (SVG) and binary ones
 *  (PNG) without a second payload shape. */
export interface AssetPayload {
  readonly bytes: Uint8Array;
  readonly mimeType: string; // e.g. 'image/svg+xml', 'image/png'
}

/** Synchronous asset resolution — the render path calls this without
 *  awaiting, exactly like `IncludeStore.get`. F4-a and F4-b each own their
 *  own key scheme; this interface only fixes the shape and the sync
 *  contract, not what a key looks like. */
export interface AssetStore {
  get(key: string): AssetPayload | undefined;
  has(key: string): boolean;
}

/** Combines any number of `AssetStore`s into one, first-match-wins —
 *  mirrors `withStdlib`'s composition shape so a host can layer a sprite
 *  store and an emoji store under one `options.assetStore` value. */
export function combineAssetStores(...stores: readonly AssetStore[]): AssetStore;
```

```ts
// src/index.ts — RenderOptions, one new optional field
export interface RenderOptions {
  // ...existing fields unchanged...
  /**
   * Pre-populated vendored asset store (jar-internal `/sprites/**` bundle —
   * F4-a; Twemoji artwork — F4-b), read SYNCHRONOUSLY wherever upstream
   * would open a jar resource. Mirrors `includeStore`: `renderSync` cannot
   * await a dynamic `import()`, and the size-conformance harness renders
   * synchronously with a pre-built store. A miss (`undefined`) on any key
   * makes the caller DEGRADE to its existing fallback (a literal `«label»`
   * for an unresolved sprite stereotype, a platform-glyph `UText` for an
   * unresolved emoji) — never a thrown error.
   */
  assetStore?: AssetStore | undefined;
}
```

## Acceptance criteria

- **Given** `options.assetStore` is unset (every existing caller today),
  **when** `render()`/`renderSync()` run, **then** behavior is byte-identical
  to before this task — the field is purely additive.
- **Given** a key with no matching payload, **when** a future consumer calls
  `assetStore.get(key)`, **then** it returns `undefined` — never throws —
  matching `IncludeStore.get`'s typed-miss convention (this is verified by a
  unit test against `combineAssetStores`/a stub store even though no `src/`
  consumer exists yet).
- **Given** the new field, **when** `npm run typecheck` runs on both
  tsconfigs, **then** it passes with no changes required in any OTHER file —
  proving the addition is genuinely additive at the type level.
- **Given** `src/index.ts`'s single-reachable-surface constraint
  (`package.json`'s `exports` map), **when** this task ships, **then**
  `AssetPayload`/`AssetStore`/`combineAssetStores` are all re-exported from
  `src/index.ts`, not left importable only via a deep path.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

The size-delta ratchets are irrelevant to this task (zero fixtures close);
still run `npx tsx scripts/measure-description-size-deltas.ts` once as a
regression check (expect no change from the batch's starting count) and
capture `$?` directly.

## Observability

N/A — additive type + optional field on a synchronous library entry point; no
request path, no logs, no metrics.

## Rollback classification

Fully reversible, low risk. Additive-only public API change: revert = delete
the new field and the new module. No data migration, no consumer to
un-wire (none exists yet).

## Boundaries

**Always:** keep `assetStore` optional; make a miss degrade, never throw;
re-export the new surface from `src/index.ts` (the only reachable entry
point); follow the `includeStore`/`stdlibRegistry` doc-comment style already
established in `RenderOptions`.

**Ask first:** if F4-a's and F4-b's likely key schemes turn out to need
different `AssetPayload` shapes (e.g. one needs pre-decoded pixel dims and
the other doesn't) — do not guess a shape that serves one better than the
other; surface it.

**Never:** wire `sprite-commands.ts` or `AtomEmoji.ts` to consume this store
(F4-a/F4-b's write-sets); add any actual vendored asset bytes (ADR-9(b) —
default bundle must not grow); make the field required or change any
existing `RenderOptions` field's meaning.

## Commit format

`feat(F3-seam): add synchronous asset store option to RenderOptions`
