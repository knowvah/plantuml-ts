/**
 * SI27 T0 — `scripts/render-manifest.ts`'s pure/fast-path units: argument
 * parsing, manifest diffing, and fixture discovery. The full-corpus render
 * path (`buildManifest`/`renderFixture` over the real `test-results/dot-
 * cache`/`oracle/goldens` trees) is exercised by the mission's own gate
 * (`npm run manifest`), not here — this project's coverage `include` is
 * `src/**\/*.ts` only (`vitest.config.ts`), so `scripts/` carries no
 * numeric coverage floor, and rendering ~2,000 real fixtures per test run
 * would make this suite slow for no assertion gain.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  diffManifests,
  findInPumlFiles,
  parseArgs,
  renderFixture,
  type Manifest,
} from '../../../scripts/render-manifest.js';

describe('diffManifests', () => {
  it('reports 0 fixtures differing for identical manifests', () => {
    const baseline: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'b/in.puml': { svg: 'hash2' } };
    const current: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'b/in.puml': { svg: 'hash2' } };
    const result = diffManifests(baseline, current);
    expect(result).toEqual({ added: [], removed: [], changed: [] });
  });

  it('reports exactly one changed key when one hash differs', () => {
    const baseline: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'b/in.puml': { svg: 'hash2' } };
    const current: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'b/in.puml': { svg: 'CHANGED' } };
    const result = diffManifests(baseline, current);
    expect(result.changed).toEqual(['b/in.puml']);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('reports added and removed keys separately from changed keys', () => {
    const baseline: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'gone/in.puml': { svg: 'hash3' } };
    const current: Manifest = { 'a/in.puml': { svg: 'hash1' }, 'new/in.puml': { svg: 'hash4' } };
    const result = diffManifests(baseline, current);
    expect(result.added).toEqual(['new/in.puml']);
    expect(result.removed).toEqual(['gone/in.puml']);
    expect(result.changed).toEqual([]);
  });

  it('treats an error entry as identity, so it never counts as changed unless the message differs', () => {
    const baseline: Manifest = { 'x/in.puml': { error: 'boom' } };
    const same: Manifest = { 'x/in.puml': { error: 'boom' } };
    const different: Manifest = { 'x/in.puml': { error: 'different boom' } };
    expect(diffManifests(baseline, same).changed).toEqual([]);
    expect(diffManifests(baseline, different).changed).toEqual(['x/in.puml']);
  });
});

describe('parseArgs', () => {
  it('parses --out with no --only', () => {
    expect(parseArgs(['--out', 'a.json'])).toEqual({ mode: 'out', out: 'a.json', only: undefined });
  });

  it('parses --out with --only as a split list', () => {
    expect(parseArgs(['--out', 'a.json', '--only', 'class,state'])).toEqual({
      mode: 'out',
      out: 'a.json',
      only: ['class', 'state'],
    });
  });

  it('parses --diff into baseline/current paths', () => {
    expect(parseArgs(['--diff', 'a.json', 'b.json'])).toEqual({
      mode: 'diff',
      baselinePath: 'a.json',
      currentPath: 'b.json',
    });
  });

  it('throws when neither --out nor a full --diff pair is given', () => {
    expect(() => parseArgs([])).toThrow(/pass --out|--diff/);
  });
});

describe('findInPumlFiles', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it('returns an empty array for a directory that does not exist', () => {
    expect(findInPumlFiles(join(tmpdir(), 'render-manifest-test-does-not-exist'))).toEqual([]);
  });

  it('finds in.puml files at any depth and ignores other files', () => {
    const root = mkdtempSync(join(tmpdir(), 'render-manifest-test-'));
    dirs.push(root);
    mkdirSync(join(root, 'a', 'nested'), { recursive: true });
    writeFileSync(join(root, 'a', 'in.puml'), '@startuml\n@enduml\n');
    writeFileSync(join(root, 'a', 'nested', 'in.puml'), '@startuml\n@enduml\n');
    writeFileSync(join(root, 'a', 'in.svg'), '<svg/>');
    const found = findInPumlFiles(root).sort();
    expect(found).toEqual([join(root, 'a', 'in.puml'), join(root, 'a', 'nested', 'in.puml')].sort());
  });
});

describe('renderFixture', () => {
  it('records an svg hash for a fixture that renders successfully', () => {
    const entry = renderFixture('@startuml\nA -> B\n@enduml\n');
    expect('error' in entry).toBe(false);
    if (!('error' in entry)) {
      expect(entry.svg).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('is deterministic: the same markup hashes identically across two calls', () => {
    const markup = '@startuml\nAlice -> Bob: hello\n@enduml\n';
    const first = renderFixture(markup);
    const second = renderFixture(markup);
    expect(first).toEqual(second);
  });

  // `renderFixture`'s try/catch is NOT exercised by any real markup here:
  // `renderSync` (`src/index.ts`) wraps its own body in a try/catch that
  // returns `errorSvg(...)` — a normal SVG string — for every failure mode
  // reachable from source text, including a bare `!include` with no store.
  // `renderFixture`'s catch guards the seam BELOW that boundary (`toSvekDot`
  // on an edge-case `DotInputGraph`, or the SHA-256 hashing itself), which
  // is not independently triggerable through valid PlantUML input — hence
  // no unit test for it; it stays as defensive per-fixture isolation for
  // the full-corpus batch run (`scripts/render-manifest.ts`'s own doc
  // comment), consistent with the `--diff` gate's `{ error: message }`
  // identity treatment either way.

  it('records a dot hash for a fixture whose render drives graph layout', () => {
    const entry = renderFixture('@startuml\nclass A\nclass B\nA --> B\n@enduml\n');
    expect('error' in entry).toBe(false);
    if (!('error' in entry)) {
      expect(entry.dot).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
