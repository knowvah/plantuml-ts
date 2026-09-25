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
}
