/**
 * class-member-creole-render-text.ts — the DRAWN-text side of
 * `DriverTextSvg.java:112-125`'s two RENDER-time-only branches, plus the
 * TAB-STOP expansion `AtomText.java:210-256` applies to a member row's
 * `'text'` atom before any of that. Split out of `class-member-creole.ts`
 * purely to keep that file under this project's 500-line cap (A4 2a / T26).
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/DriverTextSvg.java:112-125
 * @see ~/git/plantuml/.../StringUtils.java:505-534 (`trin`)
 * @see ~/git/plantuml/.../klimt/creole/legacy/AtomText.java:210-256
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ResolvedMemberAtom } from './class-member-atom-resolve.js';
import { mutedAtomFontSpec } from './class-member-creole-sea.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
import {
  hasTabulation,
  tabStopWidth,
  advanceToTabStop,
  tokenizeOnTabs,
  TAB_STRING,
} from '../../core/klimt/creole/legacy/AtomText.js';
import type { CreoleAtomUrl } from '../../core/klimt/creole/atom/Atom.js';

/** `StringUtils#trin` (java `StringUtils.java:505-534`): trims every char
 *  `<= ' '` (ASCII 32 -- space, tab, newline, ...) from BOTH ends, unlike
 *  JS's own `trim()` which uses Unicode whitespace. `DriverTextSvg.java
 *  :125` calls this UNCONDITIONALLY on every non-whitespace-only drawn run,
 *  after the leading-space strip below -- a no-op (returns `arg` itself,
 *  matching upstream's own `start === 0 && end === len - 1` fast path) for
 *  the common case of a run with no incidental leading/trailing whitespace. */
function trin(s: string): string {
  let start = 0;
  let end = s.length - 1;
  while (start <= end) {
    if (s.charCodeAt(start) <= 32) {
      start++;
      continue;
    }
    if (s.charCodeAt(end) <= 32) {
      end--;
      continue;
    }
    break;
  }
  return start > end ? '' : s.slice(start, end + 1);
}

/**
 * A4 2a: `DriverTextSvg.java:118-125`'s MIXED-content branch (a run with
 * SOME non-whitespace content that starts with one or more literal space
 * characters) -- distinct from the whitespace-ONLY NBSP branch
 * (`textRenderOverride`, mutually exclusive there: the jar's own
 * `text.matches("^\\s*$")` check runs first and short-circuits). Upstream
 * strips each leading `' '` one at a time, advancing its own local `x` by
 * that char's measured width each time (`x += space`) -- NOT ported here as
 * a positional adjustment: this port's width table reports a bare space as
 * 0-wide (`SANS_SERIF_BLOCKS[0][32]`, `MemberRenderAtom`'s own doc
 * comment), so upstream's `x += space` is a no-op under the SAME table this
 * port's `StringMeasurer`s use, and `atom.width` (the RAW/layout
 * measurement, unchanged) already reflects that -- `resolveOneAtom`'s
 * caller advances the row's `x` cursor by `atom.width`, never by this
 * function's output. Finally mirrors upstream's own unconditional trailing
 * `trin` (`:125`), which also fires for a run with no leading space at all.
 */
function stripLeadingSpacesAndTrin(text: string): string {
  let t = text;
  while (t.startsWith(' ')) t = t.slice(1);
  return trin(t);
}

/**
 * `DriverTextSvg.java:112-125`'s per-atom RENDER-time text override --
 * NBSP substitution for a whitespace-ONLY atom (`:115-116`), else the
 * leading-space-strip + trailing `trin` for a MIXED atom (`:118-125`).
 * `undefined` when the drawn text is byte-identical to `text` (the common
 * case), matching this file's own "renderText only set when it differs"
 * convention.
 *
 * Guarded off a raw `\t`: a tab-bearing atom is handled ENTIRELY by
 * {@link resolveTabbedTextRuns} (this function is called per SPLIT token
 * there, each of which is tab-free by construction) or, for a caller that
 * doesn't opt into tab expansion, is `class-object-member-creole.ts#
 * buildObjectMemberRow`'s own OWN atom to re-tokenize downstream (its
 * SKINPARAM-tabSize-aware pass) -- see that module's doc comment. A
 * `renderText` computed here on the WHOLE untokenized blob would leak,
 * unchanged, onto every one of ITS OWN per-token results (spread via
 * `{ ...atom, text: token, width }`) once this branch fired on a leading
 * tab char (`trin` strips `\t` same as space, ASCII <= 32) --
 * `object/nufoju-44-dabi767`'s ratchet caught exactly this: two
 * "field5\tfield6" runs, both re-measured as one.
 */
export function textRenderOverride(text: string): string | undefined {
  const isWhitespaceOnly = text.length > 0 && /^\s*$/.test(text);
  if (isWhitespaceOnly) return text.split(' ').join(' ');
  if (text.includes('\t')) return undefined;
  const stripped = stripLeadingSpacesAndTrin(text);
  return stripped !== text ? stripped : undefined;
}

/** One non-tab token's resolved run, before {@link resolveTabbedTextRuns}
 *  folds the FOLLOWING tab-stop gap (if any) into its `width`. */
interface TabTokenRun {
  readonly text: string;
  readonly startX: number;
}

/**
 * T26 (gekope-01-ricu859): `AtomText#getWidth`/`#drawU`'s tab-stop walk
 * (java:210-256) -- a `'text'` atom whose raw text carries a tab (or the
 * `Jaws.BLOCK_E1_REAL_TABULATION` sentinel, `hasTabulation`'s own doc
 * comment) draws as MULTIPLE `<text>` runs, one per non-tab token, each
 * advancing `x` to the token's own measured width and each tab advancing
 * `x` to the NEXT tab-stop boundary with NO drawn run of its own.
 *
 * This port's renderer (`renderer-classifier-rows.ts#renderRowAtoms`) has
 * no notion of an atom's own absolute `x` -- it advances a running cursor
 * by each atom's `width` in array order. A tab's gap is therefore folded
 * into the PRECEDING token's own `width` (the LAYOUT/x-advance value,
 * already established as the field renderers never draw FROM -- see
 * `MemberRenderAtom.width`'s own doc comment) while `renderWidth`
 * (`textLength`) stays that token's own NATURAL measured width, so the
 * glyph itself draws compact rather than stretched across the gap -- the
 * SAME `width` vs `renderWidth` split this file already uses for the
 * whitespace-only NBSP run.
 *
 * Returns `undefined` for a tab-free atom (the overwhelming common case,
 * byte-identical to the pre-T26 single-atom path) so callers can fall back
 * to their existing per-atom resolution unchanged.
 */
export function resolveTabbedTextRuns(
  text: string,
  font: FontConfiguration,
  url: CreoleAtomUrl | undefined,
  measurer: StringMeasurer,
): readonly ResolvedMemberAtom[] | undefined {
  if (!hasTabulation(text)) return undefined;
  const spec = mutedAtomFontSpec(font);
  const measure = (s: string): number => measurer.measure(s, spec).width;
  const tabStop = tabStopWidth(measure(TAB_STRING), spec.size);
  const runs: TabTokenRun[] = [];
  let x = 0;
  for (const token of tokenizeOnTabs(text)) {
    if (token.isTab) {
      x = advanceToTabStop(x, tabStop);
      continue;
    }
    runs.push({ text: token.text, startX: x });
    x += measure(token.text);
  }
  return runs.map((run, i) => {
    const outerWidth = i < runs.length - 1 ? runs[i + 1]!.startX - run.startX : measure(run.text);
    const override = textRenderOverride(run.text);
    const drawnText = override ?? run.text;
    // A non-LAST run's `width` (the outer x-advance) folds in the gap to the
    // NEXT tab stop -- its own glyph must still draw at its natural width,
    // never stretched across that gap, so `renderWidth`/`renderText` are
    // forced here whenever `outerWidth` differs from the run's own natural
    // measured width, not only when {@link textRenderOverride} itself fires
    // (the bare no-tab per-atom path's own, narrower condition).
    const naturalWidth = measure(drawnText);
    const needsRenderFields = override !== undefined || outerWidth !== naturalWidth;
    return {
      atom: {
        kind: 'text' as const,
        text: run.text,
        font,
        width: outerWidth,
        ...(needsRenderFields ? { renderText: drawnText, renderWidth: naturalWidth } : {}),
        ...(url !== undefined ? { url } : {}),
      },
      width: outerWidth,
      lineHeight: atomTextLineHeight(spec.size),
    };
  });
}
