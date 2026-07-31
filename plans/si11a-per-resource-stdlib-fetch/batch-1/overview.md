# Batch 1 — Remote source module; generator emits manifests

Two tasks, genuinely parallel. They share no file and neither consumes the
other's output.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `StdlibRemote.ts` — manifest type, `remoteStdlib()`, per-resource fetch + cache | typescript-pro | `src/core/tim/StdlibRemote.ts`, `tests/unit/stdlib-remote.test.ts` | — | [x] |
| T5 | Generator emits a remote-manifest module per bundle | typescript-pro | `scripts/build-stdlib-packages/emit-remote-manifest.ts`, `scripts/build-stdlib-packages/types.ts`, `scripts/build-stdlib-packages/package-specs.ts`, `tests/unit/stdlib-packages.test.ts` | — | [x] |

**T5 landed with a known gap:** `buildStdlibPackages()` never reads
`spec.remoteModules`, so the emitters are unreferenced and `npm run build:stdlib`
emits no manifest. The wiring lives in `scripts/build-stdlib-packages.ts`, which
is outside every task's write-set — stop condition 12, escalated to the
maintainer. **T6 is blocked on that ruling; T2 and T7 are not.**

## Why these two are independent

T1 is `src/` and browser-safe: it consumes a manifest, it does not produce one.
T5 is `scripts/` and may use Node built-ins freely. They agree only on the SHAPE
of the manifest, which is fixed by the interface contract below — so neither
blocks the other.

**Do not let that distinction blur: a Node import reaching `src/` is a STOP.**

## The manifest shape both tasks must agree on

T1 owns the TypeScript type; T5 emits objects that satisfy it. Fixed here so the
two can proceed in parallel:

```ts
interface StdlibRemoteManifest {
  readonly name: string;                              // 'tupadr3'
  readonly aliasOf?: string | undefined;              // 'awslib14' for awslib
  readonly files: Readonly<Record<string, string>>;   // key -> relative path
}
```

`key` is `derivePumlKey`'s output (lowercase, `.puml` stripped). The value is
the REAL relative path within the bundle folder, case preserved — that is
[ADR-3](../decisions.md#adr-3) and it is the whole reason no vendored file gets
renamed.

## Batch exit criteria

- All quality gates green, including the new `vendor-stdlib --verify`
- T1's module is integration-free — nothing imports it yet (T2 wires it)
- T5 changes no vendored file's content and no vendored file's name
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

## Sequencing note for the orchestrator

Both tasks can move `npm test`. Run gates after both return and attribute any
failure before committing either — commit per task, not per batch.
