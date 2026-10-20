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
import { sequenceAtomContext, sequenceCreoleRuns, type SequenceAtomContext } from './sequence-creole.js';
import {
  parseCircledCharDecoration,
  parseCircledSpriteDecoration,
  resolveBadgeRadius,
  splitStereotypeLabels,
  wrapGuillemet,
} from '../../core/stereotype-decoration.js';
import {
  participantBadgeGeo,
  participantLabelCy,
  participantLabelMetricsOf,
} from './sequence-layout-participant-sizing.js';
import { displayLines, TRANSPARENT_SVG } from './text-block-geo.js';
import { COLLECTIONS_DELTA } from './renderer-participant-symbol.js';
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
 * ONE head row, measured: its creole runs and the box they occupy.
 *
 * C4: a row is no longer one string at one width. `AbstractTextualComponent`
 * builds every label through `display.create0(fc, ..., CreoleMode.FULL, ...)`
 * (`java:80-92`) -- `Display` -> `Creole` -> `Stripe` -> `Atom` -- and
 * `DriverTextSvg#draw` emits one `<text>` per atom, so the jar draws
 * `The <b>Famous</b> Bob` as three (`kofuti-29-goti188`).
 *
 * `width` is the LAST run's RIGHT EDGE, never a sum. `height`/`ascent` are
 * the tallest run and the deepest ascent -- `Sea#doAlign` baseline-aligning
 * one stripe's atoms (`SheetBlock1.java:130-137`); an image run (a sprite,
 * cdd7 T1f) reports its box above the baseline as its ascent, so a sprite
 * taller than the text pushes the baseline down and both share the row's
 * bottom (`sequence-creole.ts#imageAtomRun`). All three equal the old
 * `measure('M')` pair for a row whose runs share the ambient font, which is
 * what keeps a markup-free head byte-identical. Runs are placed at `(0, 0)`:
 * a row's width is not known until its runs are, so the caller translates the
 * whole row by one dx (D4's centring, over the ROW's width, not each run's).
 */
interface LabelRow {
  readonly runs: readonly TextRun[];
  readonly width: number;
  readonly height: number;
  readonly ascent: number;
}

/** One head row before measurement: its text and the font it is set in. */
export interface HeadRow {
  readonly text: string;
  readonly font: FontConfiguration;
}

/**
 * A head's rows in DRAW order: the visible stereotype labels in the
 * stereotype font, then the display's own lines in the name font
 * (`Display#createStereotype` -> `getCreole(fc, ..., stereotypeConfiguration)`,
 * `Display.java:671-689`).
 */
export function headRowsOf(
  stereotypeLines: readonly string[],
  display: string,
  fonts: { readonly font: FontConfiguration; readonly stereoFont: FontConfiguration },
): readonly HeadRow[] {
  return [
    ...stereotypeLines.map((text) => ({ text, font: fonts.stereoFont })),
    ...displayLines(display).map((text) => ({ text, font: fonts.font })),
  ];
}

/** A head's rows, measured. The box's width, its height and its placed runs
 *  all come from this ONE list: a disagreement between any two is text
 *  overhanging its own box. */
export function labelRows(rows: readonly HeadRow[], ctx: ParticipantLayoutCtx, backColor?: Paint): readonly LabelRow[] {
  return rows.map((row) => {
    const atomContext = labelAtomContext(ctx, row.font, backColor);
    const runs = sequenceCreoleRuns(row.text, row.font, { leftX: 0, baselineY: 0 }, ctx.measurer, atomContext);
    const last = runs.at(-1);
    return {
      runs,
      width: last === undefined ? 0 : last.x + last.textWidth,
      height: Math.max(0, ...runs.map((r) => r.textLineHeight)),
      ascent: Math.max(0, ...runs.map((r) => r.textAscent)),
    };
  });
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
  const r = resolveBadgeRadius(theme.colors.graph.circledCharacterFontSize, theme.colors.graph.circledCharacterRadius);
  return { kind: 'char', color: deco.color, width: r * 2, height: r * 2 };
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
 * What a head's creole needs to draw `<$sprite>`/`<img>` atoms (cdd7 T1f):
 * the diagram's sprites and the row's font colour, which `AtomSprite` tints
 * a monochrome sprite with (`StripeSimple.java:228-235`). `undefined` with no
 * registry -- the pre-T1f whole-line literal, unchanged.
 */
function labelAtomContext(
  ctx: ParticipantLayoutCtx,
  font: FontConfiguration,
  backColor: Paint | undefined,
): SequenceAtomContext | undefined {
  return sequenceAtomContext(ctx.sprites, font.color ?? TRANSPARENT_SVG, backColor);
}

/**
 * The `Back` a head's label is drawn on (unwind2-S7). `participant` and
 * `collections` are `ComponentRoseParticipant`, which applies the box fill
 * before `textBlock.drawU` (`ComponentRoseParticipant.java:96-97,118`;
 * `Rose.java:136-150`); `queue` draws its label inside `USymbolQueue#asSmall`
 * after `symbolContext.apply(ug)` (`USymbolQueue.java:141,147`). The
 * stickman kinds (`ComponentRoseActor.java:75,78`, `Boundary`, `Control`,
 * `Entity`, `Database`) draw the label on the head's own `ug`, which carries
 * no back -- jar-verified white (`tests/fixtures/unwind2-S7/s-actor`).
 */
function labelBackColor(p: ParticipantGeo): Paint | undefined {
  return p.type === 'participant' || p.type === 'collections' || p.type === 'queue' ? p.background : undefined;
}

/**
 * One run moved from its row's `(0, 0)` origin to `(dx, baseline)`. An image
 * run's top is ABSOLUTE (`SequenceRunImage.y`), so it moves by the same
 * vertical delta as the baseline it was placed against.
 */
function translateRun(run: TextRun, dx: number, baselineY: number): TextRun {
  const moved = { ...run, x: run.x + dx, y: baselineY };
  if (run.image === undefined) return moved;
  return { ...moved, image: { ...run.image, y: run.image.y + baselineY - run.y } };
}

/**
 * The name block's horizontal centre. `ComponentRoseParticipant` draws the
 * text block at `padding.getTranslate()` inside the FRONT rectangle, which is
 * `getTextWidth` wide (`ComponentRoseParticipant.java:101-111,118`), so
 * the block spans `[x + left, x + width - delta - right]` -- `delta` being
 * `getDeltaCollection()` (`:121-126`). Every other kind keeps its column
 * centre.
 */
function nameCenterX(p: ParticipantGeo, paint: SequencePaint): number {
  if (p.type !== 'participant' && p.type !== 'collections') return p.centerX;
  const delta = p.type === 'collections' ? COLLECTIONS_DELTA : 0;
  const left = p.x + paint.padding.getLeft();
  return (left + p.x + p.width - delta - paint.padding.getRight()) / 2;
}

/**
 * A row's left edge in a block centred on `cx`, by the style's
 * `HorizontalAlignment` (`AbstractTextualComponent.java:81,89-92`): the
 * sheet aligns each stripe inside the block's widest one.
 */
function rowLeft(rowWidth: number, cx: number, blockWidth: number, align: HorizontalAlignment | undefined): number {
  if (align === HorizontalAlignment.LEFT) return cx - blockWidth / 2;
  if (align === HorizontalAlignment.RIGHT) return cx + blockWidth / 2 - rowWidth;
  return cx - rowWidth / 2;
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
  const fonts = { font: paint.font, stereoFont };
  const rows = labelRows(headRowsOf(p.stereotypeLines ?? [], p.display, fonts), ctx, labelBackColor(p));
  const cx = participantBadgeGeo(p.badge, p.x, p.width, paint.padding)?.nameCx ?? nameCenterX(p, paint);
  // The block is centred on `cy`, and the rows stack from its top downward.
  const cy = participantLabelCy(p.type, p.height, p.y, true, participantLabelMetricsOf(paint));
  const blockWidth = Math.max(0, ...rows.map((r) => r.width));
  let top = cy - rows.reduce((h, r) => h + r.height, 0) / 2;
  const placed: TextRun[] = [];
  for (const row of rows) {
    // D4, over the ROW: every run of a row shifts by ONE dx, so the row moves
    // as a block and the runs keep the spacing the seam gave them.
    const dx = rowLeft(row.width, cx, blockWidth, paint.align);
    const y = top + row.ascent;
    for (const run of row.runs) placed.push(translateRun(run, dx, y));
    top += row.height;
  }
  return placed;
}
