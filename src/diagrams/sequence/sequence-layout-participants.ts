/**
 * Sequence diagram layout — participant column geometry (Step 1 of
 * layoutSequence). Extracted from layout.ts to keep file size and per-function
 * complexity within limits; see layout.ts for the overall pipeline.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream lays out
 * participants left-to-right by first-appearance order)
 */

import type {
  Participant,
  ParticipantBadge,
  ParticipantGeo,
  ParticipantType,
  SequenceDiagramAST,
  SequenceEvent,
  TextRun,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { ARROW_PADDING_X, arrowFontSpecOf, fontSpecOf } from './sequence-layout-shared.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';
import {
  parseCircledCharDecoration,
  parseCircledSpriteDecoration,
  resolveBadgeRadius,
  splitStereotypeLabels,
  splitStereotypeStyleTags,
  wrapGuillemet,
} from '../../core/stereotype-decoration.js';
import { cleanStereotypeToken } from '../../core/style-map-element.js';
import { COLLECTIONS_DELTA } from './renderer-participant-symbol.js';
import {
  participantBadgeGeo, participantLabelCy, symbolPreferredHeight, symbolPreferredWidth,
} from './sequence-layout-participant-sizing.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { displayLines } from './text-block-geo.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { getSpriteMonochrome } from '../../core/sprite-registry.js';
import {
  spriteToPngDataUri,
  spriteMonochromeAsLike,
} from '../../core/klimt/sprite/sprite-raster.js';

/**
 * The playing space's left border — where the participant row starts, and
 * what `DividerTile#drawU` calls `border1`. Exported because `layout.ts`
 * needs the SAME value to span a divider's band; upstream reads one
 * `tileArguments.getBorder1()` for both.
 *
 * 10, and it is two fives. `TextBlockExporter:173` translates the whole
 * diagram by `(margin.left, margin.top)`, which for a Teoz sequence is
 * `ClockwiseTopRightBottomLeft.same(5)`
 * (`SequenceDiagram#getDefaultMargins:624-628`); inside that,
 * `SequenceDiagramFileMakerTeoz#getTextBlock`'s `drawU` applies its own
 * `new UTranslate(5, 5)` (`:132`) before shifting by `dx(-min1)`, landing the
 * body's leftmost extent at 0 in block coordinates. 5 + 5 = 10, where
 * `jobadi-87-jegi648`'s first box sits, and every other golden's.
 */
export const LEFT_MARGIN = 10;

export interface ParticipantLayoutResult {
  sortedParticipants: Participant[];
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/** Theme + measurer + the diagram's sprite registry, bundled so the column
 *  builders stay inside the project's 5-parameter cap. Mirrors
 *  `EventProcessingContext`'s own role in `sequence-layout-events.ts`. */
interface ParticipantLayoutCtx {
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  readonly sprites: SpriteRegistry | undefined;
}

/** Compute participant column geometry: x/width/height/centerX for every
 *  participant, sorted into first-appearance order. */
export function computeParticipantLayout(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  originX: number = LEFT_MARGIN,
): ParticipantLayoutResult {
  const sortedParticipants = [...ast.participants].sort(
    (a, b) => a.order - b.order,
  );
  const constraints: SpanConstraint[] = [];
  scanMessageLabels(ast.events, sortedParticipants, theme, measurer, constraints);

  const ctx: ParticipantLayoutCtx = { theme, measurer, sprites: ast.sprites };
  const participantWidths = computeParticipantWidths(sortedParticipants, ctx);
  const { participantGeos, participantMap, participantIndex, maxParticipantHeight } =
    positionParticipants(sortedParticipants, participantWidths, constraints, ctx, originX);

  return {
    sortedParticipants,
    participantGeos,
    participantMap,
    participantIndex,
    maxParticipantHeight,
  };
}

/**
 * One message's demand on the participant row: the two participant indices it
 * runs between, and the centre-to-centre distance it needs.
 *
 * This IS `CommunicationTile#addConstraints:392-416`, reduced to the part that
 * bears on x. There, `point2.ensureBiggerThan(point1.addFixed(width))` with
 * `width = comp.getPreferredDimension(...).getWidth()` and `point1`/`point2`
 * the two lifeline positions — a constraint between ANY two participants, not
 * only neighbours (D6).
 */
interface SpanConstraint {
  /** Lower participant index. */
  readonly from: number;
  /** Higher participant index. Always `> from`. */
  readonly to: number;
  /** Required `centre[to] - centre[from]`. */
  readonly span: number;
}

/**
 * Collect every message's span constraint. Recurses into frame branches.
 *
 * Constraints are stored `from < to` regardless of the arrow's direction: the
 * reverse branch of `addConstraints` (`:402-409`) swaps which endpoint is
 * bounded, but demands the same distance. The `LIVE_DELTA_SIZE` adjustments in
 * both branches are NOT modelled here — see `findings/label-widening.md`.
 */
function scanMessageLabels(
  events: readonly SequenceEvent[],
  sortedParticipants: Participant[],
  theme: Theme,
  measurer: StringMeasurer,
  out: SpanConstraint[],
): void {
  const arrowSpec = arrowFontSpecOf(theme);
  for (const ev of events) {
    if (ev.kind === 'message' && ev.from !== ev.to) {
      const fi = sortedParticipants.findIndex((p) => p.id === ev.from);
      const ti = sortedParticipants.findIndex((p) => p.id === ev.to);
      if (fi >= 0 && ti >= 0 && fi !== ti) {
        const lines = ev.label === '' ? [] : displayLines(ev.label);
        const labelWidth =
          lines.length === 0
            ? 0
            : Math.max(...lines.map((l) => measurer.measure(l, arrowSpec).width));
        out.push({
          from: Math.min(fi, ti),
          to: Math.max(fi, ti),
          // `ComponentRoseArrow#getPreferredWidth:347-349` —
          // `getTextWidth + getArrowDeltaX`, and `getTextWidth` is the block
          // plus both paddings. The same formula `sequence-layout-exo.ts`
          // already uses for an exo message's demand.
          span: labelWidth + 2 * ARROW_PADDING_X + ARROW_DELTA_X,
        });
      }
    } else if (ev.kind === 'messageExo') {
      // Deliberately skipped, not overlooked (D3). This scan widens the gap
      // between a PAIR of lifelines; an exo message has one endpoint and the
      // diagram border for the other, so there is no pair to widen. Its extent
      // reaches the diagram through `MessageExoArrow#getRightEndInternal`'s
      // `Math.max(maxX, ...)`, i.e. total width -- a different quantity.
      // @see sequencediagram/graphic/MessageExoArrow.java
      continue;
    } else if (ev.kind === 'frame') {
      for (const branch of ev.branches) {
        scanMessageLabels(branch, sortedParticipants, theme, measurer, out);
      }
    }
  }
}

/**
 * Pre-compute each participant's column width.
 *
 * A `database` participant is sized by upstream's own rule,
 * `ComponentRoseDatabase#getPreferredWidth` (`:102-105`):
 * `max(stickman.getWidth(), getTextWidth())`, where the stickman is
 * `USymbols.DATABASE.asSmall(null, empty(16,17), empty(0,0), …)` (`:70`) and
 * therefore a fixed 36 wide. It replaced a fitted `DB_MIN_WIDTH = 40`. The
 * two halves must land together: `renderer-participant-shapes.ts` draws the
 * glyph and this reserves the column (`planning/sizer-renderer-parity.md`).
 */
function computeParticipantWidths(
  sortedParticipants: Participant[],
  ctx: ParticipantLayoutCtx,
): number[] {
  const { theme, measurer } = ctx;
  const fontSpec = fontSpecOf(theme);
  return sortedParticipants.map((p) => {
    const badge = anyBadgeFor(p, ctx, resolveParticipantBackground(p, theme));
    // A head is a text BLOCK: `getPureTextWidth` is its WIDEST LINE
    // (`AbstractTextualComponent.java:106-108`), never the raw display -- and
    // C4: never the raw LINE either. `SheetBlock1#initMap` maxes `sea
    // .getWidth()` per stripe (`:145-149`), and a stripe's width is its PARSED
    // atoms', so `""MySubTitle""` reserves 70.087 and not the 90.038 its four
    // quotes measure (`jozomu-87-tajo507`, jar box width 84.087).
    const rows = [...visibleStereotypeLines(p, theme), ...displayLines(p.display)];
    const textW = Math.max(...labelRows(rows, fontSpec, measurer).map((r) => r.width));
    // `TextBlockSprited#calculateDimension`: the badge widens the block by its
    // own width plus the 6px gap (`:57-67`).
    const lw = badge === undefined ? textW : textW + badge.width + BADGE_GAP;
    const symbolW = symbolPreferredWidth(p.type, lw, theme);
    if (symbolW !== undefined) return symbolW;
    // `PARTICIPANT_HEAD` / `COLLECTIONS_HEAD` both reach
    // `ComponentRoseParticipant`, differing only by `getDeltaCollection()`
    // (`:114-124`). `getTextWidth = getPureTextWidth + padding.left + padding.right`
    // (`AbstractTextualComponent.java:106-108`) IS the drawn box
    // (`ComponentRoseParticipant#drawInternalU:100-104`), with no floor under
    // it: `getPureTextWidth`'s `max(..., minWidth)` (`:140-142`) takes
    // `minWidth` from `Rose#getMinClassWidth` (`Rose.java:275-278`), whose
    // `PName.MinimumWidth` is in no skin file and resolves to
    // `ValueNull#asDouble()` = 0 (`ValueNull.java:57-59`). Verified on 3570
    // corpus boxes to within 0.0005px (`findings/participant-width.md`).
    const plain = lw + theme.sequence.participantPadding * 2;
    return p.type === 'collections' ? plain + COLLECTIONS_DELTA : plain;
  });
}

/**
 * The gap between a head's painted shape and the bottom of the AREA it
 * reserves — one pixel, and only for the two kinds that reach
 * `ComponentRoseParticipant`.
 *
 * `ComponentRoseParticipant#getPreferredHeight:129-132` is
 * `getTextHeight + margin.top + margin.bottom + deltaShadow + 1 +
 * getDeltaCollection()`, and margin and shadow are both zero for a participant
 * (`findings/participant-width.md` §6), so its reserved area is exactly one
 * pixel taller than the rectangle it paints.
 *
 * Every other head component's `getPreferredHeight` is its glyph plus
 * `getTextHeight`, with no constant term at all — read one at a time:
 * `ComponentRoseActor:89-92`, `ComponentRoseDatabase:96-99`,
 * `ComponentRoseBoundary:90-93`, `ComponentRoseControl:91-94`,
 * `ComponentRoseEntity:91-94`, `ComponentRoseQueue:82-85`. Hence 0 for those.
 */
export function headSlackOf(type: ParticipantType): number {
  return type === 'participant' || type === 'collections' ? 1 : 0;
}

interface ParticipantColumnResult {
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/** Lay out participant boxes left-to-right, then bottom-align their headers. */
function positionParticipants(
  sortedParticipants: Participant[],
  participantWidths: number[],
  constraints: readonly SpanConstraint[],
  ctx: ParticipantLayoutCtx,
  originX: number,
): ParticipantColumnResult {
  const { theme } = ctx;
  const participantGeos: ParticipantGeo[] = [];
  const participantMap = new Map<string, ParticipantGeo>();
  const participantIndex = new Map<string, number>();
  const xs = solveParticipantXs(participantWidths, constraints, theme, originX);

  for (let i = 0; i < sortedParticipants.length; i++) {
    const p = sortedParticipants[i]!;
    const geo = buildParticipantGeo(p, participantWidths[i]!, xs[i]!, ctx);

    participantGeos.push(geo);
    participantMap.set(p.id, geo);
    participantIndex.set(p.id, i);
  }

  // Use the tallest reserved head AREA so all lifelines start at the same Y.
  // `LivingSpace#drawHeadOrTail:191-214` draws each head into an `Area` sized
  // by `comp.getPreferredDimension` (`AbstractComponent.java:163-167`), which
  // for a plain participant is one pixel taller than the rectangle
  // `drawInternalU:100-104` paints inside it (`headSlackOf`).
  const areaOf = (g: ParticipantGeo): number => g.height + headSlackOf(g.type);
  const maxParticipantHeight = Math.max(...participantGeos.map(areaOf));
  // Bottom-align the head AREAS, not the boxes: each area ends at
  // `maxParticipantHeight`, so every lifeline starts there and the box is
  // painted at the TOP of its area with the slack below it -- which puts
  // `jobadi-87-jegi648`'s box at [10, 38) with its lifeline at 39.
  for (const g of participantGeos) {
    g.y = maxParticipantHeight - areaOf(g);
    // AFTER the bottom-align, never before: the runs carry an absolute
    // baseline, and `g.y` is what it is measured from.
    g.labelRuns = buildLabelRuns(g, ctx);
  }

  return { participantGeos, participantMap, participantIndex, maxParticipantHeight };
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
function visibleStereotypeLines(p: Participant, theme: Theme): readonly string[] {
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
 * `width` is the LAST run's RIGHT EDGE, never a sum: a non-text atom advances
 * x without producing a run (`sequence-creole.ts`). `height`/`ascent` are the
 * tallest run and the deepest ascent -- `Sea#doAlign` baseline-aligning one
 * stripe's atoms (`SheetBlock1.java:130-137`). All three equal the old
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
function labelRows(rows: readonly string[], spec: FontSpec, measurer: StringMeasurer): readonly LabelRow[] {
  const font = sequenceCreoleFont(spec);
  return rows.map((row) => {
    const runs = sequenceCreoleRuns(row, font, { leftX: 0, baselineY: 0 }, measurer);
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
function resolveParticipantBackground(p: Participant, theme: Theme): Paint {
  const inline = resolveBareOrBackColor(p.color);
  if (inline !== undefined) return resolveColorToSvgHex(inline);
  const bucket = theme.colors.elements?.[p.type]?.background;
  if (bucket === undefined) return theme.colors.background;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
}

/** The box's stroke -- the same cascade, minus the inline override, which
 *  `participant X #color` only ever sets the BACKGROUND with. */
function resolveParticipantBorder(p: Participant, theme: Theme): Paint {
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
const BADGE_GAP = 6;

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
  const r = resolveBadgeRadius(
    theme.colors.graph.circledCharacterFontSize,
    theme.colors.graph.circledCharacterRadius,
  );
  return { kind: 'char', color: deco.color, width: r * 2, height: r * 2 };
}

/** Either badge form, sprite first -- `createStereotype` tries the sprite
 *  before the circled character (`Display.java:671-676`). */
function anyBadgeFor(
  p: Participant,
  ctx: ParticipantLayoutCtx,
  background: Paint,
): ParticipantBadge | undefined {
  return badgeFor(p, ctx.sprites, background) ?? charBadgeFor(p, ctx.theme);
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
function buildLabelRuns(p: ParticipantGeo, ctx: ParticipantLayoutCtx): readonly TextRun[] {
  const { theme, measurer } = ctx;
  const spec = fontSpecOf(theme);
  const rows = labelRows([...(p.stereotypeLines ?? []), ...displayLines(p.display)], spec, measurer);
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
    for (const run of row.runs) placed.push({ ...run, x: run.x + dx, y });
    top += row.height;
  }
  return placed;
}

/** Build the geometry for a single participant column at a given x offset. */
function buildParticipantGeo(
  p: Participant,
  width: number,
  currentX: number,
  ctx: ParticipantLayoutCtx,
): ParticipantGeo {
  const { theme, measurer } = ctx;
  const fontSpec = fontSpecOf(theme);
  const stereoLines = visibleStereotypeLines(p, theme);
  const background = resolveParticipantBackground(p, theme);
  const badge = anyBadgeFor(p, ctx, background);
  // A visible stereotype is a SECOND row above the name
  // (`CommandParticipant.java:174-181`; the jar draws `«APIGateway»` on its
  // own line in `birocu-87-xubi808`), and so is each line the display's own
  // escaped newlines split it into (`:153`) -- `butali-53-kige134`'s head is
  // the jar's 42 tall, not 28. C4: the SUM of those rows' own line boxes, not
  // one line height times a row count -- `SheetBlock1#initMap` accumulates
  // `y += height` per stripe (`:139-142`), and a `=` heading stripe is 18 tall
  // beside its 14pt neighbours (`bugabo-85-veki716`, jar baselines 31/55.889).
  // Identical arithmetic whenever every row shares the ambient font.
  const rows = [...stereoLines, ...displayLines(p.display)];
  const textHeight = labelRows(rows, fontSpec, measurer).reduce((h, r) => h + r.height, 0);
  // `getTextHeight = textBlock.height + padding.top + padding.bottom`
  // (`AbstractTextualComponent.java:110-114`) IS the painted rectangle
  // (`ComponentRoseParticipant#drawInternalU:100-104`), and `Padding 7`
  // expands to all four sides (`plantuml.skin:186-190`) -- the same 14 the
  // width gets, on the other axis. Verified on 2304 corpus boxes, all 28 tall
  // for a one-line label (`findings/participant-height.md`).
  // `TextBlockSprited#calculateDimension` maxes the badge's own height against
  // the block's (`:57-63`); `blockHeight` is that max WITHOUT the plain box's
  // padding allowance, which is what a glyph kind sizes from (it replaced a
  // fitted `DB_HEIGHT = 80` floor).
  const blockHeight = Math.max(textHeight, badge?.height ?? 0);
  const boxHeight = blockHeight + 2 * theme.sequence.participantPadding;
  const pHeight =
    symbolPreferredHeight(p.type, blockHeight, theme) ??
    (p.type === 'collections' ? boxHeight + COLLECTIONS_DELTA : boxHeight);
  const centerX = currentX + width / 2;

  return {
    id: p.id,
    display: p.display,
    background,
    border: resolveParticipantBorder(p, theme),
    ...(stereoLines.length > 0 ? { stereotypeLines: stereoLines } : {}),
    ...(p.url !== undefined ? { url: p.url } : {}),
    ...(badge !== undefined ? { badge } : {}),
    type: p.type,
    x: currentX,
    y: 0,
    // Both `y` and `labelRuns` are filled in by the bottom-align pass in
    // `computeParticipantLayout`: a run carries an ABSOLUTE baseline, and the
    // head's own y is not known until every column's reserved area is.
    labelRuns: [],
    width,
    height: pHeight,
    centerX,
  };
}

/**
 * Solve every participant's x — the port of `xorigin.compileNow()`
 * (`SequenceDiagramFileMakerTeoz.java:110`), and the D6 decision in code.
 *
 * Upstream builds a `Real` constraint graph and solves it globally. This does
 * NOT reimplement `Real`; it exploits the shape of the constraint set upstream
 * actually produces for the participant row, which is entirely
 * `x[j] >= x[i] + c` with `i < j` in participant order, from two sources and
 * only two:
 *
 *   - `LivingSpaces#addConstraints:61-71`, `nextA >= prevE + 10`, always
 *     between neighbours;
 *   - `CommunicationTile#addConstraints:392-416`, one per message, between the
 *     two participants it runs between — adjacent or not. The reverse branch
 *     (`:402-409`) swaps which endpoint is bounded but demands the same
 *     distance, so it too is a left-to-right edge.
 *
 * A system of difference constraints whose edges all point one way along a
 * total order is a DAG longest-path, so a single left-to-right sweep taking
 * the max of the incoming edges is its EXACT minimal solution -- not an
 * approximation of the solver but, for this constraint set, the solver, at
 * O(participants + messages). It replaced a pairwise pre-scan that widened
 * only ADJACENT gaps (`findings/label-widening.md`).
 */
function solveParticipantXs(
  widths: readonly number[],
  constraints: readonly SpanConstraint[],
  theme: Theme,
  originX: number,
): number[] {
  const xs: number[] = [];
  const centre = (i: number): number => xs[i]! + widths[i]! / 2;
  // Incoming edges, bucketed by their higher endpoint, so the sweep reads each
  // constraint exactly once and never looks ahead.
  const incoming = new Map<number, SpanConstraint[]>();
  for (const c of constraints) {
    const bucket = incoming.get(c.to);
    if (bucket === undefined) incoming.set(c.to, [c]);
    else bucket.push(c);
  }

  for (let i = 0; i < widths.length; i++) {
    // `nextA >= prevE + 10`, the neighbour constraint.
    let x = i === 0 ? originX : xs[i - 1]! + widths[i - 1]! + theme.sequence.participantGap;
    for (const c of incoming.get(i) ?? []) {
      // `centre[i] >= centre[c.from] + c.span`, expressed as a left edge.
      x = Math.max(x, centre(c.from) + c.span - widths[i]! / 2);
    }
    xs.push(x);
  }
  return xs;
}
