/**
 * Splits one vendored stdlib bundle's `.puml` file into one fragment per
 * `sprite` block (mission si11b T1;
 * `plans/si11b-bootstrap-sprite-splitting/decisions.md` ADR-1/ADR-2/ADR-3).
 *
 * `assets/stdlib/bootstrap1.13.1/bootstrap.puml` is 1,085,342 B holding
 * 2,078 `sprite` blocks -- 99.6% of the file. SI11a's per-RESOURCE
 * granularity (`scripts/build-stdlib-packages/emit-remote-manifest.ts`)
 * cannot help here because it is ONE resource; this splits it into
 * per-sprite fragments so a consumer can fetch only the sprites a diagram
 * names.
 *
 * ADR-1: READS the vendored `.puml` file, WRITES derived fragments under
 * `packages/`. The vendored file is never modified, moved or renamed --
 * `scripts/vendor-stdlib.ts --verify` needs no change at all.
 *
 * ADR-2: refuses (throws) any bundle whose manifest `license` is not on
 * the {@link isMitAllowed} allowlist, fail-closed, BEFORE touching the
 * filesystem at all.
 *
 * ADR-3: returns a sorted, lowercase name list -- the fragment path is
 * `sprites/<name>.puml` BY CONVENTION, not carried in the manifest.
 *
 * Block boundaries come from the runtime's own `matchSpriteCommand`
 * (`src/core/sprite-commands.ts`), which dispatches to its own
 * (unexported) `scanSvgSpriteBlock` for the multi-line SVG form this
 * bundle uses exclusively -- so a fragment IS the exact span the runtime
 * parser itself would consume, not a second guess at the grammar. Only the
 * sprite's NAME is extracted locally (`SPRITE_NAME_RE`, below): the same
 * duplication discipline `emit-remote-manifest.ts` already uses for
 * `read-bundle.ts#isPumlFile` (that function is private, so only the
 * small, non-authority-bearing part is copied).
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createSpriteRegistry, matchSpriteCommand } from '../../src/core/sprite-commands.js';

import { isMitAllowed } from './allowlist.js';

export interface SpriteSplitManifest {
  /** `BundleData.name` / vendored folder name, e.g. `'bootstrap1.13.1'`. */
  readonly name: string;
  /** Sorted, lowercase sprite names. Fragment path is `sprites/<name>.puml`
   *  by convention (ADR-3) -- not carried here. */
  readonly sprites: readonly string[];
}

export interface SplitSpriteBundleOptions {
  /** Absolute path to the bundle's vendored `.puml` file. Read-only. */
  readonly sourcePumlPath: string;
  /** Directory the `<name>.puml` fragments are written into directly
   *  (this IS the `sprites/` directory, not its parent). Freshly rebuilt
   *  on every call -- any fragment from a previous split that is no
   *  longer part of the bundle is removed, mirroring
   *  `build-stdlib-packages.ts#freshGeneratedDir`'s rm-then-mkdir. */
  readonly outDir: string;
  /** `BundleData.name` this split's manifest reports. */
  readonly bundleName: string;
  /** `assets/stdlib.manifest.json`'s per-bundle `license` field -- the
   *  ADR-2 allowlist gate's input. `undefined` when the bundle carries no
   *  `license` field at all (e.g. `awslib14`). */
  readonly license: string | undefined;
}

/** The shared `sprite NAME <svg …` prefix of both the single-line and
 *  multi-line SVG sprite grammars (`sprite-commands.ts`'s
 *  `SVG_SINGLE_LINE_RE`/`SVG_MULTILINE_START_RE`) -- enough to capture the
 *  name without needing either private regex. Block-boundary correctness
 *  comes from `matchSpriteCommand`, not from this pattern. */
const SPRITE_NAME_RE = /^sprite\s+\$?([-.\w]+)\s+<svg\b/i;

function spriteNameAt(lines: readonly string[], i: number): string | undefined {
  const trimmed = (lines[i] ?? '').trim();
  return SPRITE_NAME_RE.exec(trimmed)?.[1];
}

function writeFragment(outDir: string, name: string, blockLines: readonly string[]): void {
  writeFileSync(join(outDir, `${name}.puml`), blockLines.join('\n') + '\n', 'utf8');
}

/** ADR-2's gate, applied BEFORE any filesystem access. */
function assertMitAllowed(bundleName: string, license: string | undefined): void {
  if (isMitAllowed(license)) return;
  throw new Error(
    `refusing to split bundle ${JSON.stringify(bundleName)}: license ` +
      `${JSON.stringify(license ?? null)} is not on the MIT allowlist (ADR-2)`,
  );
}

/** Walks `lines` once, writing one fragment per `sprite` block found (via
 *  the runtime's own `matchSpriteCommand`) into `outDir`, and returns the
 *  set of sprite names written. `sourcePath` is only for error messages. */
function writeFragmentsFromLines(lines: readonly string[], outDir: string, sourcePath: string): Set<string> {
  const registry = createSpriteRegistry();
  const names = new Set<string>();

  for (let i = 0; i < lines.length; ) {
    const result = matchSpriteCommand(lines, i, registry);
    if (result === null) {
      i += 1;
      continue;
    }

    const name = spriteNameAt(lines, i);
    if (name === undefined) {
      throw new Error(
        `splitSpriteBundle only supports SVG-form sprite blocks; non-SVG sprite at ${sourcePath}:${i + 1}`,
      );
    }
    if (names.has(name)) {
      throw new Error(`duplicate sprite name ${JSON.stringify(name)} in ${sourcePath}`);
    }

    writeFragment(outDir, name, lines.slice(i, i + result.consumed));
    names.add(name);
    i += result.consumed;
  }

  return names;
}

/**
 * Reads `opts.sourcePumlPath`, cuts it into one fragment per `sprite`
 * block using the runtime's own parser, writes each fragment to
 * `opts.outDir`, and returns the sorted, lowercase sprite-name manifest.
 *
 * Refuses (throws) without touching the filesystem when `opts.license` is
 * not on the ADR-2 MIT allowlist.
 *
 * @throws {Error} when `opts.license` fails {@link isMitAllowed}, or when a
 *   `sprite NAME <svg …` opening line is found but the runtime parser
 *   cannot determine its name or its block boundary (e.g. an unterminated
 *   `<svg>` block, or a non-SVG sprite grammar -- this bundle's fragments
 *   are SVG-form exclusively, per the task's scope).
 */
export function splitSpriteBundle(opts: SplitSpriteBundleOptions): SpriteSplitManifest {
  assertMitAllowed(opts.bundleName, opts.license);

  const source = readFileSync(opts.sourcePumlPath, 'utf8');
  const lines = source.split('\n');

  rmSync(opts.outDir, { recursive: true, force: true });
  mkdirSync(opts.outDir, { recursive: true });

  const names = writeFragmentsFromLines(lines, opts.outDir, opts.sourcePumlPath);

  return { name: opts.bundleName, sprites: [...names].sort() };
}
