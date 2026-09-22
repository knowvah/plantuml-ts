/**
 * renderer-classifier-header-split.ts — CDD T20 (E1): the `class`/`enum`/
 * `interface`/`abstract` header-background split (`EntityImageClass
 * #drawInternal`'s four-element form). Split out of `renderer-classifier-
 * box.ts` purely to keep that file under the project's 500-line cap (pure
 * move of newly-added code into its own module, no behavior change to any
 * pre-existing export) — mirrors the `renderer-classifier-badge-tag.ts`
 * split precedent.
 */
import type { ClassifierGeo } from './layout.js';
import { rect, PAINT_NONE } from '../../core/svg.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { parseColor, type Paint } from '../../core/paint.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';

/** The `class`/`enum`/`interface`/`abstract` kinds `EntityImageClass
 *  #drawInternal`'s header-background split applies to -- disjoint from
 *  `renderer-classifier-box.ts#headerBackgroundPath`'s `object`/`map`/
 *  `json` gate (a DIFFERENT upstream image class/shape entirely, see that
 *  function's own doc comment). */
export const CLASS_HEADER_SPLIT_KINDS: ReadonlySet<ClassifierGeo['kind']> = new Set([
  'class',
  'enum',
  'interface',
  'abstract',
]);

/**
 * The `header:`/`##[style]colour`-adjacent inline `header:` part of a
 * classifier's OWN colour spec -- `ColorType.HEADER` (`klimt/color/
 * Colors.java:95-124`), mirroring `core/color-override.ts
 * #resolveBareOrBackColor`'s identical bare/`back:`-token extraction, but
 * for the `header:` keyword. NOT added to `class-declaration-extractors.ts
 * #DeclarationColors` (T18's `line?`/`lineStyle?` fields; that file is
 * outside this task's write-set) -- `geo.color` already carries the SAME
 * raw joined token that extractor reads, so the extraction is repeated
 * here exactly like `resolveBareOrBackColor`'s own precedent (a separate,
 * independent extraction of the SAME raw string, not a second parser).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:192-208
 */
function resolveInlineHeaderColor(color: string | undefined): string | undefined {
  if (color === undefined) return undefined;
  const colorToken = color.split(' ')[0];
  if (colorToken === undefined || colorToken.startsWith('##')) return undefined;
  const m = /(?:^#|;)header:([^;]+)/i.exec(colorToken);
  return m?.[1];
}

/**
 * The class-family header split's fill source, or `undefined` when
 * upstream would draw the plain single-rect box.
 *
 * Two triggers, both read off `EntityImageClass.java:192-208`'s
 * `headerBackcolor`/`backcolor` resolution:
 *  1. An inline `header:`/`##[header]` token on THIS classifier -- always
 *     compared against `bodyFill` by VALUE when both are flat
 *     (`HColorSimple#equals`, `klimt/color/HColorSimple.java:85-89`).
 *  2. No inline header at all: jar STILL independently re-resolves a
 *     (possibly identical-valued) header default via a SEPARATE
 *     `getStyleHeader()` style-signature call. `HColorGradient` has NO
 *     `equals` override (`klimt/color/HColorGradient.java:43`), so two
 *     independently-resolved gradients are NEVER `.equals()`-true even
 *     when byte-identical -- reproduced by unconditionally splitting
 *     whenever `bodyFill` itself is a gradient (from ANY source: inline,
 *     `<style>`, or skinparam default) and no inline header narrows it.
 *     `Colors#equals` is called on `backcolor` (the LHS), so a gradient
 *     BODY fill decides this outright, independent of the header token's
 *     own type -- a FLAT body with no inline header never splits (the
 *     independently-resolved flat header default IS `.equals()`-true,
 *     `HColorSimple`'s own override).
 * A `classHeaderBackgroundColor` skinparam / `<style> header {
 * BackgroundColor } }` override (`style/FromSkinparamToStyle.java:196`)
 * would ALSO trigger this for a flat body with no inline color at all
 * (`nisune-86-faji869`) -- NOT reachable here: it requires a new
 * `theme.colors.graph`/`theme.colors.elements` field (`theme-graph-
 * colors-a.ts`) and its skinparam-table wiring (`skinparam-key-handlers-
 * table-*.ts`), both outside this task's write-set (T18-follow-up/T19
 * owned) -- journaled, not fixed this task.
 */
export function resolveClassHeaderFill(geo: ClassifierGeo, bodyFill: Paint): Paint | undefined {
  const inline = resolveInlineHeaderColor(geo.color);
  if (inline !== undefined) {
    const parsed = parseColor(inline);
    const headerFill = typeof parsed === 'string' ? resolveColorToSvgHex(parsed) : parsed;
    if (typeof bodyFill !== 'string') return headerFill; // gradient body: never `.equals()`-true
    return typeof headerFill === 'string' && headerFill === bodyFill ? undefined : headerFill;
  }
  // `headerBackcolor = backcolor == null ? getStyleHeader()... : backcolor`
  // (`EntityImageClass.java:203-205`) -- an inline `back:`/bare colour with
  // NO inline header token makes `headerBackcolor` the SAME reference as
  // `backcolor`, which is trivially `.equals()`-true to itself -- so the
  // "second trigger" below (independently re-resolved header default)
  // fires ONLY when this classifier carries NO inline background colour
  // at ALL, never merely "no inline header". Jar-verified `taceve-49-
  // mezi408`'s Test1-4 (`#yellow\FFFFFF` etc., inline gradient, no header
  // token): childCount 6, no split, despite a gradient body fill.
  if (resolveBareOrBackColor(geo.color) !== undefined) return undefined;
  return typeof bodyFill === 'string' ? undefined : bodyFill;
}

/** Bundled call args for {@link classHeaderSplitRects} -- stays under this
 *  project's 5-param cap (mirrors `class-member-rows.ts#OneRowInput`'s
 *  identical rationale). */
export interface ClassHeaderSplitInput {
  geo: ClassifierGeo;
  roundCorner: number;
  bodyFill: Paint;
  border: Paint;
  strokeWidth: number;
  dasharray: string | undefined;
  headerFill: Paint;
  filter: string | undefined;
}

/**
 * `EntityImageClass#drawInternal`'s `roundCorner != 0 && headerBackcolor
 * != null && backcolor.equals(headerBackcolor) == false` branch -- FOUR
 * elements instead of one: the full box (body fill + border), a header-
 * height rounded rect (header fill, ALSO STROKED with the header fill --
 * `ugHeader.apply(headerBackcolor.bg()).apply(headerBackcolor)`, jar-
 * verified `nisune-86-faji869`/`mexaka-52-gati860`'s Demo1), a
 * `roundCorner/2`-tall SQUARE-cornered rect squaring off the header's
 * bottom corners (SAME header fill+stroke, no `rx`/`ry` -- `URectangle
 * .build(widthTotal, roundCorner / 2)`, no `.rounded()` call), and finally
 * the outer box RE-DRAWN with `fill="none"` (`HColors.none().bg()`) to
 * re-paint the border ON TOP of the header shapes. Only the FIRST rect
 * carries the shadow filter (`EntityImageClass.java`'s `rect.setDeltaShadow
 * (shadow)` runs once, BEFORE the branch; `rect2`/`rect3`/the re-drawn
 * `rect` are all explicitly zeroed). Genuinely distinct from `renderer-
 * classifier-box.ts#headerBackgroundPath`'s object/map/json ONE-path form
 * (`URectangle.halfRounded`, `EntityImageObject.java:199-203`) -- a
 * different upstream image class entirely, not a variant to merge.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:216-234
 */
export function classHeaderSplitRects(input: ClassHeaderSplitInput): string {
  const { geo, roundCorner, bodyFill, border, strokeWidth, dasharray, headerFill, filter } = input;
  const headerHeight = geo.dividerYs[0] ?? geo.height;
  const r = roundCorner / 2;
  const dash = dasharray !== undefined ? { strokeDasharray: dasharray } : {};
  const boxStroke = { stroke: border, strokeWidth, ...dash };
  const headerStroke = { stroke: headerFill, strokeWidth, ...dash };
  const filterAttr = filter !== undefined ? { filter } : {};
  let out = rect(geo.x, geo.y, geo.width, geo.height, { fill: bodyFill, ...boxStroke, rx: r, ry: r, ...filterAttr });
  out += rect(geo.x, geo.y, geo.width, headerHeight, { fill: headerFill, ...headerStroke, rx: r, ry: r });
  out += rect(geo.x, geo.y + headerHeight - r, geo.width, r, { fill: headerFill, ...headerStroke });
  out += rect(geo.x, geo.y, geo.width, geo.height, { fill: PAINT_NONE, ...boxStroke, rx: r, ry: r });
  return out;
}
