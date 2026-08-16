/**
 * Link-derived DOT edge attributes + graph spacing for the description engine.
 *
 * Split out of layout-helpers.ts (500-line cap). Faithful ports:
 * - DotStringFactory.createDotString nodesep/ranksep (dzeta/10 with 35/60
 *   floors); SvekEdge.getHorizontalDzeta/getVerticalDzeta (ArithmeticStrategySum
 *   over main label + tail/head qualifiers + decor margins).
 * - SvekEdge minlen/style=invis/label emission inputs.
 *
 * D9 (plans/si5b-stdlib/decisions.md): a link/edge label carrying a Creole
 * `<img>`/`<$sprite>` atom contributes the atom's scaled pixel dims to
 * these same measurements -- routed through `../../core/creole-atoms.js`,
 * same precedent as `resolveInlineLinks`/I5 for `[[url label]]`.
 */

import type { DescriptiveLink } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { DotInputEdge } from '../../core/graph-layout.js';
import { resolveInlineLinks } from './parse-helpers.js';
import { computeReservedLabelBox, computeQuantifierBox } from '../../core/edge-label-box.js';
import {
  type SpriteDimsLookup,
} from '../../core/creole-atoms.js';
import {
  measureLineWithAtoms,
  lineAtomHeightExcess,
} from '../../core/creole-atoms-measure.js';

// ---------------------------------------------------------------------------
// Graph spacing (nodesep / ranksep) — DotStringFactory.createDotString +
// SvekEdge.getHorizontalDzeta/getVerticalDzeta
// ---------------------------------------------------------------------------

/** Svek getMinNodeSep() (non-activity diagrams). */
const MIN_NODESEP = 35;
/** Svek getMinRankSep() (non-activity diagrams). */
const MIN_RANKSEP = 60;
/** DotStringFactory.getMinRankSep():247-249 — `!pragma kermor on` floors
 *  ranksep at 40px instead of 60px; getMinNodeSep() never checks kermor. */
const MIN_RANKSEP_KERMOR = 40;
/** DotStringFactory.getVerticalDzeta():111-114 — under kermor, ranksep
 *  divides the max vertical dzeta by 100 instead of 10 (nodesep's
 *  horizontal-dzeta divisor is unaffected — getHorizontalDzeta never
 *  checks kermor). */
const VERTICAL_DIVISOR_KERMOR = 100;
const VERTICAL_DIVISOR = 10;
/** LinkDecor.java margins: NONE=2, ARROW/ARROW_TRIANGLE=10. */
const DECOR_MARGIN_NONE = 2;
const DECOR_MARGIN_ARROW = 10;

/** Bundles the text-measurement inputs shared by every label site below, so
 *  individual helper functions stay under the 5-parameter guideline instead
 *  of threading `fontSpec`/`measurer`/`sprites` through each one separately. */
interface MeasureCtx {
  fontSpec: FontSpec;
  measurer: StringMeasurer;
  sprites: SpriteDimsLookup | undefined;
}

/** Head-decor margin for a link's arrowHead (tail decor is always NONE — we
 *  do not parse tail arrowheads today). */
function headDecorMargin(arrowHead: DescriptiveLink['arrowHead']): number {
  if (arrowHead === 'open' || arrowHead === 'filled') return DECOR_MARGIN_ARROW;
  return DECOR_MARGIN_NONE;
}

interface LinkDzeta {
  horizontal: number;
  vertical: number;
}

/**
 * SvekEdge.getHorizontalDzeta / getVerticalDzeta, in pixels.
 *
 * - Self-loop (from === to): both dzetas equal decorDzeta (label ignored).
 * - length === 1 (SvekEdge.isHorizontal()): horizontal = labelWidth + decor;
 *   vertical = 0.
 * - length > 1: vertical = labelHeight + decor; horizontal = 0.
 *
 * T7: `getHorizontalDzeta`/`getVerticalDzeta` (`SvekEdge.java:1159-1203`) sum
 * the RAW `calculateDimension()` of `labelText` and, when set,
 * `startTailText`/`endHeadText` -- no `(int)` truncation anywhere in that
 * method (the cast lives only in `appendTable`'s DOT-table emission,
 * `:504-507`, a different call site). `computeQuantifierBox` (T5) returns
 * only the FLOORED `reservedWidth`/`reservedHeight` it built for that other
 * call site, so reusing it here would inject a truncation upstream never
 * applies to this sum. Left as a flat string measure below -- unchanged by
 * this task -- rather than adopting a box contract built for a different
 * upstream method. No golden fixture combines a `\n`-bearing quantifier with
 * a horizontal/vertical dzeta contribution (`purevo-74-pamo264`, the only
 * golden with quantifier syntax, uses a single un-split digit), so this is a
 * named, verified-inert gap, not a silent one.
 */
/** The text blocks SvekEdge feeds its ArithmeticStrategySum: the main label
 *  (stereotype included) and the tail/head qualifier labels
 *  (`link.firstLabel`/`secondLabel` -- always Quantifier1/Quantifier2 here,
 *  never Role1/Role2; see `applyQualifierLabels`'s doc comment). */
function dzetaTexts(link: DescriptiveLink): string[] {
  const texts: string[] = [];
  const main = mainLabelText(link);
  if (main !== undefined) texts.push(resolveInlineLinks(main));
  if (link.firstLabel !== undefined) texts.push(resolveInlineLinks(link.firstLabel));
  if (link.secondLabel !== undefined) texts.push(resolveInlineLinks(link.secondLabel));
  return texts;
}

function computeLinkDzeta(link: DescriptiveLink, ctx: MeasureCtx): LinkDzeta {
  const decorDzeta = DECOR_MARGIN_NONE + headDecorMargin(link.arrowHead);

  if (link.from === link.to) {
    return { horizontal: decorDzeta, vertical: decorDzeta };
  }

  const texts = dzetaTexts(link);
  if (link.length === 1) {
    const widthSum = texts.reduce(
      (s, t) => s + measureLineWithAtoms(t, ctx.fontSpec, ctx.measurer, ctx.sprites).width,
      0,
    );
    return { horizontal: widthSum + decorDzeta, vertical: 0 };
  }

  const heightSum = texts.reduce(
    (s, t) => s + measureLineWithAtoms(t, ctx.fontSpec, ctx.measurer, ctx.sprites).height,
    0,
  );
  return { horizontal: 0, vertical: heightSum + decorDzeta };
}

/**
 * DotStringFactory.createDotString nodesep/ranksep:
 *   nodesep = max(maxOverEdges(horizontalDzeta) / 10, 35)
 *   ranksep = max(maxOverEdges(verticalDzeta) / D, F)
 * where D=10/F=60 normally, D=100/F=40 under `!pragma kermor on`
 * (DotStringFactory.getVerticalDzeta():111-114, getMinRankSep():247-249 —
 * nodesep's horizontal-dzeta divisor/floor never check kermor).
 *
 * (The skinparam nodesep/ranksep override is deferred — Theme has no such
 * fields yet.)
 */
export function computeGraphSpacing(
  links: readonly DescriptiveLink[],
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  kermor = false,
  sprites?: SpriteDimsLookup,
): { nodeSep: number; rankSep: number } {
  const ctx: MeasureCtx = { fontSpec, measurer, sprites };
  let maxHorizontal = 0;
  let maxVertical = 0;
  for (const link of links) {
    const dzeta = computeLinkDzeta(link, ctx);
    if (dzeta.horizontal > maxHorizontal) maxHorizontal = dzeta.horizontal;
    if (dzeta.vertical > maxVertical) maxVertical = dzeta.vertical;
  }
  const verticalDivisor = kermor ? VERTICAL_DIVISOR_KERMOR : VERTICAL_DIVISOR;
  const rankFloor = kermor ? MIN_RANKSEP_KERMOR : MIN_RANKSEP;
  return {
    nodeSep: Math.max(maxHorizontal / 10, MIN_NODESEP),
    rankSep: Math.max(maxVertical / verticalDivisor, rankFloor),
  };
}

/**
 * DotInputEdge attributes contributed by a link: minLen (SvekEdge.java:417-427;
 * useRankSame() is hardwired false, so minlen = length - 1), hidden→invis
 * (SvekEdge still emits the edge — a hidden link counts structurally), and
 * tail/head qualifier-label dimensions (CommandLinkElement FIRST_LABEL/
 * SECOND_LABEL) for svek-dot-emit.ts oracle-DOT parity. tailLabelWidth/Height
 * and headLabelWidth/Height are emitter-only — the real layout engine ignores
 * them (see graph-layout.types.ts).
 */
/** Rendered main-label text: upstream keeps a POST-colon-embedded
 *  `<<stereotype>>` inside the label (drawn as guillemets above the text)
 *  — `Labels.java` builds this text and never reads the PRE-colon
 *  `STEREOTYPE` regex group at all (G1 I5e — see `DescriptiveLink
 *  .stereotypeIsLinkLabel`'s doc comment), so a pre-colon/auto-create-
 *  endpoint stereotype (e.g. `A --> B<<tag>>`) contributes NEITHER visible
 *  text NOR DOT label-dimension weight; only `stereotypeIsLinkLabel`
 *  (the post-colon-embedded case) does. */
function mainLabelText(link: DescriptiveLink): string | undefined {
  const parts: string[] = [];
  if (link.stereotypeIsLinkLabel === true && link.stereotype !== undefined) parts.push(`«${link.stereotype}»`);
  if (link.label !== undefined) parts.push(link.label);
  return parts.length > 0 ? parts.join('\n') : undefined;
}

/** Applies the main label (`label`/`labelWidth`/`labelHeight`, or the
 *  `xlabel*` triple under `skinparam linetype ortho` — SvekEdge.java:434-441)
 *  to `attrs`, resolving `[[url]]` markup (I5) and img/sprite atoms (D9)
 *  before measuring. No-op when the link has no stereotype/label. */
function applyMainLabel(
  attrs: NonNullable<DotInputEdge['attributes']>,
  link: DescriptiveLink,
  ctx: MeasureCtx,
  linetype: 'ortho' | 'polyline' | undefined,
): void {
  const labelText = mainLabelText(link);
  if (labelText === undefined) return;
  const resolvedLabelText = resolveInlineLinks(labelText);
  // T4: the shared box formula, not a single-line string measure. Multi-line
  // labels take the MAX line width rather than the concatenation, creole
  // formatting tags are stripped, and the line count reaches the height --
  // see `core/edge-label-box.ts`. Atom-bearing lines still need
  // `measureLineWithAtoms`' extra width, so the two combine: the box supplies
  // the text dimensions, the atom scan adds any icon width on the widest line.
  // `box.lines` are already split on `\n` and stripped of formatting tags;
  // each is then measured atom-aware, and the WIDEST wins. Height is one font
  // size per line plus whatever a tall atom on that line needs -- the per-line
  // pattern `lineAtomHeightExcess` documents for exactly this composition.
  const box = computeReservedLabelBox(resolvedLabelText, ctx.fontSpec, ctx.measurer, link.from === link.to);
  // The RESERVED box, not the measured one -- the jar writes the margined,
  // floored value into the DOT table (`SvekEdge.java:504-507`). `marginLabel`
  // is read off the helper rather than restated, so the 1-vs-6 self-loop rule
  // stays in one place; only the atom-aware measurement is redone here,
  // because the helper measures plain text and an icon occupies real width.
  const widest = Math.max(
    ...box.lines.map((l) => measureLineWithAtoms(l, ctx.fontSpec, ctx.measurer, ctx.sprites).width),
  );
  const stacked = box.lines.reduce(
    (h, l) => h + ctx.fontSpec.size + lineAtomHeightExcess(l, ctx.fontSpec, ctx.sprites),
    0,
  );
  const m = {
    width: Math.floor(widest + 2 * box.marginLabel),
    height: stacked + 2 * box.marginLabel,
  };
  if (linetype === 'ortho') {
    attrs.xlabel = resolvedLabelText;
    attrs.xlabelWidth = m.width;
    attrs.xlabelHeight = m.height;
  } else {
    attrs.label = resolvedLabelText;
    attrs.labelWidth = m.width;
    attrs.labelHeight = m.height;
    // T5: hand the LAYOUT engine the same reserved box, not the label text.
    // Without these two fields `graph-layout-build-edges.ts` sends plain text
    // and the engine measures it, reserving a constant ~16.5 per line instead
    // of the declared height -- which lands as rank separation, since a
    // labelled edge spans the rank gap. Same pair the state pipeline has set
    // since G8/T2 (`state-composite-edge-label.ts`).
    //
    // These are `m.width`/`m.height` because AFTER T4 those ARE the reserved,
    // margined, floored box. The batch-2 brief's "do not reuse raw
    // labelWidth/labelHeight" warns against the PRE-T4 values, which were the
    // unmargined single-line measurement.
    attrs.labelBoxWidth = m.width;
    attrs.labelBoxHeight = m.height;
  }
}

/**
 * Applies the tail/head qualifier-label dims (`CommandLinkElement`
 * FIRST_LABEL/SECOND_LABEL, `link.firstLabel`/`secondLabel`) to `attrs`,
 * resolving `[[url]]` markup as the main label does, then sizing through
 * T5's {@link computeQuantifierBox} -- `\n` split, max-line-width, no
 * shield, no `marginLabel`, `Math.floor` truncation -- matching
 * `SvekEdge.java:447-467`'s `startTailText`/`endHeadText.calculateDimension`
 * emission (raw dimension straight into `appendTable`, unlike the main
 * label's `:440-445` which adds `2 * labelShield` first).
 *
 * Role labels (`startTailRoleText`/`endHeadRoleText`, `SvekEdge.java:341-351`,
 * a taillabel/headlabel fallback for when NO quantifier is set) are NEVER
 * reached here: the description engine's link command,
 * `CommandLinkElement.executeArg` (`descdiagram/command/CommandLinkElement
 * .java:320-324`), always calls `linkArg.withQuantifier(first, second)` --
 * `withRole` is called ONLY by the class engine's link command
 * (`classdiagram/command/CommandLinkClass.java:351`). So `link.firstLabel`/
 * `secondLabel` are always Quantifier1/Quantifier2 here, never Role1/Role2,
 * and this function has no role arm to write.
 *
 * T7/D3 gap (write-set escape, logged rather than silently patched): `font`
 * below is `ctx.fontSpec` -- the ARROW label font (`edgeFontSpec`,
 * `layout.ts`'s T3 `skinparam arrowFontSize` cascade), not the resolved
 * `{root,element,classDiagram,arrow,cardinality}` font
 * (`GraphvizImageBuilder.java:124-126`, `style-cascade-class.ts
 * #computeCardinalityFontOverride`, T1). Both resolve to the SAME default
 * (13, sans-serif -- `theme.ts`'s `defaultTheme.cardinalityFontSize`/
 * `cardinalityFontFamily`), and no description-diagram golden overrides
 * `cardinality` specifically (`zosuje-43-zebi775` overrides `arrow` but not
 * `arrow.cardinality`), so this is a verified no-op divergence today, not a
 * guessed one. Threading the real cascade needs a `cardinalityFontSpec`
 * parameter carried from `layoutDescription` (which holds `theme`) through
 * `runLayout` -> `buildDotEdges` (`layout.ts`, `layout-dot-tree.ts`) -- both
 * outside this task's write-set, so this is the STOP-and-log this file's own
 * task spec calls for, not a silent substitution.
 */
function applyQualifierLabels(
  attrs: NonNullable<DotInputEdge['attributes']>,
  link: DescriptiveLink,
  ctx: MeasureCtx,
): void {
  if (link.firstLabel !== undefined) {
    const box = computeQuantifierBox(resolveInlineLinks(link.firstLabel), ctx.fontSpec, ctx.measurer);
    attrs.tailLabelWidth = box.reservedWidth;
    attrs.tailLabelHeight = box.reservedHeight;
  }
  if (link.secondLabel !== undefined) {
    const box = computeQuantifierBox(resolveInlineLinks(link.secondLabel), ctx.fontSpec, ctx.measurer);
    attrs.headLabelWidth = box.reservedWidth;
    attrs.headLabelHeight = box.reservedHeight;
  }
}

export function buildLinkEdgeAttributes(
  link: DescriptiveLink,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  linetype?: 'ortho' | 'polyline',
  sprites?: SpriteDimsLookup,
): NonNullable<DotInputEdge['attributes']> {
  const ctx: MeasureCtx = { fontSpec, measurer, sprites };
  const attrs: NonNullable<DotInputEdge['attributes']> = { minLen: link.length - 1 };
  // `-[hidden]-` does NOT produce `style=invis`, despite the name. Upstream
  // keeps two separate fields and this port conflated them:
  //   `WithLinkType.applyOneStyle`'s "hidden" branch calls `goHidden()`
  //   (`WithLinkType.java:100-102`), setting `hidden` -- a DRAW-time flag read
  //   by `ArrowConfiguration#isHidden` / `ComponentRoseArrow`. `style=invis`
  //   is emitted from `Link#isInvis()` (`Link.java:177-182`), which reads the
  //   SEPARATE `invis` field and `type.isInvisible()`, neither of which the
  //   bracket keyword touches.
  // (`LinkStyle.getByName("hidden")` does return INVISIBLE(), but that is a
  // different parse path -- the bracket-token loop never reaches it, and the
  // oracle confirms: `component/balopu-66-jagu236`'s `-[hidden]->` produces no
  // `style=invis` at all.)
  // Emitter-only either way -- `invis` is never forwarded to the layout
  // engine -- so this corrected DOT changes no geometry and no drawing. The
  // draw-time half is a separate, still-open gap; see
  // `layout-helpers-types.ts`'s `G1 I-linkstyle` note for why folding
  // `link.hidden` into the edge-skip was attempted and reverted.
  // `[norank]` -> `Link#goNorank` -> `setConstraint(false)`
  // (`WithLinkType.java:157-158`, `Link.java:159-161`), emitted by
  // `SvekEdge.java:475-476`. The flag has been parsed onto the AST since
  // link-grammar.ts:406; this is the consumer that was missing.
  if (link.norank === true) attrs.constraint = false;
  applyMainLabel(attrs, link, ctx, linetype);
  applyQualifierLabels(attrs, link, ctx);
  return attrs;
}
