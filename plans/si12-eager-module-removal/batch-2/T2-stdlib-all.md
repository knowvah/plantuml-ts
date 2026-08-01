# T2 — `stdlib-all` re-exports eager bundles AND remote manifests

## Context

See [ADR-4](../decisions.md#adr-4).

`emit-all-index.ts` does `export * from` all three packages so a consumer can
register everything in one call. After T1, two of the three export manifests
rather than eager bundles — so `export *` would silently hand back less than
the README promises. That silent-loss option was explicitly rejected.

## Task

1. `emit-all-index.ts` — re-export `stdlib`'s five eager bundles PLUS
   `awslib14Remote`, `awslibRemote`, `tupadr3Remote`.
2. `packages/stdlib-all/README.md` — state plainly that the manifest bundles
   need a `baseUrl`, and show how.
3. `packages/stdlib-all/package.json` — adjust only if the export surface
   requires it.
4. `tests/unit/stdlib-all-exports.test.ts` — pin the export surface.

## Write-set — write NOTHING outside these

- `scripts/build-stdlib-packages/emit-all-index.ts` (modify)
- `packages/stdlib-all/package.json` (modify)
- `packages/stdlib-all/README.md` (modify)
- `tests/unit/stdlib-all-exports.test.ts` (create)

## Read-set

- `scripts/build-stdlib-packages/emit-all-index.ts` — all 27 lines
- `packages/stdlib-all/{package.json,README.md}` — current claims
- `scripts/build-stdlib-packages/emit-remote-manifest.ts` — manifest export names
- [ADR-4](../decisions.md#adr-4)

## Acceptance criteria

1. Given `stdlib-all`'s generated index, then it exports `stdlib`'s five eager
   bundles AND `awslib14Remote`, `awslibRemote`, `tupadr3Remote` — assert each
   name, not the count.
2. Given its README, then it states the manifest bundles require a `baseUrl`
   and shows the registration form.
3. Given the export-surface test, then removing any one export fails it. **No
   test asserts this today** — that gap is on-call failure mode #3.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/stdlib-all-exports.test.ts` clean. Do NOT run the full `npm test`.

## Observability

N/A — no new observable operations. The export-surface test IS the detection
mechanism for on-call failure mode #3.

## Rollback

**Reversible** — revert the commit and regenerate.

## Boundaries

**Never:** claim one-call register-everything without the `baseUrl` caveat;
add a dependency on a GPL bundle (`adaml` is excluded by SI5b D2); run a git
mutation.

## Method rules

1. **Trace TWO levels:** `emit-all-index.ts` is called from
   `build-stdlib-packages.ts#buildAllPackage`, and `stdlib-all`'s
   `dependencies` name all three packages — check both before changing the
   export list.
2. **Verify against the BUILT index**, not the emitter's source.

## Commit

`feat(T2): re-export remote manifests from the stdlib-all meta-package`
