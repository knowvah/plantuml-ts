/**
 * Unit tests for `scripts/capture-oracle-cache.ts` (mission
 * parity-dashboard-refresh, T1).
 *
 * Two findings from `.agent-notes/aoh-T0.md` are the defects under test:
 *   1. The oracle jar's exit code is not a success signal — a non-zero exit
 *      can still have written a complete `in.svg`.
 *   2. A named `@startuml <name>` block writes `<name>.svg`, not `in.svg`;
 *      the lone `.svg` present is adopted as the capture and renamed.
 *
 * `execFileSync` is mocked throughout — the jar is never invoked here, per
 * this task's boundaries. `classifyOutput` and `planEntries` are exercised
 * against real temp directories, the same style as
 * `tests/unit/scripts/dot-sync-fixtures.test.ts`.
 */
import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type * as ChildProcess from 'node:child_process';

import {
  classifyOutput,
  planEntries,
  captureOracleCache,
  type Fixture,
} from '../../../scripts/capture-oracle-cache.js';

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof ChildProcess>()),
  execFileSync: vi.fn(),
}));

let tmp: string;

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pdr-t1-capture-'));
});

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

afterEach(() => {
  vi.mocked(execFileSync).mockReset();
});

// ---------------------------------------------------------------------------
// classifyOutput — AC1, AC2, AC3
// ---------------------------------------------------------------------------

describe('classifyOutput', () => {
  it('reports in-svg when in.svg is already present — AC1 (non-zero exit, valid SVG)', () => {
    const dir = join(tmp, 'classify-in-svg');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'in.svg'), '<svg/>', 'utf-8');

    expect(classifyOutput(dir)).toEqual({ kind: 'in-svg', file: 'in.svg' });
  });

  it('renames a lone differently-named svg to in.svg — AC2', () => {
    const dir = join(tmp, 'classify-renamed');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'named-block.svg'), '<svg id="named"/>', 'utf-8');

    expect(classifyOutput(dir)).toEqual({ kind: 'renamed', file: 'named-block.svg' });
    expect(existsSync(join(dir, 'in.svg'))).toBe(true);
    expect(existsSync(join(dir, 'named-block.svg'))).toBe(false);
    expect(readFileSync(join(dir, 'in.svg'), 'utf-8')).toBe('<svg id="named"/>');
  });

  it('reports none when no svg was produced — AC3', () => {
    const dir = join(tmp, 'classify-none');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'in.puml'), '@startuml\n@enduml\n', 'utf-8');

    expect(classifyOutput(dir)).toEqual({ kind: 'none' });
  });

  it('reports ambiguous when more than one svg was produced', () => {
    const dir = join(tmp, 'classify-ambiguous');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.svg'), '<svg/>', 'utf-8');
    writeFileSync(join(dir, 'b.svg'), '<svg/>', 'utf-8');

    expect(classifyOutput(dir)).toEqual({ kind: 'ambiguous' });
    expect(existsSync(join(dir, 'a.svg'))).toBe(true);
    expect(existsSync(join(dir, 'b.svg'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// planEntries — AC4
// ---------------------------------------------------------------------------

describe('planEntries', () => {
  const manifest: Fixture[] = [
    { slug: 'alpha', markup: 'A' },
    { slug: 'bravo', markup: 'B' },
    { slug: 'charlie', markup: 'C' },
  ];

  it('skips a slug whose .done already exists, without --rebuild — AC4', () => {
    const existingDone = new Set(['alpha']);

    expect(planEntries(manifest, existingDone, { rebuild: false }).map((f) => f.slug)).toEqual(['bravo', 'charlie']);
  });

  it('re-renders a done slug when --rebuild is set', () => {
    const existingDone = new Set(['alpha']);

    expect(planEntries(manifest, existingDone, { rebuild: true }).map((f) => f.slug)).toEqual([
      'alpha',
      'bravo',
      'charlie',
    ]);
  });

  it('restricts to the --only slug list', () => {
    const existingDone = new Set<string>();

    expect(planEntries(manifest, existingDone, { rebuild: false, only: ['charlie'] }).map((f) => f.slug)).toEqual([
      'charlie',
    ]);
  });

  it('combines --only with the .done skip', () => {
    const existingDone = new Set(['bravo']);

    expect(
      planEntries(manifest, existingDone, { rebuild: false, only: ['bravo', 'charlie'] }).map((f) => f.slug),
    ).toEqual(['charlie']);
  });
});

// ---------------------------------------------------------------------------
// captureOracleCache — end-to-end over planEntries/classifyOutput with a
// mocked execFileSync (the jar is never invoked in this suite)
// ---------------------------------------------------------------------------

describe('captureOracleCache', () => {
  it('captures via in.svg despite execFileSync throwing (non-zero exit) — AC1', () => {
    const dir = join(tmp, 'cache-nonzero-exit', 'activity', 'alpha');
    vi.mocked(execFileSync).mockImplementation(() => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'in.svg'), '<svg/>', 'utf-8');
      throw new Error('jar exited 200');
    });

    const result = captureOracleCache(
      'activity',
      [{ slug: 'alpha', markup: '@startuml\nstart\nstop\n@enduml\n' }],
      { rebuild: false },
      join(tmp, 'cache-nonzero-exit'),
    );

    expect(result).toEqual({ type: 'activity', captured: ['alpha'], jarFailed: [], renamed: [] });
    expect(existsSync(join(dir, '.done'))).toBe(true);
  });

  it('adopts and renames a lone named-block svg — AC2', () => {
    const root = join(tmp, 'cache-renamed');
    const dir = join(root, 'activity', 'bravo');
    vi.mocked(execFileSync).mockImplementation(() => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'Test.svg'), '<svg/>', 'utf-8');
      return '';
    });

    const result = captureOracleCache(
      'activity',
      [{ slug: 'bravo', markup: '@startuml Test\nstart\nstop\n@enduml\n' }],
      { rebuild: false },
      root,
    );

    expect(result).toEqual({ type: 'activity', captured: ['bravo'], jarFailed: [], renamed: ['bravo'] });
    expect(existsSync(join(dir, 'in.svg'))).toBe(true);
    expect(existsSync(join(dir, '.done'))).toBe(true);
  });

  it('marks jarFailed and writes no .done when no svg is produced — AC3', () => {
    const root = join(tmp, 'cache-jar-failed');
    const dir = join(root, 'activity', 'charlie');
    vi.mocked(execFileSync).mockImplementation(() => {
      mkdirSync(dir, { recursive: true });
      return '';
    });

    const result = captureOracleCache('activity', [{ slug: 'charlie', markup: 'garbage' }], { rebuild: false }, root);

    expect(result).toEqual({ type: 'activity', captured: [], jarFailed: ['charlie'], renamed: [] });
    expect(existsSync(join(dir, '.done'))).toBe(false);
  });

  it('skips a fixture whose .done already exists and never calls execFileSync — AC4', () => {
    const root = join(tmp, 'cache-skip-done');
    const dir = join(root, 'activity', 'delta');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '.done'), '', 'utf-8');

    const result = captureOracleCache('activity', [{ slug: 'delta', markup: 'X' }], { rebuild: false }, root);

    expect(result).toEqual({ type: 'activity', captured: [], jarFailed: [], renamed: [] });
    expect(execFileSync).not.toHaveBeenCalled();
  });
});
