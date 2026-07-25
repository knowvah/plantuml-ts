/**
 * class-shadow.ts — mission skin-file-loading (deferred D3 item, CLASS-
 * scoped): the `<filter>` def markup for a class diagram's drop shadow, as
 * a plain STRING (class's own renderer emits SVG strings directly, not via
 * klimt's `XmlNode`-based `SvgGraphics` — see `renderer.ts`'s own file doc
 * comment: "Pure function: ClassGeometry + Theme -> SVG string").
 *
 * Reproduces `svg-graphics-shadow.ts#buildShadowFilter` byte-for-byte (jar-
 * verified against nimana-36-veco708's canonical SVG, state mission Batch
 * 2) rather than importing it — the klimt module builds an `XmlNode`
 * appended to a live `<defs>` document, an entirely different emission
 * shape from this module's plain string. `state/state-shadow.ts` is the
 * SAME content again, duplicated for the SAME reason (its own doc comment):
 * this codebase's established convention for identical markup across the
 * klimt-vs-string-emission split is per-module duplication, not a shared
 * import — there is no natural shared module to hang a plain-string-vs-
 * XmlNode emitter off of, and state/class are independent diagram engines
 * (no existing cross-engine import precedent to extend).
 *
 * Fixed shape, NOT parameterized by the resolved shadow value — see
 * `state-shadow.ts`'s own doc comment for the full jar citation
 * (`SvgGraphics#manageShadow`/`addFilter` hardcodes `stdDeviation="2"`/
 * `dx="4"`/`dy="4"` regardless of `deltaShadow`; the value only gates
 * WHETHER a shape gets `filter="url(#...)"` at all, and how much ink/
 * viewport `LimitFinder#drawRectangle` reserves).
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java (manageShadow, addFilter)
 * @see svg-graphics-shadow.ts#buildShadowFilter (the klimt-path twin)
 * @see ../state/state-shadow.ts (the identical string-emission twin)
 */

/** Fixed, deterministic id — ONE shadow filter per diagram, referenced by
 *  every shadowed classifier box's own `filter="url(#...)"`. See
 *  `state-shadow.ts#STATE_SHADOW_FILTER_ID`'s own doc comment for why a
 *  fixed literal (not jar's own per-render random hash) satisfies
 *  decisions.md D5's "id-normalized" bar. */
export const CLASS_SHADOW_FILTER_ID = 'classShadow';

/** Jar's `SHADOW_COLOR_MATRIX_VALUES` — feColorMatrix's alpha-only
 *  passthrough that dims the blurred copy to the drop-shadow's translucent
 *  gray. Duplicated per this module's own "per-emission-shape constant"
 *  convention (see file doc comment). */
const SHADOW_COLOR_MATRIX_VALUES = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0';

/**
 * The shared `<filter>` def — appended into `renderClass`'s own `extraDefs`
 * accumulator exactly once per diagram, gated on `theme.shadowing !==
 * undefined && theme.shadowing > 0` (the SAME diagram-level "is any shape
 * in this diagram shadowed at all" gate `state-shadow.ts
 * #buildStateShadowFilterDef`'s own doc comment establishes).
 */
export function buildClassShadowFilterDef(): string {
  return (
    `<filter id="${CLASS_SHADOW_FILTER_ID}" x="-1" y="-1" width="300%" height="300%">` +
    `<feGaussianBlur result="blurOut" stdDeviation="2"/>` +
    `<feColorMatrix type="matrix" in="blurOut" result="blurOut2" values="${SHADOW_COLOR_MATRIX_VALUES}"/>` +
    `<feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/>` +
    `<feBlend in="SourceGraphic" in2="blurOut3" mode="normal"/>` +
    `</filter>`
  );
}

/** `filter="${classShadowFilterUrl()}"` — the reference every shadowed
 *  classifier box's own `<rect>` carries (`renderer-classifier-box.ts
 *  #buildHeaderPrimitive`'s `geo.shadowing > 0` gate). */
export function classShadowFilterUrl(): string {
  return `url(#${CLASS_SHADOW_FILTER_ID})`;
}
