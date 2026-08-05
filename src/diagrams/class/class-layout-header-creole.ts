/**
 * class-layout-header-creole.ts — the A2s R2i creole-routing + badge-
 * decoration helpers `class-layout-header-geo.ts#computeHeaderNameGeo`
 * composes. Split into a sibling module purely to keep that file under the
 * repo's 500-line cap (same precedent as its own split out of
 * class-layout-generic-classifier.ts); every function is R2i-new or a pure
 * move (`buildBadgeCharFields` extracted verbatim from
 * `computeHeaderNameGeo`'s G2 N26 inline block).
 */
import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { resolveMemberAtoms, type MemberRowBuild } from './class-member-creole.js';
import { atomsToPlainText } from './class-member-display.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import { BADGE_LEFT_MARGIN } from './class-badge.js';
import { parseCircledCharDecoration, parseCircledSpriteDecoration } from './class-stereotype.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
import { javaRound4 } from '../../core/number-format.js';
import type { CommonHeaderFields } from './class-layout-header-geo.js';

/** `TextBlockUtils.withMargin(circledCharacter, 4, 0, 5, 5)`'s top/bottom
 *  margin (5 each) -- the SAME wrap a sprite badge gets
 *  (EntityImageClassHeader.java:158-159; `class-badge.ts`'s
 *  BADGE_BOX_HEIGHT bakes the identical `+ 5*2` for the char form). */
const BADGE_SPRITE_TOP_BOTTOM_MARGIN = 5;

/** A2s R2i: one header NAME line routed through the creole atom pipeline --
 *  `EntityImageClassHeader.java:107-108` builds the name TextBlock via
 *  `display.create8(fontConfigurationName, CENTER, skinParam,
 *  CreoleMode.FULL_BUT_UNDERSCORE, wrapWidth)`, i.e. the SAME
 *  `Display`/creole machinery member rows use, in the mode whose only
 *  difference from FULL is dropping the creole-pure `__underline__`
 *  command (`CommandCreoleBuilder.ts`'s OTHER map). For a line with no
 *  creole markup this reduces to ONE text atom measured byte-identically
 *  to the previous raw `measurer.measure(l, headerFont)` call
 *  (`class-member-creole.ts`'s measurement-identity guarantee; invariant
 *  re-verified on 12 plain names x 3 sizes before this cutover). */
function buildHeaderLine(
  line: string,
  font: FontConfiguration,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): { width: number; height: number; displayText: string; atoms: MemberRowBuild['atoms'] } {
  const built = buildLineAtoms(line, font, CreoleMode.FULL_BUT_UNDERSCORE);
  if (built.classification.type === 'HORIZONTAL_LINE') {
    // Zero corpus reach for a class NAME shaped like a bare separator --
    // keep it inert (no atoms, plain text line height) rather than guess.
    return { width: 0, height: atomTextLineHeight(font.size), displayText: line, atoms: [] };
  }
  const resolved = resolveMemberAtoms(built.atoms, font, measurer, sprites);
  return {
    width: resolved.width,
    height: resolved.height,
    displayText: atomsToPlainText(resolved.atoms),
    atoms: resolved.atoms,
  };
}

/** A2s R2i (item 5): the `<<($sprite[,color])>>` badge override's spot-box
 *  dims -- sprite registry dims * declared scale (`Stereotype#getSprite`,
 *  NOT font-relative) + the SAME margins every circled-character badge
 *  gets (`withMargin(4, 0, 5, 5)` -> width +4, height +10,
 *  EntityImageClassHeader.java:158-159; `class-badge.ts`'s BADGE_BOX_*
 *  derivation). `undefined` when the stereotype carries no sprite
 *  decoration OR the name doesn't resolve in the registry (upstream
 *  `getSprite` returns null then and the char/default badge path runs
 *  unchanged). Jar-verified rotisi-30-loge424 `class zz <<($bug16,red)>>`:
 *  15x15 sprite -> box 19x25 -> node 39x41px = 0.541667x0.569444in. */
export function computeBadgeSpriteBox(
  classifier: Classifier,
  sprites: SpriteRegistry | undefined,
): { width: number; height: number } | undefined {
  if (sprites === undefined) return undefined;
  const deco = parseCircledSpriteDecoration(classifier.stereotype);
  if (deco === undefined) return undefined;
  const dims = spriteDimsLookupFor(sprites).get(deco.name);
  if (dims === undefined) return undefined;
  return {
    width: dims.width * deco.scale + BADGE_LEFT_MARGIN,
    height: dims.height * deco.scale + BADGE_SPRITE_TOP_BOTTOM_MARGIN * 2,
  };
}

/** G2 N26's badge char/color override fields -- split out of
 *  `computeHeaderNameGeo` purely for the per-function NLOC cap. */
export function buildBadgeCharFields(classifier: Classifier): {
  badgeCharField: CommonHeaderFields;
  badgeColorField: CommonHeaderFields;
} {
  const circledChar = parseCircledCharDecoration(classifier.stereotype);
  return {
    badgeCharField: circledChar !== undefined ? { badgeChar: circledChar.char } : {},
    badgeColorField: circledChar?.color !== undefined ? { badgeColor: circledChar.color } : {},
  };
}

/** A2s R2i (item 1): the per-line creole builds' width/display/height
 *  projections -- split out of `computeHeaderNameGeo` purely for the
 *  per-function NLOC cap. `nameBlockHeight` is the sum of per-line heights
 *  (an emoji line is 39*factor tall, lecelo-92; a plain line stays
 *  `atomTextLineHeight(headerFont.size)`, so the sum reduces to the
 *  previous `count * atomTextLineHeight` for every atom-free header). */
export function buildHeaderLineMetrics(
  headerLines: readonly string[],
  headerFont: { family: string; size: number },
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): { headerLineWidths: number[]; headerDisplayLines: string[]; nameBlockHeight: number } {
  const font: FontConfiguration = {
    family: headerFont.family, size: headerFont.size, color: null, styles: new Set(),
  };
  const builds = headerLines.map((l) => buildHeaderLine(l, font, measurer, sprites));
  return {
    headerLineWidths: builds.map((b) => javaRound4(b.width)),
    headerDisplayLines: builds.map((b) => b.displayText),
    nameBlockHeight: builds.reduce((acc, b) => acc + b.height, 0),
  };
}
