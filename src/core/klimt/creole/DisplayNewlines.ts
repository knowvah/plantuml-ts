/**
 * DisplayNewlines — the pure, `this`-free half of `klimt/creole/Display.java`:
 * the `\n`/tab/left-align/right-align escape-sequence scanner
 * (`getWithNewlines`/`getWithNewlines3`), the deprecation-warning helper it
 * calls (`addWarning`, `warning/JawsWarning.java`), and the "several guide
 * lines" predicate family (`hasSeveralGuideLines`).
 *
 * Split out of `Display.ts` (which stays under this project's per-file size
 * cap) because every function here is a standalone algorithm with no `this`
 * — `Display.ts`'s instance/static methods are thin wrappers that call into
 * this file and wrap the plain-data result into a real `Display`, avoiding
 * a `Display.ts` <-> `DisplayNewlines.ts` circular import (this file never
 * constructs a `Display`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/warning/JawsWarning.java
 */
import { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import { Pragma } from '../../skin/Pragma.js';
import { PragmaKey } from '../../skin/PragmaKey.js';
import { Warning } from '../../warning/Warning.js';
import { BackSlash } from '../../text/BackSlash.js';

/**
 * `jaws/Jaws.java:47-57` — the private-use Unicode sentinels
 * `Display#getWithNewlines` scans for unconditionally (NOT gated behind
 * `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION`, unlike `tim/builtin/
 * jaws-constants.ts`'s own placeholder-scoped export of the SAME six
 * values -- see `BackSlash.ts`'s own doc comment for why this project's
 * established precedent is a LOCAL redefinition here rather than an
 * import of that unrelated, differently-scoped file). `BLOCK_E1_NEWLINE`
 * matches `BackSlash.hiddenNewLine()`'s own return value exactly (both are
 * `jaws/Jaws.java:47`), reused directly below rather than redefined a
 * third time.
 */
const BLOCK_E1_NEWLINE_LEFT_ALIGN = '';
const BLOCK_E1_NEWLINE_RIGHT_ALIGN = '';
const BLOCK_E1_BREAKLINE = '';
const BLOCK_E1_REAL_BACKSLASH = '';
const BLOCK_E1_REAL_TABULATION = '';
const BLOCK_E1_INVISIBLE_QUOTE = '';

/** `jaws/JawsFlags.java:42` — `SPECIAL_NEWLINE_IN_DISPLAY_CLASS`, `false`
 *  upstream too. Both branches gated behind it are ported faithfully
 *  ("don't refactor while porting") even though neither can execute. */
const SPECIAL_NEWLINE_IN_DISPLAY_CLASS = false;

/** `warning/JawsWarning.java` — a 5-value enum, each pairing a deprecated
 *  escape sequence with its `%function()` replacement. As-const object,
 *  not a TS `enum` (project convention). */
export const JawsWarning = {
  BACKSLASH_NEWLINE: 'BACKSLASH_NEWLINE',
  BACKSLASH_LEFT: 'BACKSLASH_LEFT',
  BACKSLASH_RIGHT: 'BACKSLASH_RIGHT',
  BACKSLASH_TABULATION: 'BACKSLASH_TABULATION',
  BACKSLASH_BACKSLASH: 'BACKSLASH_BACKSLASH',
} as const;
export type JawsWarning = (typeof JawsWarning)[keyof typeof JawsWarning];

const JAWS_WARNING_INFO: Record<JawsWarning, { readonly ch: string; readonly fn: string }> = {
  BACKSLASH_NEWLINE: { ch: '\\n', fn: '%newline() or %n()' },
  BACKSLASH_LEFT: { ch: '\\l', fn: '%left_align()' },
  BACKSLASH_RIGHT: { ch: '\\r', fn: '%right_align()' },
  BACKSLASH_TABULATION: { ch: '\\t', fn: '%tab()' },
  BACKSLASH_BACKSLASH: { ch: '\\\\', fn: '%backslash()' },
};

/** `JawsWarning#toWarning` (java:44-49). */
export function jawsWarningToWarning(kind: JawsWarning): Warning {
  const info = JAWS_WARNING_INFO[kind];
  return new Warning(
    `This diagram is using ${info.ch} which is deprecated and will be removed in the future.`,
    `You should use ${info.fn} instead in your diagram.`,
  );
}

/** `Display.MORE_INFO` (java:260). */
const MORE_INFO = new Warning('More info on https://plantuml.com/newline');

/** `Display#addWarning` (java:348-353). */
function addWarning(pragma: Pragma, warning: JawsWarning): void {
  if (pragma.isTrue(PragmaKey.SHOW_DEPRECATION)) {
    pragma.addWarning(MORE_INFO);
    pragma.addWarning(jawsWarningToWarning(warning));
  }
}

/** `Display#getWithNewlines3` (java:233-258) -- the simpler, pragma-free
 *  `\n`/`\t`/`\\` line splitter (no left/right-align, no BLOCK_E1
 *  sentinels). `null` in, `null` out. */
export function getWithNewlines3(s: string | null): readonly string[] | null {
  if (s === null) return null;

  const result: string[] = [];
  let current = '';
  let i = 0;
  while (i < s.length) {
    const c = s.charAt(i);
    if (c === '\\' && i < s.length - 1) {
      const c2 = s.charAt(i + 1);
      i += 2;
      if (c2 === 'n') {
        result.push(current);
        current = '';
      } else if (c2 === 't') {
        current += '\t';
      } else if (c2 === '\\') {
        current += c2;
      }
      continue;
    }
    current += c;
    i++;
  }
  result.push(current);
  return result;
}

/** Plain-data result of {@link parseWithNewlines} -- `Display.ts`'s own
 *  static factory wraps this into a real `Display` (avoiding a circular
 *  import between the two files; see this file's own module doc comment). */
export interface ParsedNewlines {
  readonly lines: readonly string[];
  readonly naturalHorizontalAlignment: HorizontalAlignment | null;
}

/** One iteration of {@link parseWithNewlines}'s scan loop -- extracted to
 *  keep the caller's cyclomatic complexity under this project's per-
 *  function budget (a single large if/else-if chain over ~10 branches
 *  would exceed it). Returns the number of source characters consumed
 *  (1, or 2 for a recognized two-character backslash escape) and mutates
 *  `state` in place (`current`/`result`/`naturalHorizontalAlignment`),
 *  matching `Display.java:270-343`'s own single loop body exactly in
 *  effect, just factored differently. */
interface ScanState {
  current: string;
  readonly result: string[];
  naturalHorizontalAlignment: HorizontalAlignment | null;
  rawMode: boolean;
}

function scanBackslashEscape(pragma: Pragma, s: string, i: number, state: ScanState): number {
  const c2 = s.charAt(i + 1);
  if (c2 === 'n' || c2 === 'r' || c2 === 'l') {
    if (c2 === 'r') {
      state.naturalHorizontalAlignment = HorizontalAlignment.RIGHT;
      addWarning(pragma, JawsWarning.BACKSLASH_RIGHT);
    } else if (c2 === 'l') {
      state.naturalHorizontalAlignment = HorizontalAlignment.LEFT;
      addWarning(pragma, JawsWarning.BACKSLASH_LEFT);
    } else {
      addWarning(pragma, JawsWarning.BACKSLASH_NEWLINE);
    }
    state.result.push(state.current);
    state.current = '';
  } else if (c2 === 't') {
    state.current += '\t';
    addWarning(pragma, JawsWarning.BACKSLASH_TABULATION);
  } else if (c2 === '\\') {
    state.current += c2;
    addWarning(pragma, JawsWarning.BACKSLASH_BACKSLASH);
  } else {
    state.current += s.charAt(i);
    state.current += c2;
  }
  return 2;
}

/** A single-character `BLOCK_E1_*` sentinel and its (state-mutating)
 *  handler -- table-driven rather than an if/else-if chain, to keep
 *  {@link scanSentinelChar}'s cyclomatic complexity under this project's
 *  per-function budget. Each entry is one `Display.java:315-339` branch. */
const SENTINEL_HANDLERS: ReadonlyArray<readonly [string, (state: ScanState) => void]> = [
  [
    BLOCK_E1_REAL_TABULATION,
    // java:316-317 -- the `current.append('\t')` alternative is commented
    // out upstream; the line that actually executes appends the sentinel
    // character itself, verbatim. Preserved exactly ("don't refactor").
    (state) => {
      state.current += BLOCK_E1_REAL_TABULATION;
    },
  ],
  [
    BLOCK_E1_REAL_BACKSLASH,
    (state) => {
      state.current += '\\';
    },
  ],
  [
    BLOCK_E1_NEWLINE_LEFT_ALIGN,
    (state) => {
      state.naturalHorizontalAlignment = HorizontalAlignment.LEFT;
      state.result.push(state.current);
      state.current = '';
    },
  ],
  // java:324-325 -- `BLOCK_E1_INVISIBLE_QUOTE` is ignored entirely, nothing appended.
  [BLOCK_E1_INVISIBLE_QUOTE, () => undefined],
  [
    BLOCK_E1_NEWLINE_RIGHT_ALIGN,
    (state) => {
      state.naturalHorizontalAlignment = HorizontalAlignment.RIGHT;
      state.result.push(state.current);
      state.current = '';
    },
  ],
  [
    BLOCK_E1_BREAKLINE,
    (state) => {
      state.result.push(state.current);
      state.current = '';
    },
  ],
];

/** One non-backslash sentinel-character branch of `Display.java:315-339`
 *  (`BLOCK_E1_*`/hidden-newline dispatch). Returns `true` if the character
 *  at `i` was recognized and consumed (1 char), `false` if the caller
 *  should fall through to the plain-text default (`current.append(c)`). */
function scanSentinelChar(s: string, i: number, state: ScanState): boolean {
  const c = s.charAt(i);
  for (const [sentinel, handle] of SENTINEL_HANDLERS) {
    if (c === sentinel) {
      handle(state);
      return true;
    }
  }
  if (!state.rawMode && c === BackSlash.hiddenNewLine()) {
    // java:330-332 -- `Jaws.BLOCK_E1_NEWLINE`, identical value to
    // `BackSlash.hiddenNewLine()` (both `jaws/Jaws.java:47`).
    state.result.push(state.current);
    state.current = '';
    return true;
  }
  return false;
}

/** `Display.java:273-277` -- toggles "raw mode" (newline-splitting
 *  suppressed) on entering/leaving a `<math>`/`<latex>`/`[[...]]` span. */
function updateRawMode(sub: string, rawMode: boolean): boolean {
  if (sub.startsWith('<math>') || sub.startsWith('<latex>') || sub.startsWith('[[')) return true;
  if (sub.startsWith('</math>') || sub.startsWith('</latex>') || sub.startsWith(']]')) return false;
  return rawMode;
}

/** `Display.java:278-287` -- the (dead-by-flag, faithfully ported)
 *  `%newline()`/`%n()` builtin recognizer. Returns the number of source
 *  characters to advance by (0 = not recognized, no mutation). */
function scanSpecialNewline(sub: string, state: ScanState): number {
  if (!SPECIAL_NEWLINE_IN_DISPLAY_CLASS) return 0;
  if (sub.startsWith('%newline()')) {
    state.result.push(state.current);
    state.current = '';
    return 10; // java:279-281 -- `i += 9` manual + the for-loop's own `i++`.
  }
  if (sub.startsWith('%n()')) {
    state.result.push(state.current);
    state.current = '';
    return 4; // java:283-285 -- `i += 3` manual + the for-loop's own `i++`.
  }
  return 0;
}

/** `Display.java:288-289`'s compound guard, extracted so the main scan
 *  loop spends only one decision point on it (complexity-hook
 *  accommodation, matching this project's established "fields object"/
 *  "table-driven dispatch" precedent elsewhere in this same file). */
function shouldScanBackslashEscape(s: string, i: number, rawMode: boolean): boolean {
  return Pragma.legacyReplaceBackslashNByNewline() && !rawMode && s.charAt(i) === '\\' && i < s.length - 1;
}

/** `Display#getWithNewlines(Pragma, String)` (java:262-346) -- the full
 *  creole-display line splitter: recognizes `\n`/`\r`/`\l`/`\t`/`\\`
 *  backslash escapes (when `Pragma.legacyReplaceBackslashNByNewline()`,
 *  always `true` today), the `%newline()`/`%n()` builtins (dead by
 *  `JawsFlags.SPECIAL_NEWLINE_IN_DISPLAY_CLASS === false`, ported anyway),
 *  and the `BLOCK_E1_*` sentinel characters, while tracking `<math>`/
 *  `<latex>`/`[[...]]` "raw mode" spans where newline-splitting is
 *  suppressed. Returns `null` for a `null` input (`Display.ts`'s own
 *  static wrapper maps that to `Display.NULL`). */
export function parseWithNewlines(pragma: Pragma, s: string | null): ParsedNewlines | null {
  if (s === null) return null;

  const state: ScanState = { current: '', result: [], naturalHorizontalAlignment: null, rawMode: false };
  let i = 0;
  while (i < s.length) {
    const c = s.charAt(i);
    const sub = s.slice(i);
    state.rawMode = updateRawMode(sub, state.rawMode);

    const specialAdvance = scanSpecialNewline(sub, state);
    if (specialAdvance > 0) {
      i += specialAdvance;
      continue;
    }
    if (shouldScanBackslashEscape(s, i, state.rawMode)) {
      i += scanBackslashEscape(pragma, s, i, state);
      continue;
    }
    if (scanSentinelChar(s, i, state)) {
      i++;
      continue;
    }
    state.current += c;
    i++;
  }
  state.result.push(state.current);
  return { lines: state.result, naturalHorizontalAlignment: state.naturalHorizontalAlignment };
}

/** `Display#hasSeveralGuideLines(Collection)` (java:729-748) -- the shared
 *  predicate both the instance method (over `displayData`) and the static
 *  `String`-splitting overload delegate to. */
export function hasSeveralGuideLinesOfAll(all: readonly { toString(): string }[]): boolean {
  if (all.length <= 1) return false;

  for (const cs of all) {
    const s = cs.toString();
    if (s.startsWith('< ')) return true;
    if (s.startsWith('> ')) return true;
    if (s.endsWith(' <')) return true;
    if (s.endsWith(' >')) return true;
  }
  return false;
}

/** `Display#hasSeveralGuideLines(String)` (java:720-727) -- splits on
 *  `\\n` (a literal backslash-n) when `Pragma.legacyReplaceBackslashNByNewline()`
 *  is `true` (always, today), else on the raw `BLOCK_E1_NEWLINE` sentinel. */
export function hasSeveralGuideLinesOfString(s: string): boolean {
  const split = Pragma.legacyReplaceBackslashNByNewline() ? s.split('\\n') : s.split(BackSlash.hiddenNewLine());
  return hasSeveralGuideLinesOfAll(split);
}

/**
 * `splitDisplayLines` -- mission `shared-seam-extraction` T1's ONE shared
 * adapter over {@link parseWithNewlines} (`Display#getWithNewlines(Pragma,
 * String)`, java:262-346) for every caller that needs "split this display
 * text into lines and resolve the whole block's alignment" but has no live
 * `Pragma` reference to thread through (every T1 caller measures at LAYOUT
 * time, not parse time). `Pragma.createEmpty()` mirrors upstream's own
 * zero-pragma convenience overload (`Display.getWithNewlines(Quark)`,
 * java:223-225) -- a fresh empty `Pragma` behaves identically to a real one
 * for every branch except the (opt-in, off by default) deprecation-warning
 * emission, which none of this adapter's callers observe.
 *
 * `naturalHorizontalAlignment === null` (no `\l`/`\r` in the text) maps to
 * `'center'` -- `SvekEdge#getMessageTextAlignment`'s own default
 * (`getDefaultTextAlignment(CENTER)`, `svek/SvekEdge.java:376-381`), the
 * only alignment source this adapter's callers share (a relationship/
 * transition/link label with no explicit alignment escape).
 *
 * Retires THREE separate re-derivations this mission's T0 survey found:
 * `core/edge-label-box.ts`'s `splitCreoleLines` (real-newline-splitting,
 * escape-blind), `diagrams/class/class-edge-label-lines.ts`'s
 * `splitEdgeLabelLines`/`resolveLabelEscape` (an independent, narrower
 * re-implementation of THIS function's own escape scan), and the class
 * engine's inverted `core/` -> `diagrams/class/` import
 * (`edge-label-box-backlog` T5) that motivated this mission.
 */
export function splitDisplayLines(text: string): { readonly lines: readonly string[]; readonly align: 'center' | 'left' | 'right' } {
  // `text` is a `string`, never `null` here -- `parseWithNewlines` only
  // returns `null` for a `null` input (java:263-264), which this adapter's
  // signature does not accept.
  const parsed = parseWithNewlines(Pragma.createEmpty(), text)!;
  const align =
    parsed.naturalHorizontalAlignment === HorizontalAlignment.LEFT
      ? 'left'
      : parsed.naturalHorizontalAlignment === HorizontalAlignment.RIGHT
        ? 'right'
        : 'center';
  return { lines: parsed.lines, align };
}
