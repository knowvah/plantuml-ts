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
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { fontSpecOf } from './sequence-layout-shared.js';
import { sequenceCreoleFont, sequenceCreoleRuns, type SequenceAtomContext } from './sequence-creole.js';
import {
  parseCircledCharDecoration,
  parseCircledSpriteDecoration,
  resolveBadgeRadius,
  splitStereotypeLabels,
  splitStereotypeStyleTags,
  wrapGuillemet,
} from '../../core/stereotype-decoration.js';
import { cleanStereotypeToken } from '../../core/style-map-element.js';
import { participantBadgeGeo, participantLabelCy } from './sequence-layout-participant-sizing.js';
import { displayLines } from './text-block-geo.js';
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
 * The visible stereotype label, or undefined when the resolved style hides it.
 *
 * `AbstractTextualComponent`'s constructor runs the display through
 * `Display#withoutStereotypeIfNeeded(style)` (`:84`), which strips the
 * stereotype only on an explicit `ShowStereotype false` -- an unset value is
 * `ValueNull` and keeps it (`Display.java:127-136`). `theme.colors
 * .showStereotypeByTag` carries exactly the tags that declared the property,
 * so an absent entry is upstream's absent value; `resolveStyleCascade` cleans
 * the token, so the lookup key is the raw `<<tag>>` de-guillemeted here.
 */
export function visibleStereotypeLines(p: Participant, theme: Theme): readonly string[] {
  if (p.stereotype === undefined) return [];
  const byTag = theme.colors.showStereotypeByTag;
  if (byTag !== undefined) {
    // The style tags are the chunk labels with any BADGE spec stripped and
    // regardless of bracket count (`splitStereotypeStyleTags`), NOT the raw
    // run: `<< ($APIGateway, #CC2264) APIGateway >>` matches `.APIGateway`.
    // Cleaned through `cleanStereotypeToken`, which is what
    // `collectStyleTagNames` keys the map by.
    const tags = splitStereotypeStyleTags(stereotypeInner(p.stereotype)).map(cleanStereotypeToken);
    if (tags.some((t) => byTag[t] === false)) return [];
  }
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

/** A head's rows, measured. Callers pass them in DRAW order -- the visible
 *  stereotype labels, then the display's own lines -- and the box's width, its
 *  height and its placed runs all come from this ONE list: a disagreement
 *  between any two is text overhanging its own box. */
export function labelRows(rows: readonly string[], spec: FontSpec, ctx: ParticipantLayoutCtx): readonly LabelRow[] {
  const font = sequenceCreoleFont(spec);
  const atomContext = labelAtomContext(ctx);
  return rows.map((row) => {
    const runs = sequenceCreoleRuns(row, font, { leftX: 0, baselineY: 0 }, ctx.measurer, atomContext);
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
 * The box's fill, in `Participant#getUsedStyles`' own precedence: the
 * participant's inline `#color` overrides the merged style
 * (`eventuallyOverride(getColors())`, `Participant.java:88`), which itself
 * comes from the kind's signature `root, element, sequenceDiagram, <kind>`
 * (`ParticipantType.java:55-80`) -- so the `<style>` bucket key IS the
 * participant kind. Falls back to the theme's own background.
 *
 * A bucket value is a raw `parseColor` result: a plain NAME still needs
 * HColorSet resolution, a Gradient is already a `Paint` and passes through
 * (the same two cases `class/renderer-note.ts#resolveNoteBackground`
 * handles).
 */
export function resolveParticipantBackground(p: Participant, theme: Theme): Paint {
  const inline = resolveBareOrBackColor(p.color);
  if (inline !== undefined) return resolveColorToSvgHex(inline);
  const bucket = theme.colors.elements?.[p.type]?.background;
  // `participantBackgroundColor<<X>>` (`FromSkinparamToStyle.java:272,
  // 290-296` tokenises the key on `<>`): the stereotype-scoped tier sits
  // above the bare bucket, keyed like `state-render-colors.ts
  // #resolveStateBackgroundByStereo`. `p.stereotype` carries its guillemets
  // (`sequence-parse-helpers.ts`), so strip them before the lookup.
  const byStereo = theme.colors.elements?.[p.type]?.backgroundColorByStereo;
  if (byStereo !== undefined && p.stereotype !== undefined) {
    const scoped =
      byStereo[
        p.stereotype
          .replace(/^<<|>>$/g, '')
          .trim()
          .toLowerCase()
      ];
    if (scoped !== undefined) return resolveColorToSvgHex(scoped);
  }
  // Not the canvas: `plantuml.skin:197-201` scopes the heads' grey-blue to
  // `sequenceDiagram { }` and the jar keeps them there under `skinparam
  // backgroundColor` (`ColorParam.background` and the participant style are
  // separate). See `Theme.colors.participantBackground`.
  if (bucket === undefined) return theme.colors.participantBackground;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
}

/** The box's stroke -- the same cascade, minus the inline override, which
 *  `participant X #color` only ever sets the BACKGROUND with. */
export function resolveParticipantBorder(p: Participant, theme: Theme): Paint {
  const bucket = theme.colors.elements?.[p.type]?.border;
  if (bucket === undefined) return theme.colors.border;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
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
  // expression `renderParticipantBox` paints the box with, so a box-fill
  // divergence is inherited once rather than doubled (`birocu-87-xubi808`:
  // the jar fills `#FF0` from `<style> participant { BackgroundColor }`,
  // which this port routes to neither). Passing these two the other way
  // round tints every sprite toward the theme's TEXT colour.
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
 * the diagram's sprites and the head's font colour, which `AtomSprite` tints
 * a monochrome sprite with (`StripeSimple.java:228-235`). `undefined` with no
 * registry -- the pre-T1f whole-line literal, unchanged.
 */
function labelAtomContext(ctx: ParticipantLayoutCtx): SequenceAtomContext | undefined {
  if (ctx.sprites === undefined) return undefined;
  return { sprites: ctx.sprites, fontColor: ctx.theme.colors.text };
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
 *   3. A row's LEFT edge is `cx - width / 2` (D4) — the centre stays the
 *      authoritative anchor and no left edge is stored. C4: `width` is the
 *      ROW's, so a row of several runs is centred as one block.
 *
 * `hide stereotype` is resolved upstream (`visibleStereotypeLines`), so an
 * absent row is simply an absent entry.
 */
export function buildLabelRuns(p: ParticipantGeo, ctx: ParticipantLayoutCtx): readonly TextRun[] {
  const { theme } = ctx;
  const spec = fontSpecOf(theme);
  const rows = labelRows([...(p.stereotypeLines ?? []), ...displayLines(p.display)], spec, ctx);
  const cx = participantBadgeGeo(p.badge, p.x, p.width, theme)?.nameCx ?? p.centerX;
  // The block is centred on `cy`, and the rows stack from its top downward.
  const cy = participantLabelCy(p.type, p.height, p.y, true, theme);
  let top = cy - rows.reduce((h, r) => h + r.height, 0) / 2;
  const placed: TextRun[] = [];
  for (const row of rows) {
    // D4, over the ROW: every run of a row shifts by ONE dx, so the row is
    // centred as a block and the runs keep the spacing the seam gave them.
    const dx = cx - row.width / 2;
    const y = top + row.ascent;
    for (const run of row.runs) placed.push(translateRun(run, dx, y));
    top += row.height;
  }
  return placed;
}
