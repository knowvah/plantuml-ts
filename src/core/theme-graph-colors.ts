/**
 * theme-graph-colors.ts — the `Theme["colors"]["graph"]` sub-object,
 * extracted from ./theme.ts (which re-declares it as `graph:
 * ThemeGraphColors`) purely to keep theme.ts under the project
 * 500-line file-size cap after the mission skin-file-loading
 * (deferred D3 item) `ElementColors.shadowing` addition — mirrors the
 * existing `svg.ts` -> `svg-markers.ts` / `style-map-theme.ts` ->
 * `style-map-element.ts` split precedent (pure move, no behavior
 * change, no runtime import — this is a type-only declaration).
 */

import type { Gradient, Paint } from './paint.js';
import type { LineStyleDash } from './style-line-style.js';
import type { HorizontalAlignment } from './klimt/geom/HorizontalAlignment.js';
import type { ThemeGraphColorsA } from './theme-graph-colors-a.js';
import type { ThemeGraphColorsB } from './theme-graph-colors-b.js';
import type { ThemeGraphColorsC } from './theme-graph-colors-c.js';

/**
 * Per-element (SName) color overrides — decision D4. Each role may hold a solid
 * color or a gradient {@link Paint}; unset roles cascade to the root/graph
 * default via {@link resolveElementPaint}.
 */
export interface ElementColors {
  background?: Paint;
  border?: Paint;
  font?: Paint;
  /** `<sname>FontSize` skinparam (flat or block form) / `<style> <sname> {
   *  FontSize N }` — G1 I4b. Overrides the entity/cluster TITLE text size
   *  (`FontParam.<SNAME>`'s per-diagram default, `klimt/font/FontParam.java`
   *  — every reachable entry is size 14). */
  fontSize?: number;
  /** `<sname>StereotypeFontSize` skinparam (flat or block form) / `<style>
   *  <sname> { stereotype { FontSize N } } }` — G1 I4b. Overrides the
   *  STEREOTYPE text size for the same element (`FontParam.<SNAME>_STEREOTYPE`
   *  — same 14pt default as the title, jar-verified I2). Falls back to
   *  `fontSize` when absent — mirrors upstream's `StyleSignatureBasic`
   *  hierarchical cascade (a less-specific `[element,<sname>]` style rule
   *  applies to the more-specific `[element,<sname>,stereotype]` query unless
   *  overridden — `FromSkinparamToStyle.java`'s `addConFont`/`addMagic`
   *  register both as SEPARATE style rules, merged by signature specificity).
   *  Not independently jar-verified against a fixture combining both on one
   *  element (no sampled I4 fixture does) — the cascade fallback is the
   *  most defensible reading of the style system's own architecture, not a
   *  guess from nothing. */
  stereotypeFontSize?: number;
  /** Per-stereotype-NAME tier of {@link ElementColors.stereotypeFontSize} --
   *  `skinparam <sname>StereotypeFontSize<<label>> N` (flat or block form) /
   *  `<style> <sname> { stereotype { .label { FontSize N } } } }`. Consulted
   *  BEFORE the flat `stereotypeFontSize` above, which is itself consulted
   *  before `fontSize`, completing the three-tier cascade that field's own
   *  doc comment describes -- upstream registers the name-scoped rule as a
   *  MORE-SPECIFIC `StyleSignatureBasic` (the `<style>` front-end, an extra
   *  stereotype token on the signature) or as a stereotype-suffixed direct
   *  VALUE lookup (`SkinParam#getFontSize(stereotype, FontParam...)`'s
   *  `getFirstValueNonNullWithSuffix("fontsize" + stereotype.getLabel(...))`,
   *  the skinparam front-end), and both beat the un-scoped rule.
   *
   *  Keys are CLEANED stereotype tokens (`StyleSignatureBasic#clean`:
   *  lowercased, `_` and `.` dropped), so the two front-ends converge on one
   *  map: `parseStyleBlock` lowercases a `.label` selector and
   *  `style-map-element.ts#cleanStereotypeToken` drops the rest, while
   *  `skinparam-key-normalize.ts#normaliseKey` applies the SAME lowercase +
   *  `[_.]`-strip to the whole `<sname>stereotypefontsize<<label>>` key
   *  before `applyStereoOverride` splits the label out. Jar-verified as one
   *  behaviour by `loroto-06-fano471` (`<style>` spelling) and
   *  `toxine-81-xofo986` (`skinparam` spelling) producing byte-identical
   *  oracle DOT. Absent = no name-scoped override (the common case). */
  stereotypeFontSizeByStereo?: Record<string, number>;
  /** `<style> <sname> { header { BackgroundColor/FontColor/FontSize } } }`
   *  -- G3/O4, `EntityImageObject`/`Map`/`Json`'s own `getStyleHeader()`
   *  nested `header` sub-selector (`StyleSignatureBasic.of(root, element,
   *  objectDiagram, <sname>, header)`), scoped to the same three kinds
   *  `stereotypeFontSize` above already narrows to via `ELEMENT_BUCKET_
   *  SNAMES` gating at the parse site (`style-map-element.ts#collect
   *  ElementStyleBuckets`). `headerBackground` draws a SEPARATE half-
   *  rounded rect over ONLY the title/header area
   *  (`renderer-classifier-box.ts#buildHeaderPrimitive`) whenever it
   *  differs from the bare bucket's own `background` -- mirrors jar's own
   *  `headerBackcolor != null && !backcolor.equals(headerBackcolor)` gate
   *  (`EntityImageObject.java:199`). `headerFont`/`headerFontSize` win over
   *  the bare bucket's `font`/`fontSize` for the NAME row text ONLY
   *  (member rows keep the bare bucket's own values) -- jar-verified
   *  `soxufi-98-nita528`. Absent = no header-specific override (the
   *  common case). */
  headerBackground?: Paint;
  headerFont?: Paint;
  headerFontSize?: number;
  /** `skinparam <sname>FontSize<<label>>` — the ELEMENT's own font size when
   *  it carries that stereotype, written by the flat key or by the nested
   *  `skinparam <sname> { <<label>> { FontSize N } }` block form (the
   *  preprocessor normalizes both to the same key). Upstream reaches it
   *  through `getStyleHeader().withTOBECHANGED(stereotype)`
   *  (`EntityImageObject.java:132-134`), i.e. a stereotype-qualified merge of
   *  the SAME `SName.object` style `objectFontSize` writes
   *  (`FromSkinparamToStyle.java:200`). Consulted BEFORE {@link headerFontSize}
   *  and the bare {@link fontSize}. */
  fontSizeByStereo?: Readonly<Record<string, number>>;
  /** B13/M22: `skinparam <sname>BackgroundColor<<label>>` (and the block
   *  form the preprocessor normalizes to the same key) — the element's own
   *  background under a stereotype, keyed by RAW label. Upstream reaches it
   *  generically: `FromSkinparamToStyle`'s ctor splits `<<...>>` off ANY key
   *  (`:292-302`) and `addStyle` re-signs the resulting signature with
   *  `.addStereotype(s)` at +1000 priority (`:396-410`,
   *  `StyleLoader.java:178-186`). Consulted BEFORE the bare
   *  {@link backgroundColor}. Exact mirror of {@link fontSizeByStereo}'s
   *  shape — see `skinparam-stereo-keys.ts` for why this port models the
   *  generic mechanism as per-key matchers and what that costs. */
  backgroundColorByStereo?: Readonly<Record<string, string>>;
  /**
   * mission skin-file-loading (deferred D3 item, class+description
   * shadow): `<sname>Shadowing` skinparam (flat `skinparam databaseShadowing
   * true` or block `skinparam actor { Shadowing false }` form -- both funnel
   * through the SAME normalized flat key, `preprocessor.ts`'s skinparam-block
   * collector) -- upstream `FromSkinparamToStyle.java#getShadowingValue`:
   * `false`/`no` -> `0`, `true`/`yes` -> `3`, else the raw numeric value
   * passed through, registered under this element's OWN `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <sname>)`), which wins over the
   * diagram-wide `Theme.shadowing` (bare `root`/`element` selector) when
   * BOTH are set -- mirrors {@link Theme.shadowing}'s own cascade precedent
   * exactly (`resolveElementShadowing`'s own doc comment). Jar-verified
   * `malado-53-noso561`: `skinparam actor { shadowing false }` +
   * `skinparam databaseShadowing true` -- the actor draws NO shadow, the
   * database draws one, though no `<style>`/`skin <name>` root-level
   * Shadowing is set at all. Absent = no per-element override (falls
   * through to {@link Theme.shadowing}).
   */
  shadowing?: number;
  /**
   * `<style> <sname> { LineThickness N } }` -- the per-element border/line
   * thickness, registered under this element's own `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <diagramType>, <sname>)`), which
   * wins over the renderer's built-in default (`ENTITY_STROKE_WIDTH` 0.5 for
   * description leaves) when set. `skin rose`'s `componentDiagram { node,
   * rectangle { LineThickness 1.5 } }` is the first consumer -- a deployment
   * node/rectangle draws a 1.5-wide border, not the 0.5 default. Absent = no
   * per-element override (the renderer's default thickness stands).
   */
  lineThickness?: number;
  /**
   * `<style> <sname> { MinimumWidth N } }` -- the per-element content-width
   * floor, registered under this element's own `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <sname>)`, `PName.MinimumWidth`),
   * which wins over the diagram-wide `Theme.minimumWidth` (bare
   * `skinparam minClassWidth`) when set (S1L-b T5, ADR-3). `zotiru-33`'s
   * `<style> package { MinimumWidth 300 }` floors package boxes' content at
   * 300 while leaving a sibling `card` unfloored. Absent = no per-element
   * override (falls through to {@link Theme.minimumWidth}, then the box
   * default). See `resolveElementMinimumWidth`.
   */
  minimumWidth?: number;
  /**
   * `<style> <sname> { RoundCorner N } }` -- the per-element CORNER RADIUS,
   * registered under this element's own `SName` bucket
   * (`StyleSignatureBasic.of(root, element, <diagramType>, <sname>)`,
   * `PName.RoundCorner`). Stores the RAW, UNHALVED style value: `rx` and
   * `ry` are each `value / 2`, following `URectangle.ts#build().rounded()`'s
   * existing halving convention and the identical treatment
   * {@link import('./theme-graph-colors-b.js').ThemeGraphColorsB.classCascadeRoundCorner}
   * already gives the class-diagram ancestor tier.
   *
   * First consumer: `activityDiagram { activity { RoundCorner 25 } }`
   * (`plantuml.skin:361`) -- the jar emits `rx="12.5" ry="12.5"` on an
   * action rect, which is `25 / 2` on BOTH axes (mission
   * `activity-style-defaults` D4; the port's own prior `rx="8"` was an
   * unsourced constant and carried no `ry` at all).
   *
   * Absent = no per-element override; the caller applies its own default,
   * mirroring {@link lineThickness} and {@link minimumWidth}'s "absent ->
   * caller default" shape rather than inventing a hard default here, since
   * the radius differs per element kind.
   */
  roundCorner?: number;
  /**
   * cdd3-T21 (E3-1): `skinparam <sname>BorderColor<<label>>` /
   * `<sname>FontColor<<label>>` / `<sname>BorderThickness<<label>>` /
   * `<sname>StereotypeFontColor<<label>>` -- the stereotype-RE-SIGNED
   * `LineColor`/`FontColor`/`LineThickness` styles `FromSkinparamToStyle`
   * registers at +1000 priority (`:292-302` splits the `<<label>>` off,
   * `:396-408` `addStyle` -> `addPriorityForStereotype` +
   * `sig.addStereotype`). Keyed by the CLEANED label (`StyleSignatureBasic
   * #clean`: lowercase, `[_.]` stripped), exactly as
   * {@link backgroundColorByStereo}. Populated for every group USymbol
   * that has an `addMagic` registration (`skinparam-stereo-keys.ts
   * #applyGroupByStereo`, cdd6 T1a). `fontByStereo` is also written by the
   * `<style> <sname> { .label { FontColor X } }` sub-selector
   * (`style-map-element.ts#collectTagFontColor`) -- the same
   * `sig.addStereotype` signature the skinparam front-end builds.
   */
  borderByStereo?: Readonly<Record<string, string>>;
  fontByStereo?: Readonly<Record<string, string>>;
  lineThicknessByStereo?: Readonly<Record<string, number>>;
  /** cdd7 T2b (xuloxo-85): `skinparam <sname>RoundCorner<<label>>` /
   *  `<sname>DiagonalCorner<<label>>` -- the same +1000 re-signing as
   *  {@link borderByStereo} (`FromSkinparamToStyle.java:275-276,396-408`);
   *  RAW unhalved values, as {@link roundCorner}. Read by the class usymbol
   *  leaf draw (`EntityImageDescription.java:168-169`). */
  roundCornerByStereo?: Readonly<Record<string, number>>;
  diagonalCornerByStereo?: Readonly<Record<string, number>>;
  stereotypeFontByStereo?: Readonly<Record<string, string>>;
  /**
   * T1d (fepiko-26-vobi566): the DECLARATION-ORDER-RESOLVED `PName.FontColor`
   * for a group USymbol's stereotype-TEXT render node. `<sname>FontColor
   * <<label>>` (`{<sname>}`, `addConFont`) and `<sname>StereotypeFontColor
   * <<label>>` (`{stereotype, <sname>}`, `addMagic` `FromSkinparamToStyle
   * .java:283`) both re-sign at the SAME `+DELTA_PRIORITY_FOR_STEREOTYPE`
   * tier (`:396-408`) and BOTH match that node; two same-tier Style entries
   * resolve by which was PARSED LATER (`DarkString#mergeWith`,
   * `DarkString.java:54-57`), not by which property is more specific.
   * `skinparam-stereo-keys.ts#applyGroupByStereo` writes this field from
   * BOTH branches, in source order, so the plain object's last-write-wins
   * semantics reproduce that tie-break for free. Consulted ahead of
   * {@link stereotypeFontByStereo}/{@link fontByStereo} by
   * `class-package-style.ts#elementStereoFontColor` only — the folder-family
   * empty-package leaf's stereotype colour is a DIFFERENT, non-Style-cascade
   * legacy lookup (`emptyPackageStereoFontColor`'s own doc comment) that
   * must keep reading {@link stereotypeFontByStereo} alone.
   */
  stereoTextFontByStereo?: Readonly<Record<string, string>>;
  /** cdd3-T21 (E3-2): `skinparam <sname>StereotypeFontColor X` -- `addMagic`
   *  (`FromSkinparamToStyle.java:283`) -> `FontColor` on `{stereotype,
   *  <sname>}`; also the legacy `FontParam.<SNAME>_STEREOTYPE` colour
   *  (`SkinParam.java:484-505`). Populated for `package` only by skinparam;
   *  cdd6 T1a: also written for any bucket SName by `<style> <sname> {
   *  stereotype { FontColor X } }` (`ClusterHeader.java:209-215`,
   *  `forStereotypeItself`). */
  stereotypeFont?: string;
  /** cdd3-T21 (E3-5): `skinparam <sname>FontName X` / `<sname>FontStyle X`
   *  -- `addConFont(cleanName, sname)` (`FromSkinparamToStyle.java:278`) ->
   *  `FontName`/`FontStyle` on `{<sname>}`. Populated for `package` only. */
  fontFamily?: string;
  fontStyle?: { readonly bold: boolean; readonly italic: boolean };
  /**
   * cdd6 T1a (D2): `PName.LineStyle` on `{<sname>}` -- the dash half of the
   * element's / cluster's stroke (`Style#getStroke`, `Style.java:299-320`;
   * the cluster draws it via `Cluster#getStrokeInternal`,
   * `Cluster.java:402-407`). Written by `<style> <sname> { LineStyle N }`
   * and by `skinparam <sname>BorderStyle X` (`FromSkinparamToStyle.java:277`
   * registers BorderStyle AS LineStyle; `dashed`/`dotted` rewrite to
   * `7;7`/`1;3` first, `:321-326`). `group` carries the cluster-wide value
   * (`Cluster.java:291`'s signature holds `group` beside the USymbol SName).
   * `{0, 0}` = an explicit solid stroke; absent = no LineStyle declared.
   */
  lineStyle?: LineStyleDash;
  /** cdd6 T1a: `skinparam <sname>BorderStyle<<label>> X` -- the
   *  stereotype-re-signed {@link lineStyle} (`FromSkinparamToStyle.java
   *  :292-302,396-408`), keyed like {@link borderByStereo}. */
  lineStyleByStereo?: Readonly<Record<string, LineStyleDash>>;
  /** cdd6 T1a: `<style> <sname> { title { FontColor X } }` -- the
   *  `{..., <sname>, composite|package_, title}` header signature
   *  (`ClusterHeader.java:151-165`; `EntityImageEmptyPackage.java:88`;
   *  `EntityImageDescription.java:146-149`). */
  titleFont?: Paint;
  /** cdd6 T1a: `skinparam packageBackgroundColor A<sep>B` when the value
   *  parses as a gradient (`HColorSet.java:107-116`). `packageBackgroundColor`
   *  registers on `{group}` and `{package_}` (`FromSkinparamToStyle.java
   *  :127,129` -> `:272`); `theme.colors.graph.packageBackground` keeps the
   *  flattened solid string, so the gradient is carried here. Absent for a
   *  solid value. */
  backgroundGradient?: Gradient;
  /** cdd6 T3g (D2): `PName.HyperLinkColor` on `{<sname>}` -- `Style.java:265`
   *  / `FontConfiguration.java:213-219` build the element's
   *  `FontConfiguration` with it, and `StripeSimple.java:224-225`
   *  (`addUrl`) draws a `[[url]]` atom from that configuration. Written by
   *  `<style> <sname> { HyperLinkColor X }`; absent = the `#0000FF`
   *  fallback (`CommandCreoleUrl.ts`). */
  hyperlinkColor?: string;
  /** cdd6 T3g: `<style> <sname> { .label { HyperLinkColor X } }` -- the
   *  stereotype-re-signed {@link hyperlinkColor} (`StyleSignatureBasic
   *  #withTOBECHANGED`, the same signature `fontByStereo`'s `<style>` form
   *  uses), keyed by the CLEANED label like {@link fontByStereo}. */
  hyperlinkColorByStereo?: Readonly<Record<string, string>>;
  /** cdd6 T3g: `PName.MaximumWidth` on `{<sname>}` -- `Style#wrapWidth`
   *  (`Style.java:330-332`), the word-wrap width `BodierJSon.java:85` hands
   *  to `TextBlockCucaJSon` (`:184-190` wraps every key and scalar cell).
   *  Written by `<style> <sname> { MaximumWidth N }`; mirrors
   *  {@link minimumWidth}. See `resolveElementMaximumWidth`. */
  maximumWidth?: number;
  /** cdd6 T3g: `PName.HorizontalAlignment` on `{<sname>}` -- written by
   *  `<style> <sname> { HorizontalAlignment X }` and, for `note`, by
   *  `skinparam noteTextAlignment X` (`FromSkinparamToStyle.java:178`).
   *  `EntityImageNote.java:112` reads it for the note body lines. Stored
   *  as the upper-case `HorizontalAlignment` token. */
  horizontalAlignment?: HorizontalAlignment;
}

export type ThemeGraphColors = ThemeGraphColorsA & ThemeGraphColorsB & ThemeGraphColorsC;
