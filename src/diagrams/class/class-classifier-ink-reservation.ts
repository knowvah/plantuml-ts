/**
 * cdd2-T17: what `LimitFinder` sees of one `EntityImageClass` besides its
 * bordered `URectangle` -- the invisible `UEmpty` reservations its header
 * and body blocks draw, in `EntityImageClass#drawInternal` order
 * (`svek/image/EntityImageClass.java:180-245`): the rect, then
 * `header.drawU(ug, widthTotal, dimHeader.height)` (`:238`), then the body
 * translated by `dy(dimHeader.height)` (`:240-244`).
 *
 * The ONLY `UEmpty` draw on this path is `TextBlockMarged#drawU`'s
 * `ug.draw(UEmpty.create(dim))` at the block's OWN dimension, when that
 * width is positive (`klimt/shape/TextBlockMarged.java:79-86`), bounded by
 * `LimitFinder#drawEmpty` with no inset (`klimt/drawing/LimitFinder.java:
 * 159-162`). The marged blocks are:
 *
 * - header (`svek/image/EntityImageClassHeader.java:111,130-132,159`): the
 *   circled character `withMargin(c, 4, 0, 5, 5)`, the stereotype
 *   `withMargin(s, 1, 0)`, the name `withMargin(n, 3, 3, 0, 0)`, each placed
 *   by `HeaderLayout#drawU` (`svek/HeaderLayout.java:81-110`) against the
 *   FINAL box width. The generic tag (`:147,154`) is not modelled here: its
 *   outer marged block spans exactly the corners `addClassicRectInk` already
 *   gives the tag's `URectangle` (`class-ink-shapes.ts`).
 * - body (`cucadiagram/BodierLikeClassOrObject.java:242-254`): each SHOWN
 *   compartment is `MethodsOrFieldsArea#asBlockMemberImpl`'s
 *   `withMargin(area, 6, 4)` (`cucadiagram/MethodsOrFieldsArea.java:83-86`),
 *   stacked LEFT-aligned by `TextBlockVertical` (`klimt/shape/
 *   TextBlockVertical.java:83-90`). An EMPTY shown compartment still
 *   reserves its 12px margin (`calculateDimensionOnlyMembers` is 0 wide,
 *   `:154-178`). Both compartments hidden is `TextBlockUtils.empty(0, 0)`
 *   (`:249-250`), which draws nothing.
 *
 * `EntityImageObject` is the same model with a different header (centred by
 * `PlacementStrategyY1Y2`, 5px clear of each side), which is why its
 * `bodyInkWidth` (`class-object-sizing.ts`) is its body reservation alone.
 */
import { badgeBoxHeight, computeHeaderSlack } from './class-badge.js';
import { sectionWidth, type FlatMemberRows } from './class-member-rows.js';
import { LIKE_CLASS_KINDS, type MemberSuppression } from './class-layout-helpers.js';
import type { ClassifierKind } from './ast.js';
import type { computeHeaderNameGeo, StereoAndTagGeo } from './class-layout-header-geo.js';
import type { computeMemberSectionsGeo } from './class-layout-generic-classifier-sections.js';

/** `MethodsOrFieldsArea#asBlockMemberImpl`'s `withMargin(this, 6, 4)` --
 *  left + right margin, summed (`cucadiagram/MethodsOrFieldsArea.java:85`). */
const MEMBER_AREA_MARGIN_X_TOTAL = 12;

/** The header blocks' own dimensions, as `HeaderLayout#drawU` reads them. */
export interface HeaderBlockDims {
  /** `circleDim` (0x0 when the circled character is hidden). */
  circleWidth: number;
  circleHeight: number;
  /** `stereoDim` (0x0 when there is no stereotype block). */
  stereoWidth: number;
  stereoHeight: number;
  /** `nameDim`, margins included. */
  nameWidth: number;
  nameHeight: number;
  genericWidth: number;
}

/** A reservation's far corner, relative to the classifier's own origin. */
export interface InkReservation {
  maxX: number;
  maxY: number;
}

/** `HeaderLayout#drawU`'s `suppWith`/`h1`/`h2` placement (`svek/
 *  HeaderLayout.java:89-94`) of one marged block of dims `w`x`h`. */
interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
}

function placeHeaderBlocks(d: HeaderBlockDims, width: number, height: number): Placed[] {
  const widthStereoAndName = Math.max(d.stereoWidth, d.nameWidth);
  const headerWidth = d.circleWidth + widthStereoAndName + d.genericWidth;
  const { h1, h2 } = computeHeaderSlack(width, headerWidth, d.circleWidth);
  const diffHeight = height - d.stereoHeight - d.nameHeight;
  const column = d.circleWidth + h1 + h2;
  return [
    // `:98-100` xCircle = h1, yCircle = (height - circleDim.height) / 2
    { x: h1, y: (height - d.circleHeight) / 2, w: d.circleWidth, h: d.circleHeight },
    // `:103-105`
    { x: column + (widthStereoAndName - d.stereoWidth) / 2, y: diffHeight / 2, w: d.stereoWidth, h: d.stereoHeight },
    // `:107-109`
    {
      x: column + (widthStereoAndName - d.nameWidth) / 2,
      y: diffHeight / 2 + d.stereoHeight,
      w: d.nameWidth,
      h: d.nameHeight,
    },
  ];
}

/**
 * The header's reservation corner: the max over its marged blocks that
 * draw a `UEmpty` (width > 0, `TextBlockMarged.java:82`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/HeaderLayout.java:81-110
 */
export function headerInkReservation(d: HeaderBlockDims, width: number, height: number): InkReservation {
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of placeHeaderBlocks(d, width, height)) {
    if (b.w <= 0) continue;
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  return { maxX, maxY };
}

/** One SHOWN compartment's marged-block width: the area plus its 12px
 *  margin, the margin alone when the area is empty.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:83-86,154-178 */
export function compartmentReservationWidth(section: FlatMemberRows, hasIcon: boolean, iconZoneWidth: number): number {
  if (section.builds.length === 0) return MEMBER_AREA_MARGIN_X_TOTAL;
  return sectionWidth(section.builds, hasIcon, iconZoneWidth);
}

/** The pieces of `measureGenericClassifier`'s pipeline the model reads. */
export interface GenericClassifierInkGeo {
  headerNameGeo: Pick<
    ReturnType<typeof computeHeaderNameGeo>,
    'badgeShown' | 'badgeSpriteBox' | 'nameWidth' | 'nameBlockHeight'
  >;
  stereoGeo: Pick<StereoAndTagGeo, 'circleWidth' | 'blockDim' | 'genericDim' | 'headerRowHeight'>;
  /** The FINAL box width (`EntityImageClass.java:113`, every floor applied). */
  width: number;
  /** `undefined` for the enhanced body, which never reaches this model. */
  memberSections:
    | Pick<
        ReturnType<typeof computeMemberSectionsGeo>,
        'fieldFlat' | 'methodFlat' | 'fieldsHasIcon' | 'methodsHasIcon' | 'iconZoneWidth'
      >
    | undefined;
}

function headerBlockDims(input: GenericClassifierInkGeo, badgeRadius: number): HeaderBlockDims {
  const { headerNameGeo, stereoGeo } = input;
  const circleHeight = headerNameGeo.badgeShown
    ? (headerNameGeo.badgeSpriteBox?.height ?? badgeBoxHeight(badgeRadius))
    : 0;
  return {
    circleWidth: stereoGeo.circleWidth,
    circleHeight,
    stereoWidth: stereoGeo.blockDim.width,
    stereoHeight: stereoGeo.blockDim.height,
    nameWidth: headerNameGeo.nameWidth,
    nameHeight: headerNameGeo.nameBlockHeight,
    genericWidth: stereoGeo.genericDim?.width ?? 0,
  };
}

/** The body's reservation right edge: the widest SHOWN compartment
 *  (`TextBlockVertical` LEFT-aligns both at x = 0); `-Infinity` when both
 *  are hidden, the `TextBlockUtils.empty(0, 0)` body that draws nothing
 *  (`cucadiagram/BodierLikeClassOrObject.java:249-250`). */
function bodyReservationMaxX(m: GenericClassifierInkGeo['memberSections'], suppress: MemberSuppression): number {
  if (m === undefined) return -Infinity;
  const fields = suppress.fields
    ? -Infinity
    : compartmentReservationWidth(m.fieldFlat, m.fieldsHasIcon, m.iconZoneWidth);
  const methods = suppress.methods
    ? -Infinity
    : compartmentReservationWidth(m.methodFlat, m.methodsHasIcon, m.iconZoneWidth);
  return Math.max(fields, methods);
}

/**
 * The classifier's rightmost `UEmpty` reservation, relative to its `x`, as
 * the `bodyInkWidth` field `class-ink-shapes.ts#addRectInk` reads. Only
 * `LeafType#isLikeClass` leaves are `EntityImageClass`
 * (`LIKE_CLASS_KINDS`); every other kind gets no field (the fixed `x + w`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:180-245
 */
export function genericClassifierInkFields(
  kind: ClassifierKind,
  geo: GenericClassifierInkGeo,
  suppress: MemberSuppression,
  badgeRadius: number,
): { bodyInkWidth?: number } {
  if (!LIKE_CLASS_KINDS.has(kind)) return {};
  const header = headerInkReservation(headerBlockDims(geo, badgeRadius), geo.width, geo.stereoGeo.headerRowHeight);
  return { bodyInkWidth: Math.max(header.maxX, bodyReservationMaxX(geo.memberSections, suppress)) };
}
