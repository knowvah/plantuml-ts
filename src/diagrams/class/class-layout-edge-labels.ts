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
import type { Theme } from '../../core/theme.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { CARDINALITY_FONT_SIZE } from '../../core/graph-layout.js';
import { computeQuantifierBox, computeMergedLabelBox } from '../../core/edge-label-box.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import { ARROW_GLYPH_SIZE, parseMagicArrowLabel } from './class-magic-arrow.js';
// T10: the note operand's REAL dimension -- `EntityImageNoteLink` builds a
// `ComponentRoseNote`, a DIFFERENT upstream component from the one
// `measureNote` models -- see `class-note-link-box.ts`'s own doc comment for
// the full derivation (verified independently against the Java, not
// inherited from a comment).
import { measureLinkNoteDim } from './class-note-link-box.js';

/** SvekEdge.CONSTRAINT_SPOT (SvekEdge.java:122): the fixed side length of the
 *  10x10 label spot emitted for a `constraint on links` edge with no text. */
const CONSTRAINT_SPOT = 10;

/**
 * `plantuml.skin`'s `arrow { FontSize 13 }` block (`svek/GraphvizImageBuilder
 * .java#getStyleArrowCardinality` resolves the `arrow.cardinality` style,
 * which falls through to the plain `arrow` block) -- the DEFAULT only.
 * **Corrected T6** (was: "no diagram in the corpus overrides `cardinality`
 * specifically"): `camuna-58-veca254` DOES, in a `<style> arrow { cardinality
 * { FontSize 10 } } }` block (decisions.md#D3). jar-verified against every
 * OTHER sampled `<text font-size="13">` multiplicity/role glyph in
 * `test-results/dot-cache/class/*` `in.svg`. G2/N25: used for the label's
 * REAL rendered size (`class-geo-builders.ts#attachPortLabels`'s baseline
 * conversion + the `textLength` this port's own `renderer.ts` emits) and for
 * @knowvah/dot-engine's own placement search (`core/graph-layout-build-edges.ts
 * #CARDINALITY_FONT_SIZE`, re-exported from `core/graph-layout.ts` -- T6
 * retired the independent same-value duplicate that used to live here;
 * this is now an IMPORT, one owner in core). SAME font `edgeLabelAttrs`
 * below now measures QUANTIFIER/ROLE boxes with via `computeQuantifierBox`
 * (T6) -- **corrected T6** (was: claimed a `theme.fontSize` = 14 mismatch
 * against the main-LABEL font; T4 (`decision-journal.md`) proved that stale:
 * `class-dot-graph.ts:371` builds the label font at `ARROW_LABEL_FONT_SIZE`
 * = 13, not 14, and `gikipi`'s 68px measurement only reproduces at 13). The
 * comment's other half stays true: `skinparam ArrowFontSize` has no cascade
 * path yet (`core/skinparam.ts#ELEMENT_BUCKET_SNAMES` omits `'arrow'`).
 *
 * **Known gap, not fixed by T6 (write-set escape, journalled):** a
 * diagram's `<style> arrow { cardinality { FontSize N } } }` override is
 * NOT read by `computeMultiplicityAttrs` below -- `computeCardinalityFontOverride`
 * (`style-cascade-class.ts`) resolves it from a StyleMap, but no StyleMap
 * reaches this file's functions; threading one through touches
 * `style-map-theme.ts`/`class-dot-graph.ts`, outside T6's write-set. See
 * `computeMultiplicityAttrs`'s own doc comment.
 */
export { CARDINALITY_FONT_SIZE };

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
 * multi-line `TextBlock` (`SvekEdge.java:440`). When this landed the DOT
 * gate's `labelOk` counted label PRESENCE only; since 2026-08-15 the box is
 * ASSERTED too (`tests/oracle/svek-dot.ts#labelSizeOk`, edge-label-box D7),
 * so a wrong reservation here now fails `class-dot-parity.test.ts`.
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
 *  distinguishes it from a real one here. Also skipped when the note-merge
 *  branch actually ran (`rel.linkNote` set AND `noteCtx` supplied) --
 *  {@link computeMergedLabelBox} already bakes this SAME margin into the
 *  label operand internally, BEFORE the note merge (`addVisibilityModifier`
 *  runs before `mergeLR`/`mergeTB`, `SvekEdge.java:302-325`); applying it
 *  again here would double it. The `noteCtx` check also covers a hand-built
 *  `Relationship` with `linkNote` set but no `noteCtx` passed (test literals
 *  predating this task): it falls through to the ordinary measured-label
 *  branch instead, which DOES still need this margin. */
function withLabelMargin(attrs: LabelAttrs, rel: Relationship, noteCtx: NoteBoxContext | undefined): LabelAttrs {
  if (attrs.labelWidth === undefined || attrs.labelHeight === undefined) return attrs;
  if (attrs.label === '') return attrs;
  if (rel.linkNote !== undefined && noteCtx !== undefined) return attrs;
  const m = 2 * labelMarginOf(rel);
  return { ...attrs, labelWidth: attrs.labelWidth + m, labelHeight: attrs.labelHeight + m };
}

/**
 * Theme + sprites needed to size a note merged into an edge label
 * (`rel.linkNote`) -- threaded from `class-dot-graph.ts`, which already
 * holds both when it builds the DOT edges (`buildNoteGraphParts` a few
 * lines later in that file takes the SAME `theme`/`ast.sprites` for
 * attached/freestanding notes). {@link measureLinkNoteDim} resolves its OWN
 * font from `theme`, unlike the label operand's already-resolved `font`.
 */
export interface NoteBoxContext {
  theme: Theme;
  sprites?: SpriteRegistry;
}

/**
 * T10/M2: `note on link` merges the note image into the label reservation
 * instead of drawing beside it (`SvekEdge.java:302-325`) -- routes through
 * T8's {@link computeMergedLabelBox}, sourcing the note operand from
 * {@link measureLinkNoteDim} (`class-note-link-box.ts` -- `EntityImageNoteLink`
 * is a `ComponentRoseNote`, NOT the plain-note component the class engine's
 * OTHER note sizer, `measureNote`, models; see that module's own doc
 * comment for the derivation). `noteCtx.sprites` reaches the SAME
 * `<$name>` atom resolution attached/freestanding notes use
 * (`measureNote`'s own `sprites` param) -- jar-verified end to end against
 * `lozego-15-coci435`: `<$test>` resolves via `ast.sprites` to its declared
 * `[50x100/8z]` box, scaled by `spriteScale(1, 13) === 1` (ambient note font
 * 13 === the sprite's own 13px reference), landing on the oracle's exact
 * `137x135`.
 */
function computeNoteMergedLabelAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  measurer: StringMeasurer,
  noteCtx: NoteBoxContext,
): LabelAttrs {
  const noteDim = measureLinkNoteDim(rel.linkNote!, noteCtx.theme, measurer, noteCtx.sprites);
  const box = computeMergedLabelBox({
    label: rel.label ?? '',
    noteDim,
    position: rel.linkNotePosition ?? 'bottom',
    // `NoteLinkStrategy.HALF_NOT_PRINTED`/`HALF_PRINTED_FULL` only fires on
    // the association-class couple's split-note path (`Association
    // .createNew`, class-assoc-couple.ts) -- untouched by this task. Every
    // note reaching this function (a still-live `ast.relationships` entry)
    // carries the NORMAL strategy (SvekEdge.java:314-317).
    halfWidth: false,
    // This port has no `LinkMiddleDecor` concept: the `0`/`(0`/`0)`/`(0)`
    // mid-arrow "INSIDE" syntax (`CommandLinkClass.java:490-509`) is a
    // surveyed-and-deferred, unbuilt feature (class-relationship-ast.ts's
    // own `LinkDecor` doc comment -- "CIRCLE_CONNECT ... deferred"). Every
    // `RelationshipType`/`LinkDecor` this port can construct therefore takes
    // `LinkType`'s default constructor, which is `LinkMiddleDecor.NONE`
    // (`decoration/LinkType.java:73`) -- so `labelShield` is always 0
    // (`SvekEdge.java:353-356`). T10 item 2: for `lozego-15-coci435`'s `--{`
    // specifically, the crowfoot `{` is parsed from `ARROW_HEAD2`, a
    // DIFFERENT regex group from `INSIDE` (`CommandLinkClass.java:132-139`),
    // so it cannot set a middle decor even if this port modeled one.
    hasMiddleDecor: false,
    font,
    measurer,
  });
  return { label: rel.label ?? '', labelWidth: box.reservedWidth, labelHeight: box.reservedHeight };
}

/** The plain (non-note, non-constraint-spot) measured label -- multi-line,
 *  magic-arrow, or a single plain string. Split out of
 *  {@link computeRelLabelAttrs} purely for the project's per-function NLOC
 *  cap; behavior unchanged (pure move, pre-existing logic). */
function computeMeasuredLabelAttrs(
  label: string,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): LabelAttrs {
  const { lines } = splitEdgeLabelLines(label);
  if (lines.length > 1) {
    const widths = lines.map((l) => measurer.measure(l, font).width);
    const lineHeight = measurer.measure(lines[0] ?? '', font).height;
    return { label, labelWidth: Math.max(...widths), labelHeight: lineHeight * lines.length };
  }
  const magic = parseMagicArrowLabel(label);
  if (magic !== undefined) {
    const m = magic.text !== undefined && magic.text !== ''
      ? measurer.measure(magic.text, font)
      : { width: 0, height: 0 };
    return { label, labelWidth: ARROW_GLYPH_SIZE + m.width, labelHeight: Math.max(ARROW_GLYPH_SIZE, m.height) };
  }
  const m = measurer.measure(label, font);
  return { label, labelWidth: m.width, labelHeight: m.height };
}

/** `noteCtx` is OPTIONAL only so a hand-built `Relationship` literal
 *  predating this task (no `noteCtx` argument) keeps compiling -- every
 *  production caller (`class-dot-edges.ts`) supplies it. */
function computeRelLabelAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  measurer: StringMeasurer,
  noteCtx?: NoteBoxContext,
): LabelAttrs {
  // `hasNoteLabelText()` (SvekEdge.java:401) wins over the constraint-spot
  // check below -- a note-bearing link is measured via the merge, REGARDLESS
  // of `linkConstraint` (SvekEdge.java:437's ternary tests `hasNoteLabelText()
  // || linkConstraint != null`, in that order).
  if (rel.linkNote !== undefined && noteCtx !== undefined) {
    return computeNoteMergedLabelAttrs(rel, font, measurer, noteCtx);
  }
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
  return computeMeasuredLabelAttrs(rel.label, font, measurer);
}

/** The `rel.fromMultiplicity`/`rel.toMultiplicity` half of
 *  {@link edgeLabelAttrs} -- see that function's own doc comment. */
/**
 * T6/M1: size the tail/head quantifier boxes via {@link computeQuantifierBox}
 * -- T5's cardinality-font, `\n`-split, raw-dimension (no shield, no
 * `marginLabel`) formula (`SvekEdge.java:328-351` construction, `:447-467`
 * emission -- the quantifier/role arms take the RAW `calculateDimension`,
 * unlike the main label's `:440-445`). Replaces the prior single
 * `measurer.measure` call at the ARROW LABEL font, which produced neither
 * the right font size nor a multi-line split (`camuna-58-veca254`: oracle
 * `23x10`/`41x20`, prior output `31x13`/`71x13`).
 *
 * **T14/D3 resolved** (was: a known write-set-escape gap logged by T6).
 * `cardinalityFont` is no longer derived locally from `font.family` +
 * `CARDINALITY_FONT_SIZE` -- the caller (`edgeLabelAttrs` below, fed by
 * `class-dot-edges.ts` <- `class-dot-graph.ts`) now resolves it from
 * `theme.cardinalityFontFamily`/`cardinalityFontSize`, which
 * `style-map-theme.ts#buildStyleMapPartialTheme` folds in from
 * `computeCardinalityFontOverride` (`style-cascade-class.ts`, D3) whenever a
 * diagram's own `<style>` sets `arrow { cardinality { FontSize N } } }` --
 * `camuna-58-veca254`'s 10px override included. Absent an override, the
 * fold contributes nothing and `deepMergeTheme` keeps the base Theme's own
 * 13/sans-serif default (`theme.ts:255-256`), so this function's own
 * contract (a plain `{family,size}` font) and its jar citations above are
 * unchanged -- only WHERE the font comes from moved.
 *
 * **Role labels (spec item 2, journalled): no path exists to route.**
 * `Relationship.fromRole`/`toRole` are parsed and stored
 * (`class-relationship-parser.ts:247-248,314`) but never READ anywhere in
 * `src/` -- `computeMultiplicityAttrs` only ever consumed
 * `fromMultiplicity`/`toMultiplicity`, and no DOT-emission or render site
 * implements upstream's `else if` role fallback
 * (`SvekEdge.java:447-466`: use the role name in place of the cardinality
 * when that end has no multiplicity). This is a genuinely UNBUILT feature,
 * not an existing path this "wiring" task can route through
 * `computeQuantifierBox` -- building it would add new DOT-attribute
 * emission (this file, in-write-set) but also new render/positioning
 * support (`class-geo-builders.ts`/`class-edge-label-anchor.ts`/
 * `renderer.ts`, all outside T6's write-set) and could move geometry for
 * any corpus fixture using bare role syntax, which D4's zero-fixture-rise
 * bar forbids attempting speculatively in this task.
 */
function computeMultiplicityAttrs(
  rel: Relationship,
  cardinalityFont: { family: string; size: number },
  measurer: StringMeasurer,
): MultiplicityAttrs {
  const attrs: MultiplicityAttrs = {};
  if (rel.fromMultiplicity !== undefined) {
    const box = computeQuantifierBox(rel.fromMultiplicity, cardinalityFont, measurer);
    attrs.tailLabelWidth = box.reservedWidth;
    attrs.tailLabelHeight = box.reservedHeight;
    // G2/N25: the actual text, fed into the real @knowvah/dot-engine layout call so
    // it computes a real position (`core/graph-layout.ts
    // #extractPortLabelPositions`) -- see that field's own doc comment.
    attrs.tailLabel = rel.fromMultiplicity;
  }
  if (rel.toMultiplicity !== undefined) {
    const box = computeQuantifierBox(rel.toMultiplicity, cardinalityFont, measurer);
    attrs.headLabelWidth = box.reservedWidth;
    attrs.headLabelHeight = box.reservedHeight;
    attrs.headLabel = rel.toMultiplicity;
  }
  return attrs;
}

export function edgeLabelAttrs(
  rel: Relationship,
  font: { family: string; size: number },
  // T14/D3: the resolved `{root,element,classDiagram,arrow,cardinality}`
  // font (`GraphvizImageBuilder.java:124-126,235-241` resolves it SEPARATELY
  // from `labelFont`) -- `class-dot-graph.ts` builds it from `theme`, not a
  // derivation of `font`. See `computeMultiplicityAttrs`'s own doc comment.
  cardinalityFont: { family: string; size: number },
  measurer: StringMeasurer,
  // T10: OPTIONAL -- see `computeRelLabelAttrs`'s own doc comment.
  noteCtx?: NoteBoxContext,
): NonNullable<DotInputEdge['attributes']> {
  return withLayoutBox({
    // The margin is applied HERE rather than inside each branch of
    // `computeRelLabelAttrs` so it lands exactly once, on whichever branch
    // produced the block — mirroring upstream, where `addVisibilityModifier`
    // wraps the finished `block` at a single call site (`SvekEdge.java:302`).
    // The `linkConstraint` spot deliberately keeps its raw 10x10: upstream
    // reaches it through the `CONSTRAINT_SPOT` arm at `SvekEdge.java:440`,
    // which never builds a `labelText` and so never sees the margin.
    ...withLabelMargin(computeRelLabelAttrs(rel, font, measurer, noteCtx), rel, noteCtx),
    ...computeMultiplicityAttrs(rel, cardinalityFont, measurer),
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
