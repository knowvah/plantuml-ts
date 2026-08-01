/**
 * The four `@knowvah/plantuml-stdlib*` packages' bundle composition
 * (`plans/si5b-stdlib/decisions.md` D2, `batch-3/overview.md` T8).
 *
 * `packages/stdlib-all` is not listed here -- it has no vendored assets of
 * its own, only a re-export index (`emit-all-index.ts`).
 */

import type { GeneratedModule, PackageSpec } from './types.js';

const STDLIB_PACKAGE: PackageSpec = {
  packageDir: 'stdlib',
  modules: [
    {
      fileBaseName: 'c4',
      exports: [{ kind: 'concrete', exportName: 'c4', bundleName: 'C4', assetFolder: 'C4' }],
    },
    {
      fileBaseName: 'archimate',
      exports: [
        { kind: 'concrete', exportName: 'archimate', bundleName: 'archimate', assetFolder: 'archimate' },
      ],
    },
    {
      fileBaseName: 'cloudinsight',
      exports: [
        { kind: 'concrete', exportName: 'cloudinsight', bundleName: 'cloudinsight', assetFolder: 'cloudinsight' },
      ],
    },
    {
      fileBaseName: 'cloudogu',
      exports: [
        { kind: 'concrete', exportName: 'cloudogu', bundleName: 'cloudogu', assetFolder: 'cloudogu' },
      ],
    },
    {
      // One module file for the alias/target pair -- `batch-3/overview.md` T8
      // enumerates exactly 5 stdlib subpaths (no separate `/bootstrap1.13.1`),
      // and the two are only useful together (`stdlibStore(bootstrap,
      // bootstrap1_13_1)` -- the alias alone cannot resolve anything).
      fileBaseName: 'bootstrap',
      exports: [
        { kind: 'alias', exportName: 'bootstrap', bundleName: 'bootstrap', aliasOf: 'bootstrap1.13.1' },
        {
          kind: 'concrete',
          exportName: 'bootstrap1_13_1',
          bundleName: 'bootstrap1.13.1',
          assetFolder: 'bootstrap1.13.1',
        },
      ],
    },
  ],
};

// Extracted (rather than inlined per-package) so `remoteModules` below can
// reuse the same `GeneratedModule` object SI12's removed eager `modules` used
// to -- the remote manifest is a pure function of this same metadata, just
// without inlined `.puml` content (`emit-remote-manifest.ts`).
const AWSLIB14_MODULE: GeneratedModule = {
  fileBaseName: 'awslib14',
  exports: [{ kind: 'concrete', exportName: 'awslib14', bundleName: 'awslib14', assetFolder: 'awslib14' }],
};

const AWSLIB_ALIAS_MODULE: GeneratedModule = {
  fileBaseName: 'awslib',
  exports: [{ kind: 'alias', exportName: 'awslib', bundleName: 'awslib', aliasOf: 'awslib14' }],
};

const STDLIB_AWS_PACKAGE: PackageSpec = {
  packageDir: 'stdlib-aws',
  // No eager `modules` -- SI12 ADR-2/ADR-5. `remoteModules` is the only
  // encoding this package ships; `generated/index.js` re-exports it instead
  // (`emit-index.ts`, SI12 ADR-1).
  remoteModules: [AWSLIB14_MODULE, AWSLIB_ALIAS_MODULE],
};

const TUPADR3_MODULE: GeneratedModule = {
  fileBaseName: 'tupadr3',
  exports: [{ kind: 'concrete', exportName: 'tupadr3', bundleName: 'tupadr3', assetFolder: 'tupadr3' }],
};

const STDLIB_TUPADR3_PACKAGE: PackageSpec = {
  packageDir: 'stdlib-tupadr3',
  // No eager `modules` -- SI12 ADR-2/ADR-5. See STDLIB_AWS_PACKAGE above.
  remoteModules: [TUPADR3_MODULE],
};

export const PACKAGE_SPECS: readonly PackageSpec[] = [
  STDLIB_PACKAGE,
  STDLIB_AWS_PACKAGE,
  STDLIB_TUPADR3_PACKAGE,
];

/**
 * si11b T1 -- the ONE bundle that additionally gets a per-sprite fragment
 * split (`plans/si11b-bootstrap-sprite-splitting/decisions.md` ADR-1/
 * ADR-3): `bootstrap1.13.1` is a single 1.06 MB `.puml` file whose content
 * is 99.6% `sprite` blocks, so the eager module above and SI11a's
 * `remoteModules` (per-RESOURCE granularity) cannot help -- it is one
 * resource.
 *
 * Declared as a standalone constant, not a new `PackageSpec` field: that
 * keeps this task's write-set from needing to touch `types.ts`, which
 * already fully describes `stdlib`'s eager module above.
 * `scripts/build-stdlib-packages.ts` reads this directly, alongside the
 * `PACKAGE_SPECS` loop.
 */
export interface SpriteSplitBundleSpec {
  /** Directory name under `packages/` this bundle's fragments ship in. */
  readonly packageDir: string;
  /** `BundleData.name` / vendored folder name, e.g. `'bootstrap1.13.1'`. */
  readonly bundleName: string;
  /** Vendored source file, relative to `assets/stdlib/<bundleName>/`. */
  readonly sourceFile: string;
  /** `assets/stdlib.manifest.json`'s per-bundle `license` field -- the
   *  ADR-2 allowlist gate's input. */
  readonly license: string | undefined;
}

export const BOOTSTRAP_SPRITE_SPLIT: SpriteSplitBundleSpec = {
  packageDir: 'stdlib',
  bundleName: 'bootstrap1.13.1',
  sourceFile: 'bootstrap.puml',
  license: 'MIT License',
};
