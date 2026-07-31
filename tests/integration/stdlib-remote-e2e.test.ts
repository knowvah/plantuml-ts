/**
 * si11a T8 -- end-to-end verification against the REAL regenerated stdlib
 * packages, and the measurement the whole mission is judged on.
 *
 * Every earlier task (T1-T7) tested its own layer against a fabricated
 * manifest. This file is the one place that:
 *   - imports the ACTUAL `tupadr3.remote.js` / `awslib14.remote.js` T6
 *     emitted (each package's `generated/` directory), not a hand-built
 *     stand-in
 *   - serves resource content from the ACTUAL vendored `.puml` files T6
 *     copied into each package's `assets/` directory (verbatim copies of
 *     `assets/stdlib` -- SI5b's checksummed-copy guarantee)
 *   - renders through the real `render()` pipeline, not `prefetchIncludes`
 *     called directly
 *   - measures the real bytes moved and logs them plainly, per ADR-6
 *     ("measure and state, never assert success")
 *
 * No network anywhere (mission stop condition 10): the injected fetcher
 * reads `readFileSync` off the local package asset tree. `baseUrl` is a
 * fake `https://cdn.example.com/...` origin used only to prove the manifest
 * -> URL join is correct; the custom fetcher never dials it out.
 *
 * Method rule 2 correction (matches `tests/unit/stdlib-remote-prefetch.test.ts`'s
 * finding): no tupadr3 `.puml` file contains an `!include` line at all --
 * `common.puml` only `!define`s the `ENTITY` macro; a diagram author
 * includes `<tupadr3/common>` and each icon file SEPARATELY. The 3-icon
 * fixture below does exactly that (one `common` fetch + one fetch per
 * icon), which is also why the count is 4, not 3.
 *
 * @see ../../src/core/tim/StdlibRemote.ts -- `remoteStdlib`, `RemoteBundle`
 * @see ../unit/stdlib-remote-prefetch.test.ts -- T3/T4's per-layer pins
 */
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

import { describe, expect, it, vi } from 'vitest';

import { render, prepareIncludeStore, remoteStdlib, stdlibRegistry } from '../../src/index.js';
import type { StdlibRemoteManifest } from '../../src/index.js';
import type { IncludeFetcher } from '../../src/core/include-resolver.js';
import { StdlibNotBundledError } from '../../src/core/tim/IncludeStore.js';
import { FormulaMeasurer } from '../../src/core/measurer.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

const TUPADR3_REMOTE_MODULE = join(PACKAGES_DIR, 'stdlib-tupadr3', 'generated', 'tupadr3.remote.js');
const TUPADR3_EAGER_MODULE = join(PACKAGES_DIR, 'stdlib-tupadr3', 'generated', 'tupadr3.js');
const TUPADR3_ASSETS_DIR = join(PACKAGES_DIR, 'stdlib-tupadr3', 'assets', 'tupadr3');
const AWSLIB14_REMOTE_MODULE = join(PACKAGES_DIR, 'stdlib-aws', 'generated', 'awslib14.remote.js');
const AWSLIB14_ASSETS_DIR = join(PACKAGES_DIR, 'stdlib-aws', 'assets', 'awslib14');

const TUPADR3_BASE_URL = 'https://cdn.example.com/tupadr3';
const AWSLIB14_BASE_URL = 'https://cdn.example.com/awslib14';

const measurer = (): FormulaMeasurer => new FormulaMeasurer();

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
}

/**
 * Fetcher that reads the resolved URL back off `assetsDir` on disk (no
 * network -- stop condition 10) and records the byte length of every file
 * it actually served, keyed by URL, into `fetched`.
 */
function diskFetcher(assetsDir: string, baseUrl: string, fetched: Map<string, number>): IncludeFetcher {
  return (url: string): Promise<string> => {
    const relPath = url.slice(baseUrl.length + 1);
    const text = readFileSync(join(assetsDir, relPath), 'utf8');
    fetched.set(url, Buffer.byteLength(text, 'utf8'));
    return Promise.resolve(text);
  };
}

/** A fetcher that must never run -- proves a given path makes zero requests. */
const noFetch: IncludeFetcher = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected fetch: ${url}`));

// `packages/*/generated/` is built ONCE by vitest's globalSetup
// (`tests/helpers/build-stdlib-globalsetup.ts`). Building it here instead --
// even conditionally -- raced with the other two test files that read the
// same tree, since the build `rmSync`s it first (si11a T8).

describe('tupadr3 -- real manifest, real assets, real render (criteria 1-2)', () => {
  it('fetches exactly 4 resources for a 3-icon diagram and draws all 3 icons', async () => {
    const { tupadr3Remote } = (await import(pathToFileURL(TUPADR3_REMOTE_MODULE).href)) as {
      tupadr3Remote: StdlibRemoteManifest;
    };

    const fetched = new Map<string, number>();
    const fetcher = diskFetcher(TUPADR3_ASSETS_DIR, TUPADR3_BASE_URL, fetched);
    const registry = stdlibRegistry({
      tupadr3: async () =>
        Promise.resolve(remoteStdlib({ manifest: tupadr3Remote, baseUrl: TUPADR3_BASE_URL, fetcher })),
    });

    const svg = await render(
      uml(
        '!include <tupadr3/common>',
        '!include <tupadr3/devicons/android>',
        '!include <tupadr3/devicons/chrome>',
        '!include <tupadr3/devicons/apple>',
        'DEV_ANDROID(a1)',
        'DEV_CHROME(a2)',
        'DEV_APPLE(a3)',
      ),
      { stdlibRegistry: registry, fetcher: noFetch, measurer: measurer() },
    );

    // AC1: exactly 4 resources fetched (common + 3 icons) -- comfortably
    // inside the "<= 5" bar, and pinned exactly rather than loosely.
    expect(fetched.size).toBe(4);
    expect([...fetched.keys()].sort()).toEqual(
      [
        `${TUPADR3_BASE_URL}/common.puml`,
        `${TUPADR3_BASE_URL}/devicons/android.puml`,
        `${TUPADR3_BASE_URL}/devicons/apple.puml`,
        `${TUPADR3_BASE_URL}/devicons/chrome.puml`,
      ].sort(),
    );

    // The icons actually drew: one <image> element per sprite-backed
    // rectangle (svg-graphics-elements.ts#svgImageDataUri's own shape).
    const imageTagCount = (svg.match(/<image /g) ?? []).length;
    expect(imageTagCount).toBe(3);
    expect(svg).toContain('xlink:href="data:image/png;base64,');

    // --- THE MEASUREMENT ---------------------------------------------
    const manifestGzipBytes = gzipSync(readFileSync(TUPADR3_REMOTE_MODULE), { level: 9 }).length;
    const resourceBytes = [...fetched.values()].reduce((sum, n) => sum + n, 0);
    const totalBytes = manifestGzipBytes + resourceBytes;
    const eagerBytes = statSync(TUPADR3_EAGER_MODULE).size;
    const reductionPct = ((eagerBytes - totalBytes) / eagerBytes) * 100;

    // Criterion 2: this IS the mission's headline evidence; it must be easy
    // to read and quote, not buried in an assertion message (T8 spec,
    // "Observability").
    console.log(
      [
        '',
        '=== si11a T8 measurement -- tupadr3, 3-icon diagram ==================',
        `manifest (tupadr3.remote.js, gzip -9): ${manifestGzipBytes.toLocaleString()} B`,
        `resources actually fetched (4 files):  ${resourceBytes.toLocaleString()} B`,
        `TOTAL over the wire:                   ${totalBytes.toLocaleString()} B`,
        `eager tupadr3.js baseline:              ${eagerBytes.toLocaleString()} B`,
        `reduction:                              ${reductionPct.toFixed(3)}%`,
        '========================================================================',
        '',
      ].join('\n'),
    );

    // Regression tripwire, not a rounded-up claim (stop condition 15): the
    // real measured reduction is ~99.7%, comfortably clearing the >=99% bar
    // this batch's stop condition names. If a future change to the manifest
    // or asset set drops below 99%, this must fail, not be relaxed.
    expect(reductionPct).toBeGreaterThan(99);
  });
});

describe('awslib14 -- uppercase multi-slash key resolves (criterion 3, ADR-3)', () => {
  it('resolves storage/simplestorageservice -> Storage/SimpleStorageService.puml and draws', async () => {
    const { awslib14Remote } = (await import(pathToFileURL(AWSLIB14_REMOTE_MODULE).href)) as {
      awslib14Remote: StdlibRemoteManifest;
    };

    const fetched = new Map<string, number>();
    const fetcher = diskFetcher(AWSLIB14_ASSETS_DIR, AWSLIB14_BASE_URL, fetched);
    const registry = stdlibRegistry({
      awslib14: async () =>
        Promise.resolve(remoteStdlib({ manifest: awslib14Remote, baseUrl: AWSLIB14_BASE_URL, fetcher })),
    });
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    const svg = await render(
      uml(
        '!include <awslib14/AWSCommon>',
        '!include <awslib14/Storage/SimpleStorageService>',
        'SimpleStorageService(s3, "S3", "storage")',
      ),
      { stdlibRegistry: registry, fetcher: noFetch, measurer: measurer() },
    );

    // The exact case ADR-3 exists for: the include path is mixed-case and
    // multi-slash (`<awslib14/Storage/SimpleStorageService>`); the manifest
    // key it must derive to is lowercase with the slash preserved
    // (`storage/simplestorageservice`) -- path-BY-CONVENTION would have
    // looked for `storage/simplestorageservice.puml` on disk and missed the
    // real `Storage/SimpleStorageService.puml`.
    expect(resolveResourceSpy).toHaveBeenCalledWith('awslib14', 'storage/simplestorageservice');
    expect([...fetched.keys()]).toContain(`${AWSLIB14_BASE_URL}/Storage/SimpleStorageService.puml`);

    const imageTagCount = (svg.match(/<image /g) ?? []).length;
    expect(imageTagCount).toBe(1);
  });
});

describe('a key absent from the manifest fails offline, no request made (criterion 4)', () => {
  it('names the bundle and key with zero network requests', async () => {
    const { tupadr3Remote } = (await import(pathToFileURL(TUPADR3_REMOTE_MODULE).href)) as {
      tupadr3Remote: StdlibRemoteManifest;
    };
    expect(tupadr3Remote.files['devicons/does-not-exist']).toBeUndefined();

    const remoteFetcher = vi.fn(noFetch);
    const registry = stdlibRegistry({
      tupadr3: async () =>
        Promise.resolve(remoteStdlib({ manifest: tupadr3Remote, baseUrl: TUPADR3_BASE_URL, fetcher: remoteFetcher })),
    });

    const err = await prepareIncludeStore(uml('!include <tupadr3/devicons/does-not-exist>'), {
      fetcher: noFetch,
      stdlibRegistry: registry,
    }).then(
      () => undefined,
      (e: unknown) => e as StdlibNotBundledError,
    );

    expect(err).toBeInstanceOf(StdlibNotBundledError);
    expect(err?.bundle).toBe('tupadr3');
    expect(err?.path).toBe('tupadr3/devicons/does-not-exist');
    expect(remoteFetcher).not.toHaveBeenCalled();
  });
});
