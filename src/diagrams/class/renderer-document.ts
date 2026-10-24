/**
 * The class document's composition around its body: the scaled theme, the
 * colour mapper, the document background and `<defs>` preamble, and the
 * returned `RenderFragment`'s fields. Moved out of `renderer.ts#renderClass`
 * unchanged (cdd8 T3a) so the svek body and the ELK body
 * (`renderer-elk.ts`) are composed by ONE implementation: upstream wraps both
 * makers' `TextBlock` in the same exporter (`net/atmp/CucaDiagram.java:462-485`
 * picks the maker, `core/TextBlockExporter.java:159-180` draws either).
 */
import type { ClassGeometry } from './layout.js';
import type { Theme } from '../../core/theme.js';
import { scaleClassTheme, type ScaledTheme } from './class-scale-geo.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { applyColorMapperToFragment, colorMapperOf } from '../../core/klimt/color/fragment-color-mapper.js';
import { buildClassShadowFilterDef } from './class-shadow.js';

/** `net.sourceforge.plantuml.core.DiagramType#CLASS` -- verified against
 *  every cached jar class-diagram fixture's `data-diagram-type` root
 *  attribute (e.g. `test-results/dot-cache/class/bajotu-30-soku184/in.svg`).
 *  T8: was `class/renderer-shell.ts`'s own copy of this constant. */
const DIAGRAM_TYPE_CLASS = 'CLASS';

/** What {@link beginClassDocument} resolves once per document. */
export interface ClassDocument {
  readonly theme: ScaledTheme;
  readonly colorMapper: ((hex: string) => string) | undefined;
  readonly canonicalBackground: string;
  /** The document-level `<defs>` payload: the path-hover rule and the shadow filter. */
  readonly extraDefs: string;
  readonly documentBackgroundRect: string | undefined;
}

/** The body half of the fragment, which the svek and ELK renderers each draw. */
export interface ClassDocumentBody {
  readonly body: string;
  readonly width: number;
  readonly height: number;
  /** The body's own defs, appended after the document's. */
  readonly extraDefs: string;
}

/** G2 N40: `skinparam pathHoverColor <color>` -- a global CSS hover rule,
 *  the SAME `<style type="text/css"><![CDATA[path:hover{...}]]></style>`
 *  shape `core/klimt/drawing/svg/svg-graphics-core.ts#getPathHover`
 *  already ports as shared (but unwired) machinery -- class's own
 *  string-based `<defs>` assembly (this file's established "class-local
 *  pure-string wrapping" precedent, N2) reproduces it directly rather
 *  than routing through klimt. Jar-verified `dasagu-52-vani172`. */
function pathHoverDef(theme: ScaledTheme, colorMapper: ClassDocument['colorMapper']): string {
  if (theme.colors.graph.pathHoverColor === undefined) return '';
  const resolvedHoverHex = resolveColorToSvgHex(theme.colors.graph.pathHoverColor);
  const hoverHex = colorMapper !== undefined ? colorMapper(resolvedHoverHex) : resolvedHoverHex;
  return `<style type="text/css"><![CDATA[path:hover { stroke: ${hoverHex} !important;}]]></style>`;
}

/**
 * The document preamble `renderClass` opens with.
 */
export function beginClassDocument(geo: ClassGeometry, rawTheme: Theme): ClassDocument {
  // cdd-T29 R2 (D4/journal row 175): `index.ts`'s `render(geo, theme)` call
  // site (outside this task's write-set) passes the UNSCALED theme
  // unchanged -- this is the one remaining seam that can turn it into a
  // `ScaledTheme` for every render-time pixel-literal constant this file's
  // call tree carries (mirrors `sequence/scale-geo.ts`'s identical
  // `scaleSequenceTheme` derivation).
  // unwind2-S11: the layout's `sprite` map rides `Theme#sprites`, as
  // `layoutClass` laid it out (a cluster title's `<$sprite>`).
  const skinTheme = geo.sprites === undefined ? rawTheme : { ...rawTheme, sprites: geo.sprites };
  const theme = scaleClassTheme(skinTheme, geo.scaleK ?? 1);
  // G2 N61: `skinparam monochrome true|reverse` applies to the document
  // background too (jar's `ColorMapper` is universal, not scoped to
  // entity/link colors) -- transformed HERE so every downstream reader of
  // `canonicalBackground` (the returned `background` field, the
  // `documentBackgroundRect` derivation below) sees the already-mapped
  // value, matching `fragment-color-mapper.ts`'s own "single choke point"
  // design (see that file's header doc comment).
  // cdd6 T3f: the mapper is `muteColorMapper`'s whole choice --
  // `monochrome`, else `reversecolor` (`fragment-color-mapper.ts#colorMapperOf`).
  const colorMapper = colorMapperOf(theme);
  const resolvedBackground = resolveColorToSvgHex(theme.colors.background);
  const canonicalBackground = colorMapper !== undefined ? colorMapper(resolvedBackground) : resolvedBackground;
  // mission skin-file-loading (deferred D3 item): ONE shared shadow filter
  // def per diagram, gated on the SAME `theme.shadowing > 0` diagram-level
  // check `class-shadow.ts#buildClassShadowFilterDef`'s own doc comment
  // establishes (mirrors `state/renderer.ts`'s identical Batch-2 gate) --
  // byte-identical (empty extraDefs) for every pre-mission/shadow-off
  // fixture.
  const shadowDef = theme.shadowing !== undefined && theme.shadowing > 0 ? buildClassShadowFilterDef() : '';
  // G2 N4/N48: full-canvas background rect, ONLY for a non-default
  // (non-black, non-white, non-transparent) background -- see
  // `renderClass`'s own doc comment for the jar-verified exclusion list and
  // evidence. N48: NOT drawn into the body -- jar's rect spans the FINAL
  // (post-chrome, post-document-margin) canvas and is the outer `<g>`'s
  // FIRST child even when a title/header/footer/legend/caption sits ABOVE
  // the diagram body (jar-verified `xalaco-64-vuzu312`: `<rect x="0" y="0"
  // width="81" height="213".../>` precedes `<g class="title">`). Threaded
  // instead as `documentBackgroundRect` on the fragment;
  // `core/assemble-svg.ts`'s class finalize function (which runs AFTER
  // chrome/margin) draws it at the correct final size and position
  // (jar-verified unchanged: `bovuze-89-noja934`).
  const documentBackgroundRect =
    canonicalBackground !== '#00000000' && canonicalBackground !== '#000000' && canonicalBackground !== '#FFFFFF'
      ? canonicalBackground
      : undefined;
  return {
    theme,
    colorMapper,
    canonicalBackground,
    extraDefs: pathHoverDef(theme, colorMapper) + shadowDef,
    documentBackgroundRect,
  };
}

/**
 * The fragment `renderClass` returns, from the document and its drawn body.
 */
export function finishClassDocument(doc: ClassDocument, geo: ClassGeometry, drawn: ClassDocumentBody): RenderFragment {
  const extraDefs = doc.extraDefs + drawn.extraDefs;
  const theme = doc.theme;
  return {
    // G2 N61: the single monochrome choke point -- see `fragment-color-mapper.ts`'s
    // own header doc comment for why a post-processing pass over the WHOLE
    // assembled fragment (rather than threading `theme.monochrome` through
    // every individual color-resolution call site) is the correct, low-risk
    // mirror of jar's real universal `ColorMapper` semantics. No-op when
    // `theme.monochrome` is `undefined` (every fixture that doesn't set this
    // skinparam is byte-identical to pre-N61 output).
    body: applyColorMapperToFragment(drawn.body, doc.colorMapper),
    width: drawn.width,
    height: drawn.height,
    background: doc.canonicalBackground,
    ...(extraDefs.length > 0 ? { extraDefs } : {}),
    // G2 N46: pre-margin/pre-quirk ink dims, present only when
    // `assembleShiftedGeometry` computed them (`ClassGeometry.rawWidth`'s
    // own doc comment) -- `core/annotations/chrome.ts#applyChrome` uses
    // these (not `width`/`height` above) as the chrome-composition
    // "original" size, and `index.ts#applyAnnotationChrome`'s class branch
    // re-applies the document margin/quirk to chrome's own output.
    ...(geo.rawWidth !== undefined && geo.rawHeight !== undefined
      ? { preChromeWidth: geo.rawWidth, preChromeHeight: geo.rawHeight }
      : {}),
    // G2 N48: see {@link beginClassDocument} -- drawn by
    // `core/assemble-svg.ts`'s class finalize function at the FINAL
    // (post-chrome) canvas size, not here.
    ...(doc.documentBackgroundRect !== undefined ? { documentBackgroundRect: doc.documentBackgroundRect } : {}),
    // G2 N66: `skinparam diagramBorderColor` -- resolved to an SVG-ready
    // hex HERE (mirrors `canonicalBackground`'s own resolution), drawn by
    // `core/assemble-svg.ts`'s class finalize function
    // (`RenderFragment.diagramBorderColor`'s own doc comment for the
    // chrome-scope guard).
    ...(theme.colors.graph.diagramBorderColor !== undefined
      ? { diagramBorderColor: resolveColorToSvgHex(theme.colors.graph.diagramBorderColor) }
      : {}),
    // lad-T1b: `TextBlockExporter.java:306-307` -- `skinparam lengthAdjust` is the
    // document's `SvgOption` (`SkinParam.java:1258-1269`), read by
    // `SvgGraphics.java:155-158,699-705`. Spread only when defined (D4).
    ...(theme.lengthAdjust !== undefined ? { lengthAdjust: theme.lengthAdjust } : {}),
    diagramType: DIAGRAM_TYPE_CLASS,
  };
}
