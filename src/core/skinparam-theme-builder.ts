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
import { LineBreakStrategy } from './klimt/LineBreakStrategy.js';
import { DARK_MODE_DEFAULTS } from './theme-dark.js';

type FieldGetter = (acc: SkinparamAccumulator) => unknown;
type FieldTable = ReadonlyArray<readonly [key: string, get: FieldGetter]>;

/** Copies every field whose getter returns non-`undefined` into `target`. */
function applyDefinedFields(target: Record<string, unknown>, acc: SkinparamAccumulator, fields: FieldTable): void {
  for (const [key, get] of fields) {
    const value = get(acc);
    if (value !== undefined) target[key] = value;
  }
}

/**
 * `SkinParam#maxMessageSize()` (`skin/SkinParam.java:971-978`), reused
 * verbatim via the already-ported {@link LineBreakStrategy}: whichever raw
 * key was ever declared wins outright -- `wrapMessageWidth` first, falling
 * back to `maxMessageSize` -- not whichever the source declared last (see
 * `theme.ts#maxMessageSize`'s own doc comment). `getMaxWidth()` folds the
 * `"auto"`/non-numeric case to 0, matching `wrapWidth`'s own "0/absent = no
 * wrap" convention, so no extra normalisation is needed here.
 */
function resolveMaxMessageSize(acc: SkinparamAccumulator): number | undefined {
  const raw = acc.wrapMessageWidth ?? acc.maxMessageSize;
  if (raw === undefined) return undefined;
  return new LineBreakStrategy(raw).getMaxWidth();
}

const ROOT_SCALAR_FIELDS: FieldTable = [
  ['fontFamily', (acc) => acc.fontFamily],
  ['fontSize', (acc) => acc.fontSize],
  ['defaultFontSize', (acc) => acc.defaultFontSize],
  ['linetype', (acc) => acc.linetype],
  ['nodeSep', (acc) => acc.nodeSep],
  ['rankSep', (acc) => acc.rankSep],
  ['wrapWidth', (acc) => acc.wrapWidth],
  ['dpi', (acc) => acc.dpi],
  ['topurl', (acc) => acc.topurl],
  ['maxMessageSize', (acc) => resolveMaxMessageSize(acc)],
  ['sameClassWidth', (acc) => acc.sameClassWidth],
  ['classAttributeIconSize', (acc) => acc.classAttributeIconSize],
  ['groupInheritance', (acc) => acc.groupInheritance],
  ['tabSize', (acc) => acc.tabSize],
  ['componentStyle', (acc) => acc.componentStyle],
  ['conditionEndStyle', (acc) => acc.conditionEndStyle], // T1p-a
  ['conditionStyle', (acc) => acc.conditionStyle], // T2c
  ['actorStyle', (acc) => acc.actorStyle],
  ['minimumWidth', (acc) => acc.minimumWidth],
  ['strictUml', (acc) => acc.strictUml],
  ['genericDisplayOld', (acc) => acc.genericDisplayOld],
  ['footbox', (acc) => acc.footbox],
  ['handwritten', (acc) => acc.handwritten],
  ['monochrome', (acc) => acc.monochrome],
  ['reverseColor', (acc) => acc.reverseColor],
  ['packageStyle', (acc) => acc.packageStyle],
  ['fixCircleLabelOverlapping', (acc) => acc.fixCircleLabelOverlapping],
  ['shadowing', (acc) => acc.shadowing],
  ['hyperlinkUnderline', (acc) => acc.hyperlinkUnderline], // add2 T3e
  ['svgLinkTarget', (acc) => acc.svgLinkTarget], // add2 T3e
  ['preserveAspectRatio', (acc) => acc.preserveAspectRatio], // add2 T3e
];

const ACTIVITY_OVERRIDE_FIELDS: FieldTable = [
  ['background', (acc) => acc.activityBackground],
  ['border', (acc) => acc.activityBorder],
  ['barColor', (acc) => acc.activityBarColor],
  ['diamondBackground', (acc) => acc.activityDiamondBackground],
  ['diamondBorder', (acc) => acc.activityDiamondBorder],
  ['startColor', (acc) => acc.activityStartColor],
  ['endColor', (acc) => acc.activityEndColor],
  ['circleInk', (acc) => acc.activityCircleInk],
  ['swimlaneBorder', (acc) => acc.swimlaneBorder],
  ['swimlaneHeaderBackground', (acc) => acc.swimlaneHeaderBackground],
  ['swimlaneBorderThickness', (acc) => acc.swimlaneBorderThickness],
  ['swimlaneTitleFontColor', (acc) => acc.swimlaneTitleFontColor],
  ['swimlaneTitleFontSize', (acc) => acc.swimlaneTitleFontSize],
];

const GRAPH_OVERRIDE_FIELDS: FieldTable = [
  // cdd2-T8 (S-10): see `theme-graph-colors-c.ts#ThemeGraphColorsC
  // .monospacedFontName`.
  ['monospacedFontName', (acc) => acc.monospacedFontName],
  // cdd2-T8 (S-13): see `theme-graph-colors-c.ts#ThemeGraphColorsC
  // .classFontColorAutomatic`.
  ['classFontColorAutomatic', (acc) => acc.classFontColorAutomatic],
  ['classBackground', (acc) => acc.classBackground],
  // T11 (cdd3, Q-4 probe c): see `theme-graph-colors-c.ts
  // #classBackgroundExplicit`'s own doc comment.
  ['classBackgroundExplicit', (acc) => acc.classBackgroundExplicit],
  ['classHeaderBackground', (acc) => acc.classHeaderBackground],
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
  ['classBackgroundColorByStereo', (acc) => acc.classBackgroundColorByStereo],
  ['classBorderColorByStereo', (acc) => acc.classBorderColorByStereo],
  ['classFontColorByStereo', (acc) => acc.classFontColorByStereo],
  // cdd-T19 (A3 M2): the legacy `classFontColor`/`classAttributeFontColor`
  // skinparam keys bridge into the SAME `classCascade(Header)FontColor`
  // theme fields the `<style>` cascade computes (`style-cascade-class.ts
  // #computeClassStyleCascadeOverrides`, applied AFTER this base build via
  // `Object.assign`) -- mirrors `classCascadeRoundCorner`'s own
  // bare-skinparam-reuses-a-cascade-field precedent two rows above. An
  // explicit `<style>` block wins when both are present (Object.assign
  // only overwrites keys the style map actually set), matching upstream's
  // `FromSkinparamToStyle`-bridge-is-lowest-priority semantics.
  ['classCascadeHeaderFontColor', (acc) => acc.classFontColor],
  ['classCascadeFontColor', (acc) => acc.classAttributeFontColor],
  ['classAttributeFontSizeByStereo', (acc) => acc.classAttributeFontSizeByStereo],
  ['classFontSizeByStereo', (acc) => acc.classFontSizeByStereo],
  ['stateBorderColorByStereo', (acc) => acc.stateBorderColorByStereo],
  ['stateBackgroundColorByStereo', (acc) => acc.stateBackgroundColorByStereo],
  ['stateFontColorByStereo', (acc) => acc.stateFontColorByStereo],
  ['stateFontSizeByStereo', (acc) => acc.stateFontSizeByStereo],
  ['arrowThickness', (acc) => acc.arrowThickness],
  ['arrowFontSize', (acc) => acc.arrowFontSize],
  ['arrowFontFamily', (acc) => acc.arrowFontFamily],
  ['arrowFontStyle', (acc) => acc.arrowFontStyle],
  ['arrowFontColor', (acc) => acc.arrowFontColor],
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
  return GRAPH_OVERRIDE_FIELDS.some(([, get]) => get(acc) !== undefined) || hasActivityOverride(acc);
}

function hasColorsOverride(acc: SkinparamAccumulator): boolean {
  return (
    acc.background !== undefined ||
    acc.backgroundGradient !== undefined ||
    acc.border !== undefined ||
    acc.text !== undefined ||
    acc.arrow !== undefined ||
    acc.arrowHeadColor !== undefined ||
    acc.arrowLollipopColor !== undefined ||
    acc.noteBackground !== undefined ||
    Object.keys(acc.elements).length > 0 ||
    hasGraphOverride(acc)
  );
}

function buildActivityOverride(acc: SkinparamAccumulator): NonNullable<Theme['colors']['graph']['activity']> {
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

/** T2d-a pass 2: the `background`/`backgroundGradient` pair, split out of
 *  {@link buildColorsOverride} purely to keep that function's own CCN
 *  under the cap -- see `skinparam-accumulator.ts#backgroundGradient`'s
 *  own doc comment for why these are two fields, not one `Paint`. */
function applyBackgroundOverride(colorsOverride: Record<string, unknown>, acc: SkinparamAccumulator): void {
  if (acc.background !== undefined) colorsOverride.background = acc.background;
  if (acc.backgroundGradient !== undefined) colorsOverride.backgroundGradient = acc.backgroundGradient;
}

function buildColorsOverride(acc: SkinparamAccumulator): Theme['colors'] {
  const colorsOverride: Record<string, unknown> = {};
  applyBackgroundOverride(colorsOverride, acc);
  if (acc.border !== undefined) colorsOverride.border = acc.border;
  if (acc.text !== undefined) colorsOverride.text = acc.text;
  if (acc.arrow !== undefined) colorsOverride.arrow = acc.arrow;
  if (acc.arrowHeadColor !== undefined) colorsOverride.arrowHead = acc.arrowHeadColor;
  if (acc.arrowLollipopColor !== undefined) colorsOverride.arrowLollipopColor = acc.arrowLollipopColor;
  if (acc.noteBackground !== undefined) colorsOverride.noteBackground = acc.noteBackground;
  if (Object.keys(acc.elements).length > 0) colorsOverride.elements = acc.elements;
  if (hasGraphOverride(acc)) colorsOverride.graph = buildGraphOverride(acc);
  // cdd-T30: `Theme['colors']` is now the NAMED interface `ThemeColorFields`
  // (theme-colors-fields.ts, split out of theme.ts's own inline object type
  // literal) -- TS's TS4.4 implicit-index-signature inference (which made
  // the pre-split inline literal assignable to `Record<string, unknown>`)
  // applies only to fresh object type literals, never to `interface`
  // declarations, so the direct cast now needs the same `as unknown as`
  // double-cast `buildGraphOverride` above already uses for the identical
  // reason (its own `Theme['colors']['graph']` extraction).
  return colorsOverride as unknown as Theme['colors'];
}

/**
 * cdd-T33: `skinparam mode dark`'s default-color gate. Seeds the SAME
 * accumulator fields an explicit skinparam would set, via `??=` -- so an
 * explicit `skinparam classBackgroundColor`/`backgroundColor`/etc. always
 * wins, REGARDLESS of source order relative to `mode dark` (mirrors
 * upstream: `HColorSimple#darkSchemeTheme` returns a user color UNCHANGED
 * when it has no baked `.dark` variant, `klimt/color/HColorSimple.java:
 * 236-239` -- see `theme-dark.ts`'s own doc comment for the full chain).
 * Must run BEFORE `applyDefinedFields`/`hasColorsOverride` below, and only
 * once every skinparam key has already been applied to `acc` (this
 * function's own caller, `buildThemePartial`, is that single choke point --
 * `resolveSkinparam` calls it exactly once, after its key-processing loop).
 *
 * `border`/`text` are the GENERAL fields (`theme.colors.border`/`.text`),
 * not class-specific ones -- see `theme-dark.ts#DARK_MODE_DEFAULTS.border`'s
 * own doc comment for why light mode's existing fallback chain makes that
 * the faithful choice, not a narrower `classBorder`/class-only field.
 * `classFontColor`/`classAttributeFontColor` reuse the EXISTING `<style>`-
 * bridge-is-lowest-priority tiers (`classCascadeHeaderFontColor`/
 * `classCascadeFontColor`, cdd-T19) rather than a new theme field, so an
 * explicit `<style>` block (applied downstream of this function) still
 * wins per that tier's own established precedent. `elements['spotclass']`
 * reuses the generic per-element bucket `ELEMENT_BUCKET_SNAMES` already
 * populates for an explicit `skinparam spotClassBackgroundColor`/`<style>
 * spotClass { ... }` override, for the SAME reason.
 *
 * WRITE-SET NOTE (stop 1, `.agent-notes/cdd-T33.md`): this function is
 * outside T33's literal write-set (`skinparam-theme-builder.ts` was not
 * listed) -- flagged, not silently expanded. It is the only point in the
 * pipeline with full, order-independent visibility into every skinparam
 * key the diagram declared; no listed file can host this gate correctly.
 */
/** One `acc` scalar field seeded by {@link applyDarkModeDefaults}, paired
 *  with its dark-mode default value. Table-driven (mirrors {@link
 *  FieldTable}) purely to keep that function's own CCN under the cap --
 *  a `??=` chain of independent fields is one branch per field on one
 *  function.
 *
 * add2 T3h (family DARK): `activityBackground`/`activityStartColor`/
 * `activityEndColor`/`arrowFontColor` added -- none has an OWN dark
 * selector in `plantuml.skin`'s `@media` block (confirmed by reading it:
 * `activityDiagram { }`'s dark block overrides only `partition`/`circle`/
 * `activityBar`, `:683-694`), so each inherits root's own dark override,
 * exactly like `classBackground`'s existing precedent two rows below
 * already reasons through for class. `activityBackground` feeds BOTH
 * `actColors().nodeFill` (the action box) AND, via its own `?? act
 * ?.background` fallback tier, `diamondColors().fill` (`activity-
 * renderer-if-shapes.ts`) -- ONE seed, not two, since the diamond bucket
 * has no dark override of its own either and the existing light-mode
 * cascade already shares the one field. `activityBorder` is deliberately
 * NOT added here: `theme.colors.border`'s own existing dark seed (one row
 * below) already reaches `actColors().nodeBorder`/`diamondColors().border`
 * through THEIR existing `?? theme.colors.border` fallback tier --
 * verified against `levuma-67-cego489`'s jar SVG, whose action-box/diamond
 * `stroke` is already `#E7E7E7` with NO code change (only `@fill` diverged
 * before this commit). `activityStartColor`/`activityEndColor` -> `circle,
 * start/stop/end`'s OWN dark override (`:687-692`, `#d`, NOT root's `#2`) --
 * `theme-dark.ts#DARK_MODE_DEFAULTS.activityCircleInk`. `arrowFontColor` ->
 * root's dark `FontColor white` (`:565`) reaching the arrow signature the
 * SAME way `core/arrow-label-font.ts#resolveArrowLabelFont` and `activity-
 * text-style.ts#activityFontColor`'s existing `sname === 'arrow'` tier
 * both already read this field for an EXPLICIT `skinparam arrowFontColor`
 * -- this is that SAME field, seeded by dark mode instead of a user value.
 *
 * T2d-a (row DARK-CIRCLE): `activityCircleInk` added -- the circle block's
 * own `LineColor` (`plantuml.skin:379-380` light / `:687-692` dark), which
 * has NO skinparam convert path at all for `start`/`end` (unlike
 * `activityStartColor`/`activityEndColor`, which are `BackgroundColor`-only
 * converts) -- so this is the ONLY tier that can ever set it. */
const DARK_SCALAR_SEEDS: ReadonlyArray<
  readonly [
    key:
      | 'background'
      | 'border'
      | 'text'
      | 'classBackground'
      | 'classFontColor'
      | 'classAttributeFontColor'
      | 'activityBackground'
      | 'activityStartColor'
      | 'activityEndColor'
      | 'activityCircleInk'
      | 'arrowFontColor',
    value: string,
  ]
> = [
  ['background', DARK_MODE_DEFAULTS.background],
  ['border', DARK_MODE_DEFAULTS.border],
  ['text', DARK_MODE_DEFAULTS.text],
  ['classBackground', DARK_MODE_DEFAULTS.classBackground],
  ['classFontColor', DARK_MODE_DEFAULTS.text],
  ['classAttributeFontColor', DARK_MODE_DEFAULTS.text],
  ['activityBackground', DARK_MODE_DEFAULTS.classBackground],
  ['activityStartColor', DARK_MODE_DEFAULTS.activityCircleInk],
  ['activityEndColor', DARK_MODE_DEFAULTS.activityCircleInk],
  ['activityCircleInk', DARK_MODE_DEFAULTS.activityCircleInk],
  ['arrowFontColor', DARK_MODE_DEFAULTS.text],
];

/** The `elements['spotclass']` half of {@link applyDarkModeDefaults} --
 *  split out purely to keep that function's own CCN under the cap. */
function seedDarkSpotClass(acc: SkinparamAccumulator): void {
  if (acc.elements['spotclass'] === undefined) {
    acc.elements['spotclass'] = { background: DARK_MODE_DEFAULTS.spotClassBackground, font: DARK_MODE_DEFAULTS.text };
  }
}

/**
 * add2 T3h (family DARK): the activity-EXCLUSIVE `elements['activity']`/
 * `elements['diamond']` buckets' own FontColor -- `activity-text-style.ts
 * #activityFontColor`'s bucket tier (checked FIRST, ahead of its hardcoded
 * `ACTIVITY_FONT_COLOR` black default) already reads these for an
 * EXPLICIT `<style> activityDiagram { activity { FontColor } } }`; dark
 * mode seeds the SAME bucket instead, mirroring {@link seedDarkSpotClass}
 * exactly. Both SNames are activity-exclusive (`activity-style-
 * defaults.ts#ActivitySName`'s own doc comment), so this cannot move any
 * other diagram's text colour -- UNLIKE `arrowFontColor` above, which
 * reuses a SHARED field other engines also read (surveyed, not assumed).
 */
function seedDarkActivityFontColors(acc: SkinparamAccumulator): void {
  if (acc.elements['activity'] === undefined) {
    acc.elements['activity'] = { font: DARK_MODE_DEFAULTS.text };
  }
  if (acc.elements['diamond'] === undefined) {
    acc.elements['diamond'] = { font: DARK_MODE_DEFAULTS.text };
  }
}

function applyDarkModeDefaults(acc: SkinparamAccumulator): void {
  if (acc.mode !== 'dark') return;
  for (const [key, value] of DARK_SCALAR_SEEDS) {
    acc[key] ??= value;
  }
  // add2 T3h (family DARK): `Paint`, not `string` -- kept out of
  // DARK_SCALAR_SEEDS' string-only table. No dedicated dark `arrow {
  // LineColor }` selector exists upstream (confirmed above), so every
  // edge/arrowhead inherits root's dark `LineColor #e7e7e7` (`:567`) the
  // SAME way `renderer.ts#renderEdge`'s existing `noGradient(theme.colors
  // .arrow)` already reads this field for an explicit `skinparam
  // ArrowColor`.
  acc.arrow ??= DARK_MODE_DEFAULTS.border;
  seedDarkSpotClass(acc);
  seedDarkActivityFontColors(acc);
}

/** Build a `Partial<Theme>` containing only the keys actually seen in `acc`. */
export function buildThemePartial(acc: SkinparamAccumulator): Partial<Theme> {
  applyDarkModeDefaults(acc);
  const partial: Record<string, unknown> = {};
  applyDefinedFields(partial, acc, ROOT_SCALAR_FIELDS);
  if (hasColorsOverride(acc)) partial.colors = buildColorsOverride(acc);
  return partial;
}
