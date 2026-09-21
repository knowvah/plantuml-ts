/**
 * Code review (2026-09-21) — Must fix: every workspace `package.json` pinned
 * `peerDependencies["@knowvah/plantuml-ts"]` at `^0.1.0` while the root
 * package was already `0.2.0`. `^0.1.0` excludes `0.2.0` under npm's own
 * caret semantics (a leading-zero major locks the minor too), so the very
 * first publish of a workspace package would fail `npm install` for any
 * consumer with `ERESOLVE`. This is a fitness function, not a one-time
 * bump: it re-checks the invariant on every run instead of relying on
 * every future version bump remembering to touch both files together.
 *
 * Caret-range satisfaction is implemented locally rather than adding a
 * `semver` dependency — `semver` is only a transitive dependency here
 * (confirmed via `package-lock.json`), and CLAUDE.md's global rule is to
 * add a library only when a hand-rolled check is genuinely insufficient.
 * npm's caret rule (https://github.com/npm/node-semver#caret-ranges-123-025-004):
 * a leading-zero component in the range version locks that component too
 * — `^0.2.0` means `>=0.2.0 <0.3.0`, `^0.0.3` means `>=0.0.3 <0.0.4`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PEER_NAME = '@knowvah/plantuml-ts';

interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

function parseVersion(raw: string): Version {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(raw);
  if (match === null) {
    throw new Error(`not a bare semver version: ${raw}`);
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** Parses a `^X.Y.Z` caret range, returning its floor version. Throws for
 *  any other range shape — every peer range in this repo is a plain caret
 *  range, so anything else is a real drift this test should surface. */
function parseCaretFloor(range: string): Version {
  const match = /^\^(\d+\.\d+\.\d+)/.exec(range);
  if (match === null) {
    throw new Error(`expected a caret range (^X.Y.Z), got: ${range}`);
  }
  return parseVersion(match[1]!);
}

function compareVersions(a: Version, b: Version): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/** Exclusive upper bound of `^floor` per npm's caret semantics: bump the
 *  first non-zero component from the left, zeroing everything after it;
 *  if every component is zero, bump the patch. */
function caretUpperBound(floor: Version): Version {
  if (floor.major !== 0) return { major: floor.major + 1, minor: 0, patch: 0 };
  if (floor.minor !== 0) return { major: 0, minor: floor.minor + 1, patch: 0 };
  return { major: 0, minor: 0, patch: floor.patch + 1 };
}

export function satisfiesCaretRange(version: Version, range: string): boolean {
  const floor = parseCaretFloor(range);
  const upper = caretUpperBound(floor);
  return compareVersions(version, floor) >= 0 && compareVersions(version, upper) < 0;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function listWorkspacePackageJsonPaths(): string[] {
  return readdirSync(join(REPO, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join('packages', entry.name, 'package.json'))
    .filter((relPath) => {
      try {
        readFileSync(join(REPO, relPath), 'utf8');
        return true;
      } catch {
        return false;
      }
    });
}

describe('workspace peer ranges are satisfied by the root package version', () => {
  const rootPkg = readJson(join(REPO, 'package.json'));
  const rootVersion = parseVersion(rootPkg.version as string);
  const workspacePaths = listWorkspacePackageJsonPaths();

  it('found at least one workspace package.json (sanity check on discovery)', () => {
    expect(workspacePaths.length).toBeGreaterThan(0);
  });

  it.each(workspacePaths)('%s peer range for @knowvah/plantuml-ts covers the root version', (relPath) => {
    const pkg = readJson(join(REPO, relPath));
    const peerDeps = pkg.peerDependencies as Record<string, string> | undefined;
    const range = peerDeps?.[PEER_NAME];
    expect(range, `${relPath} has no peerDependencies["${PEER_NAME}"]`).toBeDefined();
    expect(satisfiesCaretRange(rootVersion, range as string)).toBe(true);
  });
});

describe('satisfiesCaretRange (fixture-free)', () => {
  it('^0.1.0 excludes 0.2.0 (the actual defect this test caught)', () => {
    expect(satisfiesCaretRange({ major: 0, minor: 2, patch: 0 }, '^0.1.0')).toBe(false);
  });

  it('^0.2.0 includes 0.2.0 and 0.2.5, excludes 0.3.0', () => {
    expect(satisfiesCaretRange({ major: 0, minor: 2, patch: 0 }, '^0.2.0')).toBe(true);
    expect(satisfiesCaretRange({ major: 0, minor: 2, patch: 5 }, '^0.2.0')).toBe(true);
    expect(satisfiesCaretRange({ major: 0, minor: 3, patch: 0 }, '^0.2.0')).toBe(false);
  });

  it('^1.2.3 includes 1.9.9, excludes 2.0.0 and 1.2.2', () => {
    expect(satisfiesCaretRange({ major: 1, minor: 9, patch: 9 }, '^1.2.3')).toBe(true);
    expect(satisfiesCaretRange({ major: 2, minor: 0, patch: 0 }, '^1.2.3')).toBe(false);
    expect(satisfiesCaretRange({ major: 1, minor: 2, patch: 2 }, '^1.2.3')).toBe(false);
  });
});
