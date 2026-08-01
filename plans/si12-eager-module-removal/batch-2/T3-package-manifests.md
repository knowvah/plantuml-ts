# T3 — Drop the eager subpaths from the two packages

## Context

See [ADR-1](../decisions.md#adr-1).

`stdlib-aws` exports `./awslib14` and `./awslib` eagerly; `stdlib-tupadr3`
already has **no** dedicated eager subpath — its 20.49 MB module was reachable
only through `.`. The two packages were already inconsistent, which is
probably how 20 MB stayed easy to overlook.

## Task

1. `stdlib-aws/package.json` — remove `./awslib14` and `./awslib` from
   `exports`; keep `./awslib14.remote`, `./awslib.remote`, `.`,
   `./package.json`.
2. `stdlib-tupadr3/package.json` — confirm `.` and `./tupadr3.remote` are the
   surface.
3. Both READMEs — show manifest + `baseUrl` registration; state that eager
   registration is unavailable for that bundle and why.

**`files` keeps `assets/` in both.** Removing it is stop condition 5.

## Write-set — write NOTHING outside these

- `packages/stdlib-aws/package.json` (modify)
- `packages/stdlib-aws/README.md` (modify)
- `packages/stdlib-tupadr3/package.json` (modify)
- `packages/stdlib-tupadr3/README.md` (modify)

## Read-set

- both `package.json`s — current `exports`/`files`
- both READMEs — current registration instructions
- `docs/stdlib-remote.md` § "Recipe: self-hosted assets" and § "Recipe: pinned
  CDN" — the recipes your README should point at rather than duplicate
- [ADR-1](../decisions.md#adr-1)

## Acceptance criteria

1. Given `stdlib-aws`'s `exports`, then `./awslib14` and `./awslib` are absent
   and both `.remote` subpaths remain.
2. Given either package's `files`, then `assets/` still ships.
3. Given either README, then it shows manifest + `baseUrl` registration and
   states eager registration is unavailable for that bundle.
4. Given `npm pack --dry-run --json` in each package, then it succeeds and its
   file list still contains asset `.puml` paths.

## Quality bar

`npm run typecheck`, `npm run lint` clean, plus one `npm pack --dry-run` per
package to confirm the manifest parses and assets resolve. Do NOT run the full
`npm test` — T4 owns the packaging gate.

## Observability

N/A — packaging metadata, no runtime operations.

## Rollback

**Reversible** — revert the commit.

## Boundaries

**Never:** remove `assets/` from `files` (stop condition 5); remove or rename
a `.remote` subpath; modify or re-encode `awslib14` asset content (stop
condition 6 — CC BY-**ND**); publish; run a git mutation.

## Method rules

1. **Trace TWO levels:** these `exports` are asserted by
   `tests/unit/stdlib-package-files.test.ts` (T4, parallel with you) and read
   by `stdlib-all`'s dependencies (T2). The export map in
   [`batch-2/overview.md`](overview.md) is the contract all three share.
2. **Verify the packed file list by RESOLVING it**, not by reading the array.

## Commit

`feat(T3): drop the eager subpaths from the two large stdlib packages`
