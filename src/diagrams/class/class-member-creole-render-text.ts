/**
 * class-member-creole-render-text.ts — the DRAWN-text side of
 * `DriverTextSvg.java:113-126`'s RENDER-time-only preamble, plus the
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
import { driverTextPlacement } from '../../core/svg-text-font.js';

/**
 * `DriverTextSvg.java:113-126`'s per-atom RENDER-time text, whole: NBSP for a
 * whitespace-only run (`:115-116`), each leading `' '` removed with `x +=
 * space` (`:118-124`, `space` = `calculateDimension(font, " ")`), then the
 * unconditional `StringUtils.trin` (`:125`) and a SECOND measurement of what is
 * left (`:126`) -- the drawn `textLength`. The atom's own layout `width` stays
 * the RAW run (`AtomText.java:222-231`), so a leading space costs layout
 * advance but draws shifted: {@link TextRenderFields.renderDx}. Delegates the
 * string steps to the shared `driverTextPlacement`.
 *
 * `undefined` when the drawn text is byte-identical to `text` (the common
 * case), matching this file's "render fields only set when they differ"
 * convention. Guarded off a raw `\t`: a tab-bearing atom is handled ENTIRELY by
 * {@link resolveTabbedTextRuns} (this is called per SPLIT token there, each
 * tab-free by construction) or by `class-object-member-creole.ts#
 * buildObjectMemberRow`'s own tab-size-aware re-tokenizing pass, which a
 * `renderText` computed on the whole blob would leak into
 * (`object/nufoju-44-dabi767`).
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/DriverTextSvg.java:113-126
 * @see ~/git/plantuml/.../StringUtils.java:505-534 (`trin`)
 */
export interface TextRenderFields {
  readonly renderText: string;
  readonly renderWidth: number;
  /** One space width per leading space; absent when 0. */
  readonly renderDx?: number;
}

export function textRenderFields(text: string, measure: (s: string) => number): TextRenderFields | undefined {
  if (text.length === 0 || (text.includes('\t') && !/^\s*$/.test(text))) return undefined;
  const placed = driverTextPlacement(text, text.startsWith(' ') ? measure(' ') : 0);
  if (placed.text === text) return undefined;
  return {
    renderText: placed.text,
    renderWidth: measure(placed.text),
    ...(placed.dx !== 0 ? { renderDx: placed.dx } : {}),
  };
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
    const fields = textRenderFields(run.text, measure);
    const drawnText = fields?.renderText ?? run.text;
    // A non-LAST run's `width` (the outer x-advance) folds in the gap to the
    // NEXT tab stop -- its own glyph must still draw at its natural width,
    // never stretched across that gap, so `renderWidth`/`renderText` are
    // forced here whenever `outerWidth` differs from the run's own natural
    // measured width, not only when {@link textRenderOverride} itself fires
    // (the bare no-tab per-atom path's own, narrower condition).
    const naturalWidth = fields?.renderWidth ?? measure(drawnText);
    const needsRenderFields = fields !== undefined || outerWidth !== naturalWidth;
    return {
      atom: {
        kind: 'text' as const,
        text: run.text,
        font,
        width: outerWidth,
        ...(needsRenderFields ? { renderText: drawnText, renderWidth: naturalWidth } : {}),
        ...(fields?.renderDx !== undefined ? { renderDx: fields.renderDx } : {}),
        ...(url !== undefined ? { url } : {}),
      },
      width: outerWidth,
      lineHeight: atomTextLineHeight(spec.size),
    };
  });
}
