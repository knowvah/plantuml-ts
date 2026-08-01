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

function generatedDtsFiles(packageDir: string): string[] {
  return readdirSync(join(PACKAGES_DIR, packageDir, 'generated'))
    .filter((name) => name.endsWith('.d.ts'))
    .sort();
}

describe('generated .d.ts files import from the declared peer dependency', () => {
  it.each(GENERATED_PACKAGES)('%s emits at least one .d.ts to check', (packageDir) => {
    expect(generatedDtsFiles(packageDir).length).toBeGreaterThan(0);
  });

  it.each(GENERATED_PACKAGES)('%s: every bare specifier is a declared dependency', (packageDir) => {
    const declared = declaredPackageNames(packageDir);
    expect(declared).toContain('@knowvah/plantuml-ts');

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

    expect(undeclared).toEqual([]);
  });

  it('the unscoped pre-rename specifier appears in no generated .d.ts', () => {
    const offenders: string[] = [];

    for (const packageDir of GENERATED_PACKAGES) {
      for (const fileName of generatedDtsFiles(packageDir)) {
        const source = readFileSync(join(PACKAGES_DIR, packageDir, 'generated', fileName), 'utf8');
        if (source.includes(`from 'plantuml-ts'`)) {
          offenders.push(`${packageDir}/${fileName}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
