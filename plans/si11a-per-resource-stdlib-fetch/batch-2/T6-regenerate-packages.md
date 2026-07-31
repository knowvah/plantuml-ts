# T6 — Regenerate the packages; add the packaging gate

## Context

T5 taught the generator to emit manifests. This task runs it, ships the assets,
and adds the assertion that catches the one failure mode this mission can
produce which is **invisible in-repo**.

## Task

1. Regenerate `@plantuml-ts/stdlib-aws` and `@plantuml-ts/stdlib-tupadr3`
   (`npm run build:stdlib`, or whatever `package.json` names it — check).
2. Ship the `.puml` assets in each package so a consumer can serve them from
   their own origin (ADR-4: there is no default CDN, so the assets must be
   *in the package*).
3. Add the remote subpaths to each `package.json` `exports`, and add the assets
   directory to `files`.
4. Add `tests/unit/stdlib-package-files.test.ts` — the packaging gate.

**Scope: `stdlib-aws` and `stdlib-tupadr3` only.** `@plantuml-ts/stdlib`
(1.8 MB across 5 bundles) and `-all` are out of scope — SI8's per-bundle
laziness already solves them, and adding assets there is payload for no win.

## Write-set — write NOTHING outside these

- `packages/stdlib-aws/**` (regenerate + `package.json`)
- `packages/stdlib-tupadr3/**` (regenerate + `package.json`)
- `tests/unit/stdlib-package-files.test.ts` (create)

Do NOT modify the generator — that is T5's, and it is already done. If the
generator turns out to be wrong, that is a T5 fix commit, not a T6 edit.

## Read-set

- `packages/stdlib-aws/package.json`, `packages/stdlib-tupadr3/package.json` —
  the current `exports` / `files` shape
- `scripts/build-stdlib-packages/package-specs.ts` — what T5 emits
- `package.json` (repo root) — the build:stdlib script name
- `tests/unit/stdlib-packages.test.ts` — the existing round-trip sha256 test

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — the eager module STAYS; the remote module is
  additional
- [ADR-4](../decisions.md#adr-4) — assets ship in the package; no default URL

## Interface contract

None produced. Consumed by T8, which fetches these assets over a local fetcher.

## Acceptance criteria

1. Given each `package.json`, then `exports` carries the new remote subpath and
   `files` includes the assets directory.
2. Given every path in every emitted manifest, then that path falls inside the
   package's published `files` globs — **this is the trap**: a package whose
   `files` omits the assets passes every other test and 404s for every consumer
   after publish. Assert it by resolving the `files` patterns, not by eyeballing.
3. Given the existing eager modules (`awslib14.js`, `awslib.js`, `tupadr3.js`),
   then they are **byte-identical** to before this task.
4. Given `npx tsx scripts/vendor-stdlib.ts --verify`, then all sha256 still
   match — regeneration copied, it did not transform.
5. Given each package's manifest module, then it parses and its `files` is
   non-empty for concrete bundles.

## Quality bar

All four gates exit 0, plus `vendor-stdlib --verify`. 389 goldens
byte-identical; ratchet's 54 zero-diff; size-deltas 320/351 widened 0.

Criterion 3 matters most: an accidental change to the eager modules would break
every existing consumer silently.

## Observability

N/A — generated packaging artifacts, no runtime operations.

## Rollback

**Reversible** — revert the commit; the packages return to their previous
generated state. **Note:** `npm publish` is maintainer-gated (SI5b) and is NOT
part of this mission — an in-repo revert is clean, an unpublish is not. Do not
publish anything.

## Boundaries

**Always:** verify criterion 3 by byte comparison (`git diff --stat` on the
eager modules should show no change), not by reasoning that "adding a file
cannot change existing ones".

**Never:** publish to npm (stop condition 14). Never modify a vendored asset's
content or name. Never remove or rename an existing `exports` entry — that is a
breaking change for current consumers.

## Method rules

1. **Trace dependency cascades TWO levels.** These packages are consumed by
   `tests/unit/stdlib-packages.test.ts` and by the workspace's own
   `devDependencies` link; check both before changing `exports`.
2. **Verify the `files` globs actually include the assets** by resolving them,
   not by reading the array — that is exactly the claim criterion 2 exists to
   test.

## Commit

One commit: `feat(T6): ship per-resource assets and manifests in the stdlib packages`
