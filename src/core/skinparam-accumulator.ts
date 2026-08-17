/**
 * Mutable accumulator threaded through the resolveSkinparam key-processing
 * loop (skinparam-key-handlers.ts, skinparam-stereo-keys.ts) and consumed by
 * the theme-partial builder (skinparam-theme-builder.ts).
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module map.
 * Field names and semantics are unchanged from the original inline `let`
 * declarations in resolveSkinparam; see skinparam-theme-builder.ts for the
 * per-field upstream provenance comments.
 */

import type { ElementColors } from './theme.js';
import type { ActorStyle } from './skin/ActorStyle.js';

export interface SkinparamAccumulator {
  fontFamily: string | undefined;
  fontSize: number | undefined;
  /** R2j: EXPLICIT `skinparam defaultFontSize` marker — see
   *  `theme.ts#defaultFontSize`'s own doc comment. */
  defaultFontSize: number | undefined;
  linetype: 'ortho' | 'polyline' | undefined;
  nodeSep: number | undefined;
  rankSep: number | undefined;
  wrapWidth: number | undefined;
  sameClassWidth: boolean | undefined;
  classAttributeIconSize: number | undefined;
  groupInheritance: number | undefined;
  tabSize: number | undefined;
  roundCorner: number | undefined;
  componentStyle: 'uml2' | 'uml1' | 'rectangle' | undefined;
  actorStyle: ActorStyle | undefined;
  minimumWidth: number | undefined;
  strictUml: boolean | undefined;
  handwritten: boolean | undefined;
  monochrome: 'true' | 'reverse' | undefined;
  packageStyle: 'rect' | undefined;
  fixCircleLabelOverlapping: boolean | undefined;
  shadowing: number | undefined;
  background: string | undefined;
  border: string | undefined;
  text: string | undefined;
  arrow: string | undefined;
  noteBackground: string | undefined;
  classBackground: string | undefined;
  interfaceBackground: string | undefined;
  enumBackground: string | undefined;
  actorStroke: string | undefined;
  packageBackground: string | undefined;
  packageBorder: string | undefined;
  packageBorderThickness: number | undefined;
  classBorder: string | undefined;
  classBorderThickness: number | undefined;
  classBorderThicknessByStereo: Record<string, number> | undefined;
  /** R2j: `skinparam classAttributeFontSize<<Stereo>>` — see
   *  `theme-graph-colors-a.ts#classAttributeFontSizeByStereo`. */
  classAttributeFontSizeByStereo: Record<string, number> | undefined;
  /** `skinparam classFontSize<<Stereo>>` (flat, or the nested
   *  `skinparam class { <<Stereo>> { FontSize N } }` block) — see
   *  `theme-graph-colors-a.ts#classFontSizeByStereo`. */
  classFontSizeByStereo: Record<string, number> | undefined;
  stateBorderColorByStereo: Record<string, string> | undefined;
  stateBackgroundColorByStereo: Record<string, string> | undefined;
  stateFontColorByStereo: Record<string, string> | undefined;
  stateFontSizeByStereo: Record<string, number> | undefined;
  arrowThickness: number | undefined;
  arrowFontSize: number | undefined;
  /** D3 (T2): sibling of {@link arrowFontSize} -- see
   *  `theme-graph-colors-a.ts#arrowFontFamily`'s own doc comment. */
  arrowFontFamily: string | undefined;
  /** D3 (T2): raw, unparsed -- see
   *  `theme-graph-colors-a.ts#arrowFontStyle`'s own doc comment. */
  arrowFontStyle: string | undefined;
  /** SI26 D1/D4: resolved hex -- see
   *  `theme-graph-colors-a.ts#arrowFontColor`'s own doc comment. */
  arrowFontColor: string | undefined;
  classAttributeFontSize: number | undefined;
  classAttributeFontFamily: string | undefined;
  classAttributeFontBold: boolean | undefined;
  classAttributeFontItalic: boolean | undefined;
  classFontSize: number | undefined;
  classFontFamily: string | undefined;
  classFontBold: boolean | undefined;
  classFontItalic: boolean | undefined;
  classStereotypeFontSize: number | undefined;
  classStereotypeFontFamily: string | undefined;
  classStereotypeFontBold: boolean | undefined;
  classStereotypeFontItalic: boolean | undefined;
  circledCharacterFontSize: number | undefined;
  circledCharacterRadius: number | undefined;
  circledCharacterFontFamily: string | undefined;
  circledCharacterFontBold: boolean | undefined;
  circledCharacterFontItalic: boolean | undefined;
  pathHoverColor: string | undefined;
  diagramBorderColor: string | undefined;
  iconPrivateColor: string | undefined;
  iconPrivateBackgroundColor: string | undefined;
  iconPackageColor: string | undefined;
  iconPackageBackgroundColor: string | undefined;
  iconProtectedColor: string | undefined;
  iconProtectedBackgroundColor: string | undefined;
  iconPublicColor: string | undefined;
  iconPublicBackgroundColor: string | undefined;
  guillemetStart: string | undefined;
  guillemetEnd: string | undefined;
  activityBackground: string | undefined;
  activityBorder: string | undefined;
  activityBarColor: string | undefined;
  activityDiamondBackground: string | undefined;
  activityDiamondBorder: string | undefined;
  activityStartColor: string | undefined;
  activityEndColor: string | undefined;
  swimlaneBorder: string | undefined;
  /** Per-element (SName) color buckets — decision D4. */
  elements: Record<string, ElementColors>;
  unknown: string[];
}

/**
 * Names of every scalar (non-collection) accumulator field. Iterated by
 * `createSkinparamAccumulator` to seed each field to `undefined` — kept as a
 * data table (rather than an object literal inline in the function body) so
 * the constructor itself stays well under the project's per-function NLOC
 * cap.
 */
const SCALAR_FIELD_NAMES = [
  'fontFamily', 'fontSize', 'defaultFontSize', 'linetype', 'nodeSep', 'rankSep', 'wrapWidth',
  'sameClassWidth', 'classAttributeIconSize', 'groupInheritance', 'tabSize', 'roundCorner', 'componentStyle', 'actorStyle', 'minimumWidth', 'strictUml', 'handwritten', 'monochrome',
  'packageStyle', 'fixCircleLabelOverlapping', 'shadowing', 'background',
  'border', 'text', 'arrow', 'noteBackground', 'classBackground',
  'interfaceBackground', 'enumBackground', 'actorStroke', 'packageBackground',
  'packageBorder', 'packageBorderThickness', 'classBorder',
  'classBorderThickness', 'classBorderThicknessByStereo',
  'classAttributeFontSizeByStereo', 'classFontSizeByStereo',
  'stateBorderColorByStereo', 'stateBackgroundColorByStereo',
  'stateFontColorByStereo', 'stateFontSizeByStereo', 'arrowThickness',
  'arrowFontSize', 'arrowFontFamily', 'arrowFontStyle', 'arrowFontColor',
  'classAttributeFontSize', 'classAttributeFontFamily',
  'classAttributeFontBold', 'classAttributeFontItalic', 'classFontSize',
  'classFontFamily', 'classFontBold', 'classFontItalic',
  'classStereotypeFontSize', 'classStereotypeFontFamily',
  'classStereotypeFontBold', 'classStereotypeFontItalic',
  'circledCharacterFontSize', 'circledCharacterRadius',
  'circledCharacterFontFamily', 'circledCharacterFontBold',
  'circledCharacterFontItalic', 'pathHoverColor', 'diagramBorderColor',
  'iconPrivateColor', 'iconPrivateBackgroundColor', 'iconPackageColor',
  'iconPackageBackgroundColor', 'iconProtectedColor',
  'iconProtectedBackgroundColor', 'iconPublicColor',
  'iconPublicBackgroundColor', 'guillemetStart', 'guillemetEnd',
  'activityBackground', 'activityBorder', 'activityBarColor',
  'activityDiamondBackground', 'activityDiamondBorder', 'activityStartColor',
  'activityEndColor', 'swimlaneBorder',
] as const satisfies ReadonlyArray<
  Exclude<keyof SkinparamAccumulator, 'elements' | 'unknown'>
>;

/** Fresh accumulator with all optional fields unset. */
export function createSkinparamAccumulator(): SkinparamAccumulator {
  const acc = Object.fromEntries(
    SCALAR_FIELD_NAMES.map((name) => [name, undefined]),
  ) as unknown as SkinparamAccumulator;
  acc.elements = {};
  acc.unknown = [];
  return acc;
}
