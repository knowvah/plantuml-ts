# T1 — The generator stops emitting eager modules for aws + tupadr3

## Context

See [ADR-1](../decisions.md#adr-1) (`.` exports the manifests),
[ADR-2](../decisions.md#adr-2) (`modules?` optional) and
[ADR-5](../decisions.md#adr-5) (stop generating, not merely stop shipping).

`-tupadr3` ships 40.8 MB unpacked: eager `tupadr3.js` **20.49 MB**, assets
19.9 MB, and the remote manifest a consumer actually needs **0.43 MB**. Same
content, two encodings, and nobody uses both. This task removes the eager half
for `stdlib-aws` and `stdlib-tupadr3`. **`packages/stdlib` is untouched.**

## Task

1. `types.ts` — `modules?: readonly GeneratedModule[]` (optional).
2. `package-specs.ts` — `STDLIB_AWS_PACKAGE` and `STDLIB_TUPADR3_PACKAGE` drop
   their `modules` key; they keep `remoteModules` unchanged. `STDLIB_PACKAGE`
   is not touched.
3. `build-stdlib-packages.ts` — emit eager modules only when a spec declares
   them.
4. `emit-index.ts` — when a spec has no eager modules, build the index from
   its `remoteModules`' export names instead (ADR-1).

## Write-set — write NOTHING outside these

- `scripts/build-stdlib-packages/types.ts` (modify)
- `scripts/build-stdlib-packages/package-specs.ts` (modify)
- `scripts/build-stdlib-packages.ts` (modify)
- `scripts/build-stdlib-packages/emit-index.ts` (modify)
- `tests/unit/stdlib-eager-omission.test.ts` (create)

`emit-all-index.ts` is T2's. `tests/unit/stdlib-package{s,-files}.test.ts` are
T4's — they WILL be red after this task; that is expected, do not fix them
here.

## Read-set

- `scripts/build-stdlib-packages/types.ts` — `PackageSpec`, `GeneratedModule`
- `scripts/build-stdlib-packages/package-specs.ts` — the three specs; note
  `AWSLIB14_MODULE`/`TUPADR3_MODULE` are already shared between `modules` and
  `remoteModules`
- `scripts/build-stdlib-packages.ts` — `buildPackage`, the `spec.remoteModules ?? []`
  loop, `freshGeneratedDir`
- `scripts/build-stdlib-packages/emit-index.ts` — all 23 lines
- `scripts/build-stdlib-packages/emit-remote-manifest.ts` — the manifest export
  names (`awslib14Remote` etc.) your index must re-export

Line numbers drift — follow the code and report any correction.

## Interface contract (consumed by T2-T5)

```
packages/stdlib-aws/generated/     awslib14.remote.*  awslib.remote.*  index.*
packages/stdlib-tupadr3/generated/ tupadr3.remote.*   index.*
packages/stdlib/generated/         UNCHANGED, byte-identical
```

`index.js` re-exports `awslib14Remote, awslibRemote` / `tupadr3Remote`.

## Acceptance criteria

1. Given a spec with no `modules`, when the build runs, then no eager module
   file is written for it and `generated/index.js` re-exports its remote
   manifests instead.
2. Given `packages/stdlib`, when the build runs, then its five eager modules
   are **byte-identical to before** — assert by sha256, not by reasoning that
   the change cannot reach them (stop condition 7).
3. Given the built tree, then `awslib14.js`, `awslib.js` and `tupadr3.js` do
   not exist.
4. Given `npm run build:stdlib`, then it exits 0 and every package's `assets/`
   is emitted exactly as before.
5. Given `npx jiti scripts/vendor-stdlib.ts --verify`, then all 34,587 files
   still report verbatim.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/stdlib-eager-omission.test.ts`, and `npx jiti
scripts/vendor-stdlib.ts --verify` clean. Do NOT run the full `npm test` — it
will be red until batch 2, and the orchestrator runs the gate set.

Assert specific values (paths, sha256, export names), never truthiness.

## Observability

N/A — build-time tooling, no runtime operations. The property this task moves
(published size) is asserted by T4's packaging gate.

## Rollback

**Reversible** — revert the commit and regenerate.

## Boundaries

**Always:** keep `packages/stdlib`'s output byte-identical; keep every
package's `assets/` emission unchanged.

**Never:** write under `assets/stdlib/`; touch `scripts/vendor-stdlib/**`;
delete a module `packages/stdlib` still declares; run a git mutation — the
orchestrator commits.

## Method rules

1. **Trace dependency cascades TWO levels.** `PackageSpec` is read by the build
   script, `emit-index.ts`, `emit-remote-manifest.ts` AND two test files;
   making a field optional changes every read site.
2. **Verify the emitted tree from a real build**, not from the code's intent.
3. **Capture a failing command's stderr before theorising.**

## Commit

`feat(T1): stop emitting eager modules for the two large stdlib packages`
