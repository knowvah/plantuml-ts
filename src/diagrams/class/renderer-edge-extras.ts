/**
 * cdd-T7: `renderer-edge.ts`'s overflow — visibility-modifier icon,
 * note-on-link body, and constraint line+text. Split out to keep
 * `renderer-edge.ts` under the repo's 500-line hook cap (pre-authorised,
 * `batch-2/T7-edge-rendering.md`'s own quality bar).
 */
import type { EdgeGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Visibility } from './class-member-ast.js';
import { text, line } from '../../core/svg.js';
import { renderNote } from './renderer-note.js';
import { colorsFor, iconSizeOf } from './class-visibility-icon.js';
import { VisibilityModifier } from '../../core/skin/VisibilityModifier.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { extractFlatContent } from '../../core/klimt/document-shell.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';

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
export function renderEdgeVisibilityIcon(geo: EdgeGeo, theme: Theme): string {
  const icon = geo.visibilityIcon;
  if (icon === undefined) return '';
  const char = METHOD_MODIFIER_TO_ICON[icon.modifier];
  const modifier = MODIFIER_INSTANCE_BY_NAME[icon.modifier];
  if (char === undefined || modifier === undefined) return '';
  const color = colorsFor(char, theme).line;
  const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', NO_TEXT_BOUNDER);
  const context = ug.apply(new UTranslate(icon.x, icon.y));
  modifier.getUDrawable(iconSizeOf(theme), color, null).drawU(context);
  return extractFlatContent(ug.getSvgString()).body;
}

/**
 * cdd-T7 (A2a/M5): `note on link`'s body — reuses `renderer-note.ts
 * #renderNote`'s CURRENT plain-note path builder by CALLING it (task
 * brief boundary: never copy it, never edit `renderer-note.ts` itself —
 * T8's write-set, batch 3). Builds the minimal `NoteGeo` `renderNote`
 * actually reads: `connector: []` (so `buildConnectorPathData` draws no
 * separate line — the note-on-link box has none, it merges directly into
 * the edge's own label block) and no `color`/`stereotype`/`lineAtoms`/
 * `lineHeights` (falling back to the default note background and the
 * plain-per-line text path, `renderNoteText`'s own optional-field
 * fallback). `lipazi-06-care921`'s exact vertex order/paint is corrected
 * by T8, not here — see this task's commit message.
 */
export function renderEdgeNoteBox(geo: EdgeGeo, theme: Theme): string {
  const box = geo.noteBox;
  if (box === undefined) return '';
  const noteGeo: NoteGeo = {
    id: `${geo.id}-note`,
    kind: 'note',
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    lines: box.noteLines.map((l) => l.text),
    lineWidths: box.noteLines.map((l) => l.width),
    connector: [],
  };
  return renderNote(noteGeo, theme);
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
export function renderEdgeConstraint(geo: EdgeGeo, theme: Theme, measurer: StringMeasurer | undefined): string {
  const c = geo.constraint;
  if (c === undefined) return '';
  const parts: string[] = [
    line(c.line.x1, c.line.y1, c.line.x2, c.line.y2, { stroke: '#000', strokeWidth: 1, strokeDasharray: '3,3' }),
  ];
  if (measurer === undefined) return parts.join('');
  const font = resolveArrowLabelFont(theme);
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
