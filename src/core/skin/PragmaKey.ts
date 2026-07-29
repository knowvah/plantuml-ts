/**
 * PragmaKey — the fixed set of `!pragma <key> <value>` keys `Pragma`
 * stores. A few carry a non-null default value (`SVEK_TRACE`/`TEOZ` ->
 * `"true"`), applied by `Pragma#define` when a pragma is declared with no
 * explicit value (`!pragma teoz` with nothing after the key).
 *
 * Upstream: skin/PragmaKey.java (a Java `enum` with a per-member optional
 * `defaultValue` constructor arg). Ported in full: every enum member, the
 * `getDefaultValue()`/`simplify(String)`/`lazyFrom(String)` trio.
 *
 * As-const object, not a TS `enum` (project convention — safer across
 * declaration-file boundaries than `const enum`, see code-principles).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/PragmaKey.java
 */
export const PragmaKey = {
  // Temporary pragma
  SEQUENCE_MESSAGE_SPAN: 'SEQUENCE_MESSAGE_SPAN',

  // For debug
  EMULATE_NO_GRAPHVIZ_INSTALLATION: 'EMULATE_NO_GRAPHVIZ_INSTALLATION',
  EMULATE_GRAPHVIZ_CRASH: 'EMULATE_GRAPHVIZ_CRASH',
  EMULATE_GRAPHVIZ_244_ON_WINDOWS: 'EMULATE_GRAPHVIZ_244_ON_WINDOWS',

  ASPECT: 'ASPECT',
  COMPACT: 'COMPACT',
  DEFAULT_LABEL_ANGLE: 'DEFAULT_LABEL_ANGLE',
  DEFAULT_LABEL_DISTANCE: 'DEFAULT_LABEL_DISTANCE',
  EDGE_CORNER_RADIUS: 'EDGE_CORNER_RADIUS',
  GRAPH_ATTRIBUTES: 'GRAPH_ATTRIBUTES',
  HORIZONTAL_LINE_BETWEEN_DIFFERENT_PACKAGE_ALLOWED: 'HORIZONTAL_LINE_BETWEEN_DIFFERENT_PACKAGE_ALLOWED',
  KERMOR: 'KERMOR',
  LABEL_ANGLE: 'LABEL_ANGLE',
  LABEL_DISTANCE: 'LABEL_DISTANCE',
  RATIO: 'RATIO',
  SHOW_DEPRECATION: 'SHOW_DEPRECATION',
  SVG_FONT: 'SVG_FONT',
  SVG_INTERACTIVE: 'SVG_INTERACTIVE',
  SVG_PARSER: 'SVG_PARSER',
  SVEK_TRACE: 'SVEK_TRACE',
  TEOZ: 'TEOZ',
  TEX_SYSTEM: 'TEX_SYSTEM',
  TEX_PREAMBLE: 'TEX_PREAMBLE',
  USE_INTERMEDIATE_PACKAGES: 'USE_INTERMEDIATE_PACKAGES',
  USE_VERTICAL_IF: 'USE_VERTICAL_IF',
} as const;

export type PragmaKey = (typeof PragmaKey)[keyof typeof PragmaKey];

/** java:63,65-67: only `SVEK_TRACE`/`TEOZ` carry a non-null default
 *  (`"true"`); every other member's default is `null`. */
const DEFAULT_VALUES: Partial<Record<PragmaKey, string>> = {
  SVEK_TRACE: 'true',
  TEOZ: 'true',
};

/** Upstream: `PragmaKey#getDefaultValue()`. */
export function pragmaKeyDefaultValue(key: PragmaKey): string | null {
  return DEFAULT_VALUES[key] ?? null;
}

/** Upstream: `PragmaKey#simplify(String)` (java:85-93) — keeps only ASCII
 *  letters, lowercased, dropping digits/underscores/punctuation. */
function simplify(s: string): string {
  let result = '';
  for (const c of s) {
    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
      result += c.toLowerCase();
    }
  }
  return result;
}

/** Upstream: `PragmaKey#lazyFrom(String)` (java:95-100) — matches `s`
 *  against every member's OWN name (not the value string) under
 *  {@link simplify}, so `"tex-system"`/`"TexSystem"`/`"tex_system"` all
 *  resolve to `TEX_SYSTEM`. `null` when no member matches. */
export function pragmaKeyLazyFrom(s: string): PragmaKey | null {
  const target = simplify(s);
  for (const key of Object.values(PragmaKey)) {
    if (simplify(key) === target) return key;
  }
  return null;
}
