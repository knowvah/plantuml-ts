# T1 — The sprite splitter, its MIT allowlist, and its generator wiring

## Context

See [ADR-1](../decisions.md#adr-1) (derive, never transform),
[ADR-2](../decisions.md#adr-2) (fail-closed allowlist) and
[ADR-3](../decisions.md#adr-3) (name list, path by convention).

`assets/stdlib/bootstrap1.13.1/bootstrap.puml` is 1,085,342 B holding 2,078
sprite blocks — 99.6% of the file. SI11a's per-RESOURCE granularity cannot
help, because it is ONE resource. This task produces the per-sprite fragments
and the manifest that make per-sprite loading possible.

## Task

1. Add `scripts/split-sprite-bundle/split.ts`: read a bundle's `.puml`, cut it
   into one fragment per `sprite` block, and emit a `SpriteSplitManifest`.
2. Add `scripts/split-sprite-bundle/allowlist.ts`: the MIT allowlist gate.
3. Extend `package-specs.ts` so the bundle declares its sprite-split output.
4. **Wire it into `scripts/build-stdlib-packages.ts` so `npm run build:stdlib`
   actually emits.**

Fragments go to `packages/stdlib/assets/bootstrap1.13.1/sprites/<name>.puml`,
each a self-contained `sprite <name> <svg …>…</svg>` block. **Read the
vendored file; never write to `assets/stdlib/`** (ADR-1).

Sprite blocks are SVG-form and multi-line:

```
sprite bi-0-circle-fill <svg width="16" height="16">
  <path d="…"/>
</svg>
```

Reuse `emit-module.ts`'s `JSON.stringify` discipline where you emit JS, and
mirror `emit-remote-manifest.ts`'s structure — this is a sibling emitter, not
a new pattern.

## Write-set — write NOTHING outside these

- `scripts/split-sprite-bundle/split.ts` (create)
- `scripts/split-sprite-bundle/allowlist.ts` (create)
- `scripts/build-stdlib-packages/package-specs.ts` (modify)
- `scripts/build-stdlib-packages.ts` (modify)
- `tests/unit/split-sprite-bundle.test.ts` (create)

Do NOT modify `scripts/vendor-stdlib/**` — ADR-1 removed the need, and
touching it is stop condition 5.

## Read-set

- `scripts/build-stdlib-packages/emit-remote-manifest.ts` — the sibling
  emitter to mirror
- `scripts/build-stdlib-packages.ts:44-70` — `buildPackage`, and the
  `spec.remoteModules ?? []` loop your wiring sits beside. **Line numbers
  drift — follow the code.**
- `scripts/build-stdlib-packages/package-specs.ts` — `PackageSpec`, and
  `STDLIB_PACKAGE`'s bootstrap entry
- `assets/stdlib.manifest.json` — the per-bundle `license` field ADR-2 keys on
- `src/core/sprite-commands.ts:194-232` — `isSvgSpriteOpenLine` /
  `isSvgSpriteCloseLine` / `scanSvgSpriteBlock`, the RUNTIME parser your
  fragments must remain parseable by

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — derive into `packages/`; the vendored file
  is read-only
- [ADR-2](../decisions.md#adr-2) — **allowlist, fail-closed**
- [ADR-3](../decisions.md#adr-3) — sorted name list; path by convention

## Interface contract (consumed by T5, T6)

```ts
export interface SpriteSplitManifest {
  readonly name: string;               // 'bootstrap1.13.1'
  readonly sprites: readonly string[]; // sorted, lowercase
}
export function splitSpriteBundle(opts: {
  readonly sourcePumlPath: string;
  readonly outDir: string;
  readonly bundleName: string;
  readonly license: string | undefined;
}): SpriteSplitManifest;
```

Fragment path is `sprites/<name>.puml`, derived by convention.

## Acceptance criteria

1. Given `bootstrap.puml`, when split, then **2,078** fragments are written,
   each parsing as exactly one sprite block via the runtime's own
   `scanSvgSpriteBlock`, and the sorted name list gzips to **≤ 8 KB**
   (measured 7,289 B — assert the bound, log the actual).
2. Given a bundle whose manifest `license` is absent or not MIT, when a split
   is attempted, then it **refuses**. Assert specifically against
   **`awslib14`, which carries no `license` field** — this is the fail-closed
   case ADR-2 exists for.
3. Given the split has run, then `npx tsx scripts/vendor-stdlib.ts --verify`
   still reports all 34,587 files verbatim — nothing under `assets/stdlib/`
   was written (ADR-1).
4. Given `npm run build:stdlib`, then the fragments and manifest **are
   actually emitted to disk** — the wiring, not just the emitter. Assert on
   the built output, not by calling `splitSpriteBundle` directly.
5. Given every emitted fragment, then concatenating them yields the same 2,078
   sprite definitions the original file declares — no sprite dropped, none
   duplicated.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/split-sprite-bundle.test.ts`, and `npx tsx
scripts/vendor-stdlib.ts --verify` all clean. Do NOT run the full `npm test`
— the orchestrator runs the full gate set.

## Observability

N/A — build-time tooling, no runtime operations.

## Rollback

**Reversible** — revert the commit. Generated output is regenerable and
gitignored; the vendored tree was never written.

## Boundaries

**Always:** keep the eager emitters' behavior byte-identical.

**Never:** write anything under `assets/stdlib/`. Never rename, re-encode or
reorder a vendored file. Never allow a non-allowlisted bundle to be split —
and never implement the gate as a denylist, which fails OPEN on `awslib14`.

## Method rules

1. **Trace dependency cascades TWO levels.** `package-specs.ts` is read by
   the build script AND by two test files; `build-stdlib-packages.ts` is
   imported by a vitest `globalSetup`. Check every consumer before changing a
   shared type.
2. **Verify the emitted output from the BUILD**, not from a direct call — that
   distinction is exactly what SI11a's equivalent task got wrong.

## Commit

One commit: `feat(T1): split the bootstrap bundle into per-sprite fragments`
