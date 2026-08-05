/**
 * Classifier font resolvers for the class sizing pipeline
 * (`class-layout-helpers.ts#measureClassifier`) — attribute (member-row),
 * header, and stereotype fonts, plus the guillemet wrapper option.
 *
 * Split out of class-layout-helpers.ts (A2s R2j, that file was at the
 * 500-line cap) — a pure move except for the two R2j additions, each
 * documented on its own resolver below:
 *  - `classAttributeFontSizeByStereo` (sovuxo-25-tepi226) in
 *    {@link resolveAttributeFont};
 *  - the explicit-`defaultFontSize` tier (mizupo-59-zala765) in
 *    {@link resolveStereoFont}.
 */

import type { Theme } from '../../core/theme.js';
import type { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import { CLASS_STEREOTYPE_FONT_SIZE, type GuillemetPair } from './class-stereotype.js';

type TagCascadeEntry = ReturnType<typeof resolveClassTagCascadeEntry>;

/**
 * G2 N37: `.tagname` `<style>` cascade FontStyle wins over the more general
 * `skinparam`-resolved style value when set (more specific), which in turn
 * wins over `fallback`. Shared by both the attribute and header font
 * resolvers below -- factored out purely to keep each under the project's
 * per-function CCN cap (a bare `a ?? b ?? c` chain, repeated 4x across the
 * two callers, was the CCN driver).
 */
function resolveCascadedFontFlag(
  tagCascadeValue: boolean | undefined,
  styleValue: boolean | undefined,
  fallback: boolean,
): boolean {
  return tagCascadeValue ?? styleValue ?? fallback;
}

/**
 * A2s R2j (sovuxo-25): the STEREOTYPE-QUALIFIED
 * `classAttributeFontSize<<X>>` tier of `SkinParam#getFontSize` — consulted
 * BEFORE the plain per-param value (SkinParam.java:433-443,
 * `getFirstValueNonNullWithSuffix("fontsize" + stereotype.getLabel(...))`).
 * Same LOWERCASED-label keying/first-hit-wins shape as
 * `renderer-classifier-colors.ts#classBorderStrokeWidth`'s pre-existing
 * `classBorderThicknessByStereo` lookup.
 */
function attributeFontSizeByStereo(
  theme: Theme,
  stereotypeLabels: readonly string[] | undefined,
): number | undefined {
  const byStereo = theme.colors.graph.classAttributeFontSizeByStereo;
  if (byStereo === undefined || stereotypeLabels === undefined) return undefined;
  for (const label of stereotypeLabels) {
    const hit = byStereo[label.toLowerCase()];
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/**
 * G2 N23/N32: `skinparam class { AttributeFontSize/AttributeFontName/
 * AttributeFontStyle }` (`FontParam.CLASS_ATTRIBUTE`) overrides the generic
 * classifier box's ATTRIBUTE (member-row) font -- style-mapped by
 * `FromSkinparamToStyle.java:190-193` to the `element.class` selector. G2
 * N37: `.tagname` `<style>` cascade FontStyle wins over the ancestor
 * `classAttributeFontBold`/`Italic` value when set (more specific).
 * A2s R2j: a matching `classAttributeFontSize<<stereo>>` entry wins over
 * the plain size ({@link attributeFontSizeByStereo}); the header font
 * CASCADES from whichever size wins, exactly as for the plain value
 * (jar-verified R2c probes ps/p1 ≡ ps/p4).
 */
export function resolveAttributeFont(
  theme: Theme,
  fontSpec: { family: string; size: number },
  tagCascadeEntry: TagCascadeEntry,
  stereotypeLabels?: readonly string[],
) {
  return {
    family: theme.colors.graph.classAttributeFontFamily ?? fontSpec.family,
    size: attributeFontSizeByStereo(theme, stereotypeLabels)
      ?? theme.colors.graph.classAttributeFontSize ?? fontSpec.size,
    bold: resolveCascadedFontFlag(tagCascadeEntry?.fontBold, theme.colors.graph.classAttributeFontBold, false),
    italic: resolveCascadedFontFlag(tagCascadeEntry?.fontItalic, theme.colors.graph.classAttributeFontItalic, false),
  };
}

/**
 * `skinparam classFontSize/classFontName/classFontStyle`
 * (`FromSkinparamToStyle.java:185-188`, `element.class.header`) is the
 * classifier HEADER's own, independently-overridable font, which CASCADES
 * from the attribute-level values when unset (CSS-selector-specificity
 * semantics) -- jar-verified two ways: `jisanu-32-gado231` (attribute-only
 * override) shows the header ALSO adopting the overridden size/family;
 * `xabije-20-xusi569` (BOTH set, to DIFFERENT values) shows the header
 * using its OWN `classFont*` values instead.
 */
export function resolveHeaderFont(
  theme: Theme,
  attributeFont: ReturnType<typeof resolveAttributeFont>,
  tagCascadeEntry: TagCascadeEntry,
) {
  return {
    family: theme.colors.graph.classFontFamily ?? attributeFont.family,
    // A2s F-D mechanism A9: `<style> classDiagram { class { header {
    // FontSize } } }` -- `EntityImageClassHeader`'s styleHeader signature is
    // `element.classDiagram.class.header` (EntityImageClassHeader.java:80-82,
    // name TextBlock at :100), a MORE specific selector than the bare class
    // bucket, so it wins over `skinparam classFontSize` (which
    // FromSkinparamToStyle maps to the same header bucket; Stage-3 <style>
    // application order also puts it on top). Read from the
    // `classCascadeHeaderFontSize` cascade field (populated by
    // `style-cascade-class.ts`'s HEADER_SNAMES fontsize lookup — A2s A9);
    // the element bucket stays as a secondary source for skin files. Jar
    // evidence: momaku-69-duxe918 `o1` header at 20pt (delta =
    // w('o1'@20) - w('o1'@14) = 6.675px exact).
    size: theme.colors.graph.classCascadeHeaderFontSize
      ?? theme.colors.elements?.['class']?.headerFontSize
      ?? theme.colors.graph.classFontSize ?? attributeFont.size,
    bold: resolveCascadedFontFlag(tagCascadeEntry?.fontBold, theme.colors.graph.classFontBold, attributeFont.bold),
    italic: resolveCascadedFontFlag(tagCascadeEntry?.fontItalic, theme.colors.graph.classFontItalic, attributeFont.italic),
  };
}

/**
 * G2 N27: `skinparam guillemet <value>` -- both fields undefined means the
 * default `«`/`»` wrapper (`measureGenericClassifier`'s own `guillemet`
 * param default), so this is safe to pass through unconditionally rather
 * than gating on presence.
 */
export function resolveGuillemetOption(theme: Theme): GuillemetPair | undefined {
  return theme.colors.graph.guillemetStart !== undefined || theme.colors.graph.guillemetEnd !== undefined
    ? { start: theme.colors.graph.guillemetStart ?? '«', end: theme.colors.graph.guillemetEnd ?? '»' }
    : undefined;
}

/**
 * A2s R2j (mizupo-59): the stereotype row's SIZE tier of
 * `SkinParam#getFontSize` (SkinParam.java:441-448) — per-param
 * `classStereotypeFontSize` skinparam, then an EXPLICIT `skinparam
 * defaultFontSize` (the `theme.defaultFontSize` explicit-set marker), then
 * `FontParam.CLASS_STEREOTYPE`'s own default (12, FontParam.java:61).
 * Extracted from {@link resolveStereoFont} purely for the per-function
 * CCN cap (same rationale as {@link resolveCascadedFontFlag}).
 */
function resolveStereoFontSize(theme: Theme): number {
  return theme.colors.graph.classStereotypeFontSize
    ?? theme.defaultFontSize ?? CLASS_STEREOTYPE_FONT_SIZE;
}

/**
 * G2 N39: `skinparam classStereotypeFontSize`/`FontName`/`FontStyle` --
 * `italic` has NO `false` fallback -- `FontParam.CLASS_STEREOTYPE`'s own
 * default face IS italic (see `theme.ts#classStereotypeFontSize`'s doc
 * comment), unlike every OTHER class font param. Size tier:
 * {@link resolveStereoFontSize} (A2s R2j).
 */
export function resolveStereoFont(theme: Theme, headerFont: ReturnType<typeof resolveHeaderFont>) {
  return {
    family: theme.colors.graph.classStereotypeFontFamily ?? headerFont.family,
    size: resolveStereoFontSize(theme),
    bold: theme.colors.graph.classStereotypeFontBold ?? false,
    italic: theme.colors.graph.classStereotypeFontItalic ?? true,
  };
}
