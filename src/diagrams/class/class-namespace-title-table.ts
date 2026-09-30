/**
 * `ClusterHeader`'s title-table sizing for a class/object package cluster --
 * split out of ./class-dot-graph.ts (T4, namespace-cluster-box mission,
 * 500-line file-cap compliance; pure move, no behavior change from the
 * split itself, mirroring state-composite-header.ts's identical prior
 * split off state-composite-cluster.ts).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java
 */

import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { computeTitleTableHeight } from '../../core/cluster-title-table.js';
import { resolveDescriptionUSymbol } from '../../core/svek/image/EntityImageDescription.js';
import { resolveActorStyle, mapComponentStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import {
  namespaceTitleWidth,
  namespaceTitleLines,
  namespaceTitleHeight,
  packageTitleFontSpec,
} from './class-namespace-title-runs.js';
import type { Namespace, Visibility } from './ast.js';
import { HEADER_VISIBILITY_TOP_MARGIN } from './class-header-visibility-geo.js';
import { VISIBILITY_ICON_SIZE } from './class-visibility-icon.js';
import { getHTitle, getTitleBaselineOffset, getWTitle } from './class-package-style.js';

/** cdd6-T3d (topave-65-ceso890): `ClusterHeader#getTitleBlock`'s icon block,
 *  `TextBlockUtils.withMargin(modifier.getUBlock(classAttributeIconSize, fore,
 *  back, false), 0, 0, 4, 0)` -- `getUBlock` is RAW `size + 1` square
 *  (`VisibilityModifier.java:100-102`), and the `4` is a TOP margin
 *  (`withMargin(tb, x1, x2, y1, y2)`, the same pair `EntityImageClassHeader`
 *  uses, `class-header-visibility-geo.ts`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:130-138 */
export interface NamespaceVisibilityBlock {
  modifier: Visibility;
  width: number;
  height: number;
}

export function namespaceVisibilityBlock(
  ns: Pick<Namespace, 'visibilityModifier'>,
  theme: Theme,
): NamespaceVisibilityBlock | undefined {
  if (ns.visibilityModifier === undefined) return undefined;
  const size = theme.classAttributeIconSize ?? VISIBILITY_ICON_SIZE;
  return { modifier: ns.visibilityModifier, width: size + 1, height: size + 1 + HEADER_VISIBILITY_TOP_MARGIN };
}

/**
 * cdd-T12 (diagnosis A2b E3): `ClusterHeader`'s per-USymbol title-table
 * supplement --
 * `titleAndAttributeWidth = max(dimLabel.w, attributeWidth) +
 *  uSymbol.suppWidthBecauseOfShape()` and
 * `titleAndAttributeHeight = dimLabel.h + attributeHeight + marginForFields +
 *  uSymbol.suppHeightBecauseOfShape()`
 * (`~/git/plantuml/.../svek/ClusterHeader.java:87-94`). Both terms are 0 for
 * a `null` USymbol and for the base `USymbol` class
 * (`decoration/symbol/USymbol.java:88-93`); only `USymbolNode`
 * (`USymbolNode.java:191-199`: height+5, width+60) and `USymbolDatabase`
 * (`USymbolDatabase.java:172-175`: height+15) override it. Read off the
 * ported `USymbol` object itself rather than re-tabulated here, so the two
 * upstream overrides stay in ONE place (`src/core/decoration/symbol/`).
 *
 * Jar-verified against `dativu-93-pona469`'s cached `svek-1.dot`: `package
 * foo <<Node>>` emits `WIDTH="79"` (`floor(19.425) + 60`) / `HEIGHT="14"`
 * (`14 + 5 - 5`); `package foo1 <<Node>>` emits `WIDTH="87"`
 * (`floor(27.213) + 60`).
 */
function titleSupp(usymbol: string | undefined, theme: Theme): { width: number; height: number } {
  if (usymbol === undefined) return { width: 0, height: 0 };
  const symbol = resolveDescriptionUSymbol(
    usymbol,
    resolveActorStyle(theme.actorStyle),
    mapComponentStyle(theme.componentStyle),
  );
  if (symbol === null) return { width: 0, height: 0 };
  return { width: symbol.suppWidthBecauseOfShape(), height: symbol.suppHeightBecauseOfShape() };
}

/** `ClusterHeader`'s title font for a class/object package cluster --
 *  `getStyle()` resolves the `package.title` style signature
 *  (`plantuml.skin`'s `package { title { FontStyle bold } }`), the SAME
 *  `TextBlock` `Cluster.java:368/432/439` draws for the visible folder-tab
 *  title -- i.e. this is not a second, independent font choice, it is the
 *  one `class-namespace-shape.ts#titleFont` already established for that
 *  render path. Duplicated rather than exported (this is the DOT-title-
 *  table's only OTHER call site) per this project's own "small enough to
 *  duplicate beats widening a module's public surface for one extra caller"
 *  precedent (state-composite-header.ts's `measureLines` doc comment). */
function namespaceTitleFont(theme: Theme): FontSpec {
  // cdd3-T21 (E3-5): `packageFontName`/`packageFontStyle` reach the
  // measured title too -- the SAME font the drawn title uses.
  return packageTitleFontSpec(theme);
}

/**
 * `ClusterHeader`'s title-table dims for a class/object package cluster:
 * `dimLabel.getWidth()`/`getHeight()` (`ClusterHeader.java:78-90`) with the
 * stereo term supplied by the caller as `stereo` (cdd2-T19b,
 * `class-cluster-header.ts#buildClusterHeaderStereo`; absent == empty) and
 * the attribute term forced to 0 (`g.getStateDescription()` -- a
 * package/namespace entity never carries state-description lines) -- a
 * class package's cluster title is always its bare display text, one line
 * (matching `class-namespace-shape.ts#getHTitle`/`getWTitle`'s identical
 * single-line assumption for the same text). `dimLabel.getWidth()` is the
 * RAW text width with NO margin (unlike `getWTitle`'s +6px folder-tab
 * margin) -- `Math.max(titleWidth, 0, 0)` reduces to `titleWidth`.
 *
 * Verified against `cidepu-54-bemo048`'s cached oracle (`test-results/
 * dot-cache/class/cidepu-54-bemo048/svek-1.dot`): "pack" at the default
 * 14pt bold measures 29.575px (`WidthTableMeasurer`); the LAYOUT builder's
 * own `Math.floor` (graph-layout-build.ts:366, NOT pre-rounded here) ->
 * 29, matching `WIDTH="29"` exactly. `computeTitleTableHeight(1, 0, 0, 14)
 * = (0+1)*14 - 5 = 9`, matching `HEIGHT="9"` exactly.
 *
 * cdd-T26: `dimLabel.getWidth()` now routes through {@link
 * namespaceTitleWidth} (the shared creole-atom-lexer sum,
 * `class-namespace-title-runs.ts`) instead of one raw `measurer.measure`
 * call, so a title carrying an unresolvable `<img:>` reference sizes its
 * `(Cannot decode)` fallback run at ITS OWN (smaller, monospace) font
 * rather than measuring the raw markup text at the title's bold font — the
 * DOT-graph half of `jabama-09-kago823`'s fix (the render half is
 * `class-namespace-shape.ts#getWTitle`). A markup-free title reduces to the
 * OLD single `measurer.measure` call exactly (one run, same font), so
 * `cidepu-54-bemo048`'s own byte-exact citation above is unaffected.
 *
 * cdd-T26 residual round: `dimLabel.getHeight()` now sums PER-LINE heights
 * (`computeTitleTableHeight`'s new `readonly number[]` form,
 * `core/cluster-title-table.ts`) instead of a hardcoded 1-line count, so a
 * `\n`-split title reserves real height for every physical line, each at
 * its OWN font size. Jar-verified `daxeno-00-kasu166`: two lines at 18pt/
 * 14pt -> `computeTitleTableHeight([18,14], 0, 0, N/A)` = 32-5=27, +15
 * (`titleSupp`'s own `<<Database>>` `suppHeightBecauseOfShape`, ALREADY
 * correctly threaded via the `usymbol` param below — the `<<Database>>`
 * shape/colour SELECTION for the cluster's own outline is a separate,
 * un-ported mechanism, cdd-T26 residual-round journal row 122) = 42,
 * matching the cached oracle `svek-1.dot`'s `HEIGHT="42"` exactly. A
 * single-line title reduces to `computeTitleTableHeight([fontSize], ...)`
 * = the OLD `computeTitleTableHeight(1, 0, 0, fontSize)` byte-identically
 * (`titleLinesHeight`'s own array-form doc comment).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:73-96
 */
export function namespaceTitleTableDims(
  display: string,
  theme: Theme,
  measurer: StringMeasurer,
  usymbol?: string,
  stereo?: { readonly width: number; readonly height: number },
): { width: number; height: number } {
  return titleTableDims(display, { theme, measurer }, { usymbol, stereo, visibility: undefined });
}

/**
 * {@link namespaceTitleTableDims} read off the namespace itself, including
 * cdd6-T3d's visibility icon: `title = mergeLR(uBlock, title, CENTER)`
 * (`ClusterHeader.java:138`) -- widths add, heights max -- BEFORE the
 * `mergeTB(stereo, title)` stack (`:78`). Jar-verified `topave-65-ceso890`:
 * `- package foo` emits `WIDTH="30" HEIGHT="10"` (`floor(19.425 + 11)`,
 * `max(14, 15) - 5`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:78-90
 */
export function namespaceTitleTableDimsFor(
  ns: Pick<Namespace, 'display' | 'usymbol' | 'visibilityModifier'>,
  theme: Theme,
  measurer: StringMeasurer,
  stereo?: { readonly width: number; readonly height: number },
): { width: number; height: number } {
  const visibility = namespaceVisibilityBlock(ns, theme);
  return titleTableDims(ns.display, { theme, measurer }, { usymbol: ns.usymbol, stereo, visibility });
}

/** cdd6-T3d: the title term of `mergeTB(stereo, title)` -- per-line heights,
 *  or, once the visibility icon is merged LEFT of them (`mergeLR`,
 *  `ClusterHeader.java:138`), the single `max(sum(lines), icon)` height. */
function mergedTitleHeights(lineHeights: number[], visibility: NamespaceVisibilityBlock | undefined): number[] {
  if (visibility === undefined) return lineHeights;
  return [
    Math.max(
      visibility.height,
      lineHeights.reduce((a, b) => a + b, 0),
    ),
  ];
}

function titleTableDims(
  display: string,
  ctx: { theme: Theme; measurer: StringMeasurer },
  opts: {
    usymbol: string | undefined;
    stereo: { readonly width: number; readonly height: number } | undefined;
    visibility: NamespaceVisibilityBlock | undefined;
  },
): { width: number; height: number } {
  const { theme, measurer } = ctx;
  const { stereo, visibility } = opts;
  const font = namespaceTitleFont(theme);
  const lines = namespaceTitleLines(measurer, theme, display);
  const width = namespaceTitleWidth(measurer, theme, display) + (visibility?.width ?? 0);
  // `nominalFontSize` (declared), never `fontSize` (measured) --
  // `ClusterHeader.java:78`'s formula is `fontSize`-based, not a measured
  // pixel height; see `NamespaceTitleLine`'s own doc comment.
  // cdd2-T19b: `dimLabel = mergeTB(stereo, title)` (`ClusterHeader.java:
  // 78-79`) -- the header stereo block (`class-cluster-header.ts`, displayed
  // stereotype + the group's own legend) stacks ABOVE the title: its height
  // joins the per-line sum, its width the max.
  const titleHeights = mergedTitleHeights(
    lines.map((l) => l.nominalFontSize),
    visibility,
  );
  const lineHeights = [...(stereo !== undefined ? [stereo.height] : []), ...titleHeights];
  // cdd-T12: `suppWidthBecauseOfShape`/`suppHeightBecauseOfShape` -- see
  // {@link titleSupp}'s own doc comment for the ClusterHeader citation.
  const supp = titleSupp(opts.usymbol, theme);
  // `font.size` still feeds the (always-0 here) `stereoLines`/`attrLines`
  // terms -- see `titleAndAttributeHeight`'s own doc comment; `lineHeights`
  // (the array form) supplies the title term directly, per-line.
  return {
    width: Math.max(width, stereo?.width ?? 0) + supp.width,
    height: computeTitleTableHeight(lineHeights, 0, 0, font.size) + supp.height,
  };
}

/**
 * cdd6-T3d (topave-65-ceso890): the folder tab's `getWTitle`/`getHTitle` and
 * title baseline for a namespace, over `ClusterHeader#getTitle()` -- the
 * SAME merged icon+title block the DOT table sizes (`Cluster.java:368`
 * passes `clusterHeader.getTitle()` to `USymbolFolder#asBig`). With a
 * visibility icon the tab widens by the block width, heightens to
 * `max(text, icon)`, and the text is centred on the merged height
 * (`TextBlockHorizontal`'s CENTER). `visibilityIconDy` is the icon glyph's top, local
 * to the title block's top (`(merged - icon) / 2` + the 4px top margin).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/USymbolFolder.java
 */
export function namespaceFolderTitle(
  ns: Pick<Namespace, 'display' | 'visibilityModifier'>,
  theme: Theme,
  measurer: StringMeasurer,
): {
  wtitle: number;
  htitle: number;
  baselineOffset: number;
  visibilityBlock?: NamespaceVisibilityBlock;
  visibilityIconDy?: number;
} {
  const wtitle = getWTitle(measurer, theme, ns.display, 0);
  const htitle = getHTitle(measurer, theme, ns.display);
  const baselineOffset = getTitleBaselineOffset(measurer, theme, ns.display);
  const visibility = namespaceVisibilityBlock(ns, theme);
  if (visibility === undefined) return { wtitle, htitle, baselineOffset };
  const textH = namespaceTitleHeight(measurer, theme, ns.display);
  const merged = Math.max(textH, visibility.height);
  return {
    wtitle: wtitle + visibility.width,
    htitle: htitle + merged - textH,
    baselineOffset: baselineOffset + (merged - textH) / 2,
    visibilityBlock: visibility,
    visibilityIconDy: (merged - visibility.height) / 2 + HEADER_VISIBILITY_TOP_MARGIN,
  };
}
