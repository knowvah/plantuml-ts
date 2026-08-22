/**
 * Every generated `.d.ts` must import its types from the package name its
 * own `package.json` declares as a peer dependency.
 *
 * This is not hypothetical tidiness. `chore: move all packages to the
 * @knowvah scope` (9f189912) renamed every package but missed
 * `emit-module.ts`/`emit-remote-manifest.ts`'s `DTS_IMPORT` constants, so
 * every generated declaration file kept emitting the pre-scope specifier
 * `'plantuml-ts'` while the packages declared `@knowvah/plantuml-ts`. A
 * consumer's TypeScript could not resolve `BundleData` or
 * `StdlibRemoteManifest` from any of the four packages.
 *
 * Nothing caught it: each package's `tsconfig.json` sets `include:
 * ["generated/**\/*.d.ts"]`, so EVERY file it checks is a declaration file,
 * and `packages/tsconfig.base.json` used to set `skipLibCheck: true` --
 * which skips declaration files. The project's own type-check gate was
 * therefore vacuous (that setting is now `false`, and this test is the
 * guard that runs in `npm test`, which `npm run build:stdlib` is not part
 * of).
 *
 * Same class as si11b's `spriteSplitStdlib` shipping unreachable from the
 * public API: works in-repo, broken for a consumer.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LOCK_PRESSURE_BUDGET_MS } from '../helpers/lock-pressure-budget.js';
import { withStdlibBuildLock } from '../helpers/with-stdlib-build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/** Every package that emits a `generated/` tree containing `.d.ts` files. */
const GENERATED_PACKAGES = ['stdlib', 'stdlib-aws', 'stdlib-tupadr3', 'stdlib-all'] as const;

interface PackageJson {
  readonly dependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
}

/**
 * Every package name this package's manifest declares. A bare specifier in
 * its `.d.ts` must be one of these or a consumer cannot resolve it --
 * `stdlib-all` legitimately re-exports from its three `dependencies`, while
 * the other three reach `@knowvah/plantuml-ts` through `peerDependencies`.
 */
function declaredPackageNames(packageDir: string): string[] {
  const pkg = JSON.parse(
    readFileSync(join(PACKAGES_DIR, packageDir, 'package.json'), 'utf8'),
  ) as PackageJson;
  return [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ].sort();
}

/** Every `from '<specifier>'` in a generated `.d.ts`, in source order. */
function importSpecifiers(dtsSource: string): string[] {
  return [...dtsSource.matchAll(/ from '([^']+)';/g)].map((m) => m[1] as string);
}

/** Plain -- no lock of its own. Always invoked from inside a
 * `withStdlibBuildLock` critical section (directly, or via one of the two
 * `collect*` helpers below) so its `readdirSync` shares the SAME lock hold
 * as the file reads that follow it; acquiring a second, nested lock from
 * inside an already-held one would deadlock the single-holder lock (T3's
 * `acquireBuildLock` is not reentrant), and acquiring a second SEPARATE one
 * after releasing this one would reopen exactly the torn-read window
 * stdlib-run-isolation option D exists to close (a rebuild could run
 * between this listing and a later read of a name it named). */
function generatedDtsFiles(packageDir: string): string[] {
  return readdirSync(join(PACKAGES_DIR, packageDir, 'generated'))
    .filter((name) => name.endsWith('.d.ts'))
    .sort();
}

/** stdlib-run-isolation T4: listing + every file read for one package as
 * ONE critical section -- see `generatedDtsFiles`'s doc comment for why a
 * shared per-package lock hold, not one lock per file, is the correct
 * (not just narrower) shape here. */
function collectUndeclaredSpecifiers(packageDir: string, declared: readonly string[]): string[] {
  const undeclared: string[] = [];
  for (const fileName of generatedDtsFiles(packageDir)) {
    const source = readFileSync(join(PACKAGES_DIR, packageDir, 'generated', fileName), 'utf8');

    // Relative specifiers are the index re-exports pointing at sibling
    // modules -- only BARE specifiers resolve through node_modules and can
    // therefore name a package this manifest never declared.
    for (const specifier of importSpecifiers(source).filter((spec) => !spec.startsWith('.'))) {
      if (!declared.includes(specifier)) {
        undeclared.push(`${fileName}: '${specifier}' not in [${declared.join(', ')}]`);
      }
    }
  }
  return undeclared;
}

/** stdlib-run-isolation T4: same shape as {@link collectUndeclaredSpecifiers},
 * scanning every `GENERATED_PACKAGES` package inside one lock hold. */
function collectUnscopedSpecifierOffenders(): string[] {
  const offenders: string[] = [];
  for (const packageDir of GENERATED_PACKAGES) {
    for (const fileName of generatedDtsFiles(packageDir)) {
      const source = readFileSync(join(PACKAGES_DIR, packageDir, 'generated', fileName), 'utf8');
      if (source.includes(`from 'plantuml-ts'`)) {
        offenders.push(`${packageDir}/${fileName}`);
      }
    }
  }
  return offenders;
}

describe('generated .d.ts files import from the declared peer dependency', () => {
  it.each(GENERATED_PACKAGES)('%s emits at least one .d.ts to check', (packageDir) => {
    const count = withStdlibBuildLock(() => generatedDtsFiles(packageDir).length);
    expect(count).toBeGreaterThan(0);
  },
    LOCK_PRESSURE_BUDGET_MS);

  it.each(GENERATED_PACKAGES)('%s: every bare specifier is a declared dependency', (packageDir) => {
    const declared = declaredPackageNames(packageDir);
    expect(declared).toContain('@knowvah/plantuml-ts');

    const undeclared = withStdlibBuildLock(() => collectUndeclaredSpecifiers(packageDir, declared));

    expect(undeclared).toEqual([]);
  },
    LOCK_PRESSURE_BUDGET_MS);

  it('the unscoped pre-rename specifier appears in no generated .d.ts', () => {
    const offenders = withStdlibBuildLock(() => collectUnscopedSpecifierOffenders());

    expect(offenders).toEqual([]);
  },
    LOCK_PRESSURE_BUDGET_MS);
});
