/**
 * Port of upstream's `StyleExtractor` -- the json family's ONLY directive
 * handling. `@startjson`, `@startyaml` and `@starthcl` have no command table:
 * each factory hands `source.iterator2()` (the block's whole `UmlSource`,
 * `@start`/`@end` included) to this class and parses whatever it leaves in
 * {@link StyleExtractor.list} as payload.
 *
 * The consequences this port used to diverge from, all jar-verified
 * (`tests/fixtures/unwind-U1/`):
 *  - only `title ` is a chrome directive; `caption`/`legend`/`header`/
 *    `footer`/`mainframe`/`sprite` lines are PAYLOAD (a json/yaml block then
 *    fails to parse; hcl folds them into a module name);
 *  - every directive is recognised only while `list.size() <= 1`, i.e. before
 *    the first payload line -- one after it is payload too;
 *  - `skinparam` is read for exactly one fact, `handwritten`; every other key
 *    (and a whole `skinparam X { ... }` block) is dropped.
 *
 * `<style>` blocks are skipped here and NOT collected: this port's
 * preprocessor collector already extracts every `<style>` block for the theme
 * pipeline, which is what `applyStyles` (`StyleExtractor.java:114-138`) feeds.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/StyleExtractor.java:54-156
 */

/** What upstream's `StyleExtractor` exposes after construction. */
export interface StyleExtractor {
  /** `StyleExtractor#list` -- every non-directive, non-blank line, untrimmed,
   *  in order. Its first entry is the `@start` line and its last the `@end`
   *  line, which each factory skips (`it.next()` / `it.hasNext() == false`). */
  readonly list: readonly string[];
  /** `StyleExtractor#title`: the text after `title `, trimmed, unparsed. */
  readonly title: string | undefined;
  /** `StyleExtractor#handwritten`. */
  readonly handwritten: boolean;
  /** `StyleExtractor#scale`: the whole trimmed `scale ...` line. */
  readonly scale: string | undefined;
  /** `StyleExtractor#newSkin`: the text after `skin `, trimmed. */
  readonly newSkin: string | undefined;
}

interface MutableExtractor {
  list: string[];
  title: string | undefined;
  handwritten: boolean;
  scale: string | undefined;
  newSkin: string | undefined;
}

const STYLE_START = '<style>';
const STYLE_END = '</style>';
const SKINPARAM_PREFIX = 'skinparam ';
const BLOCK_CLOSE = '}';
/** A block's wrapper lines, as the block extractor matches them (any case). */
const RE_START = /^\s*@start/i;
const RE_END = /^\s*@end/i;

/**
 * Advances past a multi-line block the way upstream's two inner loops do:
 * `line` starts at the opener, each turn tests `line` against `close` and
 * otherwise reads the next line, so the closer itself is consumed and an
 * unclosed block swallows the rest of the source.
 * @see StyleExtractor.java:70-75 (`<style>`), :91-97 (`skinparam ... {`)
 * @returns the index of the first line NOT consumed.
 */
function skipBlock(data: readonly string[], opener: number, close: string): number {
  let line = data[opener]!;
  let next = opener + 1;
  while (next < data.length) {
    if (line.trim() === close) break;
    line = data[next]!;
    next++;
  }
  return next;
}

/**
 * The `else if` chain at `StyleExtractor.java:76-97`, minus its shared
 * `list.size() <= 1` guard (the caller's). Returns false when `s` is not a
 * directive, i.e. when it falls through to `list.add` (:98-99).
 */
function applyDirective(s: string, state: MutableExtractor): boolean {
  if (s.startsWith('!assume ') || s.startsWith('!pragma ') || s.startsWith('hide ')) return true;
  if (s.startsWith('scale ')) {
    state.scale = s;
    return true;
  }
  if (s.startsWith('title ')) {
    state.title = s.substring('title '.length).trim();
    return true;
  }
  if (s.startsWith('skin ')) {
    state.newSkin = s.substring('skin '.length).trim();
    return true;
  }
  if (!s.startsWith(SKINPARAM_PREFIX)) return false;
  if (s.includes('handwritten') && s.includes('true')) state.handwritten = true;
  return true;
}

/**
 * `new StyleExtractor(source.iterator2())`.
 * @see StyleExtractor.java:63-103
 */
export function extractStyle(data: readonly string[]): StyleExtractor {
  const state: MutableExtractor = {
    list: [],
    title: undefined,
    handwritten: false,
    scale: undefined,
    newSkin: undefined,
  };
  let i = 0;
  while (i < data.length) {
    const line = data[i]!;
    const s = line.trim();
    if (s.length === 0) i++;
    else if (s === STYLE_START) i = skipBlock(data, i, STYLE_END);
    else if (state.list.length <= 1 && applyDirective(s, state)) {
      i = s.startsWith(SKINPARAM_PREFIX) && s.includes('{') ? skipBlock(data, i, BLOCK_CLOSE) : i + 1;
    } else {
      state.list.push(line);
      i++;
    }
  }
  return state;
}

/**
 * The payload lines a factory reads: `list` minus its first entry (`it.next()`)
 * and its last (the loop breaks when `it.hasNext() == false`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagramFactory.java:76-81
 */
export function payloadOf(extractor: StyleExtractor): readonly string[] {
  return extractor.list.slice(1, -1);
}

/**
 * The lines upstream's `StyleExtractor` iterates: `UmlSource#iterator2()`, the
 * block's preprocessed source with `@start`/`@end` (`UmlSource.seedSourceLines`,
 * populated by `index.ts#umlSourceOfBlock`). A hand-built `UmlSource` carries
 * only the interior `lines`, so the missing wrapper lines are restored --
 * without them {@link payloadOf} would drop real payload.
 */
export function upstreamSourceLines(
  source: { readonly lines: readonly string[]; readonly seedSourceLines?: readonly string[] },
  type: string,
): readonly string[] {
  if (source.seedSourceLines !== undefined) return source.seedSourceLines;
  // Blank lines never reach `list` (StyleExtractor.java:67-68), so the
  // wrapper test reads the first/last NON-blank line.
  const nonBlank = source.lines.filter((l) => l.trim() !== '');
  const head = RE_START.test(nonBlank[0] ?? '') ? [] : [`@start${type}`];
  const tail = RE_END.test(nonBlank[nonBlank.length - 1] ?? '') ? [] : [`@end${type}`];
  return [...head, ...source.lines, ...tail];
}
