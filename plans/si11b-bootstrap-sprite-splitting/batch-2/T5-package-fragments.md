# T5 — Ship the fragments and the split subpath

## Context

See [ADR-1](../decisions.md#adr-1) and [ADR-3](../decisions.md#adr-3).

T1 derives per-sprite fragments into `packages/stdlib/assets/`. This task
ships them, adds the subpath a consumer imports the manifest from, and adds
the assertion that catches the one failure mode which is **invisible
in-repo**.

`@plantuml-ts/stdlib` was deliberately out of scope for SI11a (1.8 MB across
5 bundles, already solved by per-bundle laziness). It is in scope here because
bootstrap lives in it.

## Task

1. Add the split manifest subpath to `packages/stdlib/package.json` `exports`.
2. Add the fragments directory to `files`.
3. Add `tests/unit/sprite-package-files.test.ts` — the packaging gate.

Follow the pattern SI11a established in `packages/stdlib-aws` and
`packages/stdlib-tupadr3`: a `prepack` script copies assets, `assets/` is
gitignored per-package, and the eager module stays byte-identical.

## Write-set — write NOTHING outside these

- `packages/stdlib/**`
- `tests/unit/sprite-package-files.test.ts` (create)

Do NOT modify the generator — that is T1's, and it is done. If the generator
turns out to be wrong, that is a `fix(T1)` commit, not a T5 edit.

## Read-set

- `packages/stdlib-tupadr3/package.json` and
  `packages/stdlib-tupadr3/scripts/copy-assets.mjs` — SI11a's working
  pattern, **including its `isUpToDate` guard** (see Boundaries)
- `packages/stdlib/package.json` — the current `exports`/`files` shape
- `tests/unit/stdlib-package-files.test.ts` — SI11a's packaging gate, the
  model for this one
- `scripts/build-stdlib-packages/package-specs.ts` — what T1 emits

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — fragments are derived output; the vendored
  tree is untouched
- [ADR-3](../decisions.md#adr-3) — fragment path is `sprites/<name>.puml`

## Interface contract

None produced. Consumed by T6, which fetches these fragments over a local
fetcher.

## Acceptance criteria

1. Given `package.json`, then `exports` carries the split-manifest subpath and
   `files` includes the fragments directory.
2. Given every name in the split manifest, then `sprites/<name>.puml` falls
   inside the package's published `files` globs — **assert by resolving
   `npm pack --dry-run --json`'s actual file list**, never by reading the
   array. This is the trap: a `files` array that omits the fragments passes
   every other test and 404s for every consumer after publish.
3. Given the existing eager `bootstrap.js`, then it is **byte-identical**
   before and after — captured by sha256, not by reasoning that adding a file
   cannot change existing ones.
4. Given `npx tsx scripts/vendor-stdlib.ts --verify`, then all sha256 still
   match (ADR-1).
5. Given the package's unpacked size, then it stays under an asserted ceiling
   — measure the real figure first, then set the ceiling with headroom and a
   comment explaining what it protects.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/sprite-package-files.test.ts`, and `npx tsx
scripts/vendor-stdlib.ts --verify` clean. Do NOT run the full `npm test`.

## Observability

N/A — packaging artifacts, no runtime operations.

## Rollback

**Reversible** — revert the commit. **Never publish** (stop condition 14):
an in-repo revert is clean, an unpublish is not.

## Boundaries — two races SI11a already paid for

**Only ONE test file may invoke `npm pack` for this package.** SI11a lost a
stop-condition-13 escalation to two nested races: concurrent `npm pack` runs
whose `prepack` hooks `rmSync`'d the shared asset tree from under each other
(`ENOENT: lstat …/address_card_o.puml`), and three test files each calling
`buildStdlibPackages()` while others imported from the tree it deletes.

Consequences you must honor:
- **Do NOT add a `beforeAll` that rebuilds the generated tree.** It is built
  once in vitest `globalSetup` (`tests/helpers/build-stdlib-globalsetup.ts`).
- **Any `copy-assets.mjs` you add must carry the `isUpToDate` guard** so a
  second pack does not destructively rebuild.
- Allow a generous timeout: packing a package whose `prepack` copies thousands
  of files genuinely takes ~12 s.

**Never:** publish to npm, modify a vendored asset, or remove/rename an
existing `exports` entry — that is a breaking change for current consumers.

## Method rules

1. **Trace dependency cascades TWO levels.** `packages/stdlib` is consumed by
   `tests/unit/stdlib-packages.test.ts` and by the workspace's own
   `devDependencies` link; check both before changing `exports`.
2. **Verify the `files` globs actually include the fragments by RESOLVING
   them**, not by reading the array — that is exactly the claim criterion 2
   exists to test.

## Commit

One commit: `feat(T5): ship per-sprite fragments in the stdlib package`
