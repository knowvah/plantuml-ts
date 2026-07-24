/**
 * state-shadow.ts — mission skin-file-loading Batch 2 (D3's rendering half,
 * STATE-scoped): the `<filter>` def markup for a state diagram's drop
 * shadow, as a plain STRING (state's own renderer emits SVG strings
 * directly, not via klimt's `XmlNode`-based `SvgGraphics`).
 *
 * Reproduces `svg-graphics-shadow.ts#buildShadowFilter` byte-for-byte (that
 * module's own doc comment: jar-verified against nimana-36-veco708's
 * canonical SVG) rather than importing it — the klimt module builds an
 * `XmlNode` appended to a live `<defs>` document, an entirely different
 * emission shape from this module's plain string, so duplication (not
 * reuse) is this codebase's established convention for the SAME markup
 * across the klimt vs string-emission split (`STATE_BOX_RX`'s own "per-
 * module constant" precedent, `renderer-box.ts`/`renderer-composite-
 * box.ts`).
 *
 * Fixed shape, NOT parameterized by the resolved shadow value: jar's own
 * `SvgGraphics#manageShadow`/`addFilter` (`~/git/plantuml/.../klimt/
 * drawing/svg/SvgGraphics.java:1046-1066`) hardcodes `stdDeviation="2"`/
 * `dx="4"`/`dy="4"` regardless of the `deltaShadow` value passed in --
 * `deltaShadow` only gates WHETHER a shape gets `filter="url(#...)"` at all
 * (`> 0`) and how much `LimitFinder#drawRectangle`/`ensureVisible` widen the
 * shape's own ink/viewport reservation (`2 * deltaShadow`) -- verified by
 * reading `manageShadow`'s body directly: the filter element construction
 * takes no `deltaShadow` parameter at all. So ONE filter def, independent
 * of the diagram's resolved `theme.shadowing` magnitude, covers every
 * shadowed shape in a diagram (mirrors `manageShadow`'s own `withShadow`
 * once-per-document dedup, reproduced here as "define once at the document
 * root defs, reference by id everywhere").
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java (manageShadow, addFilter)
 * @see svg-graphics-shadow.ts#buildShadowFilter (the klimt-path twin)
 */

/** Fixed, deterministic id -- ONE shadow filter per diagram, referenced by
 *  every shadowed shape's own `filter="url(#...)"`. Jar's own id is a
 *  per-render random hash (`shadowId`, not reproduced here) -- the SVG-
 *  conformance harness normalizes attribute VALUES structurally but this
 *  fixture (nimana-36-veco708) is a DOT-level size-backlog target, not an
 *  SVG-byte pin, so an exact id match is not required; "id-normalized"
 *  (decisions.md D5) means self-consistent (def id === every reference),
 *  which a fixed literal trivially satisfies. */
export const STATE_SHADOW_FILTER_ID = 'stateShadow';

/** Jar's `SHADOW_COLOR_MATRIX_VALUES` (`svg-graphics-shadow.ts`'s own
 *  duplicated copy of the SAME literal) -- feColorMatrix's alpha-only
 *  passthrough that dims the blurred copy to the drop-shadow's translucent
 *  gray. */
const SHADOW_COLOR_MATRIX_VALUES = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0';

/**
 * The shared `<filter>` def -- pass into `svgRoot`'s `extraDefs` (or
 * `RenderFragment.extraDefs`) exactly once per diagram, gated on
 * `theme.shadowing !== undefined && theme.shadowing > 0` (the SAME "is any
 * shape in this diagram shadowed at all" question `manageShadow`'s own
 * `deltaShadow !== 0` gate answers upstream — state resolves ONE shadowing
 * value per diagram via the theme cascade, mission skin-file-loading Batch
 * 1, so a diagram-level gate is equivalent to per-shape gating here).
 */
export function buildStateShadowFilterDef(): string {
  return (
    `<filter id="${STATE_SHADOW_FILTER_ID}" x="-1" y="-1" width="300%" height="300%">` +
    `<feGaussianBlur result="blurOut" stdDeviation="2"/>` +
    `<feColorMatrix type="matrix" in="blurOut" result="blurOut2" values="${SHADOW_COLOR_MATRIX_VALUES}"/>` +
    `<feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/>` +
    `<feBlend in="SourceGraphic" in2="blurOut3" mode="normal"/>` +
    `</filter>`
  );
}

/** `filter="${stateShadowFilterUrl()}"` -- the reference every shadowed
 *  shape's own `<rect>` carries (`addFilterShadowId`'s `deltaShadow > 0`
 *  gate, reproduced at each call site via `node.shadowing`). */
export function stateShadowFilterUrl(): string {
  return `url(#${STATE_SHADOW_FILTER_ID})`;
}
