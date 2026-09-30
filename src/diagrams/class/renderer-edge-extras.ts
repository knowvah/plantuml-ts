/**
 * cdd-T7: `renderer-edge.ts`'s overflow — visibility-modifier icon,
 * note-on-link body, and constraint line+text. Split out to keep
 * `renderer-edge.ts` under the repo's 500-line hook cap (pre-authorised,
 * `batch-2/T7-edge-rendering.md`'s own quality bar).
 */
import type { EdgeGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { scaleDashArrayString } from './class-scale-geo-row.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Visibility } from './class-member-ast.js';
import { text, line, rect } from '../../core/svg.js';
import { renderLinkNoteBox } from './renderer-note-link-box.js';
import { colorsFor, iconSizeOf } from './class-visibility-icon.js';
import { VisibilityModifier } from '../../core/skin/VisibilityModifier.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { Paint } from '../../core/paint.js';
import { buildDotPathFromSplinePoints } from '../../core/svek/svek-edge-geometry.js';
import { extractFlatContent } from '../../core/klimt/document-shell.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { resolveArrowLabelFont, resolveCardinalityFont } from '../../core/arrow-label-font.js';
import { KAL_STROKE_THICKNESS } from './class-kal.js';

/**
 * `VisibilityModifier#name()` values `class-edge-visibility.ts#stripEdgeLabelVisibility`
 * can produce (`LinkArg.build`'s `isField=false` call, so only the METHOD
 * variants plus `IE_MANDATORY` are reachable — see that module's doc
 * comment), mapped to the raw character `class-visibility-icon.ts
 * #colorsFor` (the theme-override-aware LineColor table) expects, and to
 * the matching `core/skin/VisibilityModifier.ts` static instance.
 */
const METHOD_MODIFIER_TO_ICON: Record<string, Visibility> = {
  PRIVATE_METHOD: '-',
  PROTECTED_METHOD: '#',
  PACKAGE_PRIVATE_METHOD: '~',
  PUBLIC_METHOD: '+',
  IE_MANDATORY: '*',
};
const MODIFIER_INSTANCE_BY_NAME: Record<string, VisibilityModifier> = {
  PRIVATE_METHOD: VisibilityModifier.PRIVATE_METHOD,
  PROTECTED_METHOD: VisibilityModifier.PROTECTED_METHOD,
  PACKAGE_PRIVATE_METHOD: VisibilityModifier.PACKAGE_PRIVATE_METHOD,
  PUBLIC_METHOD: VisibilityModifier.PUBLIC_METHOD,
  IE_MANDATORY: VisibilityModifier.IE_MANDATORY,
};

/** Icon shapes never draw text (same stub `renderer-arrowhead.ts
 *  #NO_TEXT_BOUNDER` uses for extremities, duplicated per this codebase's
 *  small-helper-per-call-site convention). */
const NO_TEXT_BOUNDER = { calculateDimension: (): { width: number } => ({ width: 0 }) };

/**
 * cdd-T7 (A2a/M2): the `<g data-visibility-modifier="...">` + shape a link
 * label's leading visibility character reserves (`class-edge-visibility.ts`,
 * T6) but this port never drew. Draws via `core/skin/VisibilityModifier.ts`
 * #getUDrawable's EXISTING drawable (task brief: "no new icon shape") through
 * a throwaway `UGraphicSvg` document — the SAME technique `renderer-
 * arrowhead.ts#drawExtremityMarkup` uses for extremities. Background is
 * `null` (`SvekEdge.java:302`'s `addVisibilityModifier` passes `null`,
 * NEVER the field/method BackgroundColor `MethodsOrFieldsArea`'s row path
 * uses), which `VisibilityModifier#drawInternal` turns into `fill="none"`
 * unconditionally — the reason this does NOT reuse `class-visibility-
 * icon.ts#renderVisibilityIcon` (member-row icons, which fill METHOD shapes
 * solid): jar-verified against `canuti-20-jotu614`'s three icons, all
 * `fill="none"` regardless of method visibility.
 */
export function renderEdgeVisibilityIcon(geo: EdgeGeo, theme: ScaledTheme): string {
  const icon = geo.visibilityIcon;
  if (icon === undefined) return '';
  const char = METHOD_MODIFIER_TO_ICON[icon.modifier];
  const modifier = MODIFIER_INSTANCE_BY_NAME[icon.modifier];
  if (char === undefined || modifier === undefined) return '';
  const color = colorsFor(char, theme).line;
  // cdd-B8FU: same double-scaling trap `renderer-arrowhead.ts
  // #drawExtremityMarkup` documents -- `icon.x`/`icon.y` are ALREADY scaled
  // (`class-scale-geo-edge.ts#scaleVisibilityIcon`), and this draws through
  // the SAME scale-aware klimt `UGraphicSvg` pipeline, so the point must be
  // unscaled before translating and `SvgOption.scale=k` re-scales both the
  // position and the drawable's own local shape uniformly.
  const k = theme.scaleK;
  const ug = UGraphicSvg.build(0, basicSvgOption({ scale: k }), '$version$', NO_TEXT_BOUNDER);
  const context = ug.apply(new UTranslate(icon.x / k, icon.y / k));
  modifier.getUDrawable(iconSizeOf(theme), color, null).drawU(context);
  return extractFlatContent(ug.getSvgString()).body;
}

/**
 * cdd-T7 (A2a/M5): `note on link`'s body — draws via `renderer-note-link
 * -box.ts#renderLinkNoteBox`, the `ComponentRoseNote`-shaped render path
 * (cdd2-T19c; that module's own doc comment has the full jar derivation of
 * why a note-on-link is NOT `renderer-note.ts#renderNote`'s plain-note
 * path). Builds the `NoteGeo` it reads from the note operand's INK box
 * (`box.inkBox`, the rectangle `ComponentRoseNote#drawInternalU` actually
 * paints — NOT `box.x`/`.y`/`.width`/`.height`, the OUTER `EntityImageNoteLink
 * `-preferred box `class-edge-note-box.ts`'s own doc comment distinguishes;
 * cdd2-T19c: drawing the outer box instead of the ink box was this
 * mechanism's own defect, jar-verified against `lipazi-06-care921`'s
 * second note — the outer/ink delta matches `Rose.java:65-66`'s
 * `paddingX`/`paddingY` (both 5) exactly). `connector: []` — the
 * note-on-link box has none of its own, it merges directly into the
 * edge's own label block. `lineAtoms` threads `measureNote`'s creole/
 * sprite-atom breakdown through (`class-edge-note-box.ts`), so a
 * `<$sprite>` token draws as an image atom instead of literal source text
 * (`lozego-15-coci435`).
 */
export function renderEdgeNoteBox(geo: EdgeGeo, theme: ScaledTheme): { body: string; extraDefs: string } {
  const box = geo.noteBox;
  if (box === undefined) return { body: '', extraDefs: '' };
  const noteGeo: NoteGeo = {
    id: `${geo.id}-note`,
    kind: 'note',
    x: box.inkBox.x,
    y: box.inkBox.y,
    width: box.inkBox.width,
    height: box.inkBox.height,
    lines: box.noteLines.map((l) => l.text),
    lineWidths: box.noteLines.map((l) => l.width),
    connector: [],
    ...(box.lineAtoms !== undefined ? { lineAtoms: box.lineAtoms } : {}),
  };
  return renderLinkNoteBox(
    noteGeo,
    { ...(box.back !== undefined ? { back: box.back } : {}), ...(box.line !== undefined ? { line: box.line } : {}) },
    theme,
  );
}

/** `(fontSize - descent) / 2`-style ascent/descent split every note/member
 *  text baseline in this codebase shares (`renderer-note.ts#renderNoteText`'s
 *  own `fontSize - fontSize/4.5` formula, ADR-001's `descent = size/4.5`). */
function ascentDescent(fontSize: number): { ascent: number; descent: number } {
  const descent = fontSize / 4.5;
  return { ascent: fontSize - descent, descent };
}

/**
 * cdd-T7 (A2a/M9): `constraint on links: text` — `LinkConstraint#drawMe`
 * (`cucadiagram/LinkConstraint.java:82-103`): a dashed `<line
 * style="stroke-dasharray:3,3">` between the two links' sampled points
 * (`geo.constraint.line`, `class-edge-constraint.ts`, T6) plus the
 * constraint's own text, CENTRED on that line's midpoint using the
 * `Display`/`TextBlockVertical` multi-line-centring convention every other
 * multi-line block in this codebase already implements (each line
 * independently centred within the block's own max width — the SAME
 * shape `EdgeGeo.quantifierLines`' own centring uses, jar-verified against
 * this fixture's own two-line `enten\n/eller` case).
 *
 * Java draws BOTH the line and the text unconditionally once
 * `link.getLinkConstraint() != null` and both endpoints are set
 * (`class-edge-constraint.ts#attachConstraints`'s own doc comment records
 * the observed "both ends stamped" behaviour) — `stroke="#000"` (`HColors
 * .BLACK`, NOT the edge's own resolved `strokeColor`) and the text
 * `FontConfiguration.create(skinParam, FontParam.ARROW, null)` (the SAME
 * arrow font {@link resolveArrowLabelFont} already resolves for the main
 * label) with a plain `fill="#000"`, jar-verified against `gujigi-63-
 * roki030`'s four constrained links.
 *
 * `measurer` is `undefined` only for a hand-built `ClassGeometry` test
 * literal that omits it (`ClassGeometry.measurer`'s own doc comment) — in
 * that case only the dashed line is drawn, matching upstream's own
 * "constraint but no measurable font" impossibility gracefully rather than
 * throwing.
 */
export function renderEdgeConstraint(geo: EdgeGeo, theme: ScaledTheme, measurer: StringMeasurer | undefined): string {
  const c = geo.constraint;
  if (c === undefined) return '';
  const parts: string[] = [
    line(c.line.x1, c.line.y1, c.line.x2, c.line.y2, {
      stroke: '#000',
      strokeWidth: theme.scaleK,
      strokeDasharray: scaleDashArrayString('3,3', theme.scaleK),
    }),
  ];
  if (measurer === undefined) return parts.join('');
  // cdd-B8FU: `resolveArrowLabelFont` (`core/arrow-label-font.ts`) is
  // SHARED with description/state -- its own `size` tier is independent of
  // `theme.fontSize` (which `scaleClassTheme` scales), so it stays
  // unscaled regardless of `ScaledTheme`; scaled HERE, in class-only code,
  // before it feeds the render-time measurer (this function measures text
  // at RENDER time, unlike a layout-time `row.width`, so an unscaled font
  // size here would measure inconsistently with `c.line`'s already-scaled
  // positions).
  const rawFont = resolveArrowLabelFont(theme);
  const font = { ...rawFont, size: rawFont.size * theme.scaleK };
  const { lines } = splitDisplayLines(c.text);
  const widths = lines.map((l) => measurer.measure(l, { family: font.family, size: font.size }).width);
  const blockWidth = Math.max(0, ...widths);
  const cx = (c.line.x1 + c.line.x2) / 2;
  const cy = (c.line.y1 + c.line.y2) / 2;
  const { ascent } = ascentDescent(font.size);
  const top = cy - (lines.length * font.size) / 2;
  lines.forEach((ln, i) => {
    const w = widths[i] ?? 0;
    const baseline = top + i * font.size + ascent;
    const left = cx - blockWidth / 2 + (blockWidth - w) / 2;
    parts.push(
      text(left, baseline, ln, {
        fill: '#000',
        fontSize: font.size,
        fontFamily: font.family,
        lengthAdjust: 'spacing',
        textLength: w,
      }),
    );
  });
  return parts.join('');
}

/**
 * The tail/head multiplicity-role labels' half of {@link
 * renderEdgeMainLabel}'s doc comment (shared attribute set, D3/D4 font
 * split, T3's D5/D6 `cardinalityColor` fill) -- split into its own
 * function purely to stay under the lizard NLOC/CCN caps.
 *
 * cdd-T7 (A2a/M10): when `geo.quantifierLines` is present (every
 * production edge -- T6's own doc comment on the field), draws ONE `<text>`
 * per physical line instead of the single raw-string anchor `tailLabel`/
 * `headLabel` carry alongside it -- `SvekEdge.java:330-340`'s
 * `Display.getWithNewlines(...)`. Falls back to the single-anchor form only
 * for a hand-built `EdgeGeo` test literal that omits the field (mirrors
 * every other T6 field's optional-with-fallback contract, e.g.
 * `NoteGeo.lineAtoms`).
 *
 * T11 (cdd3, Q-5): font size/family/weight/style/colour all now come from
 * {@link resolveCardinalityFont} (`GraphvizImageBuilder.java:236-237`'s
 * `cardinalityFont`) instead of the hardcoded `CARDINALITY_FONT_SIZE`/
 * `theme.fontFamily` pair -- `font-weight`/`font-style` mirror
 * `renderer-edge.ts#arrowLabelTextAttrs`'s own `'700'`/`'italic'`
 * conversion (the raw numeric weight jar's deterministic-text SVG emits).
 * jar-verified `camuna-58-veca254`/`nafiki-56-jixu680`.
 */
export function renderEdgeCardinalityLabels(geo: EdgeGeo, theme: ScaledTheme): string[] {
  const parts: string[] = [];
  const cardinalityFont = resolveCardinalityFont(theme);
  const font = {
    fill: cardinalityFont.color,
    fontSize: cardinalityFont.size * theme.scaleK,
    fontFamily: cardinalityFont.family,
    ...(cardinalityFont.weight === 'bold' ? { fontWeight: '700' as const } : {}),
    ...(cardinalityFont.style === 'italic' ? { fontStyle: 'italic' as const } : {}),
  };
  if (geo.quantifierLines !== undefined) {
    // cdd-T17 (M8): draw each end's ADDITIVE role lines right after that
    // SAME end's quantifier lines -- `SvekEdge.java:956-980`'s draw order
    // (tail quantifier, then tail role via `drawRoleLabel`; head quantifier,
    // then head role) is per-end, not quantifier-then-quantifier-then-role.
    // `geo.roleLines` uses the SAME `[tail, head]` shape as `quantifierLines`
    // itself, so indexing both arrays by the same `i` keeps the two paired.
    for (let i = 0; i < geo.quantifierLines.length; i++) {
      for (const l of geo.quantifierLines[i]!) {
        parts.push(text(l.x, l.y, l.text, { ...font, lengthAdjust: 'spacing', textLength: l.width }));
      }
      for (const l of geo.roleLines?.[i] ?? []) {
        parts.push(text(l.x, l.y, l.text, { ...font, lengthAdjust: 'spacing', textLength: l.width }));
      }
    }
    return parts;
  }
  for (const portLabel of [geo.tailLabel, geo.headLabel]) {
    if (portLabel === undefined) continue;
    parts.push(
      text(portLabel.x, portLabel.y, portLabel.text, { ...font, lengthAdjust: 'spacing', textLength: portLabel.width }),
    );
  }
  return parts;
}

/**
 * cdd-T15 (A2a/M1, D6): `Kal#drawU` (`svek/Kal.java:134-144`) — a
 * `URectangle(dim)` filled with the `class.qualified` style's
 * BackGroundColor, stroked in its LineColor at
 * `UStroke.withThickness(0.5)`, then the text block at `UTranslate(2, 1)`.
 * `SvekEdge.java:1015-1019` draws `kal1` then `kal2`, last in the link
 * group, immediately before `ug.closeGroup()` — so this is the last thing
 * `renderEdge` pushes.
 *
 * The three paints fall back to the class box's own resolved values, which
 * is what the Style system's inheritance produces with no `qualified {}`
 * block (`baneru-00-kuro607`: `#F1F1F1` / `#181818` / `#000`); the cascade
 * fields are set only when a `<style>` actually declares them
 * (`camuna-58-veca254`: `#008000` / `#FFFFF0`).
 */
export function renderEdgeKalBoxes(geo: EdgeGeo, theme: ScaledTheme): string {
  const k = geo.kalBox;
  if (k === undefined) return '';
  const g = theme.colors.graph;
  const fill = g.classCascadeQualifiedBackground ?? g.classCascadeBackground ?? g.classBackground;
  const stroke = g.classCascadeQualifiedBorder ?? g.classCascadeBorder ?? g.classBorder ?? theme.colors.border;
  const fontColor = g.classCascadeQualifiedFontColor ?? g.classCascadeFontColor ?? '#000000';
  const parts: string[] = [];
  for (const box of [k.start, k.end]) {
    if (box === undefined) continue;
    parts.push(
      rect(box.x, box.y, box.width, box.height, { fill, stroke, strokeWidth: KAL_STROKE_THICKNESS * theme.scaleK }),
    );
    parts.push(
      text(box.textX, box.textY, box.text, {
        fill: fontColor,
        fontSize: theme.fontSize,
        fontFamily: theme.fontFamily,
        lengthAdjust: 'spacing',
        textLength: box.textWidth,
      }),
    );
  }
  return parts.join('');
}

/** {@link renderEdgeDotPath}'s stroke inputs: the colour and the
 *  ALREADY-scaled thickness `renderer-edge.ts#buildEdgePathMarkup` writes
 *  onto its flat `<path>`, the link id (`undefined` on a smetana edge, see
 *  that module's `EdgePathStyle`), and the scale factor for the dash. */
export interface EdgeDotPathStroke {
  readonly color: Paint;
  readonly thickness: number;
  readonly linkId: string | undefined;
  readonly k: number;
}

/** `LinkStyle#getStroke3`'s DASHED stroke, `new UStroke(7, 7, ...)`
 *  (`decoration/LinkStyle.java:99-100`) -- the same 7,7 the flat arm
 *  writes as `'7,7'` (scaled by `k` there too). */
const DASHED_EDGE = 7;

/** The edge's dash: a `-[dashed]->`-style bracket override's own pair,
 *  else the dashed link style's scaled 7,7, else solid. */
function edgeDash(geo: EdgeGeo, k: number): readonly [number, number] {
  if (geo.strokeDasharray !== undefined) return geo.strokeDasharray;
  return geo.dashed ? [DASHED_EDGE * k, DASHED_EDGE * k] : [0, 0];
}

/**
 * cdd7-T1a (D3, bisefo-56-dumu120): the connecting line drawn the way
 * `SvekEdge#drawU` draws it -- `ug.apply(HColors.none().bg()).apply(color)`,
 * `.apply(stroke)`, `todraw.setCommentAndCodeLine(...)`, then
 * `drawRainbow`'s `ug.draw(todraw)` (`SvekEdge.java:895,906,944,1110`) --
 * through `DriverDotPathSvg#draw`, whose `DriverRectangleSvg
 * #applyStrokeColor` turns an `HColorGradient` into `svg.createSvgGradient
 * (color1, color2, policy)` + `stroke:url(#id)` (`DriverRectangleSvg.java:
 * 103-107`). The def's vector is `SvgGraphics#createSvgGradient`'s own
 * policy table (`SvgGraphics.java:367-394`: `'|'` -> x1=0% y1=50% x2=100%
 * y2=50%); its id is renumbered to the diagram seed at assembly
 * (`svg-defs-seeded.ts`).
 *
 * Built at `scale: 1` over already-scaled inputs, so no value is scaled
 * twice. `undefined` when `points` is not a `1 + 3*n` spline (only a
 * hand-built geometry; the caller keeps its flat `<path>` there).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverDotPathSvg.java
 */
export function renderEdgeDotPath(
  geo: EdgeGeo,
  points: EdgeGeo['points'],
  stroke: EdgeDotPathStroke,
): { body: string; extraDefs: string } | undefined {
  if (points.length < 4 || (points.length - 1) % 3 !== 0) return undefined;
  const dotPath = buildDotPathFromSplinePoints(points);
  const codeLine = stroke.linkId !== undefined && geo.sourceLine !== undefined ? String(geo.sourceLine) : null;
  dotPath.setCommentAndCodeLine(stroke.linkId ?? null, codeLine);
  const [dashVisible, dashSpace] = edgeDash(geo, stroke.k);
  const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', NO_TEXT_BOUNDER);
  ug.apply(new Back('none'))
    .apply(new Fore(stroke.color))
    .apply(new UStroke(dashVisible, dashSpace, stroke.thickness))
    .draw(dotPath);
  return extractFlatContent(ug.getSvgString());
}
