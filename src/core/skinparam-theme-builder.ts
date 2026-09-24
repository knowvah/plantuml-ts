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
  ['actorStyle', (acc) => acc.actorStyle],
  ['minimumWidth', (acc) => acc.minimumWidth],
  ['strictUml', (acc) => acc.strictUml],
  ['footbox', (acc) => acc.footbox],
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
  ['swimlaneHeaderBackground', (acc) => acc.swimlaneHeaderBackground],
  ['swimlaneBorderThickness', (acc) => acc.swimlaneBorderThickness],
  ['swimlaneTitleFontColor', (acc) => acc.swimlaneTitleFontColor],
  ['swimlaneTitleFontSize', (acc) => acc.swimlaneTitleFontSize],
];

const GRAPH_OVERRIDE_FIELDS: FieldTable = [
  ['classBackground', (acc) => acc.classBackground],
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
    acc.border !== undefined ||
    acc.text !== undefined ||
    acc.arrow !== undefined ||
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

function buildColorsOverride(acc: SkinparamAccumulator): Theme['colors'] {
  const colorsOverride: Record<string, unknown> = {};
  if (acc.background !== undefined) colorsOverride.background = acc.background;
  if (acc.border !== undefined) colorsOverride.border = acc.border;
  if (acc.text !== undefined) colorsOverride.text = acc.text;
  if (acc.arrow !== undefined) colorsOverride.arrow = acc.arrow;
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
 *  a `??=` chain of 6 independent fields is 6 branches on one function. */
const DARK_SCALAR_SEEDS: ReadonlyArray<
  readonly [
    key: 'background' | 'border' | 'text' | 'classBackground' | 'classFontColor' | 'classAttributeFontColor',
    value: string,
  ]
> = [
  ['background', DARK_MODE_DEFAULTS.background],
  ['border', DARK_MODE_DEFAULTS.border],
  ['text', DARK_MODE_DEFAULTS.text],
  ['classBackground', DARK_MODE_DEFAULTS.classBackground],
  ['classFontColor', DARK_MODE_DEFAULTS.text],
  ['classAttributeFontColor', DARK_MODE_DEFAULTS.text],
];

/** The `elements['spotclass']` half of {@link applyDarkModeDefaults} --
 *  split out purely to keep that function's own CCN under the cap. */
function seedDarkSpotClass(acc: SkinparamAccumulator): void {
  if (acc.elements['spotclass'] === undefined) {
    acc.elements['spotclass'] = { background: DARK_MODE_DEFAULTS.spotClassBackground, font: DARK_MODE_DEFAULTS.text };
  }
}

function applyDarkModeDefaults(acc: SkinparamAccumulator): void {
  if (acc.mode !== 'dark') return;
  for (const [key, value] of DARK_SCALAR_SEEDS) {
    acc[key] ??= value;
  }
  seedDarkSpotClass(acc);
}

/** Build a `Partial<Theme>` containing only the keys actually seen in `acc`. */
export function buildThemePartial(acc: SkinparamAccumulator): Partial<Theme> {
  applyDarkModeDefaults(acc);
  const partial: Record<string, unknown> = {};
  applyDefinedFields(partial, acc, ROOT_SCALAR_FIELDS);
  if (hasColorsOverride(acc)) partial.colors = buildColorsOverride(acc);
  return partial;
}
