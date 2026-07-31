# T5 — The generator emits a remote-manifest module per bundle

## Context

See [ADR-1](../decisions.md#adr-1) and [ADR-3](../decisions.md#adr-3).

`scripts/build-stdlib-packages/` today emits one module per bundle with every
resource's content inlined (`emit-module.ts#emitConcreteJs`). That is what makes
`tupadr3.js` 19.54 MB. This task adds a SECOND emitter that produces a manifest
module — the same bundle described by key→path pairs with no content.

The eager emitter stays exactly as it is. Both outputs ship.

## Task

1. Add `emit-remote-manifest.ts` producing, per bundle, a `.js` + `.d.ts` pair:

```js
export const tupadr3Remote = {
  name: "tupadr3",
  files: {
    "font-awesome-5/ban": "font-awesome-5/ban.puml",
    ...
  },
};
```

   Alias bundles carry `aliasOf` and an empty `files`, mirroring
   `emit-module.ts#emitAliasJs`.

2. Extend `types.ts` / `package-specs.ts` so each package declares its remote
   modules alongside its eager ones.

3. The `.d.ts` types the export as `StdlibRemoteManifest` imported from
   `plantuml-ts`, matching how `emit-module.ts` types exports as `BundleData`.

Keys come from `read-bundle.ts#derivePumlKey` — do not reimplement the key
transform. The VALUE is the real relative path with case preserved: 890 of 891
`awslib14` paths contain uppercase, which is exactly why the map exists
(ADR-3).

**Reuse `emit-module.ts`'s `JSON.stringify` discipline** — every key and value
goes through it, escaping rather than transforming.

## Write-set — write NOTHING outside these

- `scripts/build-stdlib-packages/emit-remote-manifest.ts` (create)
- `scripts/build-stdlib-packages/types.ts` (modify)
- `scripts/build-stdlib-packages/package-specs.ts` (modify)
- `tests/unit/stdlib-packages.test.ts` (modify — extend the existing suite)

Do NOT regenerate `packages/**` in this task — T6 owns the generated output and
the package.json changes. This task changes the generator and its tests only.

## Read-set

- `scripts/build-stdlib-packages/emit-module.ts` — the emitter to mirror,
  including its `JSON.stringify` note and the alias/concrete split
- `scripts/build-stdlib-packages/read-bundle.ts` — `derivePumlKey`,
  `readBundleFiles`
- `scripts/build-stdlib-packages/package-specs.ts` — the four packages'
  composition and the `PackageSpec` shape
- `scripts/build-stdlib-packages/types.ts` — `GeneratedModule`,
  `ConcreteBundleExport`, `AliasBundleExport`
- `tests/unit/stdlib-packages.test.ts` — the round-trip sha256 test that proves
  the VERBATIM constraint; extend it, do not weaken it
- [batch-1/overview.md](overview.md#the-manifest-shape-both-tasks-must-agree-on)
  — the manifest shape T1 owns

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — a parallel remote module; the eager module
  stays
- [ADR-3](../decisions.md#adr-3) — key→path map, case preserved; **no renames**

## Interface contract

Emits objects satisfying T1's `StdlibRemoteManifest`. No runtime dependency on
T1 — the emitter writes text; only the `.d.ts` names the type.

## Acceptance criteria

1. Given `awslib14`, when the manifest is emitted, then every resolved key maps
   to its real relative path with case preserved — assert specifically on a key
   whose path contains uppercase (e.g. `storage/simplestorageservice` →
   `Storage/SimpleStorageService.puml`).
2. Given `tupadr3`, when the manifest is emitted, then its module gzips to
   ≤ 60 KB (measured 49.6 KB — assert the bound, and log the actual).
3. Given any emitted manifest, then every path in it resolves to a file that
   exists under `assets/stdlib/<assetFolder>/`.
4. Given an alias bundle (`awslib` → `awslib14`), then it emits `aliasOf` and an
   empty `files`.
5. Given the emit has run, then **no vendored file's content or name changed** —
   `npx tsx scripts/vendor-stdlib.ts --verify` still reports all sha256 matching.

## Quality bar

All four gates exit 0, plus `npx tsx scripts/vendor-stdlib.ts --verify`.
389 svg goldens byte-identical; ratchet's 54 zero-diff; size-deltas 320/351
widened 0 — a generator change should move none of these.

## Observability

N/A — build-time tooling, no runtime operations.

## Rollback

**Reversible** — revert the commit. Generator-only; no generated output is
committed by this task.

## Boundaries

**Always:** keep the eager emitter's behavior byte-identical.

**Never:** rename, rewrite, re-encode or reorder any vendored file — that is
stop condition 5 and it is the constraint that keeps `awslib14`'s CC BY-ND grant
intact. Never weaken `tests/unit/stdlib-packages.test.ts`'s round-trip sha256
assertion.

## Method rules

1. **Trace dependency cascades TWO levels.** `package-specs.ts` is read by the
   build script AND by tests; `types.ts` by every emitter. Check both before
   changing a shared type.
2. **Verify the measured manifest size against the CURRENT assets**, don't cite
   the brief's 49.6 KB — regenerate and measure.

## Commit

One commit: `feat(T5): emit a remote key-to-path manifest per stdlib bundle`
