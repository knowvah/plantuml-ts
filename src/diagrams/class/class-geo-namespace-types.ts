/**
 * `NamespaceGeo` -- split out of `class-geo-types.ts` (500-line hook cap,
 * cdd-T6). A pure move: the interface below is unchanged, and
 * `class-geo-types.ts` re-exports it so no consumer's import path changed.
 */

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
   *  keep render/ink-extent theme-agnostic" precedent. */
  inkShape?: 'polygon' | 'rect';
}
