/**
 * Build-output test for the `./image-providers` subpath (decisions.md D3):
 * a separate bundle, so the root bundle never carries network code.
 * Builds `dist/` first when it is absent.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DIST = resolve(ROOT, 'dist');
const BUILD_TIMEOUT_MS = 180_000;
const PROVIDERS_FILES = ['image-providers.js', 'image-providers.cjs', 'image-providers.d.ts'] as const;
const ROOT_BUNDLE = 'plantuml-ts.js';
const SUBPATH = '@knowvah/plantuml-ts/image-providers';
const FACTORIES = ['createBrowserImageProvider', 'createNetworkImageProvider'];

function dist(name: string): string {
  return resolve(DIST, name);
}

function runNode(args: readonly string[]): string {
  return execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
}

describe('image-providers package entry', () => {
  beforeAll(() => {
    if (!PROVIDERS_FILES.every((f) => existsSync(dist(f))) || !existsSync(dist(ROOT_BUNDLE))) {
      execFileSync('npx', ['vite', 'build'], { cwd: ROOT, stdio: 'ignore' });
    }
  }, BUILD_TIMEOUT_MS);

  it.each(PROVIDERS_FILES)('emits dist/%s', (file) => {
    expect(existsSync(dist(file))).toBe(true);
  });

  it('keeps the root bundle free of provider code', () => {
    const root = readFileSync(dist(ROOT_BUNDLE), 'utf8');
    expect(root).not.toContain('createNetworkImageProvider');
    expect(root).not.toContain('createBrowserImageProvider');
    expect(root).not.toContain('image-providers');
  });

  it('declares both factories in the subpath types', () => {
    const dts = readFileSync(dist('image-providers.d.ts'), 'utf8');
    for (const name of FACTORIES) expect(dts).toContain(`function ${name}(`);
  });

  it('resolves the subpath by package self-reference (ESM)', () => {
    const out = runNode([
      '--input-type=module',
      '-e',
      `import * as m from '${SUBPATH}'; console.log(Object.keys(m).sort().join(','))`,
    ]);
    expect(out.trim()).toBe(FACTORIES.join(','));
  });

  it('resolves the subpath by package self-reference (CJS)', () => {
    const out = runNode(['-e', `console.log(Object.keys(require('${SUBPATH}')).sort().join(','))`]);
    expect(out.trim()).toBe(FACTORIES.join(','));
  });
});
