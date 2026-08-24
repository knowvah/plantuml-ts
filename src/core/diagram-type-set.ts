/**
 * Faithful port of `net.sourceforge.plantuml.core.DiagramType`'s start-tag
 * candidate set — `findStartTypes` only. Upstream decides which factories
 * are even eligible for a source from its `@start` line alone; T3 attempts
 * the parse among the returned candidates.
 *
 * This is the finding that resized the whole `dispatch-by-parse-attempt`
 * mission: only `@startuml` yields more than one candidate (the 10-member
 * set at `DiagramType.java:198-201`). Every other tag maps to a singleton,
 * so for those the "parse attempt" this mission builds is a no-op dispatch.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramType.java
 */

// ---------------------------------------------------------------------------
// DiagramType — upstream's enum, verbatim (`DiagramType.java:45-47`)
// ---------------------------------------------------------------------------

/**
 * Upstream's full `DiagramType` enum, preserved in full including members
 * this port has no engine for (`DEFINITION`, `CHEN_EER`, `CRASH`, `JCCKIT`,
 * `BPM`, `NWDIAG`, `WIRE`, `EBNF`, `REGEX`, `GIT`, `MATH`, `LATEX`, `CREOLE`,
 * `FLOW`, `DITAA`). The enum is the spec; a missing engine is this port's
 * gap, not a reason to trim the set (D5, `decisions.md#d5`).
 *
 * Wider than this port's per-diagram plugin `DiagramType` string union
 * (`block-extractor.ts`) — a *distinct* type of the same name in a distinct
 * module. Consumers map between the two; this module does not narrow.
 *
 * @see DiagramType.java:45-47
 */
export const DiagramType = {
  SEQUENCE: 'SEQUENCE',
  STATE: 'STATE',
  CLASS: 'CLASS',
  OBJECT: 'OBJECT',
  ACTIVITY: 'ACTIVITY',
  DESCRIPTION: 'DESCRIPTION',
  COMPOSITE: 'COMPOSITE',
  TIMING: 'TIMING',
  HELP: 'HELP',
  BPM: 'BPM',
  DITAA: 'DITAA',
  DOT: 'DOT',
  JCCKIT: 'JCCKIT',
  SALT: 'SALT',
  FLOW: 'FLOW',
  CREOLE: 'CREOLE',
  MATH: 'MATH',
  LATEX: 'LATEX',
  DEFINITION: 'DEFINITION',
  GANTT: 'GANTT',
  CHRONOLOGY: 'CHRONOLOGY',
  NWDIAG: 'NWDIAG',
  MINDMAP: 'MINDMAP',
  WBS: 'WBS',
  WIRE: 'WIRE',
  JSON: 'JSON',
  GIT: 'GIT',
  BOARD: 'BOARD',
  YAML: 'YAML',
  HCL: 'HCL',
  EBNF: 'EBNF',
  REGEX: 'REGEX',
  FILES: 'FILES',
  CHEN_EER: 'CHEN_EER',
  CHART: 'CHART',
  PACKET: 'PACKET',
  SPRITES: 'SPRITES',
  CRASH: 'CRASH',
  UNKNOWN: 'UNKNOWN',
} as const;

export type DiagramType = (typeof DiagramType)[keyof typeof DiagramType];

// ---------------------------------------------------------------------------
// The flattened `getTypes` switch (`DiagramType.java:94-218`)
// ---------------------------------------------------------------------------

interface TagEntry {
  readonly key: string;
  readonly types: readonly DiagramType[];
}

/**
 * `getTypes`'s per-first-character switch (`DiagramType.java:94-218`),
 * flattened to one ordered list. Upstream dispatches on `text.charAt(p)`
 * before checking any key, but every `key` here embeds its own leading
 * character, so a key from another group can never match regardless of
 * flattening — `check` below fails on the first character. Order is
 * preserved top-to-bottom exactly as declared in the Java switch, so
 * first-match-wins ties (there are none today) would break identically.
 * Split out of `findStartTypes`/`getTypes` to stay under the repo's
 * cyclomatic-complexity hook, not as a refactor of upstream's semantics.
 */
const TAG_ENTRIES: readonly TagEntry[] = [
  { key: 'bpm', types: [DiagramType.BPM] }, // :98-99
  { key: 'board', types: [DiagramType.BOARD] }, // :100-101
  { key: 'chart', types: [DiagramType.CHART] }, // :105-106
  { key: 'creole', types: [DiagramType.CREOLE] }, // :107-108
  { key: 'chronology', types: [DiagramType.CHRONOLOGY] }, // :109-110
  { key: 'chen', types: [DiagramType.CHEN_EER] }, // :111-112
  { key: 'crash', types: [DiagramType.CRASH] }, // :113-114
  { key: 'dot', types: [DiagramType.DOT] }, // :118-119
  { key: 'ditaa', types: [DiagramType.DITAA] }, // :121-122
  { key: 'def', types: [DiagramType.DEFINITION] }, // :124-125
  { key: 'ebnf', types: [DiagramType.EBNF] }, // :129-130
  { key: 'flow', types: [DiagramType.FLOW] }, // :134-135
  { key: 'files', types: [DiagramType.FILES] }, // :136-137
  { key: 'gantt', types: [DiagramType.GANTT] }, // :141-142
  { key: 'git', types: [DiagramType.GIT] }, // :143-144
  { key: 'hcl', types: [DiagramType.HCL] }, // :148-149
  { key: 'jcckit', types: [DiagramType.JCCKIT] }, // :154-155
  { key: 'json', types: [DiagramType.JSON] }, // :157-158
  { key: 'latex', types: [DiagramType.LATEX] }, // :162-163
  { key: 'math', types: [DiagramType.MATH] }, // :167-168
  { key: 'mindmap', types: [DiagramType.MINDMAP] }, // :169-170
  { key: 'nwdiag', types: [DiagramType.NWDIAG] }, // :174-175
  { key: 'project', types: [DiagramType.GANTT] }, // :179-180 (alias)
  { key: 'packetdiag', types: [DiagramType.PACKET] }, // :181-182
  { key: 'regex', types: [DiagramType.REGEX] }, // :186-187
  { key: 'salt', types: [DiagramType.SALT] }, // :191-192
  { key: 'sprites', types: [DiagramType.SPRITES] }, // :193-194
  {
    key: 'uml', // :198-200
    types: [
      DiagramType.SEQUENCE,
      DiagramType.STATE,
      DiagramType.CLASS,
      DiagramType.OBJECT,
      DiagramType.ACTIVITY,
      DiagramType.DESCRIPTION,
      DiagramType.COMPOSITE,
      DiagramType.TIMING,
      DiagramType.HELP,
      DiagramType.SPRITES,
    ],
  },
  { key: 'wire', types: [DiagramType.WIRE] }, // :204-205
  { key: 'wbs', types: [DiagramType.WBS] }, // :206-207
  { key: 'yaml', types: [DiagramType.YAML] }, // :211-212
];

/** Reused empty instance, mirroring upstream's `static final EMPTY` (`:49`). */
const EMPTY: ReadonlySet<DiagramType> = new Set();

/**
 * Case-insensitive prefix match: does `text` contain `key` starting at `p`?
 * @see DiagramType.java:220-232 (`check`)
 */
function check(key: string, text: string, p: number): boolean {
  if (p + key.length > text.length) return false;
  for (let i = 0; i < key.length; i++) {
    if (text.charAt(p + i).toLowerCase() !== key.charAt(i)) return false;
  }
  return true;
}

/**
 * Dispatch on the character following `@start`/`\start`. Every case in
 * upstream's switch that matches no key falls through to `EnumSet.of(UNKNOWN)`
 * — including the `default:` case for a first character not among
 * `bcdefghjlmnprsuwy` (`:215-216`) — so a flat "first match wins, else
 * UNKNOWN" list (`TAG_ENTRIES` above) is equivalent for every input.
 * @see DiagramType.java:94-218 (`getTypes`)
 */
function getTypes(text: string, p: number): ReadonlySet<DiagramType> {
  for (const entry of TAG_ENTRIES) {
    if (check(entry.key, text, p)) return new Set(entry.types);
  }
  return new Set([DiagramType.UNKNOWN]);
}

// Java's `Character.isWhitespace` and JS's `\s` disagree on a handful of
// Unicode separators (e.g. non-breaking space), but agree on the ASCII
// space/tab/newline/CR that every real `@start` line uses.
// @see DiagramType.java:73-74
const WHITESPACE_PATTERN = /\s/;

/**
 * The start-tag candidate set for a diagram's first line: skip leading
 * whitespace, require `@` or `\`, require `start`, then dispatch on the
 * character that follows. Returns the empty set for a line that is not a
 * start directive at all — distinct from `{UNKNOWN}`, which is an
 * unrecognised tag after a valid `@start`/`\start` prefix.
 *
 * `DiagramType` here is upstream's full enum, wider than this port's
 * per-plugin type union — callers map between them; this function does not
 * narrow.
 *
 * @see DiagramType.java:69-92 (`findStartTypes`)
 */
export function findStartTypes(firstLine: string): ReadonlySet<DiagramType> {
  for (let i = 0; i < firstLine.length; i++) {
    const c = firstLine.charAt(i);
    if (WHITESPACE_PATTERN.test(c)) continue; // :73-74

    if (c !== '@' && c !== '\\') return EMPTY; // :76-77

    const pos = i + 1;
    if (firstLine.length - pos < 5 || !check('start', firstLine, pos)) {
      return EMPTY; // :81-82
    }

    const p = pos + 5;
    if (p >= firstLine.length) return EMPTY; // :85-86

    return getTypes(firstLine, p); // :88
  }

  return EMPTY; // :91 (empty/all-whitespace text)
}
