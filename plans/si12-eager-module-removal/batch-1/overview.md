# Batch 1 — The generator stops emitting eager modules

One task, deliberately alone.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Generator omits eager modules for aws + tupadr3 | typescript-pro | `scripts/build-stdlib-packages/types.ts`, `scripts/build-stdlib-packages/package-specs.ts`, `scripts/build-stdlib-packages.ts`, `scripts/build-stdlib-packages/emit-index.ts`, `tests/unit/stdlib-eager-omission.test.ts` | — | [x] |

## Why this task runs alone

The generated tree is built **once**, in vitest `globalSetup`
(`tests/helpers/build-stdlib-globalsetup.ts`). The moment the generator stops
emitting eager modules, every test that reads them fails. Running batch 2's
consumers in parallel would have four agents testing against a tree changing
underneath them — the shared-worktree hazard SI11b paid for twice.

## Interface contract (consumed by T2-T5)

```
packages/stdlib-aws/generated/
  awslib14.remote.{js,d.ts}   awslib.remote.{js,d.ts}   index.{js,d.ts}
  # awslib14.js and awslib.js NO LONGER EXIST

packages/stdlib-tupadr3/generated/
  tupadr3.remote.{js,d.ts}    index.{js,d.ts}
  # tupadr3.js NO LONGER EXISTS

packages/stdlib/generated/    # UNCHANGED, byte-identical
```

`index.js` re-exports `awslib14Remote, awslibRemote` / `tupadr3Remote`
(ADR-1). `assets/` is untouched in all three packages.

## Batch exit criteria

- All quality gates green
- `packages/stdlib`'s five eager modules byte-identical by sha256
- `vendor-stdlib --verify` still 34,587 files verbatim
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

Batch 2's tests will be RED until their own tasks land — that is expected and
is why they are a separate batch. Do not "fix" them from T1.
