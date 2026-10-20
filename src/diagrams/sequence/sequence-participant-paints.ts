/**
 * sequence-participant-paints.ts — a participant's merged styles, read the
 * way `Rose#createComponentParticipant` and the `ComponentRose*` it builds
 * read them (sdd1 T2a, D1/D2/D5).
 *
 * Split out of `sequence-layout-participant-label.ts` (500-line cap) when
 * the participant family moved from `theme.colors`/`theme.sequence` onto the
 * `Style` path: layout resolves {@link participantPaintsOf} once per
 * participant and carries `paint` on the geo; the renderer reads it back
 * through {@link paintOfGeo}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/Rose.java:127-191
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Participant.java:82-96
 */

import type { Participant, ParticipantGeo, ParticipantType } from './ast.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorAutomagic } from '../../core/klimt/color/HColorAutomagic.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import {
  HColorSet,
  parseConditionalColor,
  parseSimpleColor,
  resolveConditionalColor,
} from '../../core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { Style } from '../../core/style/Style.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor } from '../../core/style/Value.js';
import { ValueNull } from '../../core/style/ValueNull.js';
import { Url } from '../../core/url/Url.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
  paintOf,
  participantStyle,
  type SequencePaint,
} from './sequence-skin-param.js';

/**
 * What a participant's two merged styles give its head (`Rose#createComponent
 * Participant` -> `ComponentRose*`, Rose.java:127-135):
 *
 * - `paint`: `styles[0]`'s reads -- the box and glyph paint, padding and
 *   margin (`Rose.java:134-135`), and the name font
 *   (`AbstractTextualComponent.java:80`);
 * - `stereoFont`: the stereotype rows' font, `fontConfiguration.forceFont(
 *   stereo.getUFont(), stereo FontColor)` (`AbstractTextualComponent.java
 *   :82-83`, `Display.java:682-683`), i.e. `styles[1]`'s font configuration;
 * - `showStereotype`: `Display#withoutStereotypeIfNeeded(styles[0])`
 *   (`AbstractTextualComponent.java:84`, `Display.java:127-136`): hidden
 *   only on an explicit false, an unset `ValueNull` keeps it.
 */
export interface ParticipantPaints {
  readonly paint: SequencePaint;
  readonly stereoFont: FontConfiguration;
  readonly showStereotype: boolean;
}

/** The style layer's colour set (`ISkinParam#getIHtmlColorSet`). */
const COLOR_SET = HColorSet.instance();

/** `Participant.getUsedStyles` runs once per participant per layout pass. */
const PAINTS = new WeakMap<Participant, ParticipantPaints>();

/**
 * `participant.setSpecificColorTOBEREMOVED(ColorType.BACK, getColor(s))`
 * (`CommandParticipant.java:183-185`): the `#color` is the BACK colour, kept
 * by `Participant#getColors` (`Participant.java:164-172`). The port's COLOR
 * capture also admits the compound `#back:x;...` form, reduced to its back
 * part as before (`core/color-override.ts`).
 */
function participantColors(color: string | undefined): Colors | undefined {
  const back = resolveBareOrBackColor(color);
  if (back === undefined) return undefined;
  return Colors.empty().add(ColorType.BACK, COLOR_SET.getColorOrNull(back));
}

/**
 * `Stereotype.build(stereotype, radius, font, colorSet)` (`CommandParticipant
 * .java:176-181`): the decorated form, whose labels -- hence style names --
 * drop a `($sprite, #color)`/`(C, #color)` spec (`StereotypeDecoration
 * #buildComplex`). Radius and circled font feed only the badge, which
 * `charBadgeFor` sizes from the skinparam; neither reaches a style name.
 */
export function participantStereotype(p: Pick<Participant, 'stereotype'>): Stereotype | undefined {
  return p.stereotype === undefined ? undefined : Stereotype.build(p.stereotype, 0, undefined, parseSimpleColor);
}

/** `Participant#getUrl` as the `Url` `addClickable` keys on (`Participant.java:82-84`). */
function participantUrl(p: Participant): Url | undefined {
  return p.url === undefined ? undefined : new Url(p.url.url, p.url.tooltip, null);
}

/**
 * The `ug` back colour a head's text is drawn on (`AtomText.java:205`,
 * `FontConfiguration#adjustColorForBackground`, `FontConfiguration.java
 * :349-356`): the component's fill for the kinds that apply it before the
 * text (`sequence-layout-participant-label.ts#labelBackColor`), else none,
 * which falls to `ug.getDefaultBackground()` -- the document style's
 * `BackGroundColor` (`TitledDiagram.java:280-289`).
 */
function textBack(p: Participant, style: Style): HColor {
  if (p.type === 'participant' || p.type === 'collections' || p.type === 'queue')
    return style.value('BackGroundColor').asColor(COLOR_SET);
  const document = StyleSignatureBasic.of('root', 'document', 'sequenceDiagram').getMergedStyle(p.styleBuilder);
  return document!.value('BackGroundColor').asColor(COLOR_SET);
}

/** A back colour's simple part: a gradient answers for its first colour
 *  (`HColorGradient#opposite`, `HColorGradient.java:108-110`). */
function simpleBack(back: HColor): HColorSimple {
  const base = back instanceof HColorGradient ? back.getColor1() : back;
  if (!(base instanceof HColorSimple)) throw new Error('UnsupportedOperationException: HColor#opposite');
  return base;
}

/**
 * The colour `adjustColorForBackground` draws a context-dependent
 * `FontColor` in, or `undefined` for a plain one (`HColor.java:121-123`):
 * - `#?light:dark[:transparent]` is `HColorScheme#getAppropriateColor(back)`
 *   (`HColorScheme.java:50-60`), which the port resolves at the string level
 *   (`HColorSet.ts#resolveConditionalColor`; the `HColorScheme` class itself
 *   is not ported, so `asColor` would throw);
 * - `automatic` is `HColorAutomagic#getAppropriateColor`, `back.opposite()`
 *   (`HColorAutomagic.java:38-41`).
 */
function appropriateTextColor(style: Style, back: () => HColor): HColor | undefined {
  const raw = style.value('FontColor').asString() ?? '';
  const spec = raw.startsWith('#') ? raw : `#${raw}`;
  if (parseConditionalColor(spec) !== undefined) {
    const backHex = toSvgPaint(simpleBack(back()), ColorMapper.IDENTITY) as string;
    return COLOR_SET.getColor(resolveConditionalColor(spec, backHex)!);
  }
  if (!(style.value('FontColor').asColor(COLOR_SET) instanceof HColorAutomagic)) return undefined;
  return simpleBack(back()).opposite();
}

/** `style` with its `FontColor` resolved as the text is drawn
 *  ({@link appropriateTextColor}) against `back`: `fontConfiguration
 *  .adjustColorForBackground(ug)` (`AtomText.java:205`,
 *  `FontConfiguration.java:349-356`). A head passes its own back, a message
 *  label the document's (`sequence-arrow-paint.ts#labelFont`). */
export function withTextColorFor(style: Style, back: () => HColor): Style {
  const color = appropriateTextColor(style, back);
  return color === undefined ? style : style.eventuallyOverride(Colors.empty().add(ColorType.TEXT, color));
}

/**
 * {@link ParticipantPaints} off `Participant#getUsedStyles` (`Participant.java
 * :86-96`), merged at use time from the builder captured at the
 * participant's command (sdd1 D2).
 */
export function participantPaintsOf(p: Participant): ParticipantPaints {
  const cached = PAINTS.get(p);
  if (cached !== undefined) return cached;
  const { style, stereo } = participantStyle(
    p.styleBuilder,
    p.type,
    participantStereotype(p),
    participantUrl(p),
    participantColors(p.color),
  );
  const back = (): HColor => textBack(p, style);
  const show = style.value('ShowStereotype');
  const paints = {
    paint: paintOf(withTextColorFor(style, back), COLOR_SET),
    stereoFont: paintOf(withTextColorFor(stereo, back), COLOR_SET).font,
    showStereotype: show instanceof ValueNull || show.asBoolean(),
  };
  PAINTS.set(p, paints);
  return paints;
}

/** The default skin's paint, per kind (see {@link paintOfGeo}). */
const DEFAULT_PAINTS = new Map<ParticipantType, SequencePaint>();

/**
 * A geo's paint. Layout always sets it ({@link participantPaintsOf}); a geo
 * built by hand carries none, and reads what a participant declared under
 * the default skin reads -- `geo-participant.ts` keeps `paint` optional.
 */
export function paintOfGeo(g: Pick<ParticipantGeo, 'paint' | 'type'>): SequencePaint {
  if (g.paint !== undefined) return g.paint;
  let paint = DEFAULT_PAINTS.get(g.type);
  if (paint === undefined) {
    const builder = currentStyleBuilder(createSequenceStyleDispatch({ lines: [], type: 'sequence' }));
    paint = paintOf(participantStyle(builder, g.type).style, COLOR_SET);
    DEFAULT_PAINTS.set(g.type, paint);
  }
  return paint;
}
