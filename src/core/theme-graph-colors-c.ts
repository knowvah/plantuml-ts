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
  /** gtc T2b: `<style> arrow { LineColor }` over a description diagram's link signature `{root, element,
   *  componentDiagram, arrow}` (`SvekEdge.java:816-821`); `style-cascade-description.ts`. Read by
   *  `description/renderer-edge.ts` below an inline link colour and above `theme.colors.arrow`. */
  descriptionCascadeArrowColor?: string;
  /** gtc T3: the per-stereotype tier of the description arrow signature -- `{root, element, componentDiagram,
   *  arrow}.withTOBECHANGED(stereotype)` (`SvekEdge.java:816-821`) -- keyed by CLEANED tag. Written by `<style> arrow {
   *  .tag { LineColor; LineThickness } }` (`style-cascade-description.ts`) and by `skinparam arrow<<tag>> { Color
   *  X;line.Bold() }` (`skinparam-arrow-stereo.ts`). `fontColor` (gtc T6h): the same signature's `FontColor`, the link label colour (`skinparam arrow<<tag>> { FontColor X }`, `<style> arrow { .tag { FontColor } }`). Absent = no tagged declaration. */
  descriptionArrowTagCascade?: Readonly<Record<string, { color?: string; thickness?: number; fontColor?: string }>>;
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
  // Moved verbatim from theme-graph-colors-b.ts (500-line cap, sdd2 close-b7).
  json?: {
    keyText?: string;
    stringValue?: string;
    numberValue?: string;
    booleanValue?: string;
    nullValue?: string;
    background?: string;
    border?: string;
    headerBackground?: string;
    highlightBackground?: string;
    arrowColor?: string;
    /** True when element.header { FontStyle: bold } is set. */
    headerFontBold?: boolean;
    // jsonDiagram { node { … } } style block properties
    /** Border rx (rounded corners) from jsonDiagram.node.RoundCorner */
    roundCorner?: number;
    /** Maximum value-column pixel width before word-wrap kicks in */
    maximumWidth?: number;
    /** Text alignment within cells: left (default), center, or right */
    textAlign?: 'left' | 'center' | 'right';
    /** Border stroke width from jsonDiagram.node.LineThickness */
    nodeLineThickness?: number;
    /** Value-cell font color from jsonDiagram.node.FontColor */
    nodeFontColor?: string;
    /** Value-cell font size from jsonDiagram.node.FontSize */
    nodeFontSize?: number;
    /** Value-cell font family from jsonDiagram.node.FontName */
    nodeFontFamily?: string;
    /** Bold override from jsonDiagram.node.FontStyle/FontWeight */
    nodeFontBold?: boolean;
    /** Italic override from jsonDiagram.node.FontStyle */
    nodeFontItalic?: boolean;
    /** Dash pattern for the outer node border (from jsonDiagram.node.LineStyle) */
    nodeLineDasharray?: string;
    // jsonDiagram { arrow { … } }
    /** Arrow/edge stroke width from jsonDiagram.arrow.LineThickness */
    arrowThickness?: number;
    /** Arrow/edge dash pattern from jsonDiagram.arrow.LineStyle */
    arrowDasharray?: string;
    // jsonDiagram { node { separator { … } } }
    /** Separator line color (overrides border for row dividers) */
    separatorColor?: string;
    /** Separator line thickness */
    separatorThickness?: number;
    /** Separator line dash pattern */
    separatorDasharray?: string;
    // jsonDiagram { node { highlight { … } } }
    /** Highlighted row font color */
    highlightFontColor?: string;
    /** Highlighted row font bold */
    highlightFontBold?: boolean;
    /** Highlighted row font italic */
    highlightFontItalic?: boolean;
    /** Per-class highlight overrides keyed by style class name (e.g. "h1") */
    highlightClasses?: Record<
      string,
      {
        background?: string;
        fontColor?: string;
        fontBold?: boolean;
        fontItalic?: boolean;
      }
    >;
  };
  /** cdd2-T8 (S-7): `<style> visibilityIcon { <kind> { LineColor/
   *  BackgroundColor } } }` -- `VisibilityModifier.java:336-350`'s
   *  `{root,element,visibilityIcon,<kind>}` StyleSignature (kind in
   *  `public_`/`private_`/`protected_`/`package_`/`IEMandatory`, cleaned
   *  to `public`/`private`/`protected`/`package`/`iemandatory` selector
   *  tokens). Pre-resolved hex, keyed by the SAME cleaned kind token,
   *  read by `class-visibility-icon.ts#colorsFor` ABOVE the legacy
   *  `icon<Kind>Color`/`icon<Kind>BackgroundColor` skinparam-override
   *  tier (an explicit `<style>` block outranks the FromSkinparamToStyle
   *  bridge, the SAME precedent `classCascadeHeaderFontColor` establishes
   *  -- `skinparam-theme-builder.ts:102-110`). `undefined` for every
   *  fixture with no such `<style>` block -- zero behavior change.
   *  Jar-verified `tuguku-78-zega630`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:360-364 */
  visibilityIconLineCascade?: Readonly<Record<string, string>>;
  /** cdd2-T8 (S-7): the BackgroundColor sibling of {@link
   *  visibilityIconLineCascade}. */
  visibilityIconBackgroundCascade?: Readonly<Record<string, string>>;
}
