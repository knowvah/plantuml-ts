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
 * ## The stop is the measured width of eight spaces; `fontSize * 4` is the zero fallback
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
 * `tabString()` is only ever spaces. The upstream width table gives a SPACE
 * width 0 (`UnicodeFontWidthSansSerif` block 0, cp 0x20 -> 0), which made the
 * guard always fire under deterministic metrics: `fontSize * 4`, 56 at the
 * default 14 — the whole of `nujuke`'s once-unexplained 66px node (56 + the
 * 5+5 cell margin). The oracle's seam #4 and `DeterministicMeasurer` now give
 * a space 44 tenths of a 16 pt em (the width of `!` and U+00A0 in the same
 * table), so eight spaces measure `8 * 4.4 * size / 16` and the guard does
 * not fire; the 56 was an artefact of the zero-wide space, the same branch a
 * real font never takes. This code is unchanged: it measures, and falls back
 * only on 0.
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
 * `fontSize * 4` when that measures zero (not the case for
 * `DeterministicMeasurer`, whose space is non-zero).
 */
export function tabStopWidth(measure: (s: string) => number, fontSize: number, tabSize: number | undefined): number {
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
export function tabAwareWidth(text: string, measure: (s: string) => number, tabStop: number): number {
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
export function walkTabs(text: string, measure: (s: string) => number, tabStop: number, startDx = 0): TabRun[] {
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
