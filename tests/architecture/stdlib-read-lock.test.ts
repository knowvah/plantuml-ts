/**
 * stdlib-run-isolation T4 -- keeps the 8 in-worker consumers of
 * `packages/<pkg>/generated/` (`.agent-notes/sri-T1.md` census rows
 * #11-#18) honest: every canonical-tree accessor call in each of those
 * files must run with the cross-process build lock held
 * (`tests/helpers/with-stdlib-build-lock.ts`, option D,
 * `planning/adr/ADR-003-stdlib-run-isolation.md`). Without this guard, a
 * future edit could quietly reintroduce a ninth bare reader and nothing
 * would catch it before it reproduced T0's `ENOENT` residual again.
 *
 * Textual, like the other guards in this directory (`svg-emission-seam.test.ts`,
 * `cucadiagram-base-imports.test.ts`), not a type-checked AST walk -- but
 * structural rather than a single brittle regex: `withStdlibBuildLock(...)`
 * and named "safe container" helper bodies are located by BALANCED
 * paren/brace matching, not by guessing how many characters a call spans.
 *
 * Two accessor shapes appear across the 8 files:
 *
 *  1. Self-locking: the accessor call (`readFileSync`/`existsSync`/
 *     `execFileSync`/dynamic `import()`) sits directly inside a
 *     `withStdlibBuildLock(() => ...)` arrow body, whether that arrow is
 *     written inline at a test or inside a small named helper's own
 *     `return withStdlibBuildLock(...)`. Textual containment alone proves
 *     the lock is held for that call.
 *  2. Shared critical section (`stdlib-dts-import-specifier.test.ts` only):
 *     a `readdirSync` listing and every subsequent `readFileSync` of a name
 *     from that listing must share ONE lock hold -- two separate
 *     acquisitions would reopen a torn-read window between them. That
 *     forces the raw accessors into plain (non-locking) helper functions
 *     -- `generatedDtsFiles`/`collectUndeclaredSpecifiers`/
 *     `collectUnscopedSpecifierOffenders` -- invoked from a single
 *     `withStdlibBuildLock(...)` at the test. `safeContainers` covers this:
 *     an accessor is also approved if it sits inside a named container's
 *     body, PROVIDED every call site of that container (except its own
 *     declaration) is itself inside a lock span or another container's
 *     body.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type Span = readonly [number, number];

/**
 * Blanks out comments and string/template contents, preserving line
 * numbering, so a doc comment that quotes `readFileSync(...)` in prose can
 * never produce a false match.
 *
 * A single left-to-right scan, NOT the regex-pair technique
 * `svg-emission-seam.test.ts` uses (`/\*[^]*?\*\//g` for blocks, then a
 * per-line `//` strip). That technique breaks on this mission's own doc
 * comments: several of these 8 files write the glob path
 * `` `packages/*\/generated/` `` inside a `//` line comment, and "s/*"
 * there is a literal, un-escaped `/*` -- the regex pass runs before the
 * line-based `//` pass even sees it, so it reads as a genuine block-comment
 * OPEN and non-greedily swallows every line up to the next real `*\/`,
 * including this file's own marker text (`join(REAL_PACKAGES_DIR,`).
 * Confirmed empirically: the regex version dropped a real match at that
 * exact site. A single scan tracking line/block-comment and string state
 * left-to-right never has this ordering problem, and additionally skips
 * `//`/`/*` sequences inside string literals (e.g. `'https://...'`).
 */
function stripComments(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }
    if (c === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < src.length) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += c;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < src.length) {
          out += `${src[i]}${src[i + 1]}`;
          i += 2;
          continue;
        }
        out += src[i];
        i++;
      }
      if (i < src.length) {
        out += src[i];
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split('\n').length;
}

/** Every balanced `(...)` span immediately following each `${calleeName}(`
 * in `src`, found by counting paren depth from the opening `(`. Naive (no
 * string/backtick awareness) -- safe here because none of the 8 files nest
 * an unbalanced paren inside a string literal passed to `withStdlibBuildLock`. */
function findCallSpans(src: string, calleeName: string): Span[] {
  const spans: Span[] = [];
  const re = new RegExp(`\\b${calleeName}\\(`, 'g');
  for (const m of src.matchAll(re)) {
    const start = m.index;
    const openIndex = start + m[0].length - 1;
    let depth = 0;
    for (let i = openIndex; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') {
        depth--;
        if (depth === 0) {
          spans.push([start, i + 1]);
          break;
        }
      }
    }
  }
  return spans;
}

/** The `{...}` body span of every top-level `function NAME(` (`async` or
 * not) declaration named in `names`. */
function findFunctionBodySpans(src: string, names: readonly string[]): Span[] {
  const spans: Span[] = [];
  for (const name of names) {
    const re = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`, 'g');
    for (const m of src.matchAll(re)) {
      let i = m.index + m[0].length - 1;
      let depth = 0;
      for (; i < src.length; i++) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')') {
          depth--;
          if (depth === 0) break;
        }
      }
      const braceStart = src.indexOf('{', i);
      let braceDepth = 0;
      let j = braceStart;
      for (; j < src.length; j++) {
        if (src[j] === '{') braceDepth++;
        else if (src[j] === '}') {
          braceDepth--;
          if (braceDepth === 0) break;
        }
      }
      spans.push([braceStart, j + 1]);
    }
  }
  return spans;
}

function isWithin(index: number, spans: readonly Span[]): boolean {
  return spans.some(([start, end]) => index >= start && index < end);
}

interface FileCheck {
  readonly file: string;
  /** One regex per known canonical-tree accessor shape in the CORRECTLY
   * converted file. Every match must fall inside a `withStdlibBuildLock(...)`
   * span or a `safeContainers` body. Omit when this file only needs
   * `markerMustPrecedeLock` (see below). */
  readonly accessorPatterns?: readonly RegExp[];
  /** Plain (non-locking) helper functions whose bodies legitimately contain
   * a raw accessor, because every call site is itself locked -- see the
   * file header for why `stdlib-dts-import-specifier.test.ts` needs this. */
  readonly safeContainers?: readonly string[];
  /**
   * For a file where the accessor call's own text can't distinguish a
   * canonical-tree read from an unrelated one (`build-stdlib-packages.test.ts`
   * reuses the local name `generatedDir` for ~15 `mkdtempSync` scratch-dir
   * fixtures, correctly left unlocked): `marker` is a substring unique to
   * the REAL-tree case, and every occurrence of it must be followed, within
   * `withinChars`, by a `withStdlibBuildLock(` call.
   */
  readonly markerMustPrecedeLock?: { readonly marker: RegExp; readonly withinChars: number };
}

const FILE_CHECKS: readonly FileCheck[] = [
  {
    file: 'tests/unit/sprite-package-files.test.ts',
    accessorPatterns: [/execFileSync\(\s*'npm'/g, /readFileSync\(join\(PACKAGES_DIR, PACKAGE_DIR, 'generated'/g],
  },
  {
    file: 'tests/unit/stdlib-package-files.test.ts',
    // Narrowed to the `path` identifier: this file's OTHER dynamic import
    // (none currently) would use a different variable and must not match.
    accessorPatterns: [/execFileSync\(\s*'npm'/g, /import\(pathToFileURL\(path\)\.href\)/g],
  },
  {
    file: 'tests/unit/stdlib-dts-import-specifier.test.ts',
    accessorPatterns: [
      /readdirSync\(join\(PACKAGES_DIR,[^,]*,\s*'generated'/g,
      /readFileSync\(join\(PACKAGES_DIR,[^,]*,\s*'generated'/g,
    ],
    safeContainers: ['generatedDtsFiles', 'collectUndeclaredSpecifiers', 'collectUnscopedSpecifierOffenders'],
  },
  {
    file: 'tests/unit/stdlib-all-exports.test.ts',
    accessorPatterns: [/import\(pathToFileURL\(path\)\.href\)/g, /readFileSync\(join\(STDLIB_ALL_GENERATED_DIR,/g],
  },
  {
    file: 'tests/unit/build-stdlib-packages.test.ts',
    // `generatedDir`/`isGeneratedDirUpToDate(` also appear at ~15 scratch-dir
    // (`mkdtempSync`) call sites in this file, correctly left unlocked --
    // `join(REAL_PACKAGES_DIR,` is the one substring unique to the real,
    // shared-tree case (acceptance 4), so that is the marker instead.
    markerMustPrecedeLock: { marker: /join\(REAL_PACKAGES_DIR,/g, withinChars: 400 },
  },
  {
    file: 'tests/unit/stdlib-eager-omission.test.ts',
    accessorPatterns: [/readFileSync\(generatedPath\(/g, /existsSync\(generatedPath\(/g],
  },
  {
    file: 'tests/unit/stdlib-packages.test.ts',
    // Narrowed to `path`: `loadRemoteManifest`'s `import(pathToFileURL(tmpFile).href)`
    // targets a throwaway `node_modules/.tmp-*` scratch file, not
    // `packages/*/generated/`, and must not match.
    accessorPatterns: [/execFileSync\(\s*'npm'/g, /import\(pathToFileURL\(path\)\.href\)/g],
  },
  {
    file: 'tests/integration/stdlib-remote-e2e.test.ts',
    accessorPatterns: [
      /import\(pathToFileURL\((?:TUPADR3_REMOTE_MODULE|AWSLIB14_REMOTE_MODULE)\)\.href\)/g,
      /readFileSync\(TUPADR3_REMOTE_MODULE\)/g,
    ],
  },
];

/** Every accessor-pattern match not inside an approved region, plus every
 * `safeContainers` call site (excluding its own declaration) not inside one
 * -- both reported as `file:line`. */
function checkFile(check: FileCheck): string[] {
  const raw = readFileSync(join(REPO, check.file), 'utf8');
  const src = stripComments(raw);
  const lockSpans = findCallSpans(src, 'withStdlibBuildLock');
  const containerSpans = check.safeContainers ? findFunctionBodySpans(src, check.safeContainers) : [];
  const approved = [...lockSpans, ...containerSpans];

  const violations: string[] = [];

  for (const pattern of check.accessorPatterns ?? []) {
    const matches = [...src.matchAll(pattern)];
    if (matches.length === 0) {
      violations.push(`${check.file}: expected accessor pattern ${pattern} was not found -- reverted?`);
      continue;
    }
    for (const m of matches) {
      if (!isWithin(m.index, approved)) {
        violations.push(`${check.file}:${lineOf(src, m.index)} -- unlocked canonical-tree access: ${m[0]}`);
      }
    }
  }

  if (check.markerMustPrecedeLock) {
    const { marker, withinChars } = check.markerMustPrecedeLock;
    const markerMatches = [...src.matchAll(marker)];
    if (markerMatches.length === 0) {
      violations.push(`${check.file}: expected marker ${marker} was not found -- reverted?`);
    }
    for (const m of markerMatches) {
      const windowEnd = m.index + m[0].length + withinChars;
      const lockFollows = lockSpans.some(([start]) => start >= m.index + m[0].length && start <= windowEnd);
      if (!lockFollows) {
        violations.push(`${check.file}:${lineOf(src, m.index)} -- '${m[0]}' not followed by withStdlibBuildLock(`);
      }
    }
  }

  for (const name of check.safeContainers ?? []) {
    const callSiteRe = new RegExp(`(?<!function\\s)\\b${name}\\(`, 'g');
    for (const m of src.matchAll(callSiteRe)) {
      if (!isWithin(m.index, approved)) {
        violations.push(`${check.file}:${lineOf(src, m.index)} -- '${name}(' called outside the lock`);
      }
    }
  }

  return violations;
}

describe('stdlib generated/ readers hold the cross-process build lock', () => {
  it.each(FILE_CHECKS)('$file has no unlocked canonical-tree access', (check) => {
    expect(checkFile(check)).toEqual([]);
  });
});
