/**
 * theme-graph-colors-b.ts — second half of `ThemeGraphColors` (split
 * further out of ./theme-graph-colors.ts to keep every file under the
 * project's 500-line cap; combined back via intersection in that
 * module). Pure type-only move, no behavior change.
 */

export interface ThemeGraphColorsB {
  /** G2 N66: `EntityImageNote`'s OWN `Style#wrapWidth` cascade -- a
   *  class-diagram NOTE's body text has a SEPARATE style signature from
   *  a classifier's (`EntityImageNote.getStyleSignature()`, `{root,
   *  element,classDiagram,note}` -- `NOTE_SNAMES` in `style-cascade-
   *  class.ts`, identical to `CLASS_SNAMES` except its trailing token is
   *  `note` not `class_`), so a bare `class { MaximumWidth N } }`
   *  selector does NOT reach a note (`class_` != `note`), but the SHARED
   *  ancestor tokens (`element`/`classDiagram`/`root`) do -- jar-verified
   *  `rubecu-40-cixu870` (`element { MaximumWidth 100 } }` wraps BOTH the
   *  classifier box, via `classCascadeMaximumWidth`, AND the note body,
   *  via this field) and `nufini-44-jofo787` (an EXPLICIT `note {
   *  MaximumWidth 100 } }` block, distinct from its own sibling `class {
   *  MaximumWidth 150 } }` block -- the two fields diverge). Consumed by
   *  `note-layout.ts#measureNote`. Absent = 0 = no wrap, matching
   *  `classCascadeMaximumWidth`'s own "no built-in default" contract. NOT
   *  `.tagname`-cascaded (zero corpus reach for a stereotype-scoped
   *  note MaximumWidth, matching the class-side field's own scoping). */
  noteCascadeMaximumWidth?: number;
  /** G2 N67 item 49: `EntityImageNote`'s OWN FontColor cascade -- the
   *  SAME `NOTE_SNAMES` style signature (`{root,element,classDiagram,
   *  note}`) `noteCascadeMaximumWidth` above already established for
   *  `MaximumWidth`, wired here for `FontColor` -- mirrors
   *  `classCascadeFontColor`'s exact mechanism (`cascadeFontColorHex`,
   *  including the `#?light:dark[:transparent]` conditional path,
   *  `style-cascade-class.ts`) applied to the note signature instead of
   *  `CLASS_SNAMES`. Unlike `classCascadeFontColor`/
   *  `classCascadeHeaderFontColor`, there is no header-split sibling --
   *  a note body has no separate "header" sub-selector upstream
   *  (`EntityImageNote` never nests a `header {}` selector the way
   *  `EntityImageClassHeader` does). Consumed by `renderer-note.ts
   *  #renderNoteLineAtoms`/`renderNoteText` as the fallback tier BELOW
   *  an atom's own explicit `<color>` creole run (unchanged precedence)
   *  and ABOVE the hardcoded `'#000000'` default that function's own
   *  pre-N67 doc comment documented as having "no per-tag/theme cascade
   *  fallback tier" -- jar-verified `nufini-44-jofo787` (`<style> note {
   *  Fontcolor red } }`, distinct from its own sibling `class { Fontcolor
   *  green } }` block -- the two fields diverge exactly like the
   *  MaximumWidth pair). Absent = no override = the hardcoded black
   *  default, matching every other cascade field's "no built-in
   *  default" contract. NOT `.tagname`-cascaded (zero corpus reach for a
   *  stereotype-scoped note FontColor, matching `noteCascadeMaximumWidth`'s
   *  own scoping). */
  noteCascadeFontColor?: string;
  /** G2 N36: `<style> classDiagram { LineColor }`/`root { LineColor
   *  }`/nested `classDiagram { arrow { LineColor } } }` -- the SAME
   *  ancestor cascade applied to an EDGE's own style signature
   *  (`SvekEdge.java:819`: `{root,element,classDiagram,arrow}`,
   *  jar-verified `bikuka-40-pezi068`/`rakici-44-tivo701`). Read by
   *  `renderer.ts#renderEdge` as the default stroke color, below the
   *  per-edge `-[#color]->` bracket override (`geo.colorOverride`,
   *  N26) and above `theme.colors.arrow` (the cross-diagram-type
   *  global default -- never overwritten directly, to avoid bleeding a
   *  class-only cascade into description/other diagram types that
   *  share this Theme shape). */
  classCascadeArrowColor?: string;
  /** G2 N36: the badge/spot `<style>` cascade's ONLY possible ancestor
   *  layer -- `EntityImageClassHeader.java#spotStyleSignature` is
   *  `{root,element,spot,spot<Kind>}`, which has NO `classDiagram`
   *  token, so (unlike the box/text/edge fields above) a bare
   *  `classDiagram {}`/nested `classDiagram.class {}` selector can
   *  NEVER reach the badge -- only a bare `root {}` selector can
   *  (jar-verified `bikuka-40-pezi068`: badge ellipse/glyph pick up
   *  `root`'s BackGroundColor/FontColor while the SAME fixture's
   *  `classDiagram { BackGroundColor Green }` correctly does NOT tint
   *  the badge). Sits BELOW the existing `spot<Kind>` bucket
   *  (`theme.colors.elements['spotclass'/...]`, G2 N32) and ABOVE the
   *  hardcoded kind default in `class-badge.ts#resolveBadgeFill`/
   *  `resolveBadgeBorder`/`resolveBadgeGlyphColor`. */
  spotCascadeBackground?: string;
  spotCascadeBorder?: string;
  spotCascadeFont?: string;
  /** G2 N37: the `.tagname` stereotype-name style-cascade sub-selector
   *  (`classDiagram { RoundCorner 15 }` -- the ANCESTOR-only, non-tag
   *  half; a classifier box's own corner radius has NO prior mechanism
   *  at all -- `renderer-classifier-box.ts#buildHeaderPrimitive`
   *  hardcoded `rx: 2.5, ry: 2.5` (jar's default) unconditionally.
   *  `EntityImageClass.getStyleSignature()` (`{root,element,
   *  classDiagram,class_}`) carries `RoundCorner` the SAME way it
   *  carries BackGroundColor/LineColor -- `resolveStyleCascade`'s
   *  general subset-match resolver already covers this, this field
   *  just stores the RAW (unhalved) style value; `rx`/`ry` = value/2
   *  (`URectangle.ts#build().rounded()`'s existing halving convention,
   *  jar-verified `dozude-05-jeve029`: `RoundCorner 15` -> `rx="7.5"`).
   *  Absent = the pre-existing hardcoded 2.5 default (zero behavior
   *  change for every classifier with no `<style>` RoundCorner).
   *  G2 N65 item 47: ALSO populated by a bare `skinparam RoundCorner N`
   *  (`resolveSkinparam`, no `<style>` block at all) -- jar's own
   *  `FromSkinparamToStyle.java:164` (`addConvert("roundCorner",
   *  PName.RoundCorner, SName.root)`) converts that skinparam into a
   *  style declaration at `SName.root` scope, i.e. a bare skinparam and
   *  `<style> root { RoundCorner N }` are the SAME upstream mechanism,
   *  not two competing ones -- reusing this one field (rather than a
   *  second, parallel field) mirrors that identity directly. Precedence
   *  follows source-pipeline order (`index.ts`: `resolveSkinparam` runs
   *  before `applyStyleMap`): a real `<style>` block's own
   *  CLASS_SNAMES-cascade value (`style-cascade-class.ts
   *  #computeClassStyleCascadeOverrides`) overwrites the
   *  skinparam-sourced baseline when BOTH are present (`Object.assign`
   *  only clobbers the key when the style-block computation actually
   *  returns a defined value) -- jar-verified against `dofima-22-
   *  kofe334` (`skinparam RoundCorner 20`, no competing `<style>`
   *  block): `rect/@rx`/`@ry` 10 (was 2.5). */
  classCascadeRoundCorner?: number;
  /** G2 N37: the `.tagname` stereotype-name style-cascade sub-selector
   *  itself (`classDiagram { .mystyle { BackgroundColor cyan; RoundCorner
   *  5; FontStyle Bold; FontColor red } } }` / a top-level bare `.tag {
   *  ... }`) -- `StyleSignatureBasic#matchAllImpl`'s SECOND subset test
   *  (`element.stereotypes.containsAll(declaration.stereotypes)`,
   *  `style-map-element.ts#resolveStyleCascade`'s own doc comment for
   *  the full two-dimensional-match derivation). Keyed by the CLEANED
   *  tag name (`cleanStereotypeToken` -- lowercase, `_`/`.` stripped,
   *  mirrors upstream `StyleSignatureBasic#clean`) so a classifier's own
   *  `<<mystyle>>`/`<<<mystyle>>>` stereotype label(s) look themselves up
   *  directly. Each entry is the FULLY cascade-resolved value for that
   *  tag (ancestor cascade already folded in when the tag itself sets no
   *  override of its own -- computed by calling the SAME
   *  `resolveStyleCascade` with this one tag in its `stereotypeTags`
   *  query, so ordinary last-registered-wins semantics apply uniformly).
   *  A classifier carrying MULTIPLE simultaneous tags with DIFFERING
   *  overrides picks its FIRST matching label's entry (`renderer-
   *  classifier-box.ts#resolveClassTagCascade`'s own doc comment) -- no
   *  sampled corpus fixture combines multiple simultaneously-tagged,
   *  differently-overridden labels on one classifier, so exact upstream
   *  cross-tag registration-order fidelity is out of this iteration's
   *  scope. */
  classTagCascade?: Readonly<Record<string, {
    background?: string;
    border?: string;
    fontColor?: string;
    roundCorner?: number;
    fontBold?: boolean;
    fontItalic?: boolean;
  }>>;
  /** G2 N39: `classTagCascade`, snapshotted PER `<style>`-block boundary
   *  -- index `g` is the cascade as resolved from only the FIRST `g`
   *  `<style>` blocks in source order (index 0 = no blocks applied yet,
   *  index `preprocessed.styles.length` = the SAME value as
   *  {@link classTagCascade} itself). Upstream captures a classifier's
   *  style resolution AT ITS OWN CREATION TIME (`Entity
   *  #currentStyleBuilder`, `net/atmp/CucaDiagram.java:808-819`) rather
   *  than deferring to a single document-wide final merge -- a SECOND
   *  `<style>` block redefining the SAME selector only affects
   *  classifiers declared AFTER it (jar-verified `fexuta-62-piko653`,
   *  see `preprocessor.ts#PreprocessorResult.stylePositions`'s doc
   *  comment for the full derivation). Populated ONLY when the source
   *  carries MORE THAN ONE `<style>` block (`style-cascade-class.ts
   *  #computeClassTagCascadeGenerations`) -- undefined for every
   *  single-or-no-block fixture (the overwhelming majority), which
   *  falls back to the single {@link classTagCascade} field unchanged
   *  (zero behavior change). Read by `style-cascade-class.ts
   *  #resolveClassTagCascadeEntry` via a classifier's own `Classifier
   *  .styleGeneration` (`ast.ts`'s doc comment). */
  classTagCascadeGenerations?: readonly (Readonly<Record<string, {
    background?: string;
    border?: string;
    fontColor?: string;
    roundCorner?: number;
    fontBold?: boolean;
    fontItalic?: boolean;
  }>> | undefined)[];
  /**
   * B7/M8: per-`.tagname` ARROW style, keyed by cleaned tag token.
   *
   * A link's `<<stereo>>` is a style-class selector upstream: the arrow's
   * base signature `{root, element, classDiagram, arrow}`
   * (`svek/SvekEdge.java:817-822`) is fanned out one-signature-per-label by
   * `StyleSignatureBasic#withTOBECHANGED` (`:119-132`), so `<style> .foo {}`
   * matches the stereotype half of the two-subset test. `SvekEdge.java
   * :874-876` then reads BOTH properties off that ONE merged style —
   * `Rainbow.build(styleLine, …)` for the colour and `styleLine.getStroke()`
   * for the width, the latter resolving to `PName.LineThickness`
   * (`style/Style.java:261-263`) — which is why they are one entry here and
   * not two independent lookups.
   *
   * Precomputed at Theme-build time over `collectStyleTagNames`, the same
   * shape and for the same reason as {@link classTagCascade}: the renderer
   * has no `StyleMap`, only the resolved Theme. Populated only for tags that
   * actually carry an arrow-relevant declaration; absent otherwise, so every
   * diagram with no `<style>` tag selector is unchanged.
   */
  arrowTagCascade?: Readonly<Record<string, {
    color?: string;
    thickness?: number;
  }>>;
  /** G2 N27: `skinparam guillemet <value>` -- `Guillemet.
   *  fromDescription`'s resolved start/end wrapper strings for
   *  stereotype text (`«Foo»` by default). Both unset means the
   *  render-side default (`«`/`»`, upstream's `Guillemet.GUILLEMET`)
   *  applies -- covers every unrecognized/spaceless override value too,
   *  matching `fromDescription`'s own bottom fallback. See
   *  `class-stereotype.ts#wrapGuillemet`/`class-object-map-sizing.ts
   *  #wrapGuillemet`, the two call sites that read this pair.
   *  @see ~/git/plantuml/.../text/Guillemet.java#fromDescription */
  guillemetStart?: string;
  guillemetEnd?: string;
  /** G2 N38: `skinparam circledCharacterFontSize N` -- `FontParam
   *  .CIRCLED_CHARACTER`'s own font-size override (default 17,
   *  `klimt/font/FontParam.java:55`). Drives BOTH the badge glyph's
   *  actual rendered size AND (via `SkinParam#getCircledCharacter
   *  Radius()`, `skin/SkinParam.java:542-545`) the badge ellipse's
   *  radius when no explicit `circledCharacterRadius` override is set
   *  -- see `class-badge.ts#resolveBadgeRadius`'s own doc comment for
   *  the jar-verified formula (`floor(fontSize/3)+6`, 12/12 corpus
   *  samples matched exactly). */
  circledCharacterFontSize?: number;
  /** G2 N38: `skinparam circledCharacterRadius N` -- an explicit
   *  override that WINS over the fontSize-derived formula above
   *  unconditionally (`SkinParam#getCircledCharacterRadius()`'s own
   *  `value == -1 ? ... : value` short-circuit). Jar-verified
   *  `depulu-53-xoca727` (radius 13, fontSize 20 -- the formula alone
   *  would predict 12) and `gateja-70-losi738` (radius 18, fontSize
   *  30 -- formula alone would predict 16). */
  circledCharacterRadius?: number;
  /** G2 N47: `skinparam circledCharacterFontName <family>`/
   *  `circledCharacterFontStyle <Bold|Italic|...>` -- badge glyph
   *  OUTLINE selection only (NOT sizing/radius, both handled above).
   *  A non-default family/style draws a STRUCTURALLY different AWT
   *  glyph outline, not a scaled one (`class-badge-sized-glyphs.ts`'s
   *  own doc comment: `datugo-88-sote552`'s Helvetica 'C' at size 18
   *  has 32 coordinate pairs vs the default Monospaced capture's 34,
   *  x-extent 11.52 vs 8.17). `resolveAnnotationStyles`-style per-
   *  element cascades don't apply here -- this is `FromSkinparamToStyle
   *  .java`'s flat `CIRCLED_CHARACTER` `FontParam`, same axis as
   *  `circledCharacterFontSize` above, not a `<style>`-scoped bucket. */
  circledCharacterFontFamily?: string;
  circledCharacterFontBold?: boolean;
  circledCharacterFontItalic?: boolean;
  /** G2 N40: `skinparam pathHoverColor <color>` -- emits a global
   *  `<defs><style>path:hover { stroke: <color> !important;}</style>
   *  </defs>` CSS rule (`klimt/drawing/svg/SvgGraphics.java`'s own
   *  `getPathHover` -- already ported as shared, unwired machinery in
   *  `core/klimt/drawing/svg/svg-graphics-core.ts#getPathHover`, this
   *  is the class-render-side wiring that actually populates it).
   *  Unset means no `<style>` block is emitted at all (upstream only
   *  writes the rule when the skinparam is set -- `SvgOption
   *  #getHoverPathColor() != null`). Jar-verified `dasagu-52-
   *  vani172`. */
  pathHoverColor?: string;
  /** G2 N66: `skinparam diagramBorderColor <color>` -- jar's
   *  `TextBlockExporter#maybeDrawBorder` (`core/TextBlockExporter.java:
   *  215-232`) draws a whole-canvas `<rect fill="none">` border, one
   *  layer OUTSIDE the diagram's own content -- a universal, diagram-
   *  type-agnostic export-layer mechanism (`ColorParam.diagramBorder`),
   *  not scoped to class specifically, though this mission only found
   *  class-diagram corpus reach (`vinujo-78-kapo329`). Stored RAW (not
   *  pre-resolved to hex) -- mirrors `classBackground`/`noteBackground`'s
   *  own "resolve at the render site" convention, NOT `classCascade
   *  Background`'s N36 eager-hex convention (which only applies to the
   *  `<style>`-cascade machinery). `undefined` means jar draws no
   *  border at all (`stroke = skinParam.getThickness(...) == null &&
   *  color == null` short-circuits `maybeDrawBorder`'s own early
   *  return) -- zero behavior change for every fixture with no such
   *  skinparam. Border THICKNESS/ROUNDCORNER (`LineParam.diagramBorder`/
   *  `CornerParam.diagramBorder`) are NOT modeled -- zero corpus reach
   *  for either, jar's own default (`UStroke.simple()`, thickness 1,
   *  square corners) is what `renderer-shell.ts` hardcodes instead. */
  diagramBorderColor?: string;
  /** G2 N54: `skinparam icon<Kind>Color`/`icon<Kind>BackgroundColor`
   *  (`Kind` in Private/Package/Protected/Public) -- the member-row
   *  visibility icon's own LineColor/BackgroundColor overrides
   *  (`FromSkinparamToStyle.java:232-239`, mapped to the
   *  `element.visibilityIcon.<kind>` StyleSignature `VisibilityModifier
   *  .java` reads). No `IEMandatory` entry exists upstream (the `*`
   *  icon's black fill has no skinparam override path at all -- see
   *  `class-visibility-icon.ts#colorsFor`'s doc comment). Read by
   *  `class-visibility-icon.ts#colorsFor` as the override tier ABOVE
   *  the hardcoded `VISIBILITY_COLORS` defaults, per-visibility-char --
   *  jar-verified `lufide-34-cexu026` (all 8 keys set; only
   *  `iconProtectedBackgroundColor` actually diverges from the
   *  hardcoded default, `#FECF6C` vs `#FFFF44`). */
  iconPrivateColor?: string;
  iconPrivateBackgroundColor?: string;
  iconPackageColor?: string;
  iconPackageBackgroundColor?: string;
  iconProtectedColor?: string;
  iconProtectedBackgroundColor?: string;
  iconPublicColor?: string;
  iconPublicBackgroundColor?: string;
  edgeLabel: string;
  // NOTE: upstream actor head (via Fashion.apply in ActorStickMan.java) inherits
  // the root skin BackgroundColor (#f1f1f1 via --common-background). Current
  // renderer hardcodes fill="none" for the head circle. Divergence preserved
  // intentionally to match existing rendering behavior.
  actorFill: string;
  // NOTE: upstream usecase ellipse (USymbolUsecase.java) inherits root
  // BackgroundColor (#f1f1f1). Current renderer uses theme.colors.background
  // (#FFFFFF in default theme). Divergence preserved intentionally.
  usecaseFill: string;
  // Same divergence note as actorFill; business variant of stickman actor
  // (USymbolActorBusiness.java / ActorStickMan with isBusiness=true).
  businessActorFill: string;
  // Same divergence note as usecaseFill; business variant of usecase ellipse
  // (USymbolUsecase.java with isBusiness=true).
  businessUsecaseFill: string;
  activity?: {
    background?: string;        // ActivityBackgroundColor — action box fill
    border?: string;            // ActivityBorderColor — action box stroke
    barColor?: string;          // ActivityBarColor — fork/join bar fill
    diamondBackground?: string; // ActivityDiamondBackgroundColor
    diamondBorder?: string;     // ActivityDiamondBorderColor
    startColor?: string;        // ActivityStartColor — filled start circle
    endColor?: string;          // ActivityEndColor — end/terminate circle
    swimlaneBorder?: string;    // SwimlaneHeaderBackgroundColor — lane header
  };
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
    highlightClasses?: Record<string, {
      background?: string;
      fontColor?: string;
      fontBold?: boolean;
      fontItalic?: boolean;
    }>;
  };
}
