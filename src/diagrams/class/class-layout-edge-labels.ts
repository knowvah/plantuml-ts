/**
 * Relationship (edge) label sizing helpers for the class diagram layout
 * engine (src/diagrams/class/layout.ts).
 *
 * Split out of class-layout-helpers.ts purely to keep every function under
 * the project's per-function complexity/size caps (CCN <= 10, <= 30 NLOC)
 * and the file under the 500-line cap. No behavior differs from the
 * original inline code — this is a pure move.
 */

import type { Relationship } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputEdge } from '../../core/graph-layout.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import { ARROW_GLYPH_SIZE, parseMagicArrowLabel } from './class-magic-arrow.js';

/** SvekEdge.CONSTRAINT_SPOT (SvekEdge.java:122): the fixed side length of the
 *  10x10 label spot emitted for a `constraint on links` edge with no text. */
const CONSTRAINT_SPOT = 10;

/**
 * `plantuml.skin`'s `arrow { FontSize 13 }` block (`svek/GraphvizImageBuilder
 * .java#getStyleArrowCardinality` resolves the `arrow.cardinality` style,
 * which falls through to the plain `arrow` block -- no diagram in the corpus
 * overrides `cardinality` specifically), jar-verified against every sampled
 * `<text font-size="13">` multiplicity/role glyph in `test-results/dot-cache
 * /class/*` `in.svg`. G2/N25: used for the label's REAL rendered size
 * (`class-geo-builders.ts#attachPortLabels`'s baseline conversion + the
 * `textLength` this port's own `renderer.ts` emits) and for @knowvah/dot-engine's
 * own placement search (`core/graph-layout.ts#CARDINALITY_FONT_SIZE`, an
 * independent same-value constant in that module -- core/ does not import
 * class-local constants). NOT the same font `edgeLabelAttrs` below measures
 * with for DOT-gate sizing (`font` param, `theme.fontSize` = 14) -- that is
 * a pre-existing, separate, NOT-fixed-this-iteration mismatch (the DOT-gate
 * comparator never numeric-checks `taillabel`/`headlabel` table dims, so it
 * has never surfaced as a gate failure); left untouched to avoid ANY risk
 * to the frozen DOT gate.
 */
export const CARDINALITY_FONT_SIZE = 13;

/** G2 item 43: the alignment a `\\n`/`\\l`/`\\r`-split edge label resolves
 *  to -- see {@link splitEdgeLabelLines}'s doc comment. */
export type EdgeLabelAlign = 'center' | 'left' | 'right';

export interface EdgeLabelLines {
  lines: string[];
  align: EdgeLabelAlign;
}

/**
 * G2 item 43: split a relationship label's `\\n`/`\\l`/`\\r` line-break
 * escape sequences into individual lines, mirroring jar's
 * `Display#getWithNewlines` (`klimt/creole/Display.java:259-343`,
 * `Pragma.legacyReplaceBackslashNByNewline()` always `true`). `\\n` breaks
 * the line with no alignment change; `\\l`/`\\r` ALSO break the line and
 * additionally set the WHOLE block's horizontal alignment (the LAST
 * `\\l`/`\\r` in the string wins -- jar's `naturalHorizontalAlignment`
 * field is overwritten on each occurrence, not tracked per-line).
 * `\\t` -> a literal tab (`current.append('\t')`); `\\\\` -> a literal
 * backslash; any OTHER `\\x` pair is kept AS-IS (jar's trailing `else`
 * branch appends both characters unchanged, Display.java:308-310). Default
 * alignment (no `\\l`/`\\r` present) is CENTER
 * (`SvekEdge#getMessageTextAlignment` -> `getDefaultTextAlignment(CENTER)`,
 * SvekEdge.java:376-381). Jar-verified against `sicile-99-pefa679`'s 3
 * sibling edges (identical 3-line text, one `\\n`/`\\l`/`\\r` each).
 * Deliberately narrower than `Display.java`'s full state machine (no
 * `<math>`/`<latex>`/`[[`-raw-mode gating, no `%newline()`/`%n()` macro
 * forms, no `Jaws`-internal control-char handling) -- those branches are
 * unreached by any grep-confirmed edge-label fixture in this mission's
 * corpus (`ledger.md` item 43's own reach survey).
 */
/** One resolved `\\x` escape pair's effect on `splitEdgeLabelLines`'s scan
 *  state -- factored out purely to keep that function's CCN under the
 *  project's per-function cap; the resolution logic itself is unchanged. */
interface EscapeEffect {
  /** Literal text to append to the current line (empty when the escape
   *  breaks the line instead of appending anything). */
  append: string;
  /** True when this escape ends the current line (`\\n`/`\\l`/`\\r`). */
  breakLine: boolean;
  /** New whole-block alignment, when this escape sets one (`\\l`/`\\r`). */
  align?: EdgeLabelAlign | undefined;
}

function resolveLabelEscape(c2: string): EscapeEffect {
  if (c2 === 'n' || c2 === 'r' || c2 === 'l') {
    return { append: '', breakLine: true, align: c2 === 'r' ? 'right' : c2 === 'l' ? 'left' : undefined };
  }
  if (c2 === 't') return { append: '\t', breakLine: false };
  if (c2 === '\\') return { append: c2, breakLine: false };
  return { append: `\\${c2}`, breakLine: false };
}

export function splitEdgeLabelLines(text: string): EdgeLabelLines {
  const lines: string[] = [];
  let current = '';
  let align: EdgeLabelAlign = 'center';
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c === '\\' && i < text.length - 1) {
      const c2 = text[i + 1]!;
      i++;
      const effect = resolveLabelEscape(c2);
      if (effect.align !== undefined) align = effect.align;
      if (effect.breakLine) {
        lines.push(current);
        current = '';
      } else {
        current += effect.append;
      }
    } else {
      current += c;
    }
  }
  lines.push(current);
  return { lines, align };
}

/**
 * G2 N65 item 35: word-wraps ONE already-`\\n`/`\\l`/`\\r`-split line
 * (`splitEdgeLabelLines`'s own output) via the SAME Fission engine E2r built
 * for description word-wrap (`Fission.ts#getSplitted`) -- upstream mirror:
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
  const atom: CreoleAtom = {
    kind: 'text', text,
    font: { family: fontSpec.family, size: fontSpec.size, color: null, styles: new Set() },
  };
  const wrapped = getSplitted(
    [atom], maxWidth, (a) => (a.kind === 'text' ? measurer.measure(a.text, fontSpec).width : 0),
  );
  return wrapped.map((lineAtoms) => lineAtoms.filter((a) => a.kind === 'text').map((a) => a.text).join(''));
}

/**
 * Edge label attributes from a relationship's label + multiplicities. The Svek
 * comparator counts edges carrying each label kind (labelOk), so a relationship
 * label emits `label`, the from-side multiplicity emits `taillabel`, and the
 * to-side multiplicity emits `headlabel` (widths/heights are measured but
 * tolerant). The emitter needs only the sizes for tail/head — no text field.
 *
 * G2 item 43: a `\\n`/`\\l`/`\\r`-split multi-line label reserves the
 * WIDEST line's width and the full stacked height (`lines.length *` the
 * single-line measured height) instead of measuring the raw string (which
 * would count the literal `\\n`/`\\l`/`\\r` characters as visible glyphs
 * and never reflect the real multi-row reserved space) -- feeds @knowvah/dot-engine's
 * OWN layout/label-placement search with the true reserved box size, matching
 * jar's own `dimNote = labelText.calculateDimension(...)` over the FULL
 * multi-line `TextBlock` (`SvekEdge.java:440`). DOT-gate safe: the frozen
 * comparator's `labelOk` only counts label PRESENCE, never numeric
 * width/height (`tests/oracle/svek-dot.ts#compareStructural`, confirmed via
 * direct source read before this change).
 *
 * G2 item 44: a single-line label carrying a magic-arrow token (`class-
 * magic-arrow.ts#parseMagicArrowLabel`) reserves `ARROW_GLYPH_SIZE` (the
 * glyph's own fixed box) PLUS the stripped text's own width/height --
 * `TextBlockUtils.mergeLR`'s width-sums/height-maxes semantics
 * (`SvekEdge.java:284,304`), NOT the raw string's width (which would count
 * the literal `>`/`<` token as a visible glyph and never reserve space for
 * the triangle).
 */
type LabelAttrs = Pick<
  NonNullable<DotInputEdge['attributes']>,
  'label' | 'labelWidth' | 'labelHeight' | 'labelBoxWidth' | 'labelBoxHeight'
>;
type MultiplicityAttrs = Pick<
  NonNullable<DotInputEdge['attributes']>,
  'tailLabelWidth' | 'tailLabelHeight' | 'tailLabel' | 'headLabelWidth' | 'headLabelHeight' | 'headLabel'
>;

/** The `rel.label`/`rel.linkConstraint` half of {@link edgeLabelAttrs} --
 *  factored out purely to keep that function's NLOC/CCN under the project's
 *  per-function caps; see that function's own doc comment for the upstream
 *  derivation of every branch below (unchanged, pure move). */
/**
 * `SvekEdge#addVisibilityModifier` (`svek/SvekEdge.java:372-373`) closes by
 * wrapping the finished label block in `TextBlockUtils.withMargin(block,
 * marginLabel, marginLabel)`, where `marginLabel = startUid.equalsId(endUid)
 * ? 6 : 1` — 6 for a SELF-link, 1 otherwise. `withMargin(tb, x, y)` builds
 * `TextBlockMarged(tb, y, x, y, x)` (`klimt/shape/TextBlockUtils.java:64-68`),
 * i.e. the margin lands on BOTH sides of BOTH axes, so the measured block
 * grows by `2 * marginLabel` in each — once for the whole block, not per line.
 *
 * Applies to the MAIN label only. `addVisibilityModifier` has exactly one
 * caller (`SvekEdge.java:302`, building `labelOnly`); taillabel and headlabel
 * are built straight from `Display.create` and never pass through it — which
 * is why `tobuka-93-jale775`, whose only labels are tail/head, already matched
 * the oracle byte for byte before this change.
 */
const SELF_LINK_LABEL_MARGIN = 6;
const LINK_LABEL_MARGIN = 1;

function labelMarginOf(rel: Relationship): number {
  return rel.from === rel.to ? SELF_LINK_LABEL_MARGIN : LINK_LABEL_MARGIN;
}

/** Grow a MEASURED label block by its all-round margin — see
 *  {@link labelMarginOf}. Returns the attrs untouched when there is no label,
 *  and when the only "label" is the `linkConstraint` spot: upstream reaches
 *  that through `SvekEdge.java:440`'s `CONSTRAINT_SPOT` arm, which never
 *  builds a `labelText` and so never passes through `addVisibilityModifier`.
 *  `computeRelLabelAttrs` marks that arm with an EMPTY `label`, which is what
 *  distinguishes it from a real one here. */
function withLabelMargin(attrs: LabelAttrs, rel: Relationship): LabelAttrs {
  if (attrs.labelWidth === undefined || attrs.labelHeight === undefined) return attrs;
  if (attrs.label === '') return attrs;
  const m = 2 * labelMarginOf(rel);
  return { ...attrs, labelWidth: attrs.labelWidth + m, labelHeight: attrs.labelHeight + m };
}

function computeRelLabelAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): LabelAttrs {
  if (rel.label === undefined) {
    if (rel.linkConstraint === true) {
      // `constraint on links` puts a fixed 10x10 spot label on a constrained
      // edge with no note/label text (SvekEdge.java:430-444: `hasNoteLabelText()
      // || link.getLinkConstraint() != null` → dimNote = CONSTRAINT_SPOT, the
      // 10x10 XDimension2D at SvekEdge.java:122). With a real label the normal
      // measured branch below already matches upstream's hasNoteLabelText arm.
      return { label: '', labelWidth: CONSTRAINT_SPOT, labelHeight: CONSTRAINT_SPOT };
    }
    return {};
  }
  const { lines } = splitEdgeLabelLines(rel.label);
  if (lines.length > 1) {
    const widths = lines.map((l) => measurer.measure(l, font).width);
    const lineHeight = measurer.measure(lines[0] ?? '', font).height;
    return { label: rel.label, labelWidth: Math.max(...widths), labelHeight: lineHeight * lines.length };
  }
  const magic = parseMagicArrowLabel(rel.label);
  if (magic !== undefined) {
    const m = magic.text !== undefined && magic.text !== ''
      ? measurer.measure(magic.text, font)
      : { width: 0, height: 0 };
    return { label: rel.label, labelWidth: ARROW_GLYPH_SIZE + m.width, labelHeight: Math.max(ARROW_GLYPH_SIZE, m.height) };
  }
  const m = measurer.measure(rel.label, font);
  return { label: rel.label, labelWidth: m.width, labelHeight: m.height };
}

/** The `rel.fromMultiplicity`/`rel.toMultiplicity` half of
 *  {@link edgeLabelAttrs} -- see that function's own doc comment. */
function computeMultiplicityAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): MultiplicityAttrs {
  const attrs: MultiplicityAttrs = {};
  if (rel.fromMultiplicity !== undefined) {
    const m = measurer.measure(rel.fromMultiplicity, font);
    attrs.tailLabelWidth = m.width;
    attrs.tailLabelHeight = m.height;
    // G2/N25: the actual text, fed into the real @knowvah/dot-engine layout call so
    // it computes a real position (`core/graph-layout.ts
    // #extractPortLabelPositions`) -- see that field's own doc comment.
    attrs.tailLabel = rel.fromMultiplicity;
  }
  if (rel.toMultiplicity !== undefined) {
    const m = measurer.measure(rel.toMultiplicity, font);
    attrs.headLabelWidth = m.width;
    attrs.headLabelHeight = m.height;
    attrs.headLabel = rel.toMultiplicity;
  }
  return attrs;
}

export function edgeLabelAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): NonNullable<DotInputEdge['attributes']> {
  return withLayoutBox({
    // The margin is applied HERE rather than inside each branch of
    // `computeRelLabelAttrs` so it lands exactly once, on whichever branch
    // produced the block — mirroring upstream, where `addVisibilityModifier`
    // wraps the finished `block` at a single call site (`SvekEdge.java:302`).
    // The `linkConstraint` spot deliberately keeps its raw 10x10: upstream
    // reaches it through the `CONSTRAINT_SPOT` arm at `SvekEdge.java:440`,
    // which never builds a `labelText` and so never sees the margin.
    ...withLabelMargin(computeRelLabelAttrs(rel, font, measurer), rel),
    ...computeMultiplicityAttrs(rel, font, measurer),
  });
}

/**
 * T6: hand the LAYOUT engine the same reserved box the DOT gate already gets.
 *
 * Without `labelBoxWidth`/`labelBoxHeight`, `graph-layout-build-edges.ts`
 * sends the engine plain TEXT, which it measures itself -- reserving a
 * constant ~16.5 per line instead of the declared height. A labelled edge
 * spans the rank gap, so that lands as rank separation: measured 76.5 against
 * the jar's 75 on `class-inheritance-interface-assoc`, putting every node
 * below that rank 1.5 too low and accounting for 148 of its 202 diffs.
 *
 * The values are the ALREADY-margined ones `withLabelMargin` produced, which
 * is this engine's equivalent of `computeReservedLabelBox`'s reserved box --
 * class measures multi-line labels correctly on its own
 * (`splitEdgeLabelLines`, max width, lineHeight * lineCount). The consumer
 * floors, matching the jar's truncation (`SvekEdge.java:504-507`).
 *
 * Skipped for the `linkConstraint` spot, whose EMPTY `label` marks the
 * `CONSTRAINT_SPOT` arm that never builds a `labelText` upstream -- the same
 * discriminator `withLabelMargin` uses.
 */
function withLayoutBox(attrs: LabelAttrs): LabelAttrs {
  if (attrs.labelWidth === undefined || attrs.labelHeight === undefined) return attrs;
  if (attrs.label === '') return attrs;
  return { ...attrs, labelBoxWidth: attrs.labelWidth, labelBoxHeight: attrs.labelHeight };
}
