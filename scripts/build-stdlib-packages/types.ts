/**
 * Shared types for the stdlib package generator (scripts/build-stdlib-packages.ts,
 * mission SI5b batch-3, T8).
 *
 * A `PackageSpec` describes one of `packages/{stdlib,stdlib-aws,stdlib-tupadr3}`:
 * which generated module files it has, and which `BundleData` export(s) each
 * module file carries. `packages/stdlib-all` has no assets of its own (it only
 * re-exports the other three packages) so it is not described by a
 * `PackageSpec` -- see `emit-all-index.ts`.
 */

/** A generated module file that exports one real (asset-backed) `BundleData`. */
export interface ConcreteBundleExport {
  readonly kind: 'concrete';
  /** JS identifier the generated module binds this bundle to. */
  readonly exportName: string;
  /** `BundleData.name` -- matches the vendored folder's own case exactly. */
  readonly bundleName: string;
  /** Folder name under `assets/stdlib/` to read `.puml` files from. */
  readonly assetFolder: string;
}

/** A generated module file that exports an alias `BundleData` (`files: {}`,
 * `aliasOf` set) -- mirrors `Stdlib#retrieve`'s `link:` redirect. */
export interface AliasBundleExport {
  readonly kind: 'alias';
  readonly exportName: string;
  readonly bundleName: string;
  /** The target bundle's `BundleData.name` this alias redirects to. */
  readonly aliasOf: string;
}

export type BundleExport = ConcreteBundleExport | AliasBundleExport;

/** One `generated/<fileBaseName>.{js,d.ts}` pair. May carry more than one
 * export (the `bootstrap` module pairs the alias with its target so the
 * package keeps exactly the subpath count `plans/si5b-stdlib/batch-3/overview.md`
 * T8 enumerates). */
export interface GeneratedModule {
  readonly fileBaseName: string;
  readonly exports: readonly BundleExport[];
}

export interface PackageSpec {
  /** Directory name under `packages/`. */
  readonly packageDir: string;
  /**
   * Optional: a package with no eager `BundleData` module to ship omits it
   * entirely (`stdlib-aws`, `stdlib-tupadr3` -- SI12 ADR-2). Absent means no
   * eager `generated/<fileBaseName>.{js,d.ts}` pair is emitted for this
   * package, and `emit-index.ts` builds `generated/index.{js,d.ts}` from
   * `remoteModules` instead (SI12 ADR-1).
   */
  readonly modules?: readonly GeneratedModule[];
  /**
   * Remote (key -> path manifest, no content) siblings of a subset of
   * `modules`, emitted by `emit-remote-manifest.ts` -- SI11a ADR-1
   * (`plans/si11a-per-resource-stdlib-fetch/decisions.md`). Each entry
   * reuses the exact `GeneratedModule` its eager counterpart uses: the
   * manifest is a pure function of the same `bundleName`/`assetFolder`/
   * `aliasOf` metadata, just without inlined `.puml` content.
   *
   * Optional: a package with no remote assets to ship omits it entirely
   * (currently `stdlib` -- SI11a's T6 scopes remote packaging to
   * `stdlib-aws` and `stdlib-tupadr3` only, since SI8's per-bundle
   * laziness already solves `stdlib`'s much smaller 1.8 MB / 5 bundles).
   */
  readonly remoteModules?: readonly GeneratedModule[];
}
