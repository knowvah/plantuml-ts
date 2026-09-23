/**
 * cdd-T6 (A2a/M2): the visibility-modifier block a link LABEL carries when
 * its first line starts with `-`/`#`/`+`/`~`/`*`.
 *
 * Split out of `class-edge-geo.ts` (500-line cap, pre-authorised).
 *
 * Upstream builds the label block, then merges an icon block LEFT of it:
 * `labelOnly = addVisibilityModifier(block, link, skinParam)`
 * (`svek/SvekEdge.java:302`), whose body (`:363-374`) is
 * `visibility = visibilityModifier.getUBlock(classAttributeIconSize, fore,
 * null, false)` -> `TextBlockUtils.withMargin(visibility, 0, 1, 2, 0)` ->
 * `TextBlockUtils.mergeLR(visibility, block, VerticalAlignment.CENTER)`.
 * The character itself is stripped from the drawn text one level earlier,
 * in `Display#manageGuillemet`'s visibility arm
 * (`klimt/creole/Display.java:415-416`, `lineString.substring(1).trim()`),
 * reached from `LinkArg.build(label, queue, skinParam
 * .classAttributeIconSize() > 0)` (`abel/LinkArg.java:65-74`,
 * `classdiagram/command/CommandLinkClass.java:348-350`).
 *
 * The measurement half already exists and is unchanged:
 * `core/edge-label-box.ts#applyVisibilityIcon` reserves `size+2` x `size+3`
 * inside the DOT label box, which is why the jar's label `x` and this
 * port's differed by exactly the icon block's width before this module.
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { applyVisibilityIcon } from '../../core/edge-label-box.js';
import { VisibilityModifier } from '../../core/skin/VisibilityModifier.js';

/** `VisibilityModifier#getUBlock`'s draw origin plus the modifier's own
 *  enum name -- the `<g data-visibility-modifier="...">` wrapper's value
 *  (`skin/VisibilityModifier.java:118-124`). `x`/`y` is the icon BLOCK's
 *  top-left, the point `drawU` is applied at, NOT the ink corner: each
 *  shape adds its own offset (`drawSquare`/`drawCircle` `+2,+2`,
 *  `drawDiamond` `+1,+0`), the same convention
 *  `class-visibility-icon.ts` already uses for member rows. */
export interface VisibilityIconGeo {
  readonly x: number;
  readonly y: number;
  readonly modifier: string;
}

/** {@link stripEdgeLabelVisibility}'s result: the first line with its
 *  visibility character stripped, plus the icon block's reserved size and
 *  enum name. `modifier` is `undefined` exactly when the line carries no
 *  visibility character (or the icon size is 0), in which case `text` is
 *  the input unchanged and both dimensions are 0. */
export interface EdgeLabelVisibility {
  readonly text: string;
  readonly iconWidth: number;
  readonly iconHeight: number;
  readonly modifier: string | undefined;
}

/**
 * `Display#manageGuillemet`'s visibility arm plus `LinkArg.build`'s
 * modifier lookup, as one call over the label's FIRST line only
 * (`Display.java:410-424`'s `first` flag; `LinkArg.java:71-73`'s
 * `label.get(0)`). `isField` is `false` at that call site, which is why
 * the jar's wrapper reads `PRIVATE_METHOD`/`PROTECTED_METHOD`/
 * `PUBLIC_METHOD` on a link label rather than the `_FIELD` names.
 */
export function stripEdgeLabelVisibility(
  firstLine: string,
  classAttributeIconSize: number | undefined,
): EdgeLabelVisibility {
  const vis = applyVisibilityIcon(firstLine, classAttributeIconSize);
  const modifier = VisibilityModifier.getVisibilityModifier(firstLine, false);
  if (vis.iconWidth === 0 || modifier === null) {
    return { text: firstLine, iconWidth: 0, iconHeight: 0, modifier: undefined };
  }
  return { text: vis.text, iconWidth: vis.iconWidth, iconHeight: vis.iconHeight, modifier: modifier.name };
}

/** {@link visibilityBlockAnchor}'s result: where to draw the icon block,
 *  and the centre the REMAINING text block must be laid out around. */
export interface VisibilityBlockAnchor {
  readonly icon: VisibilityIconGeo;
  readonly center: { x: number; y: number };
}

/**
 * Place the merged `mergeLR(visibility, textBlock, CENTER)` block
 * (`SvekEdge.java:374`) around the centre graphviz laid the label box out
 * at, and report where each operand lands.
 *
 * `mergeLR` sums widths and maxes heights (`XDimension2D.java:108-112`), so
 * with `iconWidth` an integer (`size + 2`) the text sub-block's own left
 * edge works out to an exact `+iconWidth / 2` shift of the centre
 * `portLabelAnchor`/`multiLineLabelAnchor` already lay out around:
 *
 *   `blockLeft + iconWidth`
 *     === `center.x - trunc(iconWidth + textWidth) / 2 + iconWidth`
 *     === `(center.x + iconWidth / 2) - trunc(textWidth) / 2`
 *
 * Vertically, `mergeLR(…, CENTER)` offsets each operand by
 * `(mergedHeight - ownHeight) / 2` (`TextBlockHorizontal.java:79-91`), so
 * the text centre shifts by the difference between the merged block's own
 * `-trunc(h)/2` corner rule and the text block's own. Both terms vanish
 * when `textHeight >= iconHeight` — every corpus fixture, since the arrow
 * font is 13+ against a 13px icon block — which is why a label carrying no
 * visibility character reaches byte-identical geometry to before.
 *
 * Jar-verified against `canuti-20-jotu614`'s three links: icon draw origins
 * `156.32,158` / `96.32,158` / `225.99,158`, recovered from the golden's
 * `<rect x="158.32" y="160">`, `<polygon points="101.32,158,…">` and
 * `<ellipse cx="230.99" cy="163" rx="3">` through each shape's own offset
 * (`VisibilityModifier.java:177-184`); label `<text x>` `168.32` /
 * `108.32` / `237.99` = icon origin + `iconWidth` (12) exactly.
 */
export function visibilityBlockAnchor(
  vis: EdgeLabelVisibility,
  lines: readonly string[],
  center: { x: number; y: number },
  font: FontSpec,
  measurer: StringMeasurer,
): VisibilityBlockAnchor {
  const textWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  // `TextBlockVertical` stacks n lines at `font.size` apiece; a single line
  // reduces to the measurer's own height (ADR-001: height === font.size).
  const textHeight = (lines.length - 1) * font.size + measurer.measure(lines[0] ?? '', font).height;
  const mergedHeight = Math.max(vis.iconHeight, textHeight);
  const blockTop = center.y - Math.trunc(mergedHeight) / 2;
  const textTop = blockTop + (mergedHeight - textHeight) / 2;
  return {
    icon: {
      x: center.x - (vis.iconWidth + Math.trunc(textWidth)) / 2,
      // `withMargin(visibility, 0, 1, 2, 0)` -> `marginY1 = 2` above the
      // icon, `marginX1 = 0` to its left (`TextBlockUtils.java:75-78`).
      y: blockTop + (mergedHeight - vis.iconHeight) / 2 + 2,
      modifier: vis.modifier!,
    },
    center: { x: center.x + vis.iconWidth / 2, y: textTop + Math.trunc(textHeight) / 2 },
  };
}
