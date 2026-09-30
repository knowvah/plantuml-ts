/**
 * Per-line word-wrap for class-engine edge labels: `wrapPlainTextLine`, and
 * (cdd7 T2b) the multi-line main label's wrapped rows/anchors
 * (`wrappedLabelRows`, `multiLineLabelAnchorWrapped`) plus the shared
 * creole-shorthand strip they and the reservation run.
 *
 * Split out of `class-layout-edge-labels.ts` (2026-08-16, mission
 * `edge-label-box-backlog` T12b) purely to keep that file under this
 * project's 500-line cap WITHOUT trimming any upstream-citation comment --
 * this function is a standalone algorithm with no dependency on the
 * `Relationship`/edge-attrs functions that stayed behind, so this is a pure
 * move: no behavior differs from the original inline code. Precedent:
 * `core/klimt/creole/DisplayNewlines.ts`, split out of `Display.ts` for the
 * identical reason. `class-layout-edge-labels.ts` re-exports the symbol
 * here so no external import path changes.
 *
 * Mission `shared-seam-extraction` T1 retired this file's OTHER two
 * exports, `splitEdgeLabelLines`/`resolveLabelEscape` -- an independent
 * re-derivation of `Display#getWithNewlines`'s escape scan
 * (`klimt/creole/Display.java:262-346`) that `core/klimt/creole/
 * DisplayNewlines.ts#splitDisplayLines` already ports faithfully. Every
 * former caller now imports that adapter directly; `wrapPlainTextLine`
 * (below) is NOT a `Display` port (word-wrap is a Fission/`MaximumWidth`
 * concern, not a newline-escape concern) and stays here unchanged.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import { applyGuillemet, stripCreoleMarkup } from '../../core/edge-label-box.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import type { LabelAnchorContext } from './class-edge-label-anchor.js';

/**
 * G2 N65 item 35: word-wraps ONE already-`\\n`/`\\l`/`\\r`-split line
 * (`splitDisplayLines`'s own output, `core/klimt/creole/DisplayNewlines.ts`)
 * via the SAME Fission engine E2r built for description word-wrap
 * (`Fission.ts#getSplitted`) -- upstream mirror:
 * `EntityImageClassHeader.java:108`'s `Display#create8(..., styleHeader
 * .wrapWidth())` call runs `Fission#getSplitted` on EACH already-newline-
 * split `CharSequence` independently (`Display.getWithNewlines` splits
 * first, `create8` wraps each resulting line second -- the two mechanisms
 * compose, never interact). A classifier header carries no creole markup
 * today (item 48, unattempted -- a header's `**bold**`/`<color:>` runs
 * render as literal text, not interpreted), so this wraps a SINGLE
 * synthetic plain-text `CreoleAtom` per line rather than a real multi-atom
 * sequence -- `getSplitted`'s own word-boundary scan (`Neutron
 * .getNeutronTypeFromChar`) operates identically on a lone text atom either
 * way. `maxWidth<=0` (no `MaximumWidth` cascade in effect) short-circuits to
 * `[text]`, byte-identical to pre-item-35 behavior.
 */
export function wrapPlainTextLine(
  text: string,
  fontSpec: { readonly family: string; readonly size: number },
  maxWidth: number,
  measurer: StringMeasurer,
): readonly string[] {
  if (maxWidth <= 0) return [text];
  return splitPlainTextAtoms(text, fontSpec, maxWidth, measurer).map((line) => line.join(''));
}

/** {@link wrapPlainTextLine} before its per-line join: each physical line's
 *  atom texts -- `Fission#getSplitted` rebuilds every line from neutrons
 *  (`klimt/creole/Fission.java:63-101`), so a word and a space are separate
 *  atoms even on a line that did not break. `maxWidth<=0` = `[[text]]`
 *  (`Fission.java:65-66`, the whole stripe unchanged). */
export function splitPlainTextAtoms(
  text: string,
  fontSpec: { readonly family: string; readonly size: number },
  maxWidth: number,
  measurer: StringMeasurer,
): readonly (readonly string[])[] {
  if (maxWidth <= 0) return [[text]];
  const atom: CreoleAtom = {
    kind: 'text',
    text,
    font: { family: fontSpec.family, size: fontSpec.size, color: null, styles: new Set() },
  };
  const wrapped = getSplitted([atom], maxWidth, (a) =>
    a.kind === 'text' ? measurer.measure(a.text, fontSpec).width : 0,
  );
  return wrapped.map((lineAtoms) => lineAtoms.filter((a) => a.kind === 'text').map((a) => a.text));
}

/**
 * cdd7-T1b (xuloxo-85-vibu502): creole shorthand `stripCreoleMarkup`
 * (`core/edge-label-box.ts`) doesn't reach -- `**bold**`/`//italic//`
 * (`FontStyle.java:207-224`'s `getUbrexCreoleSyntax`), active even in
 * `CreoleMode.SIMPLE_LINE` (the edge-label mode, `SvekEdge.java:298-299`):
 * `CommandCreoleBuilder`'s constructor (`klimt/creole/legacy/
 * CommandCreoleBuilder.java`) adds BOLD's and ITALIC's creole form
 * UNCONDITIONALLY, unlike UNDERLINE's `__`, which is FULL-mode-only (this
 * port's `<U>` precedent, `rimeca-17-gice904`, stays on the XML-tag path
 * `stripCreoleMarkup` already handles). C4's `Rel(...)` template emits
 * `**Label**`/`//[Optional Technology]//` for xuloxo's relationship label.
 * Local to the class edge-label measure/anchor pair (not folded into the
 * SHARED `stripCreoleMarkup`) to avoid changing every other consumer
 * (state/sequence/description engines) for a class-edge-label-only need.
 * Non-greedy (`.*?`) and unclosed-safe: an unmatched `**`/`//` leaves the
 * text (and its own literal marker) untouched, matching `RegExp#test`/
 * `#replace` finding no pair to act on.
 */
const BOLD_MARK = /\*\*(.*?)\*\*/g;
const ITALIC_MARK = /\/\/(.*?)\/\//g;

export function stripCreoleShorthand(text: string): { text: string; bold: boolean; italic: boolean } {
  const bold = BOLD_MARK.test(text);
  BOLD_MARK.lastIndex = 0;
  const italic = ITALIC_MARK.test(text);
  ITALIC_MARK.lastIndex = 0;
  const stripped = text.replace(BOLD_MARK, '$1').replace(ITALIC_MARK, '$1');
  return { text: stripped, bold, italic };
}

/**
 * S-8 (cdd2-T7, vuresa-33-kumu160): `<b>...</b>` (creole BOLD), the same tag
 * family {@link stripCreoleMarkup} strips -- detected BEFORE stripping so a
 * per-line bold flag survives for {@link multiLineLabelAnchor}'s caller to
 * apply `font-weight="700"`. T1b (xuloxo-85-vibu502): {@link
 * stripCreoleShorthand} (`class-edge-label-measure.ts`) covers the SAME
 * BOLD, plus ITALIC, for `**`/`//` shorthand -- its own strip IS the
 * italic detector, so it is not re-implemented here.
 */
const BOLD_TAG_RE = /<\/?b(?::[^>]*|\s[^>]*)?>/i;

/** The stripped text plus per-line bold/italic flags of a `\\n`-split edge
 *  label -- the `stripCreoleShorthand` -> `applyGuillemet` ->
 *  `stripCreoleMarkup` -> `resolveTextEscapes` pipeline the DOT reservation
 *  (`class-edge-label-measure.ts#computeMeasuredLabelAttrs`) also runs, so
 *  ink and box cannot drift. Moved out of `class-edge-label-anchor.ts
 *  #multiLineLabelAnchor` (cdd7 T2b) for {@link multiLineLabelAnchorWrapped}. */
export function stripLabelLines(lines: readonly string[]): {
  stripped: string[];
  bold: boolean[];
  italic: boolean[];
} {
  const shorthand = lines.map(stripCreoleShorthand);
  return {
    stripped: shorthand.map((s) => resolveTextEscapes(stripCreoleMarkup(applyGuillemet(s.text)))),
    bold: lines.map((l, i) => BOLD_TAG_RE.test(l) || shorthand[i]!.bold),
    italic: shorthand.map((s) => s.italic),
  };
}

/** One physical row of a wrapped label: its atoms, their widths, and the
 *  logical line's bold/italic flags. */
interface WrappedRow {
  readonly atoms: readonly string[];
  readonly widths: readonly number[];
  readonly width: number;
  readonly bold: boolean;
  readonly italic: boolean;
}

/** The physical rows of a stripped multi-line label wrapped at `maxWidth`
 *  (`Display#create0` -> `Sheet` -> `Fission#getSplitted` per stripe,
 *  `SvekEdge.java:288-299`). Shared by the reservation and the anchor. */
export function wrappedLabelRows(
  lines: readonly string[],
  font: FontSpec,
  maxWidth: number,
  measurer: StringMeasurer,
): WrappedRow[] {
  const { stripped, bold, italic } = stripLabelLines(lines);
  return stripped.flatMap((text, i) =>
    splitPlainTextAtoms(text, font, maxWidth, measurer).map((atoms) => {
      const widths = atoms.map((t) => measurer.measure(t, font).width);
      return { atoms, widths, width: widths.reduce((s, w) => s + w, 0), bold: bold[i]!, italic: italic[i]! };
    }),
  );
}

/**
 * cdd7 T2b (xuloxo-85-vibu502): `multiLineLabelAnchor`
 * (`class-edge-label-anchor.ts`) under a label wrap width -- `SvekEdge.java
 * :288-299` hands `create0` `arrowStyle.wrapWidth()` else
 * `skinParam.maxMessageSize()`. One anchor per ATOM (`StripeSimple`'s
 * per-atom `drawU`): the rows stack at `labelFont.size`, each aligned inside
 * the widest row, atoms advancing by their own width -- the SAME block
 * geometry `multiLineLabelAnchor` uses, which this reduces to exactly at
 * `maxWidth <= 0` (one atom per logical line). Jar: xuloxo's `[Optional`,
 * ` `, `Technology]` on one row. The wrap width is `ctx.maxWidth`.
 */
export function multiLineLabelAnchorWrapped(
  lines: readonly string[],
  align: 'center' | 'left' | 'right',
  ctx: LabelAnchorContext,
): Array<{ text: string; x: number; y: number; width: number; bold?: boolean; italic?: boolean }> {
  const { center, measurer, labelFont: font } = ctx;
  const rows = wrappedLabelRows(lines, font, ctx.maxWidth ?? 0, measurer);
  const blockWidth = Math.max(...rows.map((r) => r.width));
  const blockLeft = center.x - Math.floor(blockWidth) / 2;
  const firstLine = rows[0]?.atoms.join('') ?? '';
  const baselineOffset = font.size - measurer.getDescent(font, firstLine);
  const totalHeight = (rows.length - 1) * font.size + measurer.measure(firstLine, font).height;
  const blockTop = center.y - totalHeight / 2;
  return rows.flatMap((row, r) => {
    let x = blockLeft + rowOffset(align, blockWidth, row.width);
    return row.atoms.map((text, i) => {
      const width = row.widths[i]!;
      const anchor = { text, x, y: blockTop + baselineOffset + r * font.size, width, ...rowFlags(row) };
      x += width;
      return anchor;
    });
  });
}

/** `TextBlockVertical#drawU`'s per-block `dx` (`klimt/shape/TextBlockVertical
 *  .java:91-98`), as `multiLineLabelAnchor` applies it. */
function rowOffset(align: 'center' | 'left' | 'right', total: number, own: number): number {
  return align === 'left' ? 0 : align === 'right' ? total - own : (total - own) / 2;
}

function rowFlags(row: WrappedRow): { bold?: true; italic?: true } {
  return { ...(row.bold ? { bold: true as const } : {}), ...(row.italic ? { italic: true as const } : {}) };
}
