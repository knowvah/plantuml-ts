/**
 * theme-graph-colors-a.ts — first half of `ThemeGraphColors` (split
 * further out of ./theme-graph-colors.ts to keep every file under the
 * project's 500-line cap; combined back via intersection in that
 * module). Pure type-only move, no behavior change.
 */

export interface ThemeGraphColorsA {
  classBackground: string;
  interfaceBackground: string;
  enumBackground: string;
  actorStroke: string;
  packageBackground: string;
  packageBorder: string;
  /** G2 N18: `skinparam packageBorderThickness N` / `skinparam
   *  package { BorderThickness N }` -- the folder-tab outline's own
   *  stroke width (jar default 1.5, `class-namespace-shape.ts
   *  #PACKAGE_STROKE_WIDTH`). NOTE: the title's own FontSize/FontColor
   *  overrides are NOT dedicated fields here -- class reads the
   *  generic `colors.elements.package.{fontSize,font}` bucket instead
   *  (shared with description's package/folder USymbol rendering, see
   *  `class-namespace-shape.ts#titleFont`'s doc comment). */
  packageBorderThickness?: number;
  /** G2 N51: `skinparam classBorderColor #X` / `skinparam class {
   *  BorderColor #X }` -- the classifier box's own bare (non-`<style>`,
   *  non-tag) LineColor override (`FromSkinparamToStyle.java:183`:
   *  `element.class_` LineColor -- the SAME StyleSignature
   *  `classCascadeBorder` above models for `<style>` blocks). Read by
   *  `renderer-classifier-box.ts#classBorder` as the fallback tier
   *  BELOW the `.tagname`/`classCascadeBorder` cascade and ABOVE the
   *  plain `theme.colors.border` default -- mirrors the PRE-EXISTING
   *  `classBackground`/`classCascadeBackground` two-tier precedent
   *  exactly (`classifierFill`'s own doc comment), jar-verified
   *  `cunavo-77-filo788` (`classBorderColor #F0F`, no `<style>` block,
   *  no stereotype tag match -- box `stroke`/both divider `stroke`s all
   *  render `#FF00FF`). */
  classBorder?: string;
  /** G2 N51: `skinparam classBorderThickness N` / `skinparam class {
   *  BorderThickness N }` -- the classifier box outline's + divider
   *  lines' own stroke-width override (`FromSkinparamToStyle.java:195`:
   *  `element.class_` LineThickness), jar default `0.5`
   *  (`renderer-classifier-box.ts`'s own pre-existing hardcoded
   *  literal). Read by `renderer-classifier-box.ts#classBorderStrokeWidth`
   *  BELOW the per-stereotype `classBorderThicknessByStereo` bucket and
   *  ABOVE the `0.5` default -- jar-verified `vaxeku-10-peko225`
   *  (`classBorderThickness .5`, matches the pre-existing default
   *  coincidentally -- already zero-diff before this field existed). */
  classBorderThickness?: number;
  /** G2 N51: `skinparam classBorderThickness<<stereo>> N` --
   *  `SkinParam#getThickness(LineParam, Stereotype)` (`SkinParam.java
   *  :904-938`): a STEREOTYPE-QUALIFIED skinparam key, resolved by
   *  DIRECT VALUE LOOKUP (`param.name() + "thickness" +
   *  stereotype.getLabel(...)`), NOT via the `<style>`/StyleSignature
   *  cascade `classTagCascade`/`resolveClassTagCascadeEntry` model for
   *  `.tagname` sub-selectors -- a genuinely separate mechanism that
   *  happens to share the `<<stereotype>>` suffix syntax. Keyed by the
   *  LOWERCASED stereotype label (matching `resolveClassTagCascadeEntry`'s
   *  own case-insensitive comparison against `geo.stereotypeLabels`).
   *  Wins over the plain `classBorderThickness` above when the
   *  classifier's OWN stereotype matches a key here -- jar-verified
   *  `ragona-89-fadi984` (`class A <<stereo>>` renders stroke-width 5,
   *  `class B` with no stereotype stays at the 0.5 default). */
  classBorderThicknessByStereo?: Readonly<Record<string, number>>;
  /** G4 S9: `skinparam StateBorderColor<<stereo>> #X` --
   *  `SkinParam#getColor(ColorParam, Stereotype)`: a STEREOTYPE-
   *  QUALIFIED skinparam key, resolved by DIRECT VALUE LOOKUP (mirrors
   *  `classBorderThicknessByStereo`'s identical mechanism/doc comment
   *  above, applied to a state box's own border COLOR instead of class's
   *  border THICKNESS). Keyed by the LOWERCASED stereotype label
   *  (`core/skinparam.ts#STATE_BORDER_COLOR_STEREO_RE`, matching a
   *  state's own `StateNodeGeo.stereotype`, lowercased at lookup time).
   *  Read by `state-render-colors.ts#resolveStateBorder` as the fallback
   *  tier BELOW `theme.colors.border`'s own default -- jar-verified
   *  `semala-31-joji042` (`skinparam StateBorderColor<<meblue>> blue`,
   *  `state a<<meblue>>` renders `stroke="#0000FF"` on both its own
   *  outline `rect` and divider `line`; its plain (non-stereotyped)
   *  children keep the `#181818` default). */
  stateBorderColorByStereo?: Readonly<Record<string, string>>;
  /**
   * mission G4 S15: `skinparam stateBackgroundColor<<stereo>> #X` /
   * `skinparam stateFontColor<<stereo>> #X` -- the SAME direct-value-
   * lookup mechanism as {@link stateBorderColorByStereo} above, applied
   * to a state box's own FILL / text color instead of its border. The
   * SIBLING field for the box's own text SIZE, `stateFontSize<<X>>`, is
   * `stateFontSizeByStereo` below (mission G4 S16 -- S9/S14/S15's own
   * "three fields load-bearing together" queue note is now resolved:
   * all three are landed, just via two separate Theme fields since
   * FontSize is also a layout-time concern the other two are not).
   * Keyed by the LOWERCASED stereotype label (`core/skinparam.ts
   * #STATE_BACKGROUND_COLOR_STEREO_RE`/`#STATE_FONT_COLOR_STEREO_RE`).
   * Read by `state-render-colors.ts#resolveStateFillBucketed`/
   * `#resolveStateFontColor` as a fallback tier BELOW the `#color`
   * inline override and ABOVE the bare `state`-element `<style>`
   * bucket (mission G4 S10's own `resolveStateBucketBackground`).
   */
  stateBackgroundColorByStereo?: Readonly<Record<string, string>>;
  stateFontColorByStereo?: Readonly<Record<string, string>>;
  /**
   * mission G4 S16: `skinparam stateFontSize<<stereo>> N` -- the SAME
   * direct-value-lookup mechanism as {@link stateBorderColorByStereo}
   * above, applied to a state box's own label TEXT SIZE. Unlike its two
   * color siblings, this field is a LAYOUT-time concern too, not just a
   * render-time swap: `state-render-colors.ts#resolveStateFontSize`
   * reads it during MEASUREMENT (feeds `StringMeasurer` and therefore
   * the box's own DOT node width/height) as well as at render time (the
   * `<text font-size="...">` attribute and the header/body line-step
   * formula, `renderer-box.ts`). Keyed by the LOWERCASED stereotype
   * label (`core/skinparam.ts#STATE_FONT_SIZE_STEREO_RE`), same
   * lookup key shape as `stateBackgroundColorByStereo`/
   * `stateFontColorByStereo` above. Jar-verified `laferu-31-tice836`
   * (`skinparam stateFontSize<<Foo>> 30`, `state state1 <<Foo>>` ->
   * `font-size="30"`, box widened/heightened to fit the larger glyph).
   */
  stateFontSizeByStereo?: Readonly<Record<string, number>>;
  /**
   * mission G4 S16: `<style> stateDiagram { arrow { LineColor
   * HeadColor } } }` -- selector `statediagram.arrow`
   * (`style-map-theme.ts#applyStyleMap`, the ONLY merge point for any
   * diagram-type-specific `<style>` selector -- S14/S15's own
   * "WRITE-SET BLOCKED" finding, resolved by this iteration's explicit
   * write-set grant). LineColor overrides the transition PATH's own
   * stroke (raw, unresolved -- resolved via `resolveColorToSvgHex` at
   * consumption time, mirroring every other `graphOverride` color
   * field's convention). Read by `state-render-colors.ts
   * #resolveStateArrowLineColor` as a fallback tier BELOW
   * `theme.colors.arrow`'s own default. Jar-verified
   * `nanozi-96-foda024` (`LineColor blue` -> `path stroke="#0000FF"`).
   */
  stateArrowLineColor?: string;
  /**
   * mission G4 S16: the SAME `statediagram.arrow` selector's HeadColor
   * declaration -- overrides the arrowhead `<polygon>`'s OWN fill AND
   * stroke (BOTH, jar-verified `nanozi-96-foda024`: `polygon
   * fill="#FF0000" stroke="#FF0000"` -- a single color feeds both
   * attributes, unlike `stateArrowLineColor` above, which only ever
   * feeds the path's stroke). Read by `state-render-colors.ts
   * #resolveStateArrowHeadColor`.
   */
  stateArrowHeadColor?: string;
  /**
   * mission skin-file-loading Batch 1 (D3): the GLOBAL root/element
   * universal-selector BackgroundColor cascade -- see `style-map-
   * element.ts#resolveGlobalBackground`'s own doc comment for the
   * bare "root"/"element" precedence algorithm and why this is a
   * DEDICATED field (not `theme.colors.background`, which the
   * document/canvas-background cascade already claims with a
   * DIFFERENT precedence rule). RAW (unresolved) -- resolved via
   * `resolveColorToSvgHex` at consumption time, mirroring
   * `stateArrowLineColor`'s own convention. Read by `state-render-
   * colors.ts#resolveStateFillBucketed` as a fallback tier BELOW the
   * `state`-element bucket and ABOVE each shape's own hardcoded
   * default. State is this field's first consumer (D3: other diagram
   * types are a later increment, when a fixture needs it -- no corpus
   * sample outside the state family exercises `skin <name>` today).
   */
  rootElementBackground?: string;
  /**
   * mission G6 T4: `<style> stateDiagram { RoundCorner N } }` -- the
   * bare "statediagram" selector's own RoundCorner declaration, RAW
   * (unhalved) per `classCascadeRoundCorner`'s own storage convention
   * above -- `rx`/`ry` = value/2 at consumption time
   * (`state-render-colors.ts#resolveStateBoxRadius`). Populated directly
   * from the bare `"statediagram"` StyleMap key
   * (`style-map-theme.ts#applyStyleMap`, mirroring `stateArrowLineColor`'s
   * own injection point but reading the UN-nested selector, since
   * RoundCorner has no established nested `state {}`/`arrow {}`
   * sub-selector reach of its own in this port). Applies uniformly to
   * EVERY state-diagram box shape (leaf, composite/cluster outline, AND
   * the composite header's own half-rounded arc) -- jar's compound
   * StyleSignature reaches all of them from one bare selector (mission
   * G6 T4 diagnosis, `decede-10-buvu414`: `RoundCorner 2` -> `rx="1"`
   * on all 8 entities; a targeted probe confirms the halving formula
   * generally, `RoundCorner 10` -> `rx="5"`). Absent = the pre-existing
   * hardcoded `STATE_BOX_RX` (12.5, i.e. the jar default `RoundCorner
   * 25`) -- zero behavior change for every state diagram with no
   * `<style>` RoundCorner override.
   */
  stateCascadeRoundCorner?: number;
  /**
   * mission G4 S16: `<style> activityBar { .fork { BackGroundColor }
   * .join { BackGroundColor } } }` -- selector `activitybar..fork`/
   * `activitybar..join` (the double-dot is `parseStyleBlock`'s own
   * stack-join artifact: a child selector that itself starts with `.`
   * joins as `"activitybar" + "." + ".fork"`). A cross-diagram-type
   * selector (shared with the activity-diagram engine, which this port
   * has not built) -- but state's OWN fork/join synchro-bars
   * (`EntityImageSynchroBar`) reuse the SAME selector name upstream, so
   * this field is consumed entirely within `src/diagrams/state/`
   * (`renderer-pseudostate.ts#renderForkJoin`), not a real
   * cross-engine dependency. Read as a fallback tier BELOW the `#color`
   * inline override and ABOVE the hardcoded `SYNCHRO_BAR_COLOR` default
   * -- `syncBar` (T2's `=name=` construct, a DIFFERENT upstream
   * shape from `<<fork>>`/`<<join>>` stereotype states, no corpus
   * evidence of a matching selector) is deliberately EXCLUDED from this
   * lookup, unaffected. Jar-verified `koguvo-74-kubo455`
   * (`activityBar { .fork { BackGroundColor: green; } } }` -> fork bar
   * `fill="#008000"`).
   */
  activityBarForkColor?: string;
  /** Same mechanism as {@link activityBarForkColor}, the `.join`
   *  selector's own BackGroundColor. Jar-verified `koguvo-74-kubo455`
   *  (join bar `fill="#FFA500"`). */
  activityBarJoinColor?: string;
  /** G2 N51: `skinparam arrowThickness N` -- `FromSkinparamToStyle.java
   *  :150`: `SName.arrow` LineThickness, the DEFAULT stroke-width every
   *  edge draws at when it carries no `-[thickness=N]->`/`-[bold]->`
   *  bracket override of its own (`LinkType#getStroke3(UStroke
   *  defaultThickness)`, `decoration/LinkType.java:245-256`: a bracket
   *  override always wins; absent one, this skinparam's value is
   *  applied to the edge's OWN dash-pattern via `LinkStyle#goThickness`
   *  -- BOLD edges still hardcode thickness 2 regardless, per that
   *  function's existing doc comment). Read by
   *  `class-geo-builders.ts#buildStrokeOverride` as the fallback
   *  passed to the SAME `svek-edge-stroke.ts#strokeForStyle` formula
   *  the bracket-override path already uses -- jar-verified
   *  `jezepa-12-padu194`/`vufuko-05-lapu034`. */
  arrowThickness?: number;
  /** `skinparam arrowFontSize N` -- `FontParam.ARROW`'s size override
   *  (`klimt/font/FontParam.java:54`, default 13). Feeds edge-label
   *  MEASUREMENT via `core/edge-label-box.ts`, so it changes the reserved box
   *  in the DOT and therefore rank separation -- not only how the text draws.
   *  Was unported until 2026-08-14; the omission is why
   *  `usecase/jecici-56-bimu826` measured its labels at 13 where the fixture
   *  asks for 10. */
  arrowFontSize?: number;
  /** D3: `<style> arrow { FontName X }` / `skinparam arrowFontName X` --
   *  `arrow-label-font.ts#resolveArrowLabelFont`'s `family` fallback tier,
   *  above `theme.fontFamily`. Sibling of {@link arrowFontSize}; see that
   *  field's own doc comment. No caller yet (D4/Batch 3). */
  arrowFontFamily?: string;
  /** D3: `<style> arrow { FontStyle bold|italic|... }` / `skinparam
   *  arrowFontStyle X` -- the RAW cascade value, unparsed. `arrow-label-
   *  font.ts#resolveArrowLabelFont` is the ONE reader that maps it onto
   *  `FontSpec.weight`/`style` (`klimt/font/FontStyle.java`'s independent
   *  bold/italic axes). No caller yet (D4/Batch 3). */
  arrowFontStyle?: string;
  /** G2 N23/N32: `skinparam class { AttributeFontSize N }` / `skinparam
   *  classAttributeFontSize N` -- upstream `FontParam.CLASS_ATTRIBUTE`'s
   *  dedicated size override, style-mapped by `FromSkinparamToStyle
   *  .java:190` to the `element.class` style selector (the WHOLE box,
   *  fields+methods). N23 believed this was member-row-only and
   *  independent of the header's own font (`FontParam.CLASS`) -- WRONG,
   *  corrected N32: `element.class.header` (the header's style
   *  signature, `classFontSize` below) CASCADES from `element.class`
   *  when it carries no override of its own (CSS-selector-specificity
   *  semantics, `EntityImageClassHeader#getStyleSignature`'s more
   *  specific selector wins only when it actually sets the property).
   *  Jar-verified `jisanu-32-gado231` (AttributeFontSize/Name only, no
   *  ClassFontSize/Name set) -- the header text ALSO renders at the
   *  overridden size/family, not just member rows. `classFontSize`'s own
   *  doc comment covers the header-overrides-cascade case
   *  (`xabije-20-xusi569`, both pairs set, header and members diverge).
   *  `SkinParam#getFontSize`'s real lookup key is `p.name() + "fontsize"`
   *  where `p.name()` is the Java enum constant `"CLASS_ATTRIBUTE"` --
   *  underscore-stripped, that is EXACTLY `"class" + "attributefontsize"`,
   *  the same block-context + inner-key concatenation this port's own
   *  `skinparam class { AttributeFontSize N }` parsing already produces
   *  (`preprocessor.ts`'s `SkinLoader`-mirroring collector). */
  classAttributeFontSize?: number;
  /** A2s R2j: `skinparam classAttributeFontSize<<stereo>> N` -- the
   *  STEREOTYPE-QUALIFIED tier of the SAME `SkinParam#getFontSize` lookup
   *  as `classAttributeFontSize` above: `getFirstValueNonNullWithSuffix
   *  ("fontsize" + stereotype.getLabel(...), param)` is consulted BEFORE
   *  the plain per-param value (SkinParam.java:433-443), so a matching
   *  stereotype's entry here WINS over `classAttributeFontSize`. A direct
   *  VALUE lookup, not the `<style>`/`.tagname` cascade -- mirrors
   *  `classBorderThicknessByStereo` above (same key shape, same
   *  LOWERCASED-stereotype-label keying, `skinparam-stereo-keys.ts`).
   *  Read by `class-layout-fonts.ts#resolveAttributeFont`; the header
   *  font CASCADES from the resolved attribute size exactly as for the
   *  plain value (jar-verified R2c probes ps/p1 ≡ ps/p4 for the matching
   *  class; ps/p1's non-stereotyped class ≡ ps/p3's -- untouched). */
  classAttributeFontSizeByStereo?: Readonly<Record<string, number>>;
  /** `skinparam classFontSize<<Stereo>> N` — the class HEADER's own size
   *  under that stereotype. Written by the flat key or by the nested
   *  `skinparam class { <<Stereo>> { FontSize N } }` block, which
   *  `SkinLoader#getFullParam` (`command/SkinLoader.java:69-75`) concatenates
   *  to `class<<Stereo>>FontSize` and `SkinParam#cleanForKeySlow`
   *  (`skin/SkinParam.java:283-300`) rewrites to this one key.
   *
   *  Upstream does NOT route it through the stereotype-suffixed VALUE lookup
   *  {@link classAttributeFontSizeByStereo} uses: `SkinParam#setParam`
   *  (`SkinParam.java:225-232`) hands every key to `FromSkinparamToStyle`,
   *  whose constructor (`style/FromSkinparamToStyle.java:292-302`) splits the
   *  `<<...>>` off, so `classfontsize` resolves through its ordinary
   *  registration — `PName.FontSize` at `element.class.header`
   *  (`FromSkinparamToStyle.java:185`) — and `addStyle`
   *  (`FromSkinparamToStyle.java:396-410`) then re-signs it
   *  `.addStereotype(label)` with `StyleLoader#addPriorityForStereotype`
   *  (`StyleLoader.java:178-186`, +1000 priority). The class header picks it
   *  up via its own `withTOBECHANGED(stereotype)` merge, so a matching
   *  stereotype WINS over the plain `classFontSize`.
   *
   *  Read by `class-layout-fonts.ts#resolveHeaderFont`. Jar-verified
   *  `tabaxa-70-pomu341`: `class { FontSize 16, <<Foo1>> { FontSize 8 } }`
   *  draws the stereotyped `A` and the plain `B` at the SAME 0.997917x0.861111in
   *  — A's header shrinks to 8 by exactly the height its stereotype row adds. */
  classFontSizeByStereo?: Readonly<Record<string, number>>;
  /** Same mechanism, `FontParam.CLASS_ATTRIBUTE`'s font-family override
   *  (`skinparam class { AttributeFontName X }` / `classAttributeFontName
   *  X`). */
  classAttributeFontFamily?: string;
  /** G2 N32: `skinparam class { AttributeFontStyle italic|bold }` /
   *  `classAttributeFontStyle <tokens>` -- `SkinParam#getFontFace`'s real
   *  parsing rule (`contains("bold")`/`contains("italic")` substring
   *  match on the lowercased value, BOTH may be set simultaneously, e.g.
   *  `"bold italic"`) applied to the SAME `element.class` selector as
   *  `classAttributeFontSize` above. Member-row-only when `classFontStyle`
   *  (below) is ALSO set for a given classifier; the header cascade
   *  applies here too when it is not. */
  classAttributeFontBold?: boolean;
  classAttributeFontItalic?: boolean;
  /** G2 N32: `skinparam classFontSize N` / `classFontName X` /
   *  `classFontStyle <tokens>` -- `FromSkinparamToStyle.java:185-188`'s
   *  `element.class.header` selector, the classifier HEADER's own
   *  font override (name text + kind-badge row), independent of
   *  `classAttributeFont*` above -- jar-verified `xabije-20-xusi569`:
   *  `ClassFontSize 14`/`ClassFontStyle bold` render on the header
   *  ("Class", size 14, `font-weight="700"`) while `ClassAttributeFontSize
   *  18`/`ClassAttributeFontStyle italic` render on the member rows
   *  (size 18, `font-style="italic"`) -- the two axes genuinely diverge
   *  for a real multi-compartment class (N23's "one shared font" was
   *  only correct by coincidence for the enum single-compartment case,
   *  where `MethodsOrFieldsArea` folds header+members into one region).
   *  Unset (the overwhelmingly common case) falls back to
   *  `classAttributeFont*` first, then `theme.fontFamily`/`fontSize` --
   *  see `class-layout-helpers.ts#measureClassifier`'s cascade. */
  classFontSize?: number;
  classFontFamily?: string;
  classFontBold?: boolean;
  classFontItalic?: boolean;
  /** G2 N39: `skinparam classStereotypeFontSize N` / `classStereotype
   *  FontName X` / `classStereotypeFontStyle <tokens>` --
   *  `FontParam.CLASS_STEREOTYPE` (`klimt/font/FontParam.java:61`,
   *  default size 12, ALWAYS italic by default), the font BOTH the
   *  classifier's `<<stereotype>>` label row(s) AND its `<T>` generic
   *  type-parameter tag box share (`EntityImageClassHeader.java:124-132`
   *  and `:144-148` both call the identical `FontConfiguration.create
   *  (skinParam, FontParam.CLASS_STEREOTYPE, stereotype)` -- confirmed
   *  by direct read, not inferred) -- a SEPARATE `FontParam` from
   *  `classFontSize`/`classAttributeFontSize` above (N32's header-vs-
   *  attribute split), disambiguated from `circledCharacterFontSize`
   *  (G2 N38, which drives ONLY the badge) by `datugo-88-sote552`'s own
   *  byte-exact formula match. `classStereotypeFontStyle`'s parsing
   *  mirrors `classFontStyle`'s substring rule EXACTLY, but the
   *  UNSET-vs-SET distinction matters more here: `FontParam
   *  .CLASS_STEREOTYPE`'s own default face is italic (unlike
   *  class/classAttribute's plain default), so `classStereotypeFontBold`/
   *  `Italic` unset means "italic, not bold" (the upstream default),
   *  NOT "neither" -- jar-verified `teluve-08-moco846` (FontSize+FontName
   *  only, no FontStyle: renders `font-style="italic"`) vs `datugo-88-
   *  sote552` (FontStyle bold: renders `font-weight="700"`, NO
   *  `font-style` attribute at all -- an explicit override REPLACES the
   *  default face, it does not add to it). See `class-stereotype.ts
   *  #CLASS_STEREOTYPE_FONT_SIZE`'s own doc comment for the consuming
   *  side (`measureStereoLabelWidths`/`stereoBlockDim`/`buildStereoRows`/
   *  `measureGenericTagDim`/`buildGenericTagGeo`). */
  classStereotypeFontSize?: number;
  classStereotypeFontFamily?: string;
  classStereotypeFontBold?: boolean;
  classStereotypeFontItalic?: boolean;
  /** G2 N36: the "classDiagram class-selector cascade reaching
   *  classifier boxes" mechanism -- `<style> classDiagram { BackGround
   *  Color }`/`root {}`/nested `classDiagram { class { ... } } }` all
   *  cascade DOWN to a classifier box's own BackGroundColor/LineColor/
   *  FontColor (upstream `EntityImageClass.getStyleSignature() =
   *  {root,element,classDiagram,class_}`, a pure SName-subset test --
   *  see `style-map-element.ts#resolveStyleCascade`'s own doc comment).
   *  Pre-resolved to an SVG-ready hex string at Theme-build time
   *  (`style-map-theme.ts#applyStyleMap`), matching the existing
   *  inline-`#color`-override precedent -- unlike the PRE-EXISTING,
   *  narrower `classBackground` above (bare `class {}` selector only,
   *  RAW/unresolved), `classCascadeBackground` additionally covers the
   *  `classDiagram`/`root` ancestor layer and nested `classDiagram
   *  .class {}`, and always wins when set (a strict superset of what
   *  `classBackground` could ever populate from the SAME StyleMap).
   *  `classCascadeFontColor` is the member-row/box-level FontColor
   *  cascade; `classCascadeHeaderFontColor` additionally allows a MORE
   *  specific nested `... { header { FontColor } } }` override to win
   *  for the header row alone (`class-badge.ts`/`renderer-classifier-
   *  box.ts#renderRowText`'s own doc comment, jar-verified `bikuka-40-
   *  pezi068`/`cilaba-36-zogi212`/`momaku-69-duxe918`). */
  classCascadeBackground?: string;
  classCascadeBorder?: string;
  classCascadeFontColor?: string;
  classCascadeHeaderFontColor?: string;
  /** G2 N65 item 35: `<style> class { MaximumWidth N } }`'s word-wrap
   *  cascade -- `Style#wrapWidth` (`Style.java:292-295`, `PName
   *  .MaximumWidth`) resolved against the SAME two style signatures the
   *  FontColor pair above already models: `classCascadeMaximumWidth`
   *  is `EntityImageClass.getStyleSignature()` (`{root,element,
   *  classDiagram,class_}`, `CLASS_SNAMES`) -- feeds a member/field ROW's
   *  own word-wrap (`MethodsOrFieldsArea#createTextBlock`,
   *  java:255-256/264-265). `classCascadeHeaderMaximumWidth` is
   *  `EntityImageClassHeader.getStyleSignature()` (adds `header`,
   *  `HEADER_SNAMES`) -- feeds the classifier NAME's own word-wrap
   *  (`EntityImageClassHeader.java:108`). A bare `class { MaximumWidth
   *  N }` selector (this mission's own 2 named reach fixtures,
   *  `nufini-44-jofo787`/`nucite-98-kuga991`) sets BOTH fields to the
   *  SAME value (`HEADER_SNAMES` is a strict superset of
   *  `CLASS_SNAMES`, so the identical cascade lookup matches under
   *  either signature) -- a `... { header { MaximumWidth N } } }`
   *  override (unsampled in this mission's corpus) would diverge them,
   *  matching the FontColor pair's own precedent exactly. Absent = 0 =
   *  no wrap (upstream sets no built-in default for `PName
   *  .MaximumWidth` anywhere, `Fission.ts`'s own doc comment). NOT
   *  `.tagname`-cascaded (unlike RoundCorner/FontColor/FontStyle above)
   *  -- zero corpus reach for a stereotype-scoped MaximumWidth override,
   *  scoped out deliberately rather than guessed. */
  classCascadeMaximumWidth?: number;
  classCascadeHeaderMaximumWidth?: number;
  /** A2s A9: `<style> classDiagram { class { header { FontSize N } } }` --
   *  `EntityImageClassHeader.java:80-82` resolves the header style signature
   *  (`HEADER_SNAMES`) and builds the name's FontConfiguration from it
   *  (`:100`); a header-scoped FontSize therefore sizes the classifier NAME
   *  independently of `classFontSize` (momaku-69-duxe918: `o1` header at
   *  20pt, delta = w('o1'@20) - w('o1'@14) = 6.675px jar-exact). Consumed by
   *  `class-layout-helpers.ts#resolveHeaderFont`. */
  classCascadeHeaderFontSize?: number;
}
