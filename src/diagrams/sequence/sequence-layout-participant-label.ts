/**
 * sequence-layout-participant-label.ts — a participant head's LABEL: its
 * stereotype rows, its creole runs (sprites included, cdd7 T1f), its badge
 * and the paints its box is filled and stroked with.
 *
 * Split out of `sequence-layout-participants.ts` when cdd7 T1f pushed that
 * file further past the repo's 500-line cap — a pure move, the same reason
 * `sequence-layout-participant-sizing.ts` split off before it. Column
 * geometry (widths, x solve, bottom-align) stays in the parent module.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:80-92
 */

import type { Participant, ParticipantBadge, ParticipantGeo, TextRun } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { paintOfGeo, participantPaintsOf } from './sequence-participant-paints.js';
import {
  componentLabelBlock,
  offsetRun,
  strokeOfPaint,
  type LabelBlock,
  type LabelInk,
} from './sequence-creole-sheet.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import {
  parseCircledCharDecoration,
  parseCircledSpriteDecoration,
  resolveBadgeRadius,
  splitStereotypeLabels,
  wrapGuillemet,
} from '../../core/stereotype-decoration.js';
import {
  DB_TEXT_PADDING_X,
  participantLabelCy,
  participantLabelMetricsOf,
} from './sequence-layout-participant-sizing.js';
import { displayLines } from './text-block-geo.js';
import { getMargin as queueMargin } from '../../core/decoration/symbol/USymbolQueue.js';
import { DEFAULT_SPOT_FONT_SIZE } from '../../core/spot-glyph-data.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { getSpriteMonochrome } from '../../core/sprite-registry.js';
import { spriteToPngDataUri, spriteMonochromeAsLike } from '../../core/klimt/sprite/sprite-raster.js';

/** Theme + measurer + the diagram's sprite registry, bundled so the column
 *  builders stay inside the project's 5-parameter cap. Mirrors
 *  `EventProcessingContext`'s own role in `sequence-layout-events.ts`. */
export interface ParticipantLayoutCtx {
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  readonly sprites: SpriteRegistry | undefined;
}

/**
 * The DISPLAYED labels of a `<<...>>` run, guillemet-wrapped.
 *
 * `StereotypeDecoration#buildComplex` rewrites each chunk to just its LABEL
 * group, dropping the `(CHAR[,COLOR])` / `($sprite[,COLOR])` badge spec that
 * introduced it (`:143-182`) -- so `<< ($APIGateway, #CC2264) APIGateway >>`
 * displays as `«APIGateway»`, the jar's own text for `birocu-87-xubi808`. It
 * yields ONE label per chunk, so a stacked `<<A>><<B>>` is two rows and
 * 3-bracket `<<<X>>>` chunks are invisible. `core/stereotype-decoration.ts`
 * is that port, shared rather than duplicated.
 */
function stereotypeLabels(raw: string): string[] {
  return splitStereotypeLabels(stereotypeInner(raw)).map((l) => wrapGuillemet(l));
}

/** The text inside the outermost guillemets, which is what every
 *  `stereotype-decoration.ts` entry point takes (each reconstructs the
 *  `<<...>>` wrapper itself). */
function stereotypeInner(raw: string): string {
  return raw.replace(/^<</, '').replace(/>>$/, '');
}

/**
 * The visible stereotype labels; none when the merged style hides them
 * (`sequence-participant-paints.ts#ParticipantPaints.showStereotype`).
 */
export function visibleStereotypeLines(p: Participant): readonly string[] {
  if (p.stereotype === undefined || !participantPaintsOf(p).showStereotype) return [];
  return stereotypeLabels(p.stereotype);
}

/**
 * A head's text block, as the participant row reads it: `labelRows` hands
 * back the ONE block `Display#createStereotype` builds over the whole display
 * (`Display.java:671-690`) as its only entry, so a caller maxing the widths
 * and summing the heights reads `getPureTextWidth`/the block height
 * (`AbstractTextualComponent.java:94-114`).
 */
interface LabelRow {
  readonly runs: readonly TextRun[];
  readonly width: number;
  readonly height: number;
}

/** A head's display before measurement (`Participant#getDisplay`,
 *  `Participant.java:124-135`): its visible stereotype labels, in the
 *  stereotype font, then its own lines in the name font. */
export interface HeadDisplay {
  readonly stereotypeLines: readonly string[];
  readonly lines: readonly string[];
  readonly font: FontConfiguration;
  readonly stereoFont: FontConfiguration;
  /** `Participant.stereotypePositionTop` false (`Participant.java:128-131`). */
  readonly stereotypeBottom?: boolean | undefined;
  /** `Participant#getDisplay(true)` = `Display#underlined` (`Participant.java
   *  :125-126`): the name lines carry `<u>`, the stereotype rows do not. */
  readonly underlined?: boolean | undefined;
}

/** `"<u>" + line` (`Display.java:462-469`). */
export function underlineLine(line: string): string {
  return `<u>${line}`;
}

/**
 * A head's display: the visible stereotype labels, then the display's own
 * lines (`Display#createStereotype` -> `getCreole(fc, ..., stereotypeConfiguration)`,
 * `Display.java:671-689`; the stereotype rides first, `Participant.java:127-128`).
 */
export function headRowsOf(
  stereotypeLines: readonly string[],
  display: string,
  fonts: {
    readonly font: FontConfiguration;
    readonly stereoFont: FontConfiguration;
    readonly stereotypeBottom?: boolean | undefined;
    readonly underlined?: boolean | undefined;
  },
): HeadDisplay {
  // `Display#underlined` prefixes every (already split) line (`Display.java:462-469`).
  const lines = displayLines(display);
  return { stereotypeLines, lines: fonts.underlined === true ? lines.map(underlineLine) : lines, ...fonts };
}

/** How a head's block is drawn: its `Back` (the sprite tint start), its ink
 *  and its margins (`style.getPadding()`, `ComponentRoseParticipant.java:71`
 *  -> `AbstractTextualComponent.java:91`). */
interface HeadDraw {
  /** `getHorizontalAlignment()` (`AbstractTextualComponent.java:81`), the
   *  sheet's: `participant { HorizontalAlignment center }` by default
   *  (`plantuml.skin:199`). */
  readonly align?: HorizontalAlignment;
  readonly ink?: LabelInk | undefined;
  readonly marginX1?: number;
  readonly marginX2?: number;
}

/** The head's ONE text block (module doc of `sequence-creole-sheet.ts`, "The
 *  participant head"). */
function headBlock(head: HeadDisplay, ctx: ParticipantLayoutCtx, draw: HeadDraw = {}): LabelBlock {
  const stereotype = { labels: head.stereotypeLines, font: head.stereoFont, bottom: head.stereotypeBottom };
  return componentLabelBlock(head.lines, head.font, { sprites: ctx.sprites, stereotype, ...draw }, ctx.measurer);
}

/** A head's block as the participant row reads it -- see {@link LabelRow}.
 *  `backColor` is the `Back` the label is drawn on. */
export function labelRows(head: HeadDisplay, ctx: ParticipantLayoutCtx, backColor?: Paint): readonly LabelRow[] {
  const block = headBlock(head, ctx, { ink: { back: backColor } });
  return [{ runs: block.primitives, width: block.width, height: block.height }];
}

/**
 * `TextBlockSprited` -- the gap between the badge and the label block beside
 * it: the sprite draws at the block origin and the parent text block is
 * translated right by `sprite.width + 6.0` (`TextBlockSprited.java:65-67,76`).
 * Jar-verified on `birocu-87-xubi808`: a 64-wide image at x=179.938 puts its
 * label at x=249.938, and 249.938 - (179.938 + 64) = 6.
 */
export const BADGE_GAP = 6;

/**
 * The sprite BADGE a participant's stereotype declares, rasterised.
 *
 * `Participant#getDisplay` folds the `Stereotype` into the display
 * (`:125-136`), and `Display#createStereotype` wraps the text block in a
 * `TextBlockSprited` carrying `stereotype.getSprite(spriteContainer)`
 * (`Display.java:671-689`). `undefined` when the run declares no sprite or the
 * name does not resolve -- upstream's `getSprite` returns null there and the
 * plain text block draws unchanged. The circled-CHARACTER badge takes the
 * other arm of that same `if` and is {@link charBadgeFor}'s.
 */
function badgeFor(
  p: Participant,
  sprites: SpriteRegistry | undefined,
  background: Paint,
): ParticipantBadge | undefined {
  if (p.stereotype === undefined || sprites === undefined) return undefined;
  const deco = parseCircledSpriteDecoration(stereotypeInner(p.stereotype));
  if (deco === undefined) return undefined;
  const sprite = getSpriteMonochrome(sprites, deco.name);
  if (sprite === undefined) return undefined;
  // `spriteToRgba`'s gradient runs backColor -> fontColor, mirroring
  // `toUImage`'s `gradient(backcolor, color)` (`SpriteMonochrome.java:191`).
  // `Stereotype#getSprite` passes `asTextBlock(getHtmlColor(), null, ...)`
  // (`:116`) and `asTextBlock#drawU` resolves `color = forcedColor ?? fontColor`
  // (`:215`), so the END is the stereotype's DECLARED colour -- or black when
  // it declares none (`buildComplex`'s `htmlColor = col == null ?
  // HColors.BLACK : col`, already `spriteToRgba`'s default).
  //
  // The START is `ug.getParam().getBackcolor()`, i.e. whatever the box is
  // filled with, so the sprite blends into it. Sourced from the same
  // value `renderParticipantBox` paints the box with -- the merged style's
  // `BackGroundColor` (`birocu-87-xubi808`: `#FF0` from `<style> participant
  // { BackgroundColor }`). Passing these two the other way round tints every
  // sprite toward the TEXT colour.
  const png = spriteToPngDataUri(
    spriteMonochromeAsLike(sprite),
    deco.color,
    // A gradient background has no single start colour to blend from; the
    // rasteriser's own default (white) stands in, which is also upstream's
    // when `getBackcolor()` yields nothing usable
    // (`SpriteMonochrome.java:181-182`).
    typeof background === 'string' ? background : undefined,
    deco.scale,
  );
  return { kind: 'sprite', dataUri: png.dataUri, width: png.width, height: png.height };
}

/**
 * The circled-CHARACTER badge -- `Display#createStereotype`'s other arm,
 * taken when `stereotype.isSpotted()` (`Display.java:673-676`). Its radius is
 * `SkinParam#getCircledCharacterRadius()` (`:548-551`), shared with the class
 * engine via `core/stereotype-decoration.ts`.
 */
function charBadgeFor(p: Participant, theme: Theme): ParticipantBadge | undefined {
  if (p.stereotype === undefined) return undefined;
  const deco = parseCircledCharDecoration(stereotypeInner(p.stereotype));
  if (deco === undefined) return undefined;
  const fontSize = theme.colors.graph.circledCharacterFontSize ?? DEFAULT_SPOT_FONT_SIZE;
  const r = resolveBadgeRadius(fontSize, theme.colors.graph.circledCharacterRadius);
  return { kind: 'char', color: deco.color, width: r * 2, height: r * 2, character: deco.char, fontSize };
}

/** Either badge form, sprite first -- `createStereotype` tries the sprite
 *  before the circled character (`Display.java:671-676`). */
export function anyBadgeFor(
  p: Participant,
  ctx: ParticipantLayoutCtx,
  background: Paint,
): ParticipantBadge | undefined {
  return badgeFor(p, ctx.sprites, background) ?? charBadgeFor(p, ctx.theme);
}

/**
 * The ink a head's label is drawn under (unwind2-S7: its `Back`, a sprite's
 * tint start). `participant` and `collections` are `ComponentRoseParticipant`,
 * which applies the line colour and the box fill, strokes the box, then
 * resets to `UStroke.simple()` before `textBlock.drawU`
 * (`ComponentRoseParticipant.java:93-118`; `Rose.java:136-150`) -- the ink a
 * `----` rule in the head is drawn with. `queue` draws its label inside
 * `USymbolQueue#asSmall` after `symbolContext.apply(ug)` (`USymbolQueue.java:
 * 141,147`), the style's stroke. The stickman kinds (`ComponentRoseActor.java
 * :75,78`, `Boundary`, `Control`, `Entity`, `Database`) draw the label on the
 * head's own `ug`, which carries no back -- jar-verified white
 * (`tests/fixtures/unwind2-S7/s-actor`).
 */
function labelInk(p: ParticipantGeo, paint: SequencePaint): LabelInk | undefined {
  if (p.type === 'participant' || p.type === 'collections')
    return { fore: paint.stroke, back: p.background, stroke: UStroke.simple() };
  if (p.type !== 'queue') return undefined;
  return { fore: paint.stroke, back: p.background, stroke: strokeOfPaint(paint) };
}

/** The kinds whose component is `ComponentRoseActor`'s shape: a glyph with
 *  the text block stacked against it, padding `(0, 3, 0, 3)`. */
function isStickKind(type: ParticipantGeo['type']): boolean {
  return type === 'actor' || type === 'boundary' || type === 'control' || type === 'entity' || type === 'database';
}

/**
 * The name block's horizontal centre. `ComponentRoseParticipant` draws the
 * text block at `padding.getTranslate()` inside the FRONT rectangle, which is
 * `getTextWidth` wide (`ComponentRoseParticipant.java:101-111,118`), so
 * the block spans `[x + left, x + width - delta - right]` -- `delta` being
 * `getDeltaCollection()` (`:121-126`).
 *
 * The stick kinds draw it at `getTextMiddlePostion` = `(getPreferredWidth -
 * getTextWidth) / 2` with `getTextWidth` = block + 3 + 3
 * (`ComponentRoseActor.java:75,85`, `AbstractTextualComponent.java:106-108`),
 * so the block's LEFT edge is that offset and the padding is never added to
 * it: the centre sits 3 left of the column's. `queue` draws it inside
 * `USymbolQueue#asSmall` at `margin.getX1()` (`USymbolQueue.java:147`),
 * `delta` being 0 because the glyph is the component's width
 * (`ComponentRoseQueue.java:67,77`).
 *
 * `blockWidth` is the whole text block's, badge included (`TextBlockSprited
 * .java:62`), `badgeWidth` the part of it left of the rows.
 */
function nameCenterX(p: ParticipantGeo, paint: SequencePaint, blockWidth: number, badgeWidth: number): number {
  if (p.type === 'queue') return p.x + queueMargin().getX1() + badgeWidth + (blockWidth - badgeWidth) / 2;
  if (isStickKind(p.type)) {
    const left = (p.width - (blockWidth + DB_TEXT_PADDING_X * 2)) / 2;
    return p.x + left + badgeWidth + (blockWidth - badgeWidth) / 2;
  }
  if (p.type !== 'participant' && p.type !== 'collections') return p.centerX;
  // The block is drawn at `padding.getTranslate()` (`ComponentRoseParticipant
  // .java:121`) at its OWN width, never the box's: a `MinimumWidth` box is
  // wider than it (`:139-142`), and the text stays at the left padding.
  // The badge, when any, takes the block's left `badgeWidth` (`TextBlockSprited.java:70-77`).
  return p.x + paint.padding.getLeft() + badgeWidth + (blockWidth - badgeWidth) / 2;
}

/**
 * A participant head's label, as placed and measured runs (A3, C4).
 * `birocu-87-xubi808` box 1 is the reference: box x=55.575 w=107.363 y=46
 * h=42, `«APIGateway»` at x=62.575 w=93.363 baseline 63.889, `OnlyLabel` at
 * x=77.713 w=63.087 baseline 77.889 — both centred on 109.2565, one line
 * apart. Three derivations, all upstream's:
 *
 *   1. The block's vertical CENTRE is `participantLabelCy` (`ComponentRose*
 *      #drawInternalU`), and the rows stack from its top downward,
 *      `y += height` per stripe (`SheetBlock1.java:139-142`).
 *   2. A row's BASELINE is its own line box's top plus its measured ascent:
 *      row centre 60 gives `60 - 14/2 + 10.889 = 63.889`, 74 gives 77.889.
 *   3. A row's LEFT edge is its alignment inside the block ({@link rowLeft});
 *      centred by default (`plantuml.skin:199`). C4: `width` is the ROW's,
 *      so a row of several runs moves as one block.
 *
 * `p` is the painted box (`participantBoxOf`); `stereoFont` is
 * `ParticipantPaints.stereoFont` (`sequence-participant-paints.ts`). `hide stereotype` is resolved
 * upstream (`visibleStereotypeLines`), so an absent row is an absent entry.
 */
export function buildLabelRuns(
  p: ParticipantGeo,
  ctx: ParticipantLayoutCtx,
  stereoFont: FontConfiguration,
): readonly TextRun[] {
  const paint = paintOfGeo(p);
  const head = headRowsOf(p.stereotypeLines ?? [], p.display, {
    font: paint.font,
    stereoFont,
    stereotypeBottom: p.stereotypeBottom,
    underlined: p.underlined,
  });
  const block = headBlock(head, ctx, {
    align: paint.align ?? HorizontalAlignment.CENTER,
    ink: labelInk(p, paint),
    marginX1: paint.padding.getLeft(),
    marginX2: paint.padding.getRight(),
  });
  const badgeWidth = p.badge === undefined ? 0 : p.badge.width + BADGE_GAP;
  // `TextBlockSprited#calculateDimension`: width = rows + sprite + 6, height =
  // max(sprite, rows) (`TextBlockSprited.java:55-62`).
  const blockHeight = Math.max(p.badge?.height ?? 0, block.height);
  const cx = nameCenterX(p, paint, block.width + badgeWidth, badgeWidth);
  // The block's TOP is `cy - blockHeight / 2`: the sprite draws at the block
  // origin and the parent text block at the same y (`TextBlockSprited.java:
  // 70-77`), so the rows start at the block top, not centred on it. The sheet
  // aligns each stripe inside the block (`SheetBlock1#initMap`), so the
  // block moves as one.
  const cy = participantLabelCy(p.type, p.height, p.y, true, participantLabelMetricsOf(paint, 1, blockHeight));
  return block.primitives.map((run) => offsetRun(run, cx - block.width / 2, cy - blockHeight / 2));
}
