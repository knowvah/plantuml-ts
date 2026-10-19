/**
 * renderer-entity.ts — T17: assembles `EntityImageDescription` (T14) for
 * one leaf `DescriptionNodeGeo` and draws it through klimt, translated to
 * its absolute layout position (`SvekResult.java:87`'s
 * `image.drawU(ug2.apply(new UTranslate(minX, minY)))` — flat, absolute
 * positioning; no coordinate-space nesting inside a parent container's
 * `<g>`, matching the jar's own flat draw order — see `renderer.ts`'s
 * module doc comment).
 *
 * `note` and `port` have no upstream `USymbol`/`EntityImageDescription`
 * mapping (`EntityImageNote`/`EntityImagePort` are separate, unported draw
 * classes — see `renderer-symbol.ts#resolveSymbol`'s doc comment) and draw
 * through a small local klimt-primitive fallback instead, preserving the
 * pre-T17 renderer's basic visual shape (rect + text) without upstream's
 * exact chrome. Documented approximation, not a T17 acceptance blocker
 * (neither symbol appears in the T17 zero-diff conformance fixture).
 */
import { bareEntityName } from './namespace-groups.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { Theme } from '../../core/theme.js';
import { resolveElementPaint, resolveElementShadowing, resolveElementLineThickness } from '../../core/theme.js';
import {
  resolveElementMinimumWidth,
  resolveElementRoundCorner,
  stereotypeFontColor,
} from '../../core/theme-element-resolve.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';
import {
  EntityImageDescription,
  type EntityImageDescriptionParams,
  type EntityImageDescriptionStereotypeSprite,
} from '../../core/svek/image/EntityImageDescription.js';
import { titleAlignmentFor } from '../../core/svek/image/leaf-sizing-entity.js';
import { buildTextBlock } from '../../core/svek/image/EntityImageDescriptionSupport.js';
import {
  decorateEntityDrawing,
  type EntityDecorationInfo,
  type UGraphicWithGroups,
} from '../../core/svek/DecorateEntityImage.js';
import {
  upstreamKeyword,
  mapComponentStyle,
  textFont,
  stereotypeTextFont,
  entityTitleStyles,
  resolveActorStyle,
} from '../../core/decoration/symbol/usymbol-resolve.js';
import { type SpriteRegistry, spriteDimsLookupFor } from '../../core/sprite-commands.js';
import { resolveStereotypeSprite } from '../../core/svek/image/EntityImageDescriptionDelegates.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import { drawNote } from './renderer-note.js';
import { parseColorOverride, lineStyleStroke, type ColorOverride } from './renderer-color-override.js';

/** Jar-verified default entity corner radius / stroke width for the
 *  rectangle-family `USymbol`s (`test-results/dot-cache/component/
 *  sacuso-94-gugi476/in.svg`: `rx="2.5" ry="2.5"`,
 *  `style="stroke:...;stroke-width:0.5;"`). A uniform baseline across every
 *  `USymbol` — some (ellipse/actor families) ignore `roundCorner` entirely,
 *  matching upstream's own per-symbol `SymbolContext` consumption.
 *
 *  Value is 5.0, not the jar's rendered `rx="2.5"`: `driver-rectangle-svg
 *  .ts` halves `roundCorner` at serialization (`rx: rx / 2`, mirroring
 *  upstream `URectangle`'s own convention — see that driver's note), so a
 *  `roundCorner` of 5 emits `rx="2.5"`. */
const ENTITY_ROUND_CORNER = 5.0;
const ENTITY_STROKE_WIDTH = 0.5;
/** Stereotype text style flags — italic only, SAME size as the entity
 *  title (`klimt/font/FontParam.java`'s `*_STEREOTYPE` entries, e.g.
 *  `COMPONENT_STEREOTYPE(14, UFontFace.italic())` vs `COMPONENT(14, ...)`
 *  — see `renderer-symbol.ts#textFont`'s doc comment, G1 I2 finding: a
 *  prior `theme.fontSize - 2` delta here was not faithful to the jar). */
const STEREOTYPE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.ITALIC]);

/** Narrows `ug` to `UGraphicWithGroups` (duplicated locally per this
 *  codebase's established one-helper-per-call-site convention — see
 *  `Cluster.ts`/`EntityImageDescription.ts`'s own identical helpers). */
function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('renderer-entity: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}

/** Business actor/use-case fill: upstream draws these two symbols with a
 *  dedicated `businessActorFill`/`businessUsecaseFill` skinparam (the legacy
 *  `renderer-helpers.ts` read the same `theme.colors.graph.*` fields, and the
 *  `<style> actor { business { BackGroundColor } }` block writes there), NOT
 *  the generic element background `resolveElementPaint` resolves. Returns
 *  `undefined` for every other symbol so the caller falls back to the generic
 *  path. */
function businessBackcolor(theme: Theme, symbol: DescriptionNodeGeo['symbol']): string | undefined {
  if (symbol === 'actor-business') return theme.colors.graph.businessActorFill;
  if (symbol === 'usecase-business') return theme.colors.graph.businessUsecaseFill;
  return undefined;
}

/** `LinkStyle.getStroke3()` (decoration/LinkStyle.java:97-107) — the
 *  three fixed dash patterns upstream uses for `line.dashed`/`.dotted`/
 *  `.bold`, all with `nonZeroThickness()` = 1 (no thickness override
 *  syntax reaches entity declarations). Falls back to this renderer's
 *  default entity stroke when no line-style override is present. */
function overrideStroke(
  lineStyle: ColorOverride['lineStyle'],
  defaultThickness: number = ENTITY_STROKE_WIDTH,
): UStroke {
  // No inline line-style override: the element's own resolved LineThickness
  // (`skin rose`'s `componentDiagram { node { LineThickness 1.5 } }`) stands
  // in for the built-in `ENTITY_STROKE_WIDTH` default -- the dashed/dotted/
  // bold branches keep their fixed upstream thicknesses (LinkStyle.getStroke3).
  return lineStyleStroke(lineStyle) ?? UStroke.withThickness(defaultThickness);
}

/** Renderer-side twin of `leaf-sizing-entity.ts#spriteLabel` — the registry is
 *  narrowed through `spriteDimsLookupFor` so both producers ask the SAME
 *  lookup (`planning/sizer-renderer-parity.md`). */
function spriteLabel(
  node: DescriptionNodeGeo,
  sprites: SpriteRegistry | undefined,
): { stereotypeSprite?: EntityImageDescriptionStereotypeSprite } {
  const lookup = sprites === undefined ? undefined : spriteDimsLookupFor(sprites);
  const resolved = resolveStereotypeSprite(node.stereotypeSprite, lookup);
  return resolved === undefined ? {} : { stereotypeSprite: resolved };
}

export function buildEntityParams(
  node: DescriptionNodeGeo,
  theme: Theme,
  sprites: SpriteRegistry | undefined,
): EntityImageDescriptionParams {
  // Style comes from the FULL stereotype list; only the printed labels are filtered (EntityImageDescription.java:151-159,193).
  const stereotypeLabels = node.stereotype ?? [];
  const styleLabels = node.styleStereotype ?? stereotypeLabels;
  const override = node.color !== undefined ? parseColorOverride(node.color) : {};
  // cdd3-T28 (E3-14): `fcTitle` (styleTitle, bold for `package`) vs `fc`
  // (style) -- java:172-173; `buildDesc` draws a label that differs from the
  // code name in `fontBody`.
  // `<sname>FontColor<<label>>` is a stereotype-signed style (+1000 priority), over the plain element font colour.
  const titleColor = stereotypeFontColor(theme, node.symbol, 'title', styleLabels);
  const stereoColor = stereotypeFontColor(theme, node.symbol, 'stereotype', styleLabels);
  const recolor = (font: FontConfiguration, color: string | undefined): FontConfiguration =>
    color === undefined ? font : { ...font, color };
  const fontTitle = recolor(textFont(theme, node.symbol, 0, entityTitleStyles(node.symbol)), titleColor);
  const fontBody = recolor(textFont(theme, node.symbol), titleColor);
  const fontStereo = recolor(stereotypeTextFont(theme, node.symbol, styleLabels, STEREOTYPE_STYLES), stereoColor);
  // D3 (cdd6 T1b/T2f): this entity's own resolved LineThickness -- the SAME
  // value `paint.stroke` below draws the body's border with -- doubles as
  // the sprite decomposition's ambient stroke seed (`SvgNanoParser.java
  // :187-215#applyFillAndStroke` only overrides the CALLER's active stroke
  // when the path declares its own `stroke-width`; `plantuml.skin:93`
  // `element { LineThickness 0.5 }` for a card/state body, `:15`'s root
  // `1.0` for a note -- `SpritePrimitiveCollector.create`'s own doc
  // comment). Computed ONCE and reused by both `paint.stroke` and
  // `atomImageResolverFor` below, so the body border and its own sprite
  // atoms can never disagree on this entity's ambient thickness.
  const lineThickness = resolveElementLineThickness(theme, node.symbol) ?? ENTITY_STROKE_WIDTH;
  return {
    entity: { name: bareEntityName(node.id), uid: '', qualifiedName: node.id, location: null, url: node.url ?? null },
    symbol: {
      keyword: upstreamKeyword(node.symbol),
      actorStyle: resolveActorStyle(theme.actorStyle),
      componentStyle: mapComponentStyle(theme.componentStyle),
    },
    labels: {
      // cdd3-T28 (E3-14): `codeDisplay` = `entity.getName()` (java:180) --
      // the leaf id, which the sizer's `measureShownFolderTitle(node.id, ...)`
      // already reads; `buildDesc`'s package/empty branch compares it.
      codeName: node.id,
      displayText: node.display,
      stereotypeLabels,
      // Same resolution the sizer performed (`leaf-sizing-entity.ts
      // #spriteLabel`), through the SAME `SpriteDimsLookup` narrowing, so the
      // drawn sprite cannot differ from the measured one.
      ...spriteLabel(node, sprites),
    },
    paint: {
      // EntityImageDescription.java:152-166: `<<labels>>` re-sign the style.
      forecolor: override.line ?? resolveElementPaint(theme, node.symbol, 'border', styleLabels),
      backcolor:
        override.back ??
        businessBackcolor(theme, node.symbol) ??
        resolveElementPaint(theme, node.symbol, 'background', styleLabels),
      roundCorner: resolveElementRoundCorner(theme, node.symbol) ?? ENTITY_ROUND_CORNER,
      diagonalCorner: 0,
      // mission skin-file-loading (deferred D3 item): was hardcoded 0 --
      // `EntityImageDescription.ts:251`'s `.withShadow(params.paint
      // .deltaShadow)` already draws the shadow given a nonzero value (the
      // klimt `LimitFinder`/`SvgGraphics` shadow machinery is shared,
      // jar-verified byte-exact); this was the entity-leaf call site
      // suppressing it. `resolveElementShadowing` cascades this entity's
      // OWN USymbol bucket (`skinparam <sname> { Shadowing N }`) over the
      // diagram-wide `theme.shadowing` (`skin rose`/`<style> element {
      // Shadowing N } }`), matching jar's `EntityImageDescription`-family
      // shared `getStyle().getShadowing()` read. Jar-verified
      // malado-53-noso561.
      deltaShadow: resolveElementShadowing(theme, node.symbol, styleLabels),
      stroke: overrideStroke(override.lineStyle, lineThickness),
      fontTitle: override.text !== undefined ? { ...fontTitle, color: override.text } : fontTitle,
      fontBody: override.text !== undefined ? { ...fontBody, color: override.text } : fontBody,
      fontStereo: override.text !== undefined ? { ...fontStereo, color: override.text } : fontStereo,
      titleAlignment: titleAlignmentFor(node.symbol, {
        own: theme.colors.elements?.[node.symbol]?.horizontalAlignment,
        root: theme.colors.elements?.root?.horizontalAlignment,
      }),
      minimumWidth: resolveElementMinimumWidth(theme, node.symbol) ?? 0,
      stereotypeAlignment: HorizontalAlignment.CENTER,
      ...(theme.wrapWidth !== undefined ? { wrapWidth: theme.wrapWidth } : {}),
      guillemet: {
        start: theme.colors.graph.guillemetStart ?? GUILLEMET_DEFAULT.start,
        end: theme.colors.graph.guillemetEnd ?? GUILLEMET_DEFAULT.end,
      },
    },
    links: [],
    fixCircleLabelOverlapping: theme.fixCircleLabelOverlapping === true,
    // D3 (cdd6 T1b/T2f): forward this entity's own resolved LineThickness
    // as the sprite decomposition's ambient stroke -- see `lineThickness`'s
    // own doc comment above.
    atomImageResolverFor: makeAtomImageResolverFor(sprites, UStroke.withThickness(lineThickness)),
    // Same store the sizer measured through (`layout-helpers.ts`), off the
    // same registry — a one-sided wiring would draw a glyph the ellipse was
    // not fitted to (`planning/sizer-renderer-parity.md`).
    ...(sprites?.emoji === undefined
      ? {}
      : { emojiArtwork: (unicode: string): string | undefined => sprites.emoji?.get(unicode) }),
    ...(node.symbol === 'hexagon' ? { hexagonPolygon: null } : {}),
  };
  // #lizard forgives -- pre-existing entity-params assembly (one object
  // literal, no branching); porting discipline forbids restructuring
  // faithfully-ported code during an unrelated change.
}

/** Jar-verified port box border thickness (`EntityImagePort
 *  .getUStroke()`, svek/image/EntityImagePort.java:139-141) -- FIXED at
 *  1.5, independent of `ENTITY_STROKE_WIDTH`'s 0.5 (the regular-entity
 *  default) and of any `#line:`/`line.dashed` override (upstream's
 *  `drawU` never reads `getEntity().getColors()`'s stroke override for a
 *  port -- only backcolor/bordercolor). */
const PORT_STROKE_WIDTH = 1.5;

/** `EntityImagePort.drawU` (svek/image/EntityImagePort.java:99-137): draws
 *  the port's OWN display text (`getDesc()` — `leaf.getDisplay()`, i.e.
 *  `node.display`, CENTER-aligned) positioned above or below the port's
 *  small square box (never inside it — the box stays a fixed
 *  `RADIUS*2` square regardless of label width), THEN the box itself —
 *  text first, box second, matching the jar's own child order (`<text>`
 *  before `<rect>` in every jar-cached port fixture). Horizontal
 *  centering: `x = 0 - (dimDesc.width - node.width) / 2`. Vertical side:
 *  `node.portLabelAbove` (set once, at layout time, by `layout.ts
 *  #applyPortLabelPositions` — see that field's doc comment; `undefined`
 *  — a port with no resolved parent cluster, not reachable from any real
 *  `parseDescription()` output — defaults to the "below" branch, same as
 *  upstream's own `false` case). Fill/border: the entity's inline colours
 *  first, then the `resolveElementPaint` cascade (`sname: 'port'`, jar-verified
 *  `#F1F1F1`/`#181818` by default), NOT `theme.colors.border` for both. */
function drawPortFallback(ug: UGraphic, node: DescriptionNodeGeo, theme: Theme, uid: string): void {
  const info: EntityDecorationInfo = { name: bareEntityName(node.id), qualifiedName: node.id, uid, location: null };
  const font = textFont(theme, 'port');
  // EntityImagePort.java:121-130: inline colours, then the port style + `<<labels>>`.
  const override = node.color !== undefined ? parseColorOverride(node.color) : {};
  const stereotypes = node.styleStereotype ?? node.stereotype ?? [];
  const fill = override.back ?? resolveElementPaint(theme, 'port', 'background', stereotypes);
  const border = override.line ?? resolveElementPaint(theme, 'port', 'border', stereotypes);
  decorateEntityDrawing(
    requireGroups(ug),
    info,
    {
      drawU(inner: UGraphic): void {
        const desc = buildTextBlock(node.display, font, HorizontalAlignment.CENTER);
        const dimDesc = desc.calculateDimension(inner.getStringBounder());
        const x = -(dimDesc.getWidth() - node.width) / 2;
        const y = node.portLabelAbove === true ? -(node.height + dimDesc.getHeight()) : node.height;
        desc.drawU(inner.apply(new UTranslate(x, y)));
        const rect = URectangle.build(node.width, node.height);
        inner.apply(new Fore(border)).apply(new Back(fill)).apply(UStroke.withThickness(PORT_STROKE_WIDTH)).draw(rect);
      },
    },
    { withComment: false },
  );
}

/** Draws one leaf entity, translated to its absolute layout position.
 *  Text measurement (dual-measurer conformance seam) is NOT threaded as a
 *  function parameter here — `EntityImageDescription.drawU`/its internal
 *  `TextBlock`s read the active measurer from `ug.getStringBounder()`
 *  (the single render-phase injection seam, `renderer.ts`'s
 *  `UGraphicSvg.build` call). See `EntityImageDescriptionSupport.ts`'s
 *  `buildTextBlock` doc comment for why this is safe (lazy — no
 *  measurement happens before a `ug`/`stringBounder` is available). */
export function drawEntity(
  ug: UGraphic,
  node: DescriptionNodeGeo,
  theme: Theme,
  uid: string,
  sprites?: SpriteRegistry,
): void {
  const translated = ug.apply(new UTranslate(node.x, node.y));
  if (node.symbol === 'note') {
    drawNote(translated, node, theme, uid, sprites);
    return;
  }
  if (node.symbol === 'port') {
    drawPortFallback(translated, node, theme, uid);
    return;
  }
  const params = buildEntityParams(node, theme, sprites);
  new EntityImageDescription({ ...params, entity: { ...params.entity, uid } }).drawU(translated);
}
