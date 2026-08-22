/**
 * test-budget-invariant T3 -- D1/D2 (`plans/test-budget-invariant/decisions.md`).
 * Enforces, as a fitness test rather than a convention, that every vitest
 * test which acquires the stdlib cross-process build lock
 * (`withStdlibBuildLock`, `tests/helpers/with-stdlib-build-lock.ts`, or
 * `acquireBuildLock`, `scripts/build-stdlib-packages/build-lock.ts`)
 * declares a per-test budget strictly greater than the wait bound that
 * SPECIFIC acquisition could legitimately hit -- so a real lock timeout
 * always surfaces as the lock's own diagnosis, never disguised as vitest's
 * generic "Test timed out in 5000ms".
 *
 * Threshold, per call site (D1's context + this task's brief §0):
 *   - if the call's own options object carries a literal `maxWaitMs: N`
 *     override, that call can only ever wait up to N -- the required
 *     per-test budget is N, not the full default. This is the
 *     `tests/unit/build-stdlib-lock.test.ts` "unit-testing the lock
 *     itself" class: 100/150/5000/15000ms overrides need proportionally
 *     small budgets, not 120s.
 *   - otherwise the call falls through to `acquireBuildLock`'s real
 *     production default, `DEFAULT_MAX_WAIT_MS` -- read LIVE out of
 *     `scripts/build-stdlib-packages/build-lock.ts` below (it is not
 *     exported) rather than hardcoded, so this test breaks loudly, not
 *     silently, if that module's default ever moves.
 * SCOPE BOUNDARY -- adjudicated 2026-08-22, not an oversight: a call is
 * in scope ONLY when it resolves to the DEFAULT lock path, i.e. its
 * options carry no `lockPath` override. D1 binds tests that acquire "the
 * stdlib build lock" -- the ONE shared lock, deterministically derived by
 * hashing `repoRoot` (`defaultLockPath`, `build-lock.ts:108-111`), whose
 * contention across up to 8+ concurrent reader test files is the entire
 * subject of this mission. A call that passes an explicit `lockPath` built
 * from `join(makeTempDir(prefix), '<name>.lock')` (`mkdtempSync` under
 * `os.tmpdir()`) targets a fresh, per-call-unique file no other process or
 * test can ever contend for: the `wx` create always wins on the first
 * attempt, so `DEFAULT_MAX_WAIT_MS` is unreachable by construction. That
 * acquisition exercises the LOCK MECHANISM under test, not THE stdlib
 * build lock -- `with-stdlib-build-lock.ts`'s own doc comment makes the
 * same distinction, warning that a different path string "would silently
 * produce a DIFFERENT lock file". Verified in `tests/unit/build-stdlib-lock.test.ts`
 * and `tests/unit/with-stdlib-build-lock.test.ts`: exactly one acquisition
 * across both files omits `lockPath` (`build-stdlib-lock.test.ts:286`,
 * already budgeted at `:295`); all 30 others pass an explicit scratch
 * `lockPath` and are out of scope. This narrows WHICH calls are examined;
 * it does not relax how an in-scope call's threshold is computed (still
 * the explicit-`maxWaitMs`-override rule above, else the live-parsed
 * default) or D2's helper-indirection resolution below.
 *
 * D2's hard case: `tests/unit/stdlib-packages.test.ts:429` never mentions
 * `withStdlibBuildLock` in its own `it(...)` body -- it calls a same-file
 * helper, `npmPackDryRun`, whose OWN body holds the lock. Detection below
 * resolves same-file helper indirection to a fixed point (any depth of
 * same-file helper calling another same-file helper), not just one level,
 * so it also covers a same-file helper wrapping another. Cross-FILE
 * indirection (a helper imported from elsewhere, or a lock acquired inside
 * a spawned child process's own script) is deliberately OUT OF SCOPE per
 * D2 -- `:429`'s shape is same-file, and that bounds the work. Several
 * files in this scan (`tests/unit/build-stdlib-lock.test.ts`,
 * `tests/unit/with-stdlib-build-lock.test.ts`) spawn real child processes
 * whose worker scripts are generated as TEMPLATE-LITERAL STRINGS containing
 * literal source text that mentions these same function names -- inert
 * text, not a real call in THIS file's own execution. Blanking string
 * contents (see `stripCommentsAndStrings` below) is what keeps those out of
 * scope rather than producing a false positive.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LOCK_PRESSURE_BUDGET_MS } from '../helpers/lock-pressure-budget.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** vitest's own built-in per-test timeout when a test declares no explicit
 * third-arg budget (`vitest.config.ts` sets no global `testTimeout` -- D4).
 * Named so a comparison against it is self-documenting, not a bare `5000`. */
const VITEST_DEFAULT_TIMEOUT_MS = 5_000;

type Span = readonly [number, number];

/**
 * Duplicates the general balanced-bracket scanning technique
 * `tests/architecture/stdlib-read-lock.test.ts`'s `stripComments` uses
 * (that file is outside this task's write-set, and its helpers are not
 * exported) -- but goes one step further and ALSO blanks string/template
 * literal CONTENTS (keeping the quote characters, so column alignment and
 * line numbering both survive). That extra step is not optional here: this
 * task's own worker-script generators (`buildWorkerSource`,
 * `holderWorkerSource`, `sharedReaderWorkerSource`, `sharedReaderWorkerSource`
 * in `with-stdlib-build-lock.test.ts`) return template-literal strings
 * containing literal, syntactically valid mentions of `acquireBuildLock(...)`
 * and `withStdlibBuildLock(...)` -- text meant for a CHILD PROCESS, not a
 * real call in this file. A scanner that only blanks comments (like the
 * read-lock file's, which needs to see INSIDE string arguments such as
 * `'npm'` for its own patterns) would misclassify those string-returning
 * functions as same-file lock-holding helpers. Confirmed empirically
 * against `build-stdlib-lock.test.ts`.
 */
function stripCommentsAndStrings(src: string): string {
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
          out += '  ';
          i += 2;
          continue;
        }
        out += src[i] === '\n' ? '\n' : ' ';
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

/** Index just past the bracket that balances the one at `openIndex`
 * (`openChar`/`closeChar`, e.g. `(`/`)` or `{`/`}`). Shared by every span
 * finder below -- generalises `stdlib-read-lock.test.ts`'s separate
 * paren-counting and brace-counting loops into one. */
function findBalancedSpanEnd(src: string, openIndex: number, openChar: string, closeChar: string): number {
  let depth = 0;
  for (let i = openIndex; i < src.length; i++) {
    if (src[i] === openChar) depth++;
    else if (src[i] === closeChar) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return src.length;
}

/** Every balanced `NAME(...)` call span in `src`. */
function findCallSpans(src: string, calleeName: string): Span[] {
  const spans: Span[] = [];
  const re = new RegExp(`\\b${calleeName}\\(`, 'g');
  for (const m of src.matchAll(re)) {
    const openIndex = m.index + m[0].length - 1;
    spans.push([m.index, findBalancedSpanEnd(src, openIndex, '(', ')')]);
  }
  return spans;
}

interface FunctionDecl {
  readonly name: string;
  readonly bodySpan: Span;
}

/** Every top-level `function NAME(...) { ... }` declaration in `src`,
 * discovered by name (unlike `stdlib-read-lock.test.ts`'s
 * `findFunctionBodySpans`, which takes a pre-known list) -- this file
 * cannot hardcode helper names, since discovering them IS D2's task. */
function findAllFunctionDeclarations(src: string): FunctionDecl[] {
  const out: FunctionDecl[] = [];
  const re = /(?:async\s+)?function\s+(\w+)\s*\(/g;
  for (const m of src.matchAll(re)) {
    const name = m[1] as string;
    const paramsOpen = m.index + m[0].length - 1;
    const paramsEnd = findBalancedSpanEnd(src, paramsOpen, '(', ')');
    const braceStart = src.indexOf('{', paramsEnd);
    if (braceStart === -1) continue;
    out.push({ name, bodySpan: [braceStart, findBalancedSpanEnd(src, braceStart, '{', '}')] });
  }
  return out;
}

/** Splits `text` on top-level commas only -- depth-tracked across
 * `()[]{}`, so a comma inside a nested callback body or object literal
 * never produces a spurious argument boundary. Operates on
 * comment-and-string-blanked text, so a comma inside a string can never
 * appear in the first place. Trims each part and drops empty ones, so a
 * Prettier-style trailing comma (`fn(a, b,\n)`) never manufactures a
 * spurious empty final argument that would shadow the real last one. */
function splitTopLevelArgs(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

interface LockCallSite {
  readonly span: Span;
  readonly threshold: number;
}

/** A call's own required threshold: its literal `maxWaitMs: N` override
 * (searched only within the call's FINAL top-level argument -- the options
 * object, per every observed call shape -- not the whole call span, so a
 * coincidental `maxWaitMs` mention deep inside a callback body can never
 * be misread as this call's own override), else `defaultMaxWaitMs`. */
function extractCallThreshold(callSpanText: string, defaultMaxWaitMs: number): number {
  const inner = callSpanText.slice(callSpanText.indexOf('(') + 1, -1);
  const lastArg = splitTopLevelArgs(inner).at(-1) ?? '';
  const match = /maxWaitMs\s*:\s*([\d_]+)/.exec(lastArg);
  return match ? Number((match[1] as string).replace(/_/g, '')) : defaultMaxWaitMs;
}

/** True if this call's own options argument names `lockPath` at all
 * (shorthand `{ lockPath }` or explicit `{ lockPath: x }` -- either means
 * an override, so a plain identifier search is enough within that one
 * argument). A call with only one top-level argument (no options object,
 * e.g. `withStdlibBuildLock(fn)`) has nothing to override and is always
 * in scope -- see the file header's SCOPE BOUNDARY note. */
function hasLockPathOverride(callSpanText: string): boolean {
  const inner = callSpanText.slice(callSpanText.indexOf('(') + 1, -1);
  const parts = splitTopLevelArgs(inner);
  if (parts.length < 2) return false;
  return /\blockPath\b/.test(parts.at(-1) ?? '');
}

/** Every direct `withStdlibBuildLock(...)`/`acquireBuildLock(...)` call
 * site in `stripped` that resolves to the DEFAULT lock path (see the file
 * header's SCOPE BOUNDARY note), each with its own required threshold. */
function findLockCallSites(stripped: string, defaultMaxWaitMs: number): LockCallSite[] {
  const sites: LockCallSite[] = [];
  for (const callee of ['withStdlibBuildLock', 'acquireBuildLock']) {
    for (const span of findCallSpans(stripped, callee)) {
      const callText = stripped.slice(span[0], span[1]);
      if (hasLockPathOverride(callText)) continue;
      sites.push({ span, threshold: extractCallThreshold(callText, defaultMaxWaitMs) });
    }
  }
  return sites;
}

function containsIndex(span: Span, index: number): boolean {
  return index >= span[0] && index < span[1];
}

/** A same-file helper's own required threshold, if it holds the lock
 * (directly, or by calling another already-resolved helper) -- else
 * `undefined`. `resolved` only ever contains PREVIOUSLY discovered
 * helpers, so this is one fixed-point iteration step, not a full solve. */
function helperOwnThreshold(
  stripped: string,
  helper: FunctionDecl,
  lockSites: readonly LockCallSite[],
  resolved: ReadonlyMap<string, number>,
): number | undefined {
  const direct = lockSites.filter((site) => containsIndex(helper.bodySpan, site.span[0])).map((site) => site.threshold);
  const bodyText = stripped.slice(...helper.bodySpan);
  const viaHelpers = [...resolved.entries()]
    .filter(([name]) => new RegExp(`\\b${name}\\(`).test(bodyText))
    .map(([, threshold]) => threshold);
  const all = [...direct, ...viaHelpers];
  return all.length > 0 ? Math.max(...all) : undefined;
}

/** Fixed-point resolution over same-file helpers: any depth of helper
 * calling another same-file helper that (eventually) reaches a real lock
 * call is discovered, not just one level -- D2 requires "at least one",
 * this covers more without requiring cross-file indirection (out of scope). */
function resolveHelperThresholds(
  stripped: string,
  helpers: readonly FunctionDecl[],
  lockSites: readonly LockCallSite[],
): Map<string, number> {
  const resolved = new Map<string, number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const helper of helpers) {
      if (resolved.has(helper.name)) continue;
      const threshold = helperOwnThreshold(stripped, helper, lockSites, resolved);
      if (threshold !== undefined) {
        resolved.set(helper.name, threshold);
        changed = true;
      }
    }
  }
  return resolved;
}

/** Every `it(name, fn, timeout?)` and `it.each(cases)(name, fn, timeout?)`
 * ARGUMENT-LIST span (the parens right after `it(`, or after the SECOND
 * call in the `.each` chain) -- name/fn/timeout live here regardless of
 * which shape produced it. */
function findTestArgsSpans(src: string): Span[] {
  const spans: Span[] = [];
  for (const m of src.matchAll(/\bit\(/g)) {
    const open = m.index + m[0].length - 1;
    spans.push([open, findBalancedSpanEnd(src, open, '(', ')')]);
  }
  for (const m of src.matchAll(/\bit\.each\(/g)) {
    const firstOpen = m.index + m[0].length - 1;
    const firstEnd = findBalancedSpanEnd(src, firstOpen, '(', ')');
    const secondOpen = src.indexOf('(', firstEnd);
    if (secondOpen === -1 || src.slice(firstEnd, secondOpen).trim() !== '') continue;
    spans.push([secondOpen, findBalancedSpanEnd(src, secondOpen, '(', ')')]);
  }
  return spans;
}

interface FileAnalysis {
  readonly stripped: string;
  readonly lockSites: readonly LockCallSite[];
  readonly helperThresholds: ReadonlyMap<string, number>;
}

/** The strictest threshold this test-args span is bound by, considering
 * every direct lock call AND every resolved-helper call textually inside
 * it -- or `undefined` if the span never touches the lock at all (the
 * "not flagged" case, acceptance clause 4). */
function requiredThresholdForSpan(analysis: FileAnalysis, span: Span): number | undefined {
  const direct = analysis.lockSites.filter((site) => containsIndex(span, site.span[0])).map((site) => site.threshold);
  const spanText = analysis.stripped.slice(...span);
  const viaHelpers = [...analysis.helperThresholds.entries()]
    .filter(([name]) => new RegExp(`\\b${name}\\(`).test(spanText))
    .map(([, threshold]) => threshold);
  const all = [...direct, ...viaHelpers];
  return all.length > 0 ? Math.max(...all) : undefined;
}

/** The test's own declared budget: its third top-level argument, if any --
 * a bare numeric literal, the imported `LOCK_PRESSURE_BUDGET_MS` identifier
 * (resolved to T1's REAL constant value, not a re-hardcoded copy), or
 * absent (vitest's default). Any other shape (a variable this scan cannot
 * statically resolve) is treated as "no declared budget" -- the safer
 * direction, since it can only ADD a flagged case, never hide one; none of
 * the current lock-using files uses any other shape. */
function extractDeclaredBudgetMs(argsText: string): number {
  const parts = splitTopLevelArgs(argsText);
  if (parts.length < 3) return VITEST_DEFAULT_TIMEOUT_MS;
  const last = parts.at(-1) ?? '';
  if (last === 'LOCK_PRESSURE_BUDGET_MS') return LOCK_PRESSURE_BUDGET_MS;
  const numeric = Number(last.replace(/_/g, ''));
  return Number.isFinite(numeric) && last !== '' ? numeric : VITEST_DEFAULT_TIMEOUT_MS;
}

/** Every lock-using test in `file` whose declared budget does not exceed
 * the threshold its own lock usage requires, as `file:line -- ...`
 * strings (mirrors `stdlib-read-lock.test.ts`'s message style). */
function checkFile(file: string, defaultMaxWaitMs: number): string[] {
  const raw = readFileSync(join(REPO, file), 'utf8');
  const stripped = stripCommentsAndStrings(raw);
  const analysis: FileAnalysis = {
    stripped,
    lockSites: findLockCallSites(stripped, defaultMaxWaitMs),
    helperThresholds: resolveHelperThresholds(stripped, findAllFunctionDeclarations(stripped), findLockCallSites(stripped, defaultMaxWaitMs)),
  };

  const violations: string[] = [];
  for (const span of findTestArgsSpans(stripped)) {
    const threshold = requiredThresholdForSpan(analysis, span);
    if (threshold === undefined) continue;
    const declared = extractDeclaredBudgetMs(stripped.slice(span[0] + 1, span[1] - 1));
    if (declared <= threshold) {
      violations.push(
        `${file}:${lineOf(stripped, span[0])} -- lock-using test declares a ${declared}ms budget, ` +
          `must exceed ${threshold}ms (this call's maxWaitMs, or DEFAULT_MAX_WAIT_MS if unset)`,
      );
    }
  }
  return violations;
}

/** `DEFAULT_MAX_WAIT_MS` is not exported by `build-lock.ts` -- read and
 * parsed live out of its source rather than duplicated as a literal, so a
 * future change to that constant breaks THIS test loudly instead of
 * silently drifting out of sync. */
function readDefaultMaxWaitMs(): number {
  const src = readFileSync(join(REPO, 'scripts', 'build-stdlib-packages', 'build-lock.ts'), 'utf8');
  const match = /DEFAULT_MAX_WAIT_MS\s*=\s*([\d_]+)/.exec(src);
  if (match === null) {
    throw new Error(
      'DEFAULT_MAX_WAIT_MS not found in scripts/build-stdlib-packages/build-lock.ts -- ' +
        'this fitness test cannot derive the threshold it enforces; the constant was renamed or moved.',
    );
  }
  return Number((match[1] as string).replace(/_/g, ''));
}

function collectTestFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTestFiles(full));
    else if (entry.name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

/** A plain substring pre-filter, not an import-statement parse: any file
 * that never mentions either lock function's name anywhere cannot contain
 * a real call to it, so `checkFile` would trivially find nothing there
 * anyway. Deliberately broader than "actually imports it" (a doc-comment
 * mention is enough to include a file) -- over-inclusion only costs an
 * extra, cheap, always-passing scan; under-inclusion would silently skip a
 * real violation. This IS the file-discovery step -- no list is hardcoded. */
function discoverCandidateFiles(): string[] {
  return collectTestFiles(join(REPO, 'tests'))
    .filter((full) => {
      const raw = readFileSync(full, 'utf8');
      return raw.includes('withStdlibBuildLock') || raw.includes('acquireBuildLock');
    })
    .map((full) => full.slice(REPO.length + 1));
}

describe('every test that acquires the stdlib build lock declares an adequate budget', () => {
  const defaultMaxWaitMs = readDefaultMaxWaitMs();
  const files = discoverCandidateFiles();

  it('found at least one candidate file (sanity check on the discovery scan itself)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s has no under-budgeted lock-using test', (file) => {
    expect(checkFile(file, defaultMaxWaitMs)).toEqual([]);
  });
});
