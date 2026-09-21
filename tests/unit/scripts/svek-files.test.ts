/**
 * Unit tests for scripts/lib/svek-files.ts — extracted from six scripts that
 * each defined an identical `svekFiles` (code-review-tasks.md item 2).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { svekFiles } from '../../../scripts/lib/svek-files.js';

describe('svekFiles', () => {
  let dir: string | null = null;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = null;
  });

  it('returns svek-N.dot filenames sorted numerically, not lexically', () => {
    dir = mkdtempSync(join(tmpdir(), 'svek-files-'));
    for (const name of ['svek-10.dot', 'svek-2.dot', 'svek-1.dot']) {
      writeFileSync(join(dir, name), '');
    }
    expect(svekFiles(dir)).toEqual(['svek-1.dot', 'svek-2.dot', 'svek-10.dot']);
  });

  it('excludes files that do not match the svek-N.dot pattern', () => {
    dir = mkdtempSync(join(tmpdir(), 'svek-files-'));
    writeFileSync(join(dir, 'svek-1.dot'), '');
    writeFileSync(join(dir, 'input.puml'), '');
    writeFileSync(join(dir, 'svek-1.dot.bak'), '');
    expect(svekFiles(dir)).toEqual(['svek-1.dot']);
  });

  it('returns an empty array for a directory with no svek files', () => {
    dir = mkdtempSync(join(tmpdir(), 'svek-files-'));
    writeFileSync(join(dir, 'input.puml'), '');
    expect(svekFiles(dir)).toEqual([]);
  });
});
