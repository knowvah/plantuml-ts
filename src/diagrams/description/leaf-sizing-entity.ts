/**
 * `EntityImageDescription.calculateDimensionSlow` routing for the
 * description engine's leaf sizer (T6/ADR-6).
 *
 * Split out of `leaf-sizing.ts` to keep that file under the project's
 * 500-line cap (S1L-a) once SI10/ADR-2 added `measureUsecaseOrActorLeaf`
 * below. `measureEntityLeaf` is the SAME faithful call
 * `leaf-sizing.ts#measureLeafNode` dispatches most USymbols through --
 * upstream's own sizing entry point, already used by the renderer.
 * `measureEntityLeaf` itself stays un-exported from the package's public
 * surface (ADR-2: the class engine calls in via
 * `measureUsecaseOrActorLeaf`, not this raw primitive).
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { measureInlineAtom } from '../../core/creole-atoms-measure.js';
import type { SpriteDimsLookup, AtomImageResolver } from '../../core/creole-atoms.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { EntityImageDescription, type EntityImageDescriptionParams } from '../../core/svek/image/EntityImageDescription.js';
import type { FontConfiguration, FontStyle } from '../../core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { resolveSvgSpriteAtom } from './render-atoms.js';
import { upstreamKeyword, mapComponentStyle, resolveActorStyle } from './renderer-symbol.js';
import { type BoxSizingOpts, type Dim, DEFAULT_SIZING_STROKE_THICKNESS } from './leaf-sizing-consts.js';

/** No style flags -- `StringBounder.calculateDimension`'s font param is narrowed to `family`/`size` only. */
const SIZING_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/** `calculateDimensionSlow` never reads forecolor/backcolor (consumed only
 *  by DRAW-time `apply`/`applyColors`, verified across every `asSmall`
 *  closure) -- any string satisfies `Paint`; documents intent, not a real
 *  color. */
const SIZING_PLACEHOLDER_COLOR = '#000000';

/**
 * Sizing-only `AtomImageResolver` factory. `width`/`height` are ALWAYS the
 * DECLARED box (T10/ADR-3: `fitToInk` retired -- fed one narrowed number to
 * both cursor advance and `Footprint`'s size). Unresolved -> 0x0.
 *
 * Dropping `fitToInk` outright widened `bootstrap-0`/`ruziru-69-xixo434`
 * (0.076372in): `Footprint` runs eagerly inside `TextBlockInEllipse`'s ctor
 * at SIZING time, and a plain `kind: 'image'` collects the FULL declared
 * box (`Footprint.ts#MyUGraphic.drawImage`), not the ink. A synthesized
 * ink-sized `URectangle` fixed the number but was measurement ink wearing a
 * draw-time costume -- rejected on review (this mission's own thesis is
 * that the divergence is architectural, not arithmetic).
 *
 * Real fix: for an SVG-backed sprite, call `render-atoms.ts
 * #resolveSvgSpriteAtom` -- the SAME `SvgNanoParser` decomposition the
 * RENDERER uses -- so `Footprint` observes actual per-shape corners, not an
 * approximation. `SpriteDims.svg` (T10) threads the raw source through the
 * EXISTING `SpriteDimsLookup` channel, so no caller signature changes.
 * Deliberately NOT sharing `makeAtomImageResolverFor` wholesale: its
 * monochrome branch rasterizes a PNG, work sizing has no use for (`href` is
 * never read for a `kind: 'image'` box) and would only cost CPU during
 * every sizing pass -- so monochrome/unresolved sprites keep today's
 * `href: ''` declared-box fallback. Verified back to widened 0.
 *
 * SI15 T6: that fallback DOES now carry `rasterWidth`/`rasterHeight` --
 * `Math.round(dims.width)`/`Math.round(dims.height)`, a cheap arithmetic
 * derivation of the already-computed declared dims, not a rasterization --
 * so `Footprint.drawImage`'s `raster − 1` corner-point branch (ADR-1) is
 * reachable from this sizing path too. `.agent-notes/si15-ink-offset.md`
 * diagnosed the prior gap: this fallback's `href: ''`-only shape left
 * `rasterWidth`/`rasterHeight` `undefined`, so the ellipse fit silently
 * used the full declared box for every monochrome-sprite label whose
 * extremal corner happened to be size-sensitive.
 *
 * Exported (SI1 T12) for `leaf-sizing-folder-title.ts`'s
 * `create2`→`BodyEnhanced1` title route — the SAME sizing resolver, one
 * construction, so a sprite/img atom in a `package` title sizes exactly
 * like one in any other routed leaf. */
export function sizingAtomImageResolverFor(
  sprites: SpriteDimsLookup | undefined,
): (font: FontConfiguration) => AtomImageResolver {
  return (font) => (atom) => {
    const dims = measureInlineAtom(atom, sprites, font.size);
    if (atom.kind === 'sprite') {
      const reg = sprites?.get(atom.name);
      if (reg?.svg !== undefined) return resolveSvgSpriteAtom(atom, reg.svg, sprites!, font);
    }
    // SI15 T6: raster dims now reach the sizing path too -- a monochrome
    // sprite's `Footprint`-driven ellipse fit needs `rasterWidth`/
    // `rasterHeight` on this fallback for the SAME reason `render-atoms.ts`
    // needs them at render time (the raster-dims gap `.agent-notes/
    // si15-ink-offset.md` diagnosed: `Footprint.drawImage`'s `raster − 1`
    // branch was unreachable from this sizing path). `Math.round(dims.width)`/
    // `Math.round(dims.height)` -- a cheap grid-derived number, NOT a PNG
    // rasterization -- matches `render-atoms.ts#resolveSpriteAtom`'s formula
    // exactly, so sizing and rendering agree bit-for-bit. `href: ''` is
    // unchanged (never read for a `kind: 'image'` box, D9's sizer/renderer
    // split).
    //
    // Gated on a REAL raster backing (ADR-1's own wording): an unresolvable
    // sprite name measures 0x0, and attaching raster dims there would make
    // `Footprint` fit against `round(0) - 1 = -1` -- a negative-extent
    // corner upstream can never produce (`StripeSimple.addSprite` skips
    // unknown names entirely, so no upstream `UImage` ever wraps a 0-size
    // raster). The render-time resolver has the same guard structurally:
    // `resolveSpriteAtom` returns `undefined` for an unknown name.
    const rasterBacked =
      ((atom.kind === 'sprite' && sprites?.get(atom.name) !== undefined) || atom.kind === 'img') &&
      dims.width > 0 &&
      dims.height > 0;
    if (!rasterBacked) return { kind: 'image', href: '', width: dims.width, height: dims.height };
    return {
      kind: 'image',
      href: '',
      width: dims.width,
      height: dims.height,
      rasterWidth: Math.round(dims.width),
      rasterHeight: Math.round(dims.height),
    };
  };
}

/** Bundles the per-diagram inputs `measureEntityLeaf`/
 *  `buildSizingEntityParams` need, keeping both under the 5-param ceiling. */
interface EntityLeafCtx {
  readonly opts: BoxSizingOpts | undefined;
  readonly sprites: SpriteDimsLookup | undefined;
  readonly measurer: StringMeasurer;
}

/** `paint.fontTitle`/`fontStereo`: the SAME `fontSpec` for both slots
 *  (pre-routing sizer's own convention) -- per-element stereotype font
 *  override is a separate, unlisted gap this task does not fix. */
function sizingFontConfig(fontSpec: FontSpec): FontConfiguration {
  return { family: fontSpec.family, size: fontSpec.size, color: null, styles: SIZING_FONT_STYLES };
}

/** `EntityImageDescriptionPaint` assembly, split out to keep
 *  `buildSizingEntityParams` under the NLOC/CCN ceiling. */
function sizingPaint(font: FontConfiguration, opts: BoxSizingOpts | undefined): EntityImageDescriptionParams['paint'] {
  return {
    forecolor: SIZING_PLACEHOLDER_COLOR,
    backcolor: SIZING_PLACEHOLDER_COLOR,
    roundCorner: 0,
    diagonalCorner: 0,
    deltaShadow: 0,
    stroke: UStroke.withThickness(DEFAULT_SIZING_STROKE_THICKNESS),
    fontTitle: font,
    fontStereo: font,
    titleAlignment: HorizontalAlignment.CENTER,
    stereotypeAlignment: HorizontalAlignment.CENTER,
    minimumWidth: opts?.minimumWidth ?? 0,
    wrapWidth: opts?.wrapWidth ?? 0,
    guillemet: opts?.guillemet ?? GUILLEMET_DEFAULT,
  };
}

/**
 * Assembles `EntityImageDescriptionParams` for ONE leaf, from exactly what
 * `BoxSizingOpts`/`DescriptiveNode` already carry — mirrors
 * `renderer-entity.ts#buildEntityParams`'s field-for-field shape (a parallel
 * assembly of the SAME params, not a call to it).
 *
 * Deliberately NOT threaded (verified draw-only, or out of write-set):
 * `forecolor`/`backcolor` (`SIZING_PLACEHOLDER_COLOR`), `roundCorner`/
 * `diagonalCorner`, `deltaShadow`/`stroke` per-element overrides (need
 * `Theme` in `layout.ts`'s `ClassifyCtx` -- T9's write-set; the DEFAULT
 * stroke IS supplied), `links`/`hexagonPolygon`, and
 * `fixCircleLabelOverlapping` (only feeds `resolveShapeType`, never
 * `calculateDimensionSlow`).
 *
 * `actorStyle` (T7): `ctx.opts?.actorStyle`, threaded from `Theme.actorStyle`
 * -- the SAME accessor the renderer reads, so an actor sizes to whichever
 * of stickman/awesome/hollow it will actually be drawn as. Falls back to
 * `ActorStyle.STICKMAN`, upstream's own default, when unset.
 */
function buildSizingEntityParams(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  ctx: EntityLeafCtx,
): EntityImageDescriptionParams {
  const font = sizingFontConfig(fontSpec);
  return {
    entity: { name: node.id, uid: '', qualifiedName: node.id, location: null, url: null },
    symbol: {
      keyword: upstreamKeyword(node.symbol),
      actorStyle: resolveActorStyle(ctx.opts?.actorStyle),
      componentStyle: mapComponentStyle(ctx.opts?.componentStyle),
    },
    labels: {
      codeName: node.display,
      displayText: node.display,
      stereotypeLabels: node.stereotype ?? [],
    },
    paint: sizingPaint(font, ctx.opts),
    links: [],
    fixCircleLabelOverlapping: false,
    atomImageResolverFor: sizingAtomImageResolverFor(ctx.sprites),
  };
}

/** The margin+icon-only baseline `measureEntityLeaf`'s `MinimumWidth` floor
 *  needs: the SAME symbol at zero content/stereotype/minimumWidth, so its
 *  width is exactly the fixed allowance real content adds on top. */
function minWidthFloorBaseline(node: DescriptiveNode, fontSpec: FontSpec, ctx: EntityLeafCtx, bounder: MeasurerStringBounder): number {
  // `stereotype` omitted, not set to `undefined` (`exactOptionalPropertyTypes`).
  const { stereotype: _dropped, ...rest } = node;
  const baselineNode: DescriptiveNode = { ...rest, display: '' };
  const baselineCtx: EntityLeafCtx = { ...ctx, opts: ctx.opts === undefined ? undefined : { ...ctx.opts, minimumWidth: 0 } };
  const params = buildSizingEntityParams(baselineNode, fontSpec, baselineCtx);
  return new EntityImageDescription(params).calculateDimensionSlow(bounder).getWidth();
}

/**
 * Routes one leaf through `EntityImageDescription.calculateDimensionSlow` --
 * upstream's own sizing entry point, ALREADY used by the renderer (ADR-6).
 *
 * `applyMinWidthFloor` (box family only): `buildDesc` (svek/, out of
 * write-set) reads `paint.minimumWidth` ONLY on its "empty desc" branch,
 * silently skipped for non-blank box text (jar-verified:
 * `component/dexigu-24-deru622`). Reproduced as a POST-STEP via
 * `minWidthFloorBaseline` (a synthetic zero-content construction of the
 * same params): `Math.max(real, minimumWidth + baseline)` -- can only
 * WIDEN, never shrink below upstream's own margin+icon, skipped when unset.
 */
export function measureEntityLeaf(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  ctx: EntityLeafCtx,
  applyMinWidthFloor: boolean,
): Dim {
  const bounder = new MeasurerStringBounder(ctx.measurer);
  const params = buildSizingEntityParams(node, fontSpec, ctx);
  const dim = new EntityImageDescription(params).calculateDimensionSlow(bounder);
  const width = dim.getWidth();
  const height = dim.getHeight();

  const minContentW = applyMinWidthFloor ? (ctx.opts?.minimumWidth ?? 0) : 0;
  if (minContentW <= 0) return { width, height };

  const baselineWidth = minWidthFloorBaseline(node, fontSpec, ctx, bounder);
  return { width: Math.max(width, minContentW + baselineWidth), height };
}

/**
 * The class engine's usecase/actor leaf-sizing entry point (SI10, ADR-2):
 * upstream sizes both symbols via `EntityImageDescription` regardless of
 * host diagram type, and that port lives in THIS engine -- external callers
 * route in here rather than reimplementing the routing decision. Synthesizes
 * the minimal `DescriptiveNode` `measureEntityLeaf` needs and calls the SAME
 * faithful path `measureLeafNode`'s own `actor`/non-`<latex>` `usecase`
 * cases use, `applyMinWidthFloor: false` to match. Callers needing
 * `stereotype`/`BoxSizingOpts` call `measureLeafNode` directly instead.
 *
 * Re-exported from `leaf-sizing.ts` (ADR-2: "leaf-sizing.ts exports ONE
 * purpose-built entry point") -- this file is an internal split, not a
 * second public entry point.
 */
export function measureUsecaseOrActorLeaf(
  display: string,
  symbol: 'usecase' | 'actor',
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): Dim {
  const node: DescriptiveNode = { id: '', display, symbol, children: [] };
  return measureEntityLeaf(node, fontSpec, { opts: undefined, sprites, measurer }, false);
}
