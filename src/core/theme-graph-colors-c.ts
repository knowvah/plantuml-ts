/**
 * theme-graph-colors-c.ts — third slice of `ThemeGraphColors`, split out
 * because `theme-graph-colors-a.ts`/`-b.ts` are both at the project's
 * 500-line cap (cdd2-T8) — mirrors the `-a`/`-b` split precedent exactly
 * (combined back via intersection in `theme-graph-colors.ts`). A pure
 * addition, not a move.
 */

/**
 * cdd2-T8 (S-10): `skinparam defaultMonospacedFontName <name>` --
 * `SkinParam.java:1092`'s `getValue("defaultMonospacedFontName",
 * Parser.MONOSPACED)`. The REAL font name substituted for the creole
 * engine's logical `monospaced` token (`""text""` runs) BEFORE
 * `svg-text-font.ts#renameLogicalMonospace`'s CSS-generic `monospace`
 * fallback would otherwise apply -- consumed by
 * `renderer-classifier-rows.ts#resolveAtomFontFamily` at the member-row
 * text-emission site. `undefined` (the common case) preserves today's
 * `monospaced` -> `monospace` rename exactly. Jar-verified
 * `nesivu-99-cexu403`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:1092
 */
export interface ThemeGraphColorsC {
  monospacedFontName?: string;
  /** cdd2-T8 (S-13): `skinparam classFontColor automatic` -- see
   *  `skinparam-accumulator.ts#classFontColorAutomatic`'s own doc comment.
   *  Resolved per-row against the classifier's OWN local background by
   *  `renderer-classifier-rows.ts#resolveAutomaticFontColor` (`HColorAutomagic
   *  #getAppropriateColor`/`HColorSimple#opposite`, a YIQ-luma test --
   *  `<128` -> white text, `>=128` -> black text). `undefined` (the common
   *  case) leaves the existing `#000000` hardcoded fallback untouched.
   *  Jar-verified `nisune-86-faji869`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java:211-214 */
  classFontColorAutomatic?: boolean;
  /** T11 (cdd3, Q-4): `EntityImageClassHeader.java:138-149`'s
   *  `styleGeneric.value(BackGroundColor)` -- the generic type-parameter
   *  tag's OWN ancestor cascade (`{root,element,classDiagram,class_,
   *  generic}`, `style-cascade-class-snames.ts#GENERIC_SNAMES`, a strict
   *  superset of `CLASS_SNAMES` so a bare `class { BackgroundColor }` --
   *  no nested `generic` block -- also matches, jar-verified cdd2-T13
   *  probe a). Read by `renderer-classifier-badge-tag.ts#renderGenericTag`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:138-149 */
  genericCascadeBackground?: string;
  /** T11: the same signature's `LineColor` half. */
  genericCascadeBorder?: string;
  /** T11 (cdd3, Q-4 probe c, cdd2-T13): `skinparam classBackgroundColor`
   *  is converted into an `{element,class_}` style declaration upstream
   *  (`FromSkinparamToStyle.java`) BEFORE the generic tag's own merge
   *  runs above, so it recolors the tag too -- jar-verified (`gen-c.puml`:
   *  `skinparam classBackgroundColor LightBlue` -> both the class box AND
   *  the generic tag rect fill `#ADD8E6`; unstyled -> the tag stays
   *  `#FFFFFF` despite `classBackground` carrying its own non-white
   *  built-in default `#F1F1F1`, `theme.ts:267`). Our port's
   *  `classBackground` field is ALWAYS populated (default or override),
   *  so this marker is the only way `renderGenericTag` can tell
   *  "explicitly set" apart from "still the built-in default" -- set
   *  alongside `classBackground` by the SAME `classbackgroundcolor`
   *  skinparam handler (`skinparam-key-handlers-table-b.ts`), never by a
   *  theme literal. */
  classBackgroundExplicit?: true;
}
