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
  /** add4-T2b: `addConvert("PartitionBorderColor", PName.LineColor,
   *  SName.composite)` / `"PartitionBackgroundColor"` -> `BackGroundColor` /
   *  `addConFont("Partition", SName.composite)`'s `FontColor` and `FontSize`
   *  (`FromSkinparamToStyle.java:131-133`). Read by the activity frame
   *  (`FtileGroup.java:99-102`, style `<symbol>/composite`, `:89-91`).
   *  `PartitionBorderThickness` has no conversion upstream, so none here.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:131-133 */
  partitionBorder?: string;
  partitionBackground?: string;
  partitionFontColor?: string;
  partitionFontSize?: number;
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
  /** cdd3-T24 (C-6): `EntityImageClass`'s `getStyle().value(PName
   *  .LineThickness)` over `{root,element,classDiagram,class_}`
   *  (`style-cascade-class-snames.ts#CLASS_SNAMES`) -- the box stroke
   *  (`EntityImageClass.java:215`) and the body's sentinel divider
   *  (`BodyEnhancedAbstract.java:121-122`). `skin rose` resolves 1.0
   *  (`rose.skin:11`, no element override). Absent = the `plantuml.skin:93`
   *  `element { LineThickness 0.5 }` default, applied by the reader
   *  (`renderer-classifier-colors.ts#classStyleLineThickness`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:215 */
  classCascadeLineThickness?: number;
  /** cdd3-T24 (E3-8): `EntityImageNote`'s `style.getStroke()` thickness
   *  over `{root,element,classDiagram,note}` (`NOTE_SNAMES`). Absent = the
   *  `plantuml.skin:325` `note { LineThickness 0.5 }` default.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNote.java:283-292 */
  noteCascadeLineThickness?: number;
  /** cdd3-T24 (E3-8): `EntityImageNote.java:108`'s `style.value(PName
   *  .LineColor)` over the same `NOTE_SNAMES` signature, SVG-ready hex.
   *  Absent = `theme.colors.border`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNote.java:108 */
  noteCascadeBorder?: string;
  /** cdd6 T3g: `PName.HyperLinkColor` over `EntityImageClass`'s own
   *  `{root,element,classDiagram,class_}` signature (`CLASS_SNAMES`) -- the
   *  member rows' `FontConfiguration.create(skinParam, style, colors)`
   *  reads it (`FontConfiguration.java:213-219`) and `StripeSimple.java
   *  :224-225` (`addUrl`) draws a `[[url]]` atom in it. SVG-ready hex.
   *  Absent = `CommandCreoleUrl.ts`'s `#0000FF`. */
  classCascadeHyperlinkColor?: string;
  /** cdd6 T3g: the same over the header signature (`HEADER_SNAMES`,
   *  `EntityImageClassHeader.java:93-101`'s `styleHeader`) -- the classifier
   *  NAME's links. */
  classCascadeHeaderHyperlinkColor?: string;
}
