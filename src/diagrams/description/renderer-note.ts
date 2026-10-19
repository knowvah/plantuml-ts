/**
 * renderer-note.ts -- `EntityImageNote#drawU` for a description `note` leaf,
 * split out of `renderer-entity.ts` (at the 500-line cap).
 *
 * One `<g class="entity">` group holds the outline polygon, the fold and the
 * body text, in that order (`EntityImageNote.java:154-157` `ug.startGroup`
 * ... `:233` `ug.closeGroup()`; `drawNormal`/`Opale#drawU` draw all three
 * inside it). The shape comes from `renderer-note-opale.ts#drawNoteShape`.
 *
 * Paints (`EntityImageNote.java:100-108`): the fill is the entity's own `#color`
 * BACK when set, else the style `BackGroundColor` -- the note's `<<stereotype>>`
 * `.tag` sub-selector (`getStyleSignature().withTOBECHANGED(getStereo())`), then
 * the bare `note {}` bucket, then `plantuml.skin`'s `#FEFFDD`
 * (`theme.colors.noteBackground`). The border is the style `LineColor`; an
 * inline `line:` token is NOT read for a note.
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java:154-233 (drawU)
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java:272-286 (drawNormal)
 */
import { bareEntityName } from './namespace-groups.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { Theme } from '../../core/theme.js';
import { resolveElementFontSize, resolveElementLineThickness } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UGraphicStencil } from '../../core/klimt/drawing/UGraphicStencil.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { textFont } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import { buildNoteBody } from '../../core/svek/image/leaf-sizing.js';
import { NOTE_FONT_SIZE } from '../../core/svek/image/leaf-sizing-consts.js';
import { OPALE_MARGIN_Y as NOTE_MARGIN_Y } from '../../core/svek/image/Opale.js';
import { cleanStereotypeToken } from '../../core/style-map-tag-cascade.js';
import {
  decorateEntityDrawing,
  type EntityDecorationInfo,
  type UGraphicWithGroups,
} from '../../core/svek/DecorateEntityImage.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';
import { parseColorOverride } from './renderer-color-override.js';
import { drawNoteShape, NOTE_STROKE_WIDTH, type NotePaints } from './renderer-note-opale.js';

/** Upstream: `EntityImageNote.java`'s `marginX1 = 6` (`drawNormal`'s
 *  `ug.apply(new UTranslate(marginX1, marginY))`), jar-verified against
 *  `component/basetu-75-xevi153` (box left 127.62, text x 133.62) and
 *  `component/fojamu-08-veku866` (every line of a 3-line note shares x offset
 *  6.0 -- `HorizontalAlignment.LEFT`). */
const NOTE_MARGIN_X = 6;

/** Narrows `ug` to `UGraphicWithGroups` (see `renderer-entity.ts#requireGroups`). */
function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('renderer-note: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}

/**
 * The note body's own font (`EntityImageNote.java:111`'s `style
 * .getFontConfiguration(...)`): family/color/styles exactly as `textFont`
 * resolves them, but the SIZE falls back to `NOTE_FONT_SIZE` (13,
 * `plantuml.skin:312-313`'s `note { FontSize 13 }`) rather than to the
 * diagram-wide `theme.fontSize` (14). `resolveElementFontSize(theme, 'note',
 * 'title')` is the SAME call `layout.ts#ClassifyCtx.fontSizeFor` makes, so a
 * `<style> note { FontSize N }` override moves box and ink together.
 */
function noteFont(theme: Theme): FontConfiguration {
  return { ...textFont(theme, 'note'), size: resolveElementFontSize(theme, 'note', 'title') ?? NOTE_FONT_SIZE };
}

/** The creole body block both note kinds draw (`BodyFactory.create3` over the `note` font). */
export function buildNoteBlock(display: string, theme: Theme, sprites: SpriteRegistry | undefined): TextBlock {
  return buildNoteBody(display, noteFont(theme), {
    wrapWidth: theme.wrapWidth,
    guillemet: {
      start: theme.colors.graph.guillemetStart ?? GUILLEMET_DEFAULT.start,
      end: theme.colors.graph.guillemetEnd ?? GUILLEMET_DEFAULT.end,
    },
    atomImageResolverFor: makeAtomImageResolverFor(sprites),
  });
}

/** `.tag` sub-selector fill for the note's `<<stereotype>>` labels
 *  (`core/style-map-tag-cascade.ts#computeNoteStyleTagCascade`). */
function tagBackground(theme: Theme, labels: readonly string[]): Paint | undefined {
  const cascade = theme.colors.noteTagCascade;
  if (cascade === undefined) return undefined;
  // The FIRST label with a value wins (StyleSignatureBasic.java:119-132; DarkString.java:50-57).
  for (const label of labels) {
    const hit = cascade[cleanStereotypeToken(label)]?.background;
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/** `EntityImageNote.java:100-108`: see the module doc comment. */
export function resolveNotePaints(node: DescriptionNodeGeo, theme: Theme): NotePaints {
  const override = node.color !== undefined ? parseColorOverride(node.color) : {};
  const bucket = theme.colors.elements?.['note'];
  const styled = tagBackground(theme, node.styleStereotype ?? node.stereotype ?? []) ?? bucket?.background;
  const back = override.back ?? (styled !== undefined ? resolveStyled(styled) : theme.colors.noteBackground);
  const thickness = resolveElementLineThickness(theme, 'note') ?? NOTE_STROKE_WIDTH;
  return { back, border: bucket?.border ?? theme.colors.border, stroke: UStroke.withThickness(thickness) };
}

/** A `<style>` colour NAME needs `HColorSet` resolution; a gradient passes through. */
function resolveStyled(paint: Paint): Paint {
  return typeof paint === 'string' ? resolveColorToSvgHex(paint) : paint;
}

/**
 * `EntityImageNote#drawU`: the entity group around the shape, fold and body.
 * The stencil is built over the note's OWN box before the margin translate
 * (`UGraphicStencil.create(ug, this, UStroke.simple())`, java:207) -- REQUIRED
 * for a body separator (`--`/`==`/`..`/`__`), whose `UHorizontalLine` is only
 * ever intercepted by an `AbstractUGraphicHorizontalLine` wrapper.
 */
export function drawNote(
  ug: UGraphic,
  node: DescriptionNodeGeo,
  theme: Theme,
  uid: string,
  sprites: SpriteRegistry | undefined,
): void {
  const info: EntityDecorationInfo = { name: bareEntityName(node.id), qualifiedName: node.id, uid, location: null };
  const paints = resolveNotePaints(node, theme);
  const block = buildNoteBlock(node.display, theme, sprites);
  decorateEntityDrawing(
    requireGroups(ug),
    info,
    {
      drawU(inner: UGraphic): void {
        const ug2 = UGraphicStencil.create(inner, new XDimension2D(node.width, node.height));
        drawNoteShape(ug2, node, paints);
        // The text draws on the note's `Back` and `Fore` (`drawNormal` :279,
        // `Opale.drawU` :107 apply `bg` then `border`), so a sprite atom tints
        // from the first and a block separator (`UHorizontalLine`) takes the
        // second. `Opale.drawU` (:123-124) strokes the graphic BEFORE the text;
        // `drawNormal` strokes only the polygon, leaving the default width 1
        // (jar: separator `<line>`s in a plain note carry `stroke-width:1`).
        const coloured = ug2.apply(new Back(paints.back)).apply(new Fore(paints.border));
        const textUg = node.opale === undefined ? coloured : coloured.apply(paints.stroke);
        block.drawU(textUg.apply(new UTranslate(NOTE_MARGIN_X, NOTE_MARGIN_Y)));
      },
    },
    { withComment: false },
  );
}
