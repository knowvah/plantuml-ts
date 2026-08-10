/**
 * Builds a `Partial<Theme>` from a populated {@link SkinparamAccumulator} —
 * only the keys that were actually seen during key processing are set.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module
 * map. Field-by-field upstream provenance is documented on the
 * corresponding `Theme`/`ThemeGraphColors` field declarations
 * (theme.ts, theme-graph-colors-a.ts, theme-graph-colors-b.ts); this module
 * only assembles the override object, it does not reinterpret any value.
 */

import type { Theme } from './theme.js';
import type { SkinparamAccumulator } from './skinparam-accumulator.js';

type FieldGetter = (acc: SkinparamAccumulator) => unknown;
type FieldTable = ReadonlyArray<readonly [key: string, get: FieldGetter]>;

/** Copies every field whose getter returns non-`undefined` into `target`. */
function applyDefinedFields(
  target: Record<string, unknown>,
  acc: SkinparamAccumulator,
  fields: FieldTable,
): void {
  for (const [key, get] of fields) {
    const value = get(acc);
    if (value !== undefined) target[key] = value;
  }
}

const ROOT_SCALAR_FIELDS: FieldTable = [
  ['fontFamily', (acc) => acc.fontFamily],
  ['fontSize', (acc) => acc.fontSize],
  ['defaultFontSize', (acc) => acc.defaultFontSize],
  ['linetype', (acc) => acc.linetype],
  ['nodeSep', (acc) => acc.nodeSep],
  ['rankSep', (acc) => acc.rankSep],
  ['wrapWidth', (acc) => acc.wrapWidth],
  ['sameClassWidth', (acc) => acc.sameClassWidth],
  ['classAttributeIconSize', (acc) => acc.classAttributeIconSize],
  ['groupInheritance', (acc) => acc.groupInheritance],
  ['tabSize', (acc) => acc.tabSize],
  ['componentStyle', (acc) => acc.componentStyle],
  ['actorStyle', (acc) => acc.actorStyle],
  ['minimumWidth', (acc) => acc.minimumWidth],
  ['strictUml', (acc) => acc.strictUml],
  ['handwritten', (acc) => acc.handwritten],
  ['monochrome', (acc) => acc.monochrome],
  ['packageStyle', (acc) => acc.packageStyle],
  ['fixCircleLabelOverlapping', (acc) => acc.fixCircleLabelOverlapping],
  ['shadowing', (acc) => acc.shadowing],
];

const ACTIVITY_OVERRIDE_FIELDS: FieldTable = [
  ['background', (acc) => acc.activityBackground],
  ['border', (acc) => acc.activityBorder],
  ['barColor', (acc) => acc.activityBarColor],
  ['diamondBackground', (acc) => acc.activityDiamondBackground],
  ['diamondBorder', (acc) => acc.activityDiamondBorder],
  ['startColor', (acc) => acc.activityStartColor],
  ['endColor', (acc) => acc.activityEndColor],
  ['swimlaneBorder', (acc) => acc.swimlaneBorder],
];

const GRAPH_OVERRIDE_FIELDS: FieldTable = [
  ['classBackground', (acc) => acc.classBackground],
  // G2 N65 item 47: see `theme.ts#classCascadeRoundCorner`'s doc comment
  // for why a bare skinparam reuses that SAME field.
  ['classCascadeRoundCorner', (acc) => acc.roundCorner],
  ['interfaceBackground', (acc) => acc.interfaceBackground],
  ['enumBackground', (acc) => acc.enumBackground],
  ['actorStroke', (acc) => acc.actorStroke],
  ['packageBackground', (acc) => acc.packageBackground],
  ['packageBorder', (acc) => acc.packageBorder],
  ['packageBorderThickness', (acc) => acc.packageBorderThickness],
  ['classBorder', (acc) => acc.classBorder],
  ['classBorderThickness', (acc) => acc.classBorderThickness],
  ['classBorderThicknessByStereo', (acc) => acc.classBorderThicknessByStereo],
  ['classAttributeFontSizeByStereo', (acc) => acc.classAttributeFontSizeByStereo],
  ['stateBorderColorByStereo', (acc) => acc.stateBorderColorByStereo],
  ['stateBackgroundColorByStereo', (acc) => acc.stateBackgroundColorByStereo],
  ['stateFontColorByStereo', (acc) => acc.stateFontColorByStereo],
  ['stateFontSizeByStereo', (acc) => acc.stateFontSizeByStereo],
  ['arrowThickness', (acc) => acc.arrowThickness],
  ['classAttributeFontSize', (acc) => acc.classAttributeFontSize],
  ['classAttributeFontFamily', (acc) => acc.classAttributeFontFamily],
  ['classAttributeFontBold', (acc) => acc.classAttributeFontBold],
  ['classAttributeFontItalic', (acc) => acc.classAttributeFontItalic],
  ['classFontSize', (acc) => acc.classFontSize],
  ['classFontFamily', (acc) => acc.classFontFamily],
  ['classFontBold', (acc) => acc.classFontBold],
  ['classFontItalic', (acc) => acc.classFontItalic],
  ['classStereotypeFontSize', (acc) => acc.classStereotypeFontSize],
  ['classStereotypeFontFamily', (acc) => acc.classStereotypeFontFamily],
  ['classStereotypeFontBold', (acc) => acc.classStereotypeFontBold],
  ['classStereotypeFontItalic', (acc) => acc.classStereotypeFontItalic],
  ['circledCharacterFontSize', (acc) => acc.circledCharacterFontSize],
  ['circledCharacterRadius', (acc) => acc.circledCharacterRadius],
  ['circledCharacterFontFamily', (acc) => acc.circledCharacterFontFamily],
  ['circledCharacterFontBold', (acc) => acc.circledCharacterFontBold],
  ['circledCharacterFontItalic', (acc) => acc.circledCharacterFontItalic],
  ['pathHoverColor', (acc) => acc.pathHoverColor],
  ['diagramBorderColor', (acc) => acc.diagramBorderColor],
  ['iconPrivateColor', (acc) => acc.iconPrivateColor],
  ['iconPrivateBackgroundColor', (acc) => acc.iconPrivateBackgroundColor],
  ['iconPackageColor', (acc) => acc.iconPackageColor],
  ['iconPackageBackgroundColor', (acc) => acc.iconPackageBackgroundColor],
  ['iconProtectedColor', (acc) => acc.iconProtectedColor],
  ['iconProtectedBackgroundColor', (acc) => acc.iconProtectedBackgroundColor],
  ['iconPublicColor', (acc) => acc.iconPublicColor],
  ['iconPublicBackgroundColor', (acc) => acc.iconPublicBackgroundColor],
  ['guillemetStart', (acc) => acc.guillemetStart],
  ['guillemetEnd', (acc) => acc.guillemetEnd],
];

function hasActivityOverride(acc: SkinparamAccumulator): boolean {
  return ACTIVITY_OVERRIDE_FIELDS.some(([, get]) => get(acc) !== undefined);
}

function hasGraphOverride(acc: SkinparamAccumulator): boolean {
  return (
    GRAPH_OVERRIDE_FIELDS.some(([, get]) => get(acc) !== undefined) ||
    hasActivityOverride(acc)
  );
}

function hasColorsOverride(acc: SkinparamAccumulator): boolean {
  return (
    acc.background !== undefined ||
    acc.border !== undefined ||
    acc.text !== undefined ||
    acc.arrow !== undefined ||
    acc.noteBackground !== undefined ||
    Object.keys(acc.elements).length > 0 ||
    hasGraphOverride(acc)
  );
}

function buildActivityOverride(
  acc: SkinparamAccumulator,
): NonNullable<Theme['colors']['graph']['activity']> {
  const actOverride: Record<string, unknown> = {};
  applyDefinedFields(actOverride, acc, ACTIVITY_OVERRIDE_FIELDS);
  return actOverride;
}

function buildGraphOverride(acc: SkinparamAccumulator): Theme['colors']['graph'] {
  const graphOverride: Record<string, unknown> = {};
  applyDefinedFields(graphOverride, acc, GRAPH_OVERRIDE_FIELDS);
  if (hasActivityOverride(acc)) {
    graphOverride.activity = buildActivityOverride(acc);
  }
  return graphOverride as unknown as Theme['colors']['graph'];
}

function buildColorsOverride(acc: SkinparamAccumulator): Theme['colors'] {
  const colorsOverride: Record<string, unknown> = {};
  if (acc.background !== undefined) colorsOverride.background = acc.background;
  if (acc.border !== undefined) colorsOverride.border = acc.border;
  if (acc.text !== undefined) colorsOverride.text = acc.text;
  if (acc.arrow !== undefined) colorsOverride.arrow = acc.arrow;
  if (acc.noteBackground !== undefined) colorsOverride.noteBackground = acc.noteBackground;
  if (Object.keys(acc.elements).length > 0) colorsOverride.elements = acc.elements;
  if (hasGraphOverride(acc)) colorsOverride.graph = buildGraphOverride(acc);
  return colorsOverride as Theme['colors'];
}

/** Build a `Partial<Theme>` containing only the keys actually seen in `acc`. */
export function buildThemePartial(acc: SkinparamAccumulator): Partial<Theme> {
  const partial: Record<string, unknown> = {};
  applyDefinedFields(partial, acc, ROOT_SCALAR_FIELDS);
  if (hasColorsOverride(acc)) partial.colors = buildColorsOverride(acc);
  return partial;
}
