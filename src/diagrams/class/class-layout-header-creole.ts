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
import { resolveMemberAtoms, memberBaseFont, type MemberRowBuild } from './class-member-creole.js';
import { atomsToPlainText } from './class-member-display.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import { getSpriteMonochrome, getSpriteColor4096 } from '../../core/sprite-registry.js';
import { spriteMonochromeAsLike, spriteToPngDataUri } from '../../core/klimt/sprite/sprite-raster.js';
import { spriteColor4096ToPngDataUri } from '../../core/klimt/sprite/sprite-raster.js';
import { BADGE_LEFT_MARGIN } from './class-badge.js';
import { parseCircledCharDecoration, parseCircledSpriteDecoration } from './class-stereotype.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
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
): { width: number; height: number; displayText: string; atoms: MemberRowBuild['atoms']; hasMarkup: boolean } {
  const built = buildLineAtoms(line, font, CreoleMode.FULL_BUT_UNDERSCORE);
  if (built.classification.type === 'HORIZONTAL_LINE') {
    // Zero corpus reach for a class NAME shaped like a bare separator --
    // keep it inert (no atoms, plain text line height) rather than guess.
    return { width: 0, height: atomTextLineHeight(font.size), displayText: line, atoms: [], hasMarkup: false };
  }
  const resolved = resolveMemberAtoms(built.atoms, font, measurer, sprites);
  // cdd-T25 (M8b): `true` iff the line actually carried creole markup --
  // the SAME "no command/atom matched anywhere" identity `class-member-
  // creole.ts`'s own module doc comment names ("Measurement-identity
  // guarantee"): a markup-free line always resolves to EXACTLY one text
  // atom carrying the UNTOUCHED input string. Narrows the blast radius of
  // wiring atoms into header rows to the handful of fixtures that actually
  // use header-name creole (diseka-11-gozu390, gekope-01-ricu859,
  // lecelo-92-loma110), leaving every other classifier header's render
  // byte-identical to the pre-T25 plain-text path.
  const hasMarkup = !(
    resolved.atoms.length === 1 &&
    resolved.atoms[0]!.kind === 'text' &&
    resolved.atoms[0]!.text === line
  );
  return {
    width: resolved.width,
    height: resolved.height,
    displayText: atomsToPlainText(resolved.atoms),
    atoms: resolved.atoms,
    hasMarkup,
  };
}

/** CDD B7FU-R2 item (c-b): resolves the badge sprite's OWN drawable image
 *  (href + raw, unmargined pixel dims) -- the SAME dual monochrome/4096-
 *  colour resolution `class-member-atom-resolve.ts#resolveSpriteAtom`
 *  already does for a `<$sprite>` creole atom, reused here rather than
 *  re-derived (mono tried first, the common case; a 4096-colour sprite
 *  has no gray-level tint, so `deco.color` is not threaded to that path,
 *  matching `resolveSpriteAtom`'s own identical `spriteColor4096ToPngDataUri`
 *  call). `deco.color` maps to `Stereotype#getSprite`'s `getHtmlColor()`
 *  (java:116, the sprite's OWN foreground tint, `Stereotype.java:100-102`'s
 *  `decoration.htmlColor`); `deco.scale` (NOT font-relative, see {@link
 *  computeBadgeSpriteBox}'s own doc comment) is `asTextBlock`'s third arg. */
function resolveBadgeSpriteImage(
  sprites: SpriteRegistry,
  name: string,
  color: string | undefined,
  scale: number,
): { href: string; width: number; height: number } | undefined {
  const mono = getSpriteMonochrome(sprites, name);
  if (mono !== undefined) {
    const png = spriteToPngDataUri(spriteMonochromeAsLike(mono), color, undefined, scale);
    return { href: png.dataUri, width: png.width, height: png.height };
  }
  const color4096 = getSpriteColor4096(sprites, name);
  if (color4096 === undefined) return undefined;
  const png = spriteColor4096ToPngDataUri(color4096, scale);
  return { href: png.dataUri, width: png.width, height: png.height };
}

/** A2s R2i (item 5)/CDD B7FU-R2 item (c-b): the `<<($sprite[,color])>>`
 *  badge override's spot-box dims -- sprite registry dims * declared scale
 *  (`Stereotype#getSprite`, NOT font-relative) + the SAME margins every
 *  circled-character badge gets (`withMargin(4, 0, 5, 5)` -> width +4,
 *  height +10, EntityImageClassHeader.java:158-159; `class-badge.ts`'s
 *  BADGE_BOX_* derivation). `image` (added this task) is the ACTUAL drawn
 *  `<image>`'s own href + raw (unmargined) dims, positioned at `box.x +
 *  BADGE_LEFT_MARGIN(4), box.y + BADGE_SPRITE_TOP_BOTTOM_MARGIN(5)` --
 *  jar-verified rotisi-30-loge424 `class zz <<($bug16,red)>>`: box
 *  `x=287.5,y=116.114,w=39,h=41`, image `x=291.5,y=121.114,w=15,h=15`
 *  (both offsets exact). `undefined` when the stereotype carries no sprite
 *  decoration OR the name doesn't resolve in the registry (upstream
 *  `getSprite` returns null then and the char/default badge path runs
 *  unchanged). Box dims jar-verified: 15x15 sprite -> box 19x25 -> node
 *  39x41px = 0.541667x0.569444in. */
export function computeBadgeSpriteBox(
  classifier: Classifier,
  sprites: SpriteRegistry | undefined,
): { width: number; height: number; image?: { href: string; width: number; height: number } } | undefined {
  if (sprites === undefined) return undefined;
  const deco = parseCircledSpriteDecoration(classifier.stereotype);
  if (deco === undefined) return undefined;
  const dims = spriteDimsLookupFor(sprites).get(deco.name);
  if (dims === undefined) return undefined;
  const image = resolveBadgeSpriteImage(sprites, deco.name, deco.color, deco.scale);
  return {
    width: dims.width * deco.scale + BADGE_LEFT_MARGIN,
    height: dims.height * deco.scale + BADGE_SPRITE_TOP_BOTTOM_MARGIN * 2,
    ...(image !== undefined ? { image } : {}),
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

/** {@link buildHeaderLineMetrics}'s return shape -- named purely to keep
 *  that function's own NLOC under the per-function cap. */
export interface HeaderLineMetrics {
  headerLineWidths: number[];
  headerDisplayLines: string[];
  nameBlockHeight: number;
  /** cdd-T25 (M8b): one entry per line, `undefined` when that line carries
   *  no creole markup (see {@link buildHeaderLine}'s `hasMarkup`) -- the
   *  caller (`class-layout-header-geo.ts#buildHeaderNameRowsGeo`) sets
   *  `ClassifierGeo['rows'][].atoms` only for a defined entry, so a
   *  markup-free header renders through the UNCHANGED pre-T25 plain-text
   *  path. */
  headerLineAtoms: Array<MemberRowBuild['atoms'] | undefined>;
  /** CDD B7FU-R2 item (c): per-line height (not just the `nameBlockHeight`
   *  sum) -- `buildHeaderRows`'s own bottom-anchor gate needs each sprite-
   *  bearing line's OWN height, the SAME mechanism `class-member-rows.ts
   *  #buildSectionRows`/`class-body-enhanced-layout.ts#buildRowsBlockRows`
   *  already carry. */
  headerLineHeights: number[];
}

/** A2s R2i (item 1): the per-line creole builds' width/display/height
 *  projections -- split out of `computeHeaderNameGeo` purely for the
 *  per-function NLOC cap. `nameBlockHeight` is the sum of per-line heights
 *  (an emoji line is 39*factor tall, lecelo-92; a plain line stays
 *  `atomTextLineHeight(headerFont.size)`, so the sum reduces to the
 *  previous `count * atomTextLineHeight` for every atom-free header). */
export function buildHeaderLineMetrics(
  headerLines: readonly string[],
  headerFont: { family: string; size: number; bold: boolean; italic: boolean },
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
  // cdd-T25 (M8b): the classifier's OWN kind-derived italic
  // (interface/abstract, `class-stereotype-layout.ts#computeHeaderInfo`) --
  // unioned with `headerFont.italic` (`skinparam classFontStyle italic`)
  // the SAME way `buildHeaderRows`'s own `row.italic` field already does,
  // so the creole atoms' BASE styles agree with what the plain-text
  // fallback row would have drawn.
  headerItalic: boolean,
): HeaderLineMetrics {
  // cdd-T25 (M8b): seeds BOLD/ITALIC onto the creole atoms' BASE font from
  // the classifier header's OWN resolved style (`skinparam classFontStyle`/
  // kind-derived italic) -- the SAME `getStyles(font)` mirroring
  // `class-member-creole.ts#memberBaseFont` already does for member rows
  // (`FontConfiguration.java:65-73`'s upstream mechanism: a classifier's
  // base font face carries its skin-param weight/slant independently of
  // any in-scope creole style command). No `member` modifiers apply to a
  // header line (no `{abstract}`/`{static}` token), so the second
  // argument is `{}`.
  const font = memberBaseFont(
    {
      family: headerFont.family,
      size: headerFont.size,
      bold: headerFont.bold,
      italic: headerFont.italic || headerItalic,
    },
    {},
  );
  const builds = headerLines.map((l) => buildHeaderLine(l, font, measurer, sprites));
  return {
    headerLineWidths: builds.map((b) => b.width),
    headerDisplayLines: builds.map((b) => b.displayText),
    nameBlockHeight: builds.reduce((acc, b) => acc + b.height, 0),
    headerLineAtoms: builds.map((b) => (b.hasMarkup ? b.atoms : undefined)),
    headerLineHeights: builds.map((b) => b.height),
  };
}
