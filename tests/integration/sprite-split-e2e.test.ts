/**
 * si11b T6 -- end-to-end verification against the REAL emitted sprite-split
 * artifacts, and the measurement the whole mission is judged on.
 *
 * Every earlier task (T1-T5) tested its own layer against a fabricated
 * manifest or a hand-built stand-in. This file is the one place that:
 *   - reads the ACTUAL `sprites.json` manifest T1's generator emitted to
 *     `packages/stdlib/assets/bootstrap1.13.1/` (built once by vitest's
 *     `globalSetup`, `tests/helpers/build-stdlib-globalsetup.ts` --
 *     `buildStdlibPackages()` -> `buildSpriteSplits()`), not a hand-built
 *     stand-in
 *   - serves fragment content from the ACTUAL derived
 *     `packages/stdlib/assets/bootstrap1.13.1/sprites/<name>.puml` files T1
 *     wrote, via a disk-backed fetcher -- never the network (mission stop
 *     condition 11)
 *   - registers the bundle through `spriteSplitStdlib` exactly as its own
 *     module doc comment's registration recipe describes
 *     (`src/core/sprite-split-stdlib.ts`), imported from `src/index.ts` --
 *     the ONLY surface a published consumer can import from (fix(T4))
 *   - renders through the real `render()` pipeline, not
 *     `assembleSpriteSplitContent` called directly
 *   - measures the real bytes moved and logs them plainly, per ADR-6
 *     ("measure and state, never assert success")
 *
 * Path correction (README/T6 spec said `packages/stdlib/generated/...`):
 * the manifest is emitted under `packages/stdlib/assets/bootstrap1.13.1/
 * sprites.json`, not `generated/` -- verified against
 * `scripts/build-stdlib-packages.ts#buildSpriteSplits` and the file on disk.
 * Following the code per the mission's own push-forward condition.
 *
 * Shape correction (T6 spec / acceptance criterion 1 asked for an `<image>`
 * count and a `data:image/...` href, mirroring SI11a's tupadr3 raster-sprite
 * assertion): `bootstrap1.13.1`'s sprites are SVG-form EXCLUSIVELY
 * (`scripts/split-sprite-bundle/split.ts`'s own doc comment: "this bundle's
 * fragments are SVG-form exclusively"). An SVG-form sprite draws as an
 * inline `<path>` (`klimt/sprite/SpriteSvg.ts` -> `SvgNanoParser`), never an
 * `<image>`/base64 raster -- confirmed against the real golden
 * (`oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/golden.svg`
 * contains zero `<image>` elements but one `<path>` per sprite-bearing
 * entity). A PLAIN-TEXT usecase diagram draws zero `<path>` elements at all
 * (verified: `grep -rL path` over every usecase golden.svg finds several) --
 * so any `<path>` in this diagram's output can only have come from a
 * sprite. This test proves the sprites drew with the
 * shape this bundle actually produces: per-entity `<path>` presence, content
 * matched against the real fragment source read off disk, and pairwise
 * distinctness across the three sprites (never the same fallback ink for
 * all three). This is a stricter, shape-accurate substitute for the
 * criterion's literal wording, not a relaxation (mission stop condition 15
 * forbids relaxing to make a number look better; this is the opposite --
 * a more specific check of the same "sprites actually drew" property).
 *
 * @see ../../src/core/sprite-split-stdlib.ts -- `spriteSplitStdlib`, the registration recipe
 * @see ../../src/core/sprite-prefetch.ts -- `scanSpriteNames`, ADR-4's `<$name>` scan
 * @see ./stdlib-remote-e2e.test.ts -- si11a T8, the structure this mirrors
 */
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import {
  render,
  prepareIncludeStore,
  spriteSplitStdlib,
  stdlibRegistry,
  SpriteNotBundledError,
} from '../../src/index.js';
import type { BundleData, SpriteSplitManifest } from '../../src/index.js';
import type { IncludeFetcher } from '../../src/core/include-resolver.js';
import { FormulaMeasurer } from '../../src/core/measurer.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// si11b T1's real output (path correction: `assets/`, not `generated/` --
// see this file's header comment).
const BUNDLE_ASSETS_DIR = join(REPO_ROOT, 'packages', 'stdlib', 'assets', 'bootstrap1.13.1');
const MANIFEST_PATH = join(BUNDLE_ASSETS_DIR, 'sprites.json');

// The vendored source T1's splitter reads (ADR-1: read-only, never
// transformed) -- the "whole-file" baseline this mission exists to avoid
// paying, read from disk rather than hardcoded (acceptance criterion 2).
const BASELINE_PUML_PATH = join(REPO_ROOT, 'assets', 'stdlib', 'bootstrap1.13.1', 'bootstrap.puml');

const BASE_URL = 'https://cdn.example.com/bootstrap1.13.1';

const measurer = (): FormulaMeasurer => new FormulaMeasurer();

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
}

/**
 * Fetcher that reads the resolved URL back off `BUNDLE_ASSETS_DIR` on disk
 * (no network -- stop condition 11) and records the byte length of every
 * fragment it actually served, keyed by URL, into `fetched`. Mirrors
 * `stdlib-remote-e2e.test.ts`'s `diskFetcher` exactly.
 */
function diskFetcher(fetched: Map<string, number>): IncludeFetcher {
  return (url: string): Promise<string> => {
    const relPath = url.slice(BASE_URL.length + 1);
    const text = readFileSync(join(BUNDLE_ASSETS_DIR, relPath), 'utf8');
    fetched.set(url, Buffer.byteLength(text, 'utf8'));
    return Promise.resolve(text);
  };
}

/** A fetcher that must never run -- proves a given path makes zero requests
 *  for ordinary (non-stdlib) `!include` targets. */
const noFetch: IncludeFetcher = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected fetch: ${url}`));

/**
 * Registers `bootstrap1.13.1` via `spriteSplitStdlib` (the recipe in that
 * module's own doc comment) plus the `bootstrap` -> `bootstrap1.13.1` alias
 * stub the real generated `packages/stdlib/generated/bootstrap.js` also
 * ships (verified: it exports both `bootstrap` -- `aliasOf`, `files: {}` --
 * and `bootstrap1_13_1`, the concrete payload). This is what lets a source
 * write `!include <bootstrap/bootstrap>`, the form the real oracle fixture
 * `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml`
 * uses, resolve through to the sprite-split bundle.
 */
function buildRegistry(fetcher: IncludeFetcher) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SpriteSplitManifest;
  expect(manifest.name).toBe('bootstrap1.13.1');

  return stdlibRegistry({
    bootstrap: (): Promise<BundleData> =>
      Promise.resolve({ name: 'bootstrap', aliasOf: 'bootstrap1.13.1', files: {} }),
    'bootstrap1.13.1': () =>
      Promise.resolve(spriteSplitStdlib({ manifest, baseUrl: BASE_URL, fetcher })),
  });
}

/** Total `<path ` occurrences across the given fragments' REAL on-disk
 *  source -- the number of ink strokes the render must produce if (and only
 *  if) every requested sprite actually drew. Never hardcoded: recomputed
 *  from the same files the fetcher served. */
function expectedPathCount(names: readonly string[]): number {
  let total = 0;
  for (const name of names) {
    const source = readFileSync(join(BUNDLE_ASSETS_DIR, 'sprites', `${name}.puml`), 'utf8');
    total += (source.match(/<path /g) ?? []).length;
  }
  return total;
}

describe('bootstrap1.13.1 -- real manifest, real fragments, real render (criteria 1-2)', () => {
  it('fetches exactly 3 fragments for a 3-sprite diagram and draws all 3', async () => {
    const fetched = new Map<string, number>();
    const registry = buildRegistry(diskFetcher(fetched));

    const spriteNames = ['bi-globe', 'bi-house', 'bi-alarm'] as const;

    const svg = await render(
      uml(
        'skinparam UsecaseBackgroundColor white',
        '!include <bootstrap/bootstrap>',
        'usecase a as "<$bi-globe>"',
        'usecase b as "<$bi-house>"',
        'usecase c as "<$bi-alarm>"',
      ),
      { stdlibRegistry: registry, fetcher: noFetch, measurer: measurer() },
    );

    // AC1: at most 4 fetches (comfortably inside the bar); pinned exactly
    // rather than loosely, and independent of fetch completion order
    // (`assembleSpriteSplitContent` sorts names before any fetch starts).
    expect(fetched.size).toBe(3);
    expect([...fetched.keys()].sort()).toEqual(
      spriteNames.map((name) => `${BASE_URL}/sprites/${name}.puml`).sort(),
    );

    // The sprites actually drew: a plain-text usecase diagram draws ZERO
    // `<path>` elements (verified against the real golden corpus -- this
    // file's header comment), so every `<path>` below came from a sprite.
    // The count is derived from the REAL fragment bytes the fetcher just
    // served, not a hardcoded literal, so it tracks the actual content.
    const pathCount = (svg.match(/<path /g) ?? []).length;
    expect(pathCount).toBe(expectedPathCount(spriteNames));
    expect(pathCount).toBeGreaterThan(0);

    // Each of the 3 requested sprites drew ITS OWN ink, not one drawing
    // repeated three times or two sprites silently missing: split the SVG
    // on entity boundaries and require a `<path>` inside each, with three
    // pairwise-distinct `d` attributes.
    const entityChunks = svg.split('<!--entity ').slice(1);
    expect(entityChunks).toHaveLength(3);
    const firstPathDs = entityChunks.map((chunk) => {
      const match = /<path d="([^"]+)"/.exec(chunk);
      expect(match).not.toBeNull();
      return match![1]!;
    });
    expect(new Set(firstPathDs).size).toBe(3);

    // --- THE MEASUREMENT ---------------------------------------------
    const manifestGzipBytes = gzipSync(readFileSync(MANIFEST_PATH), { level: 9 }).length;
    const fragmentBytes = [...fetched.values()].reduce((sum, n) => sum + n, 0);
    const totalBytes = manifestGzipBytes + fragmentBytes;
    const baselineBytes = statSync(BASELINE_PUML_PATH).size;
    const reductionPct = ((baselineBytes - totalBytes) / baselineBytes) * 100;

    // Criterion 2: this IS the mission's headline evidence; it must be easy
    // to read and quote, not buried in an assertion message (T6 spec,
    // "Observability").
    console.log(
      [
        '',
        '=== si11b T6 measurement -- bootstrap1.13.1, 3-sprite diagram ==========',
        `manifest (sprites.json, gzip -9):      ${manifestGzipBytes.toLocaleString()} B`,
        `fragments actually fetched (3 files):  ${fragmentBytes.toLocaleString()} B`,
        `TOTAL over the wire:                   ${totalBytes.toLocaleString()} B`,
        `whole-file bootstrap.puml baseline:    ${baselineBytes.toLocaleString()} B`,
        `reduction:                              ${reductionPct.toFixed(3)}%`,
        '========================================================================',
        '',
      ].join('\n'),
    );

    // ADR-6: measure and state, never assert success beyond what was
    // measured. The mission projected ~98.7% (a 3-sprite diagram against
    // the 1,085,342 B whole file); this is a regression tripwire set below
    // that projection, not a rounded-up claim -- if a future change to the
    // manifest or fragment set drops the real reduction materially below
    // ~98.7%, this must fail per stop condition 15, not be relaxed.
    expect(reductionPct).toBeGreaterThan(97);
  });
});

describe('ADR-5b escape hatch -- a sprite named only via options.sprites (criterion 3)', () => {
  it('fetches and draws a sprite the <$name> scan cannot see', async () => {
    const fetched = new Map<string, number>();
    const registry = buildRegistry(diskFetcher(fetched));

    // The raw source never contains the literal substring `<$bi-heart>`
    // anywhere -- it is assembled from two string literals joined by TIM's
    // `+` operator (`TValue#add`, `src/core/tim/expression/TValue.ts`) and
    // only becomes `<$bi-heart>` once the preprocessor evaluates
    // `iconFrag()` at parse time. `scanSpriteNames` runs on the RAW source
    // during the async prefetch walk, BEFORE that evaluation (ADR-5's own
    // documented limitation), so this is a faithful reproduction of "a
    // macro-produced sprite name the scan cannot see" -- not a name that
    // merely looks indirect while still appearing literally in the text.
    const source = uml(
      'skinparam UsecaseBackgroundColor white',
      '!include <bootstrap/bootstrap>',
      '!function iconFrag()',
      '!return "<$bi" + "-heart>"',
      '!endfunction',
      '!$iconValue = iconFrag()',
      'usecase e as "$iconValue"',
    );

    const svg = await render(source, {
      stdlibRegistry: registry,
      fetcher: noFetch,
      measurer: measurer(),
      sprites: ['bi-heart'],
    });

    // Fetched exactly the option-named sprite, and nothing else -- proving
    // the escape hatch is what drove the fetch, not a (nonexistent) scan hit.
    expect(fetched.size).toBe(1);
    expect([...fetched.keys()]).toEqual([`${BASE_URL}/sprites/bi-heart.puml`]);

    // And it actually drew: the entity's `<path>` count matches the real
    // fragment's `<path>` count, read off disk.
    const pathCount = (svg.match(/<path /g) ?? []).length;
    expect(pathCount).toBe(expectedPathCount(['bi-heart']));
    expect(pathCount).toBeGreaterThan(0);
  });
});

describe('a sprite absent from the manifest fails offline, no request made (criterion 4)', () => {
  it('names the bundle and sprite with zero network requests', async () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SpriteSplitManifest;
    expect(manifest.sprites).not.toContain('bi-does-not-exist');

    const fetched = new Map<string, number>();
    const registry = buildRegistry(diskFetcher(fetched));

    const err = await prepareIncludeStore(
      uml('!include <bootstrap/bootstrap>', 'usecase e as "<$bi-does-not-exist>"'),
      { fetcher: noFetch, stdlibRegistry: registry },
    ).then(
      () => undefined,
      (e: unknown) => e as SpriteNotBundledError,
    );

    expect(err).toBeInstanceOf(SpriteNotBundledError);
    expect(err?.bundle).toBe('bootstrap1.13.1');
    expect(err?.sprite).toBe('bi-does-not-exist');
    // No fragment request made for the offending name, or for any name
    // sorted after it (`assembleSpriteSplitContent` validates every
    // requested name BEFORE fetching any of them).
    expect(fetched.size).toBe(0);
  });
});
