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

import type { Paint, Gradient } from './paint.js';
import type { ElementColors } from './theme.js';
import type { ActorStyle } from './skin/ActorStyle.js';

export interface SkinparamAccumulator {
  fontFamily: string | undefined;
  /** T2d-a pass 2 (row DOCGRAD): `skinparam backgroundColor <c1>-<c2>` is a
   *  document-level GRADIENT (`HColorSet.java:109-116`). `background`
   *  (below) keeps the flattened end-colour string every other consumer
   *  reads; this carries the recovered `Gradient` to the ONE caller that
   *  draws it (`assemble-svg.ts`'s activity background-rect finalizer) --
   *  never widening `background` itself to `Paint` (see that field's own
   *  doc comment for why). Set only when `skinparam-key-handlers-table-a
   *  .ts`'s `backgroundcolor` handler's `paint` arg resolves to a real
   *  `Gradient`, never for a plain colour. */
  backgroundGradient: Gradient | undefined;
  /** cdd2-T8 (S-10): `skinparam defaultMonospacedFontName <name>` -- see
   *  `theme-graph-colors-c.ts#ThemeGraphColorsC.monospacedFontName`. */
  monospacedFontName: string | undefined;
  fontSize: number | undefined;
  /** R2j: EXPLICIT `skinparam defaultFontSize` marker — see
   *  `theme.ts#defaultFontSize`'s own doc comment. */
  defaultFontSize: number | undefined;
  /** add3-T3f (PADDING): bare `skinparam padding N` — see
   *  `theme-root-fields.ts#padding`'s own doc comment. */
  padding: number | undefined;
  /** add4-T1b: `skinparam swimlaneWidth` — see
   *  `theme-root-fields.ts#swimlaneWidth`'s own doc comment. */
  swimlaneWidth: number | undefined;
  /** isw-T2b-ca: raw `skinparam swimlaneWrapTitleWidth` -- see
   *  `theme-root-fields.ts#swimlaneWrapTitleWidth`'s own doc comment. */
  swimlaneWrapTitleWidth: string | undefined;
  linetype: 'ortho' | 'polyline' | undefined;
  nodeSep: number | undefined;
  rankSep: number | undefined;
  wrapWidth: number | undefined;
  /** cdd-T30: `skinparam dpi N` -- see `theme.ts#dpi`'s own doc comment. */
  dpi: number | undefined;
  /** cdd-T34: `skinparam topurl <url>` -- see `theme.ts#topurl`'s own doc comment. */
  topurl: string | undefined;
  /** Raw `skinparam maxMessageSize` value -- see `theme.ts#maxMessageSize`'s
   *  own doc comment for the fallback-precedence resolution against
   *  {@link wrapMessageWidth}, done in `skinparam-theme-builder.ts`. */
  maxMessageSize: string | undefined;
  /** Raw `skinparam wrapMessageWidth` value -- takes precedence over
   *  {@link maxMessageSize} when EITHER key was declared, regardless of
   *  source order (`skin/SkinParam.java:971-978`). */
  wrapMessageWidth: string | undefined;
  sameClassWidth: boolean | undefined;
  classAttributeIconSize: number | undefined;
  groupInheritance: number | undefined;
  tabSize: number | undefined;
  roundCorner: number | undefined;
  componentStyle: 'uml2' | 'uml1' | 'rectangle' | undefined;
  /** T1p-a: `skinparam ConditionEndStyle hline` -- see `theme.ts
   *  #conditionEndStyle`'s own doc comment. */
  conditionEndStyle: 'diamond' | 'hline' | undefined;
  /** T2c (ex-T2a): `skinparam ConditionStyle InsideDiamond` -- see
   *  `theme.ts#conditionStyle`'s own doc comment. */
  conditionStyle: 'insideHexagon' | 'emptyDiamond' | 'insideDiamond' | undefined;
  actorStyle: ActorStyle | undefined;
  minimumWidth: number | undefined;
  strictUml: boolean | undefined;
  /** cdd3-T25 (E3-3): `skinparam genericDisplay old` --
   *  `SkinParam#displayGenericWithOldFashion` (`skin/SkinParam.java:1179-
   *  1181`, `valueIs("genericDisplay", "old")`). See `theme.ts
   *  #genericDisplayOld`'s own doc comment for the render-side mechanism. */
  genericDisplayOld: boolean | undefined;
  /** `skinparam footbox hide|show` — `SequenceDiagram#isShowFootbox` reads it
   *  as a raw string and compares case-insensitively to "hide"
   *  (`SequenceDiagram.java:478-485`). */
  footbox: string | undefined;
  handwritten: boolean | undefined;
  /** cdd-T33: `skinparam mode dark` — `SkinParam.isDark`
   *  (`skin/SkinParam.java:114-116`): `"dark".equalsIgnoreCase(getValue
   *  ("mode"))`, case-insensitive, any other value (including absent) is
   *  NOT dark. See `theme-dark.ts`'s own doc comment for the full
   *  mechanism and `skinparam-theme-builder.ts#buildThemePartial`'s gate. */
  mode: 'dark' | undefined;
  monochrome: 'true' | 'reverse' | undefined;
  /** Raw `skinparam reversecolor` (`TitledDiagram.java:301`). */
  reverseColor: string | undefined;
  packageStyle: 'rect' | undefined;
  fixCircleLabelOverlapping: boolean | undefined;
  shadowing: number | undefined;
  background: string | undefined;
  border: string | undefined;
  text: string | undefined;
  /** cdd7-T1a (D3): a `Paint`, mirroring upstream's `HColor` -- a
   *  `Red|Green` value is an `HColorGradient` (`HColorSet.java:109-116`),
   *  not a flattened string. */
  arrow: Paint | undefined;
  /** T2c: `skinparam ArrowHeadColor` -- see `theme.ts
   *  #ThemeColorFields.arrowHead`'s own doc comment. */
  arrowHeadColor: Paint | undefined;
  /** cdd7-T1a (D2): `skinparam ArrowLollipopColor` --
   *  `ColorParam.arrowLollipop`, read by `SvekEdge.java:266-268`. */
  arrowLollipopColor: string | undefined;
  noteBackground: string | undefined;
  classBackground: Paint | undefined;
  /** T11 (cdd3, Q-4 probe c): set alongside `classBackground` -- see
   *  `theme-graph-colors-c.ts#classBackgroundExplicit`'s own doc comment. */
  classBackgroundExplicit: true | undefined;
  /** CDD T6FU: `skinparam classHeaderBackgroundColor` / the nested-block
   *  form `skinparam class { HeaderBackgroundColor X }` (both normalise to
   *  the SAME key) -- `FromSkinparamToStyle.java:196` maps it onto the
   *  `{element, class_, header}` signature `EntityImageClass
   *  #getStyleHeader` (java:173-178) queries, i.e. the header-background
   *  split's fill source. */
  classHeaderBackground: Paint | undefined;
  interfaceBackground: string | undefined;
  enumBackground: string | undefined;
  actorStroke: string | undefined;
  packageBackground: string | undefined;
  packageBorder: string | undefined;
  packageBorderThickness: number | undefined;
  classBorder: Paint | undefined;
  classBorderThickness: number | undefined;
  classBorderThicknessByStereo: Record<string, number> | undefined;
  /** CDD T6FU: `skinparam classBackgroundColor<<stereo>>` (and the nested
   *  `skinparam class { <<stereo>> { BackgroundColor X } }` form -- one
   *  normalised key, `SkinParam#cleanForKeySlow` java:285-300). Stored RAW
   *  so `classifierFill` can `parseColor` it (a `#A-B` value is a gradient
   *  upstream), keyed by the LOWERCASED label. */
  classBackgroundColorByStereo: Record<string, string> | undefined;
  /** cdd-T19 (A3 M2): `skinparam classFontColor`/the block form
   *  `skinparam class { FontColor X }` — resolved hex, mapped to the
   *  HEADER-only `classCascadeHeaderFontColor` theme field
   *  (`FromSkinparamToStyle.java:187`'s `{element,class_,header}`
   *  signature, jar-verified `remanu-84-sega129`/`picija-82-jebu272`:
   *  only the name row tints, member rows stay unaffected). */
  classFontColor: string | undefined;
  /** cdd2-T8 (S-13): `skinparam classFontColor automatic` -- set instead of
   *  `classFontColor` above when the value is the literal keyword
   *  `automatic` (`skinparam-key-handlers-table-b.ts#isAutomaticFontColor`).
   *  Bridges to `theme.colors.graph.classFontColorAutomatic`, resolved
   *  PER-ROW at render time against that row's own local background
   *  (`renderer-classifier-rows.ts#resolveAutomaticFontColor`) since a
   *  parse-time value cannot know a classifier's resolved header colour.
   *  Jar-verified `nisune-86-faji869`. */
  classFontColorAutomatic: boolean | undefined;
  /** cdd-T19 (A3 M2): `skinparam class { AttributeFontColor X }` (no
   *  bare/top-level form upstream — always block-scoped, `Colors.java`'s
   *  key resolves to `classAttributeFontColor` after the block-name
   *  prefix, `preprocessor.ts`'s `skinparamStack` join) — resolved hex,
   *  mapped to the MEMBER-row `classCascadeFontColor` theme field
   *  (`FromSkinparamToStyle.java:192`'s `{element,class_}` signature, no
   *  `header` token, jar-verified `picija-82-jebu272`: every attribute
   *  AND method row tints, the name row does not). */
  classAttributeFontColor: string | undefined;
  /** R2j: `skinparam classAttributeFontSize<<Stereo>>` — see
   *  `theme-graph-colors-a.ts#classAttributeFontSizeByStereo`. */
  classAttributeFontSizeByStereo: Record<string, number> | undefined;
  /** `skinparam classFontSize<<Stereo>>` (flat, or the nested
   *  `skinparam class { <<Stereo>> { FontSize N } }` block) — see
   *  `theme-graph-colors-a.ts#classFontSizeByStereo`. */
  classFontSizeByStereo: Record<string, number> | undefined;
  /** cdd2-T8 (S-3): `skinparam class { BorderColor<<Stereo>> #X }` /
   *  `skinparam classBorderColor<<Stereo>> #X` -- see
   *  `theme-graph-colors-a.ts#classBorderColorByStereo`. */
  classBorderColorByStereo: Record<string, string> | undefined;
  /** cdd2-T8 (S-3): `skinparam class { FontColor<<Stereo>> #X }` /
   *  `skinparam classFontColor<<Stereo>> #X` -- see
   *  `theme-graph-colors-a.ts#classFontColorByStereo`. */
  classFontColorByStereo: Record<string, string> | undefined;
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
  iconPrivateColor: Paint | undefined;
  iconPrivateBackgroundColor: string | undefined;
  iconPackageColor: Paint | undefined;
  iconPackageBackgroundColor: string | undefined;
  iconProtectedColor: Paint | undefined;
  iconProtectedBackgroundColor: string | undefined;
  iconPublicColor: Paint | undefined;
  iconPublicBackgroundColor: string | undefined;
  guillemetStart: string | undefined;
  guillemetEnd: string | undefined;
  // add2 T3h (family PAINT): `Paint`, not `string` -- `skinparam activity{
  // BackgroundColor red-green}` is a gradient (`HColorSet.java:109-116`),
  // and `rect()`'s own `BoxStyle.fill?: Paint` already draws a
  // `<linearGradient>` def for any gradient value (D9: one style path).
  // Was flattened to a solid hex before the handler's `paint` param (4th
  // arg, `arrowcolor`'s own precedent) was threaded through.
  activityBackground: Paint | undefined;
  activityBorder: string | undefined;
  activityBarColor: string | undefined;
  activityDiamondBackground: string | undefined;
  activityDiamondBorder: string | undefined;
  activityStartColor: string | undefined;
  activityEndColor: string | undefined;
  /** T2d-a (row DARK-CIRCLE): `activityDiagram { circle { start, stop, end {
   *  LineColor #2 } } }` (`plantuml.skin:379-380`) -- the terminal circles'
   *  STROKE, independent of {@link activityStartColor}/
   *  {@link activityEndColor} (which are `BackgroundColor`-only converts,
   *  `FromSkinparamToStyle.java:137-138`). No upstream skinparam key maps
   *  to this at all for `start`/`end` (confirmed by grep of
   *  `FromSkinparamToStyle.java` -- only `stop` has one, via
   *  `ActivityStopColor` -> `LineColor`, also unported) -- this field is
   *  therefore NEVER set by a key handler, only seeded in dark mode
   *  (`skinparam-theme-builder.ts#DARK_SCALAR_SEEDS`). Reusing
   *  `activityStartColor`/`activityEndColor` here would be wrong in
   *  general: `activity-renderer-terminals.ts#renderStart`'s own doc
   *  comment documents the jar-verified regression (`poraji-17-goke817`,
   *  `ActivityStartColor red` with no dark mode) where the stroke
   *  incorrectly followed the fill to red. */
  activityCircleInk: string | undefined;
  swimlaneBorder: string | undefined;
  /** D4 amendment (T1): `SwimlaneTitleBackgroundColor` -- see
   *  `theme-graph-colors-b.ts#swimlaneHeaderBackground`'s own doc comment. */
  swimlaneHeaderBackground: string | undefined;
  /** D4 amendment (T1): `SwimlaneBorderThickness` -- see
   *  `theme-graph-colors-b.ts#swimlaneBorderThickness`'s own doc comment. */
  swimlaneBorderThickness: number | undefined;
  /** D4 amendment (T1): `SwimlaneTitleFontColor` -- see
   *  `theme-graph-colors-b.ts#swimlaneTitleFontColor`'s own doc comment. */
  swimlaneTitleFontColor: string | undefined;
  /** D4 amendment (T1): `SwimlaneTitleFontSize` -- see
   *  `theme-graph-colors-b.ts#swimlaneTitleFontSize`'s own doc comment. */
  swimlaneTitleFontSize: number | undefined;
  /** add4-T2b: `Partition{Border,Background}Color` and `PartitionFont{Color,
   *  Size}` -- see `theme-graph-colors-c.ts#ThemeGraphColorsC.partitionBorder`. */
  partitionBorder: string | undefined;
  partitionBackground: string | undefined;
  partitionFontColor: string | undefined;
  partitionFontSize: number | undefined;
  /** add2 T3e: see `theme-root-fields.ts#ThemeRootFields.hyperlinkUnderline`. */
  hyperlinkUnderline: boolean | undefined;
  /** add2 T3e: see `theme-root-fields.ts#ThemeRootFields.svgLinkTarget`. */
  svgLinkTarget: string | undefined;
  /** add2 T3e: see `theme-root-fields.ts#ThemeRootFields.preserveAspectRatio`. */
  preserveAspectRatio: string | undefined;
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
  'fontFamily',
  'monospacedFontName',
  'fontSize',
  'defaultFontSize',
  'padding',
  'swimlaneWidth',
  'swimlaneWrapTitleWidth',
  'linetype',
  'nodeSep',
  'rankSep',
  'wrapWidth',
  'dpi',
  'topurl',
  'maxMessageSize',
  'wrapMessageWidth',
  'sameClassWidth',
  'classAttributeIconSize',
  'groupInheritance',
  'tabSize',
  'roundCorner',
  'componentStyle',
  'conditionEndStyle',
  'conditionStyle',
  'actorStyle',
  'minimumWidth',
  'strictUml',
  'genericDisplayOld',
  'footbox',
  'handwritten',
  'mode',
  'monochrome',
  'reverseColor',
  'packageStyle',
  'fixCircleLabelOverlapping',
  'shadowing',
  'background',
  'backgroundGradient',
  'border',
  'text',
  'arrow',
  'arrowHeadColor',
  'arrowLollipopColor',
  'noteBackground',
  'classBackground',
  'classBackgroundExplicit',
  'classHeaderBackground',
  'interfaceBackground',
  'enumBackground',
  'actorStroke',
  'packageBackground',
  'packageBorder',
  'packageBorderThickness',
  'classBorder',
  'classBorderThickness',
  'classBorderThicknessByStereo',
  'classBackgroundColorByStereo',
  'classBorderColorByStereo',
  'classFontColorByStereo',
  'classFontColor',
  'classFontColorAutomatic',
  'partitionBorder',
  'partitionBackground',
  'partitionFontColor',
  'partitionFontSize',
  'classAttributeFontColor',
  'classAttributeFontSizeByStereo',
  'classFontSizeByStereo',
  'stateBorderColorByStereo',
  'stateBackgroundColorByStereo',
  'stateFontColorByStereo',
  'stateFontSizeByStereo',
  'arrowThickness',
  'arrowFontSize',
  'arrowFontFamily',
  'arrowFontStyle',
  'arrowFontColor',
  'classAttributeFontSize',
  'classAttributeFontFamily',
  'classAttributeFontBold',
  'classAttributeFontItalic',
  'classFontSize',
  'classFontFamily',
  'classFontBold',
  'classFontItalic',
  'classStereotypeFontSize',
  'classStereotypeFontFamily',
  'classStereotypeFontBold',
  'classStereotypeFontItalic',
  'circledCharacterFontSize',
  'circledCharacterRadius',
  'circledCharacterFontFamily',
  'circledCharacterFontBold',
  'circledCharacterFontItalic',
  'pathHoverColor',
  'diagramBorderColor',
  'iconPrivateColor',
  'iconPrivateBackgroundColor',
  'iconPackageColor',
  'iconPackageBackgroundColor',
  'iconProtectedColor',
  'iconProtectedBackgroundColor',
  'iconPublicColor',
  'iconPublicBackgroundColor',
  'guillemetStart',
  'guillemetEnd',
  'activityBackground',
  'activityBorder',
  'activityBarColor',
  'activityDiamondBackground',
  'activityDiamondBorder',
  'activityStartColor',
  'activityEndColor',
  'activityCircleInk',
  'swimlaneBorder',
  'swimlaneHeaderBackground',
  'swimlaneBorderThickness',
  'swimlaneTitleFontColor',
  'swimlaneTitleFontSize',
  'hyperlinkUnderline',
  'svgLinkTarget',
  'preserveAspectRatio',
] as const satisfies ReadonlyArray<Exclude<keyof SkinparamAccumulator, 'elements' | 'unknown'>>;

/** Fresh accumulator with all optional fields unset. */
export function createSkinparamAccumulator(): SkinparamAccumulator {
  const acc = Object.fromEntries(
    SCALAR_FIELD_NAMES.map((name) => [name, undefined]),
  ) as unknown as SkinparamAccumulator;
  acc.elements = {};
  acc.unknown = [];
  return acc;
}
