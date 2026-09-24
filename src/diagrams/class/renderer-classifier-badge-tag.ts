/**
 * `renderBadge` (the kind badge in a classifier's header) and
 * `renderGenericTag` (`class Foo<T>`'s generic type-parameter tag box) --
 * split out of `renderer-classifier-box.ts` purely to keep that file
 * under this project's 500-line cap. Both are self-contained (their own
 * geometry + `svg.ts` primitives, no shared state with the rest of that
 * file), so they move as one cohesive unit; `renderer-classifier-box.ts`
 * imports them back, unchanged for its own callers. Pure move, zero
 * behavior change.
 */
import type { ClassifierGeo } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { scaleDashArrayString } from './class-scale-geo-row.js';
import { rect, text, ellipse, path, image } from '../../core/svg.js';
import {
  resolveBadgeFill,
  resolveBadgeBorder,
  resolveBadgeGlyphColor,
  spotSnameForKind,
  badgeGlyphPath,
  resolveBadgeRadius,
  BADGE_LEFT_MARGIN,
} from './class-badge.js';

/**
 * The kind badge in the header: a filled `<ellipse>` (radius {@link
 * BADGE_RADIUS}, upstream `SkinParam#getCircledCharacterRadius()` default)
 * plus the kind letter drawn as a real vector glyph outline (`<path>`),
 * matching `klimt/shape/CircledCharacter.java` -- never `<circle>`+`<text>`.
 *
 * Position (G2 N23, replacing N4's indent-reversal trick): `cx` reads the
 * NAME row's own `badgeIndent` directly -- `class-stereotype.ts#
 * buildHeaderRow`'s own `h1 + BADGE_LEFT_MARGIN + BADGE_RADIUS` term. N4's
 * "reverse the text row's own indent" shortcut is NO LONGER valid post-N23:
 * the header TEXT row's `indent` bakes in `h1 + h2` (an asymmetric
 * wider-box-centering split, see that function's doc comment), while the
 * badge only moves by `h1` alone -- the two diverge by `h2/2` whenever
 * `h2 > 0`, so they need their OWN stored field rather than one shared
 * offset. `cy = geo.y + headerHeight / 2`, unchanged. G2 N24: the NAME row
 * is `rows[headerRowCount - 1]`, not always `rows[0]` -- a stacked
 * `<<stereotype>>` pushes N stereo rows in FRONT of it (`badgeIndent` is
 * only ever set on the name row, never a stereo row).
 *
 * G2 N24 (pre-existing bug, unmasked while jar-verifying the "fully
 * suppressed" height fix on `xibibe-37-regi626`): `dividerYs[0]` is only
 * absent when BOTH compartments are suppressed (`hide members`/`hide empty
 * members` on a member-less classifier) -- `measureGenericClassifier`'s own
 * early-return branch, which now sets `geo.height === headerRowHeight`
 * EXACTLY in that case (no other content). The old fallback (a flat,
 * unverified `28`) was simply wrong whenever the real `headerRowHeight`
 * differed (badge-dominant `32`, or higher still with a stereotype row) --
 * `geo.height` is the correct value in every case that reaches this
 * fallback, not a new formula.
 */
/** cdd-T29 R2: `BADGE_RADIUS` (`class-badge.ts`) is a render-time
 *  pixel-literal constant, scaled here like every other local literal this
 *  round's audit found (D4/journal row 175) -- split out purely to keep
 *  {@link renderBadge}'s own NLOC under this project's cap. */
function scaledBadgeRadius(theme: ScaledTheme): number {
  return (
    resolveBadgeRadius(theme.colors.graph.circledCharacterFontSize, theme.colors.graph.circledCharacterRadius) *
    theme.scaleK
  );
}

export function renderBadge(geo: ClassifierGeo, theme: ScaledTheme): string {
  const headerH = geo.dividerYs[0] ?? geo.height;
  const nameRowIndex = (geo.headerRowCount ?? 1) - 1;
  // G2 N38: resolved from theme (formula or explicit override) -- see
  // `class-badge.ts#resolveBadgeRadius`'s own doc comment. Falls back to
  // the SAME value `buildHeaderRow` used to compute `badgeIndent`
  // whenever that field is present (the common case); only reached for
  // hand-built test geometries that bypass the real layout pipeline.
  const badgeRadius = scaledBadgeRadius(theme);
  const badgeIndent = geo.rows[nameRowIndex]?.badgeIndent ?? BADGE_LEFT_MARGIN * theme.scaleK + badgeRadius;
  const badgeX = geo.x + badgeIndent;
  const badgeY = geo.y + headerH / 2;
  // G2 N32: `skinparam stereotype<X>BackgroundColor/BorderColor` / `<style>
  // spot<Kind> { BackgroundColor; LineColor; FontColor }` -- the badge's
  // own theme-level spot-color override bucket, see `class-badge.ts
  // #spotSnameForKind`'s doc comment. `undefined` for any kind with no
  // bucket (every non-badge-bearing kind, plus unsurveyed badge kinds).
  const spotSname = spotSnameForKind(geo.kind);
  const spot = spotSname !== undefined ? theme.colors.elements?.[spotSname] : undefined;
  return (
    ellipse(badgeX, badgeY, badgeRadius, badgeRadius, {
      // G2 N4: `strokeWidth` (camelCase) is not a valid SVG attribute name --
      // was silently emitting a bogus `strokeWidth="1"` attribute (invisible
      // to any real SVG renderer) instead of the intended `stroke-width="1"`,
      // a pre-existing bug from N3 diagnosed this iteration (blocked EVERY
      // badge-bearing fixture's `ellipse/@stroke-width` from matching jar).
      // G2 N26: `resolveBadgeFill` -- the badge-customization COLOR half
      // of `class Foo << (F,orange) >>` (`geo.badgeColor`) wins over the
      // kind default when present; see that function's own doc comment.
      // G2 N36: `theme.colors.graph.spotCascade*` -- the bare `<style>
      // root { BackGroundColor/LineColor/FontColor } }` ancestor-cascade
      // fallback, see `resolveBadgeFill`/`resolveBadgeBorder`/
      // `resolveBadgeGlyphColor`'s own `rootFallback` doc comments.
      fill: resolveBadgeFill(geo.kind, geo.badgeColor, spot?.background, theme.colors.graph.spotCascadeBackground),
      stroke: resolveBadgeBorder(theme.colors.border, spot?.border, theme.colors.graph.spotCascadeBorder),
      'stroke-width': theme.scaleK,
    }) +
    // `style.value(PName.FontColor)` on the spot style signature -- black in
    // every non-monochrome theme sampled (`plans/g2-class-svg/ledger.md`
    // N3); monochrome-reverse flips this to white, a separate, smaller,
    // unfixed divergence (that theme already diverges more broadly). G2 N32:
    // `spot.font` (`<style> spot<Kind> { FontColor }`) overrides the
    // hardcoded default -- jar-verified `gekofe-43-lufa479`.
    // G2 N26: `geo.badgeChar` -- the CHAR half of the same decoration,
    // see `badgeGlyphPath`/`resolveBadgeLetter`'s own doc comment for the
    // 5-known-letters limitation.
    // T7b: routed through `path()` (was a raw template literal) -- the
    // `d` string itself is already formatted at its source
    // (`class-badge.ts#badgeGlyphPath`'s own T7b fix), so this call only
    // needed to stop bypassing the shared emitter for the `fill` attribute.
    path(
      badgeGlyphPath(
        geo.kind,
        badgeX,
        badgeY,
        geo.badgeChar,
        theme.colors.graph.circledCharacterFontSize,
        theme.colors.graph.circledCharacterFontFamily,
        theme.colors.graph.circledCharacterFontBold,
        theme.colors.graph.circledCharacterFontItalic,
        theme.scaleK,
      ),
      { fill: resolveBadgeGlyphColor(spot?.font, theme.colors.graph.spotCascadeFont) },
    )
  );
}

/** `withMargin(4, 0, 5, 5)`'s top/bottom margin -- see `class-layout-header-
 *  creole.ts#computeBadgeSpriteBox`'s own doc comment (same value, small
 *  constant duplicated across the layout/render module family, matching
 *  this project's established convention rather than crossing a module
 *  boundary for one number). */
const BADGE_SPRITE_TOP_MARGIN = 5;

/**
 * CDD B7FU-R2 item (c-b): `class Foo <<($sprite[,color])>>`'s SPRITE badge
 * -- drawn in place of {@link renderBadge}'s default circled-character
 * badge whenever `geo.badgeSpriteImage` is set (`renderer-classifier-
 * box.ts#buildHeaderPrimitive`'s own dispatch). Position: jar-verified
 * rotisi-30-loge424 `class zz <<($bug16,red)>>` -- the image sits at
 * `geo.x + BADGE_LEFT_MARGIN(4), geo.y + BADGE_SPRITE_TOP_MARGIN(5)`
 * (box `x=287.5,y=116.114`, image `x=291.5,y=121.114`, both offsets
 * exact), i.e. flush against the classifier box's OWN top-left corner --
 * NOT vertically centered in `headerH` the way the char badge's `<ellipse>`
 * is (`Stereotype#getSprite`'s `withMargin(4,0,5,5)`-wrapped block is the
 * FIRST element `HeaderLayout`'s ctor places, at a fixed top offset, unlike
 * the circled-character badge's own vertical-center placement rule).
 */
export function renderBadgeSpriteImage(
  geo: ClassifierGeo,
  sprite: { href: string; width: number; height: number },
  k: number,
): string {
  return image(
    geo.x + BADGE_LEFT_MARGIN * k,
    geo.y + BADGE_SPRITE_TOP_MARGIN * k,
    sprite.width,
    sprite.height,
    sprite.href,
  );
}

/**
 * G2 N32: `class Foo<T>`'s generic type-parameter tag box -- a dashed
 * `<rect>` + italic `<text>`, drawn OUTSIDE/above the classifier box (see
 * `class-stereotype.ts#buildGenericTagGeo`'s doc comment for the position
 * derivation) as the LAST header-bundle primitive (jar's own draw order:
 * box, badge, name, THEN the generic tag -- `EntityImageClassHeader
 * .java:163`'s `HeaderLayout` ctor argument order, `circledCharacter, stereo,
 * name, genericBlock`, matches `HeaderLayout#drawU`'s own sequential draw
 * calls). Fill is a FIXED white default (`GENERIC_TAG_BACKGROUND`), NOT
 * `theme.colors.background` (the ROOT canvas background) -- G2 N49
 * jar-verified `remulu-24-zadi546` (`skinparam backgroundcolor transparent`
 * still draws the tag `fill="#FFFFFF"`, proving the two are independent):
 * the tag's fill is `element.classDiagram.class.generic`'s OWN style-cascade
 * default (`EntityImageClassHeader.java:149`, `styleGeneric.value(BackGround
 * Color)`), a DIFFERENT selector from both `class_`'s own fill AND the
 * document/root background -- the earlier `caboco-62-jula911` citation
 * (default theme, non-transparent) couldn't distinguish the two since
 * `theme.colors.background` ALSO defaults to `#FFFFFF`. A `<style> class {
 * generic { BackgroundColor ... } } }` override (jar-verified honored,
 * `camuna-58-veca254`) is NOT yet wired here -- no corpus fixture reaches
 * zero-diff on that path alone (that fixture has unrelated, larger diffs);
 * ledgered as a follow-up, not attempted this iteration. Text fill
 * is the SAME hardcoded `#000000` every other classifier text row uses
 * (`renderRowText`'s own doc comment); `font-style="italic"` always
 * (`FontParam.CLASS_STEREOTYPE`'s own default face, `FontParam.java:59`).
 */
const GENERIC_TAG_BACKGROUND = '#FFFFFF';
export function renderGenericTag(
  geo: ClassifierGeo,
  tag: NonNullable<ClassifierGeo['genericTag']>,
  theme: ScaledTheme,
): string {
  return (
    rect(geo.x + tag.rectX, geo.y + tag.rectY, tag.rectWidth, tag.rectHeight, {
      fill: GENERIC_TAG_BACKGROUND,
      stroke: theme.colors.border,
      strokeWidth: theme.scaleK,
      strokeDasharray: scaleDashArrayString('2,2', theme.scaleK),
    }) +
    // CDD T6FU: one `<text>` per `Display.getWithNewlines` line
    // (`EntityImageClassHeader.java:146`), each pre-placed and pre-measured
    // by `buildGenericTagGeo`. A single-line clause yields exactly one
    // entry at `textX`/`textY` with `width === tag.textWidth`, so this is
    // byte-identical to the previous single-`<text>` emission there.
    tag.lines
      .map((line) =>
        text(geo.x + line.x, geo.y + line.y, line.text, {
          fontFamily: tag.fontFamily,
          fontSize: tag.fontSize,
          fill: '#000000',
          // G2 N39: `skinparam classStereotypeFontStyle` override -- see
          // `GenericTagGeo`'s own doc comment.
          ...(tag.italic ? { fontStyle: 'italic' as const } : {}),
          ...(tag.bold === true ? { fontWeight: '700' as const } : {}),
          lengthAdjust: 'spacing',
          textLength: line.width,
        }),
      )
      .join('')
  );
}
