/**
 * `\t` inside a drawn cell — tab-stop expansion, ported from
 * `AtomText` (`klimt/creole/legacy/AtomText.java`).
 *
 * A tab is not a glyph with a width. `AtomText` tokenizes its text on `\t`
 * (`StringTokenizer(text, "\t…", true)` — delimiters returned) and, for a tab
 * token, ADVANCES x to the next multiple of a tab stop while drawing nothing.
 * Two consequences this port had wrong, both visible in
 * `json/nujuke-14-nabo073`:
 *
 *  - **width**: a line containing a tab is measured by that walk
 *    (`AtomText#getWidth`, :241-256), not by handing the raw string to the
 *    bounder — which would give the tab its table width;
 *  - **emission**: a line whose text is EXACTLY `"\t"` draws no `<text>` at
 *    all, because `drawU` (:210-234) only emits for non-tab tokens. That is
 *    the element this port had 11 of against the jar's 10.
 *
 * ## Why the stop is 56px and not the width of eight spaces
 *
 * `getTabSize` measures {@link tabString} and falls back when that measures
 * zero:
 *
 * ```java
 * final double width = stringBounder.calculateDimension(font, tabString()).getWidth();
 * if (width == 0)
 *     return fontConfiguration.getFont().getSize2D() * 4;
 * return width;
 * ```
 *
 * Under the deterministic width table a SPACE is 0 wide
 * (`UnicodeFontWidthSansSerif` block 0, cp 0x20 → 0), so `tabString()` — which
 * is only ever spaces — measures 0 and the guard always fires. The stop is
 * therefore `fontSize * 4`: 56 at the default 14. That is the whole of
 * `nujuke`'s otherwise unexplained 66px node (56 + the 5+5 cell margin), and
 * it is a branch that fires ONLY under deterministic metrics — a real font
 * gives a space non-zero width and takes the other path. No measurement of
 * rendered output could have revealed it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java#getTabSize
 */

/** `AtomText#tabString` — `skinparam tabSize` spaces, clamped to upstream's
 *  own `nb >= 1 && nb < 7` window, else eight. */
export function tabString(tabSize: number | undefined): string {
  const nb = tabSize ?? DEFAULT_TAB_SIZE;
  return nb >= 1 && nb < 7 ? '        '.slice(0, nb) : '        ';
}

/** `SkinParam#getTabSize()` — `getAsInt("tabsize", 8)`. */
const DEFAULT_TAB_SIZE = 8;

/** `AtomText#getTabSize`'s zero-width fallback multiplier. */
const FALLBACK_STOPS_PER_EM = 4;

/**
 * The tab stop in pixels: the measured width of {@link tabString}, or
 * `fontSize * 4` when that measures zero (which it always does under the
 * deterministic table, since a space is 0 wide there).
 */
export function tabStopWidth(
  measure: (s: string) => number,
  fontSize: number,
  tabSize: number | undefined,
): number {
  const width = measure(tabString(tabSize));
  return width === 0 ? fontSize * FALLBACK_STOPS_PER_EM : width;
}

/** One token from `StringTokenizer(text, "\t", true)` — delimiters included. */
export interface TabToken {
  readonly text: string;
  readonly isTab: boolean;
}

/**
 * Split on tabs, KEEPING the tabs as their own tokens, and dropping empty
 * runs — `StringTokenizer` never yields an empty token, which matters for a
 * text that starts or ends with a tab.
 */
export function splitOnTabs(text: string): TabToken[] {
  const out: TabToken[] = [];
  for (const piece of text.split('\t')) {
    if (piece !== '') out.push({ text: piece, isTab: false });
    out.push({ text: '\t', isTab: true });
  }
  out.pop(); // one trailing separator too many
  return out;
}

/** Whether {@link tabAwareWidth} / {@link walkTabs} need to run at all. */
export function hasTab(text: string): boolean {
  return text.includes('\t');
}

/**
 * `AtomText#getWidth` — walk the tokens, advancing to the next stop on a tab
 * and by the measured width otherwise.
 */
export function tabAwareWidth(
  text: string,
  measure: (s: string) => number,
  tabStop: number,
): number {
  let x = 0;
  for (const token of splitOnTabs(text)) {
    x = token.isTab ? x + tabStop - (x % tabStop) : x + measure(token.text);
  }
  return x;
}

/** A drawn run and where it sits — tabs contribute position, never a run. */
export interface TabRun {
  readonly text: string;
  readonly dx: number;
}

/**
 * `AtomText#drawU`'s emission order: a run per non-tab token at its advanced
 * x, and NOTHING for a tab. A text of only tabs yields an empty array, which
 * is how the jar draws no `<text>` for `json/nujuke`'s `\t` row.
 */
export function walkTabs(
  text: string,
  measure: (s: string) => number,
  tabStop: number,
  startDx = 0,
): TabRun[] {
  const runs: TabRun[] = [];
  let x = startDx;
  for (const token of splitOnTabs(text)) {
    if (token.isTab) {
      x += tabStop - (x % tabStop);
      continue;
    }
    runs.push({ text: token.text, dx: x });
    x += measure(token.text);
  }
  return runs;
}
