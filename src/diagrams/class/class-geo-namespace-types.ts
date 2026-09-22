/**
 * `NamespaceGeo` -- split out of `class-geo-types.ts` (500-line hook cap,
 * cdd-T6). A pure move: the interface below is unchanged, and
 * `class-geo-types.ts` re-exports it so no consumer's import path changed.
 *
 * cdd-T12 added three CARRY-ONLY fields (`usymbol`/`color`/`url`) -- verbatim
 * copies of the same-named `Namespace` AST fields T11 landed, taken in
 * `class-geo-builders.ts#namespaceGeoFromBox` so the render phase reads one
 * geo object instead of re-reaching into the AST (the same "copy at the
 * builder, keep render AST-free" convention `label`/`creationIndex` already
 * follow).
 */
import type { UrlInfo } from './class-url.js';

export interface NamespaceGeo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** G2 N17: the folder-tab's own title-tab width/height, pre-computed at
   *  layout time (`class-namespace-shape.ts#getWTitle`/`getHTitle`) -- the
   *  render phase stays a pure `geometry -> SVG string` function with no
   *  `StringMeasurer` of its own, matching `ClassifierGeo.rows[].text`'s
   *  established "measure once, at layout time" convention. */
  wtitle: number;
  htitle: number;
  /** G2 N17: pre-computed title baseline Y offset (relative to `y`) --
   *  see `class-namespace-shape.ts#getTitleBaselineOffset`'s doc comment. */
  baselineOffset: number;
  /** G2 N2 (mechanism 3): parse-time creation order, copied unchanged from
   *  `Namespace.creationIndex`. */
  creationIndex?: number;
  /** G2 N60 (item 42): which klimt shape `Cluster#drawU` draws this
   *  namespace's outline as -- determines its `LimitFinder` ink rule
   *  (`layout-ink-extent.ts#addNamespaceInk`'s own doc comment carries the
   *  full jar-verified mechanism). `undefined` is the common case (default
   *  FOLDER style, non-`strictuml`): jar draws a rounded-arc `UPath`
   *  (`USymbolFolder#asBig`'s `roundCorner!=0` branch), which gets the
   *  PLAIN ink rule (`addPlainInk`, no correction needed -- this is what
   *  every namespace got before N60). `'polygon'`: FOLDER style WITH
   *  `strictuml` (`roundCorner=0` forces the sharp-corner `UPolygon`
   *  branch, `renderNamespaceFolder`'s own `theme.strictUml === true`
   *  gate) -- needs `LimitFinder#drawUPolygon`'s `HACK_X_FOR_POLYGON=10`
   *  x-padding. `'rect'`: `skinparam packageStyle rect` (`USymbolRectangle`
   *  draws a plain `URectangle`) -- needs the classic `-1` min/max inset,
   *  NOT the polygon hack. Computed once at layout time
   *  (`class-geo-builders.ts#buildNamespaceGeos`) from `theme.packageStyle`/
   *  `theme.strictUml`, mirroring `wtitle`/`htitle`'s own "resolve once,
   *  keep render/ink-extent theme-agnostic" precedent.
   *
   *  cdd-T12 adds two USymbol-container rules, both read off the drawn
   *  `asBig` primitives directly: `'node'` (`USymbolNode#drawNode`,
   *  `USymbolNode.java:71-92` -- a `UPolygon`, so the same
   *  `HACK_X_FOR_POLYGON` x-padding, PLUS a trailing `ug.apply(new
   *  UTranslate(0, height)).draw(new UEmpty(10, 10))` at `:90` whose
   *  `LimitFinder#drawEmpty` rule, `LimitFinder.java:159-162`, reserves 10px
   *  BELOW the box) and `'database'` (`USymbolDatabase#drawDatabase` -- a
   *  `UPath` (plain rule) plus `ug.apply(new UTranslate(width,
   *  height)).draw(new UEmpty(10, 10))`, reserving 10px right AND below). */
  inkShape?: 'polygon' | 'rect' | 'node' | 'database';
  /** cdd-T12 (diagnosis A2b E3): the group's own USymbol keyword, copied
   *  from `Namespace.usymbol` (`ast.ts`). Drives BOTH the DOT title-table
   *  supplement (`class-namespace-title-table.ts`, `ClusterHeader.java:
   *  87-94`'s `suppWidthBecauseOfShape`/`suppHeightBecauseOfShape`) and the
   *  drawn cluster outline (`class-namespace-shape.ts#renderNamespaceUSymbol`,
   *  `ClusterDecoration.java:66-91`'s `guess` + `symbol.asBig`). `undefined`
   *  is the common case: a plain `package`/`namespace` keeps the folder-tab
   *  outline `renderNamespaceFolder` already draws. */
  usymbol?: string;
  /** cdd-T12 (diagnosis A3 M3): the header's own inline `#COLOR` background
   *  override, copied from `Namespace.color` (already resolved to its
   *  bare/`back:` half at parse time -- see that field's doc comment). Read
   *  AHEAD of the global `theme.colors.graph.packageBackground` fallback,
   *  mirroring `Cluster.java:360-362`'s `group.getColors()`-first back-color
   *  resolution. */
  color?: string;
  /** cdd-T12 (diagnosis A2b E4): the header's own `[[url]]`, copied from
   *  `Namespace.url`. Consumed by `renderer-group.ts#wrapCluster`, which
   *  opens the `<a>` INSIDE the `<g class="cluster">` and before the
   *  decoration (`Cluster.java:337-341,379-382`). */
  url?: UrlInfo;
}
