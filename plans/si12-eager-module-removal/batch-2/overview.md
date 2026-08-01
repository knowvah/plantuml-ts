# Batch 2 — The consumers

Four tasks, genuinely parallel. Disjoint write-sets; none consumes another's
output within this batch. All four depend on T1's generated tree.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `stdlib-all` re-exports eager + manifests | typescript-pro | `scripts/build-stdlib-packages/emit-all-index.ts`, `packages/stdlib-all/package.json`, `packages/stdlib-all/README.md`, `tests/unit/stdlib-all-exports.test.ts` | T1 | [ ] |
| T3 | The two packages' manifests + READMEs | typescript-pro | `packages/stdlib-aws/package.json`, `packages/stdlib-aws/README.md`, `packages/stdlib-tupadr3/package.json`, `packages/stdlib-tupadr3/README.md` | T1 | [ ] |
| T4 | Tests move off the eager modules | typescript-pro | `tests/unit/stdlib-packages.test.ts`, `tests/unit/stdlib-package-files.test.ts` | T1 | [ ] |
| T5 | Re-base the measurement | typescript-pro | `tests/integration/stdlib-remote-e2e.test.ts` | T1 | [ ] |

## The export map all four agree on

T3 writes it, T4 asserts it, T2 re-exports from it:

```jsonc
// packages/stdlib-aws
"exports": {
  ".": …index (awslib14Remote, awslibRemote),
  "./awslib14.remote": …, "./awslib.remote": …, "./package.json": …
}   // "./awslib14" and "./awslib" are GONE

// packages/stdlib-tupadr3
"exports": {
  ".": …index (tupadr3Remote),
  "./tupadr3.remote": …, "./package.json": …
}
```

`files` keeps `assets/` in both — stop condition 5.

## The one criterion that is easy to skip and must not be

**T4 must LOWER the packaging gate's size ceilings.** They are the only
automated thing that would notice this mission silently not working; left at
aws 18 MB / tupadr3's current value they pass vacuously at half the size.
Measure, then set with headroom and a comment saying what the ceiling
protects.

## Batch exit criteria

- All quality gates green, `vendor-stdlib --verify` unmoved
- `npm pack --dry-run --json` resolves every asset path in both packages
- Measured: aws ≈ 8.3 MB, tupadr3 ≈ 20.3 MB unpacked
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

## Sequencing note for the orchestrator

All four can move `npm test`. Run gates after all four return and attribute any
failure before committing — **commit per task, not per batch.**
