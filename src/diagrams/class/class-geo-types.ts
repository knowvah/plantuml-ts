/**
 * Public geometry types for the class-diagram layout engine. Split out of
 * ./layout.ts (which re-exports them, preserving the public import path used
 * by ./renderer.ts, ./class-geo-builders.ts, and other callers) to keep
 * layout.ts under the project's 500-line file-size cap — mirrors the
 * existing `state/state-geo-types.ts` split precedent exactly (pure move,
 * no behavior change).
 */
import type { ClassifierKind, LinkDecor, UrlInfo, Visibility } from './ast.js';
import type { NoteGeo } from './note-layout.js';
import type { GenericTagGeo } from './class-stereotype.js';
import type { EmptyPackageLeafDim } from './class-namespace-shape.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';

export interface ClassifierGeo {
  id: string;
  kind: ClassifierKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** y-offsets of section dividers within the box (relative to box top) */
  dividerYs: number[];
  /** Text rows to render: [header display, ...member strings] with y offset. */
  rows: Array<{
    text: string;
    y: number;
    indent: number;
    italic?: boolean; // abstract/interface header names — rendered in italic
    /** G2 N32: header-only, `skinparam classFontStyle bold` --
     *  `theme.ts#classFontBold`'s doc comment. Absent for every classifier
     *  with no such override (zero behavior change). */
    bold?: boolean;
    visibilityIcon?: Visibility; // colored icon left of member text
    /** G2 N6: true when this member is a FIELD (not a method) -- gates
     *  the filled-vs-stroke-only fill rule
     *  (`class-visibility-icon.ts#renderVisibilityIcon`'s own doc comment).
     *  Present only alongside `visibilityIcon`. */
    visibilityIsField?: boolean;
    /**
     * G2 N4: the row text's own pre-measured (unmargined) width, from the
     * SAME measurer `layoutClass` used for box sizing -- feeds the rendered
     * `<text textLength="..." lengthAdjust="spacing">` attributes
     * (`renderer.ts#renderRow`), matching jar's `-DPLANTUML_DETERMINISTIC_
     * TEXT=true` output exactly rather than leaving per-character rendering
     * up to the SVG viewer's own font. Optional: rows built by hand in unit
     * tests (bypassing layoutClass) simply omit `textLength` -- the
     * attribute is additive on `core/svg.ts#text()`.
     */
    width?: number;
    /** G2 N16: this row's source member's OWN parsed `[[url]]`/`[[[url]]]`
     *  link suffix -- `Member.ownUrl`'s doc comment (N15 tracked presence
     *  only via a boolean `hasUrl`; N16 carries the full value so the
     *  render-side per-primitive `<a>`-run splitting can compare DIFFERENT
     *  member rows' urls for value equality, not just presence). Read by
     *  `renderer.ts`'s classifier-level url-wrap decision
     *  (`renderer-url.ts`). */
    url?: UrlInfo;
    /**
     * G2 N22: this row's text run through the shared creole atom engine
     * (`class-member-creole.ts#buildMemberRow`) -- present on EVERY member
     * row `layoutClass` builds (a hand-built test geometry that bypasses
     * `measureGenericClassifier` may omit it, same optionality precedent as
     * `width`). ABSENT on the header row (upstream's `EntityImageClassHeader`
     * name text is a separate, non-creole mechanism -- `italic` above is its
     * own, narrower styling hook). `renderer-classifier-box.ts#renderRowText`
     * draws one `<text>`/`<image>` per atom, left-to-right, x-advancing by
     * each atom's own measured width -- mirrors `EntityImageDescriptionSupport
     * .ts#drawAtoms`'s identical reconstruction for description.
     */
    atoms?: readonly MemberRenderAtom[];
    /**
     * G2 N23: the header row's own kind-badge `<ellipse>` cx position,
     * relative to `geo.x` -- `HeaderLayout#drawU`'s `xCircle = h1` term
     * (`h1`/`h2` derived in `class-layout-helpers.ts#buildHeaderRow`'s doc
     * comment), PLUS the badge's own internal left-margin+radius inset
     * (`BADGE_LEFT_MARGIN + BADGE_RADIUS`). Present ONLY on the header row
     * (rows[0]); `renderer-classifier-box.ts#renderBadge` reads it directly
     * instead of back-solving from the header TEXT row's `indent` (which,
     * post-N23, no longer shares the same offset -- `h1 !== h1 + h2` once
     * `h2 > 0`, the wider-box-centering case). Optional: hand-built test
     * geometries that bypass `measureGenericClassifier` omit it, falling
     * back to `renderBadge`'s own pre-N23 constant.
     */
    badgeIndent?: number;
    /**
     * G2 N23: `skinparam class { AttributeFontSize/AttributeFontName }`
     * (`FontParam.CLASS_ATTRIBUTE`) override -- present ONLY on the header
     * row (rows[0]) when the classifier's `measureGenericClassifier` box
     * uses a non-default font (jar-verified `jisanu-32-gado231`: overrides
     * the header text's OWN `<text>` attrs too, not just member rows -- see
     * `class-layout-helpers.ts`'s `buildHeaderRow` doc comment). Member rows
     * carry their own per-atom font via `atoms` instead
     * (`class-member-creole.ts#buildMemberRow` already receives the SAME
     * overridden fontSpec). Absent (falls back to `theme.fontFamily`/
     * `theme.fontSize`) for every classifier with no override -- zero
     * behavior change for the common case.
     */
    fontFamily?: string;
    fontSize?: number;
    /**
     * G3/O4: `skinparam style strictuml` -- `EntityImageObject#getUnderlinedName`
     * (`Display#underlinedName`, jar's own UML-instance-notation convention:
     * an object's name is ALWAYS underlined, and a `name : type` header
     * splits into an underlined name segment + a plain `: type` segment,
     * `jotaga-99-fatu830`'s own citation). OBJECT-kind header rows only --
     * `EntityImageMap`/`Json`/`ClassHeader` never call `underlinedName()`
     * (jar-verified absent from all three). Absent = no underline (the
     * common case, `theme.strictUml` unset).
     */
    underline?: boolean;
  }>;
  hideCircle?: boolean; // suppress the circle badge (hide circle directive)
  /**
   * G2 N7: true when `hide <entity|$tag|<<stereotype>>|*|@unlinked>`
   * (`class-directives.ts#computeHiddenIds`) matched this classifier — the
   * renderer skips ALL drawn content for it, but layout/uid numbering runs
   * exactly as if it were visible (matches jar: the entity keeps its svek
   * node/creationIndex slot, only its `<g class="entity">` disappears).
   */
  hidden?: boolean;
  usymbol?: string; // for kind 'descriptive': the keyword whose USymbol icon renders
  /**
   * G2 N2 (mechanism 3): parse-time creation order, copied unchanged from
   * `Classifier.creationIndex` (`ast.ts`'s doc comment) — feeds
   * `renderer-uid.ts#buildClassUidPlan`'s exact/fallback gate.
   */
  creationIndex?: number;
  /**
   * G2 N15 (README item #7): copied unchanged from `Classifier.url`
   * (`ast.ts`'s doc comment) — feeds `renderer.ts`'s `<a>`-wrap emission.
   */
  url?: UrlInfo;
  /** G2 N19: copied unchanged from `Classifier.syntheticIdName` (`ast.ts`'s
   *  doc comment) — feeds `renderer.ts#linkIdForSvg`'s couple/lollipop
   *  synthetic-name resolution. */
  syntheticIdName?: string;
  /** G2 N19: copied unchanged from `Classifier.phantomSlot` (`ast.ts`'s doc
   *  comment) — feeds `renderer-uid.ts#buildClassUidPlan`'s phantom-rank
   *  bookkeeping. */
  phantomSlot?: true;
  /** G2 N19: copied unchanged from `Classifier.noUidSlot` (`ast.ts`'s doc
   *  comment) — feeds `renderer-uid.ts#buildClassUidPlan`'s
   *  never-write-a-classifierUid rule for `kind: 'assoc-circle'`. */
  noUidSlot?: true;
  /** G2 N19: copied unchanged from `Classifier.subsumedLinkCreationIndex`
   *  (`ast.ts`'s doc comment) — feeds `renderer-uid.ts#buildClassUidPlan`'s
   *  subsumed-explicit-association phantom-rank bookkeeping. */
  subsumedLinkCreationIndex?: number;
  /** G2 N20: copied unchanged from `Classifier
   *  .invertedClassEdgeOldCreationIndex` (`ast.ts`'s doc comment) — feeds
   *  `renderer-uid.ts#buildClassUidPlan`'s repeat-coupling phantom-rank
   *  bookkeeping. */
  invertedClassEdgeOldCreationIndex?: number;
  /** G2 N20: copied unchanged from `Classifier
   *  .repeatCoupleInvisLinkCreationIndex` (`ast.ts`'s doc comment) — feeds
   *  `renderer-uid.ts#buildClassUidPlan`'s repeat-coupling phantom-rank
   *  bookkeeping. */
  repeatCoupleInvisLinkCreationIndex?: number;
  /** G2 N24: copied unchanged from `MeasuredClassifier.headerRowCount`
   *  (`class-layout-helpers.ts`'s doc comment) — feeds
   *  `renderer-classifier-box.ts#buildHeaderPrimitive`/`#buildBodyPrimitives`'s
   *  header-vs-body row split. */
  headerRowCount?: number;
  /** G2 N64 item 45: copied unchanged from `MeasuredClassifier.nameRowCount`
   *  (`class-layout-helpers.ts`'s doc comment) — feeds
   *  `renderer-classifier-box.ts#buildHeaderPrimitive`'s stereo-vs-name-line
   *  font-color-cascade split. */
  nameRowCount?: number;
  /** G2 N26: copied unchanged from `MeasuredClassifier.badgeChar`/
   *  `.badgeColor` (`class-layout-helpers.ts`'s doc comment) — feeds
   *  `renderer-classifier-box.ts#renderBadge`'s `resolveBadgeLetter`/
   *  `resolveBadgeFill` calls. */
  badgeChar?: string;
  badgeColor?: string;
  /** G2 N31: copied unchanged from `Classifier.color` (`ast.ts`'s doc
   *  comment) -- feeds `renderer-classifier-box.ts#classifierFill`'s
   *  inline `class Foo #color { ... }` background override. */
  color?: string;
  /** G2 N32: copied unchanged from `MeasuredClassifier.genericTag`
   *  (`class-layout-helpers.ts`'s doc comment) -- feeds `renderer-
   *  classifier-box.ts#renderGenericTag`. Omitted for every classifier with
   *  no `typeParams`. */
  genericTag?: GenericTagGeo;
  /** G2 N33: copied unchanged from `MeasuredClassifier.folderTab`
   *  (`class-layout-helpers.ts`'s doc comment) -- feeds `renderer.ts`'s
   *  unwrapped folder-icon render dispatch for a collapsed-empty
   *  `package`/`namespace` leaf. */
  folderTab?: EmptyPackageLeafDim;
  /** G2 N42: copied unchanged from `MeasuredClassifier.enhancedBody`
   *  (`class-layout-helpers.ts`'s doc comment) -- feeds `renderer-
   *  classifier-box.ts#buildBodyPrimitives`'s enhanced-body dispatch
   *  (`renderer-body-enhanced.ts#renderEnhancedBody`). Omitted for every
   *  classifier whose body does not trigger `class-body-enhanced.ts
   *  #isEnhancedBody`. */
  enhancedBody?: EnhancedBodyGeo;
  /** M3(c): copied unchanged from `MeasuredClassifier.jsonBody`
   *  (`class-layout-helpers.ts`'s doc comment) -- present only on a
   *  `kind:'json'` leaf, and the thing `renderer-classifier-box.ts
   *  #buildBodyPrimitives` draws INSTEAD OF the `dividerYs`/`rows` Y-sort
   *  merge for one. */
  jsonBody?: readonly JsonBodyItem[];
  /** G2 N37: EVERY stereotype label (2-or-3-bracket, `class-stereotype.ts
   *  #resolveStyleStereotypeTags`) this classifier carries -- feeds
   *  `renderer-classifier-box.ts`'s `.tagname` `<style>` cascade lookup
   *  (`theme.colors.graph.classTagCascade`). Deliberately NOT the same list
   *  as the rendered stereotype row(s) (`rows[]`, visible-only) -- see
   *  `class-stereotype.ts#splitStereotypeTokens`'s own doc comment. Omitted
   *  for every classifier with no stereotype at all. */
  stereotypeLabels?: readonly string[];
  /** G2 N39: copied unchanged from `Classifier.styleGeneration` (`ast.ts`'s
   *  doc comment) -- feeds `style-cascade-class.ts#resolveClassTagCascadeEntry`'s
   *  position-scoped `.tagname` cascade lookup alongside {@link
   *  stereotypeLabels}. Omitted for every classifier the parser did not
   *  stamp (0-or-1-`<style>`-block sources, hand-built fixtures). */
  styleGeneration?: number;
  /**
   * mission skin-file-loading (D3's rendering half, CLASS-scoped): the
   * resolved `theme.shadowing` value (`skin <name>`/`<style> element {
   * Shadowing N } }`) -- upstream `EntityImageClass`/`EntityImageObject`/
   * `EntityImageMap`/`Json`'s shared `getStyle().getShadowing()` read
   * (`rect.setDeltaShadow(shadow)` on the outer bordered rect), matching
   * `state/state-geo-types.ts#StateNodeGeo.shadowing`'s identical role for
   * the state engine. Populated ONLY for classifiers that reach `renderer
   * -classifier-box.ts#renderClassifierBox`'s bordered-rect path (`renderer
   * .ts#renderClassifier`'s dispatch: NOT `assoc-circle`/`folderTab`-leaf/
   * `lollipop`, NOT a `tryRenderUSymbol`-rendered icon kind) -- those other
   * shapes draw via a DIFFERENT jar image class (`EntityImageDescription`/
   * a bare circle/folder-tab icon) with no `setDeltaShadow` call this port
   * has jar-verified, so leaving the field unset there avoids reserving
   * ink for a shadow that is never drawn. Absent or `0` behave identically
   * (no shadow) -- absent for every pre-mission fixture (`theme.shadowing`
   * is always `undefined` before `skin <name>`/`<style> Shadowing`).
   */
  shadowing?: number;
}

export interface EdgeGeo {
  id: string;
  points: Array<{ x: number; y: number }>;
  /** G2 N62: `x`/`y` is the left/baseline anchor jar's own `<text>` emits
   *  (`class-geo-builders.ts#attachEdgeLabel`'s `portLabelAnchor` reuse --
   *  same conversion `tailLabel`/`headLabel` already apply), `width` the
   *  `textLength` value. Positioned from @knowvah/dot-engine's own native edge
   *  `label=` placement (`core/graph-layout.ts#toEdgeEntry`'s `ge.label`,
   *  already computed by `getLayout()` -- no SVG-scan extraction needed,
   *  unlike `tailLabel`/`headLabel`'s xlabel mechanism), NOT a hand-rolled
   *  geometric-midpoint guess (the pre-N62 formula, never jar-verified --
   *  see `ledger.md` N62). Still subject to the SAME @knowvah/dot-engine-vs-real-
   *  graphviz label-placement residual N25 already named (gvts-genuine,
   *  out of scope) -- this field is structurally correct (real engine
   *  placement, real jar text-styling formula) but not guaranteed
   *  byte-exact for that reason. */
  label?: { text: string; x: number; y: number; width: number };
  /** G2 item 43: present INSTEAD OF {@link label} when the relationship's
   *  text carried a `\n`/`\l`/`\r` line-break escape sequence
   *  (`class-layout-helpers.ts#splitEdgeLabelLines`) -- one entry per line,
   *  in top-to-bottom order, each already positioned/aligned by
   *  `class-geo-builders.ts#multiLineLabelAnchor`'s doc comment. Mutually
   *  exclusive with `label` (`attachEdgeLabel` sets exactly one of the two
   *  for a labeled edge). */
  labelLines?: Array<{ text: string; x: number; y: number; width: number }>;
  /** G2 item 44: the magic-arrow glyph (`class-magic-arrow.ts`) -- a small
   *  filled triangle drawn ALONGSIDE `label` (present together when the
   *  arrow token carried remaining text, e.g. `"foo >"`) or ALONE (a bare
   *  `"<"`/`">"` label, `label` stays `undefined`). Exactly 3 points, in
   *  jar's own tip-then-two-back-corners order
   *  (`class-magic-arrow.ts#magicArrowGlyphPoints`'s doc comment). */
  arrowGlyph?: { points: Array<{ x: number; y: number }> };
  /** G2/N25: `Relationship.fromMultiplicity`/`.toMultiplicity` (or the
   *  `fromRole`/`toRole` fallback -- SvekEdge.java:447-466), positioned by
   *  @knowvah/dot-engine's own external-label placement (`core/graph-layout.ts
   *  #extractPortLabelPositions`) -- the SAME `xladjust` search real
   *  graphviz runs, since upstream never sets `labelangle`/`labeldistance`
   *  on a class-diagram edge (dead `LinkArg` fields, see `DotInputEdge
   *  .attributes.tailLabel`'s own doc comment). `x`/`y` is the CENTER of
   *  the label box in this geometry's coordinate frame -- `renderer.ts`
   *  converts to the left/baseline anchor jar's own `<text>` emits. */
  tailLabel?: { text: string; x: number; y: number; width: number };
  headLabel?: { text: string; x: number; y: number; width: number };
  /** Arrow decoration at the target end (from the arrow's target-side head). */
  targetDecor: LinkDecor;
  /** Arrow decoration at the source end (from the arrow's source-side head). */
  sourceDecor: LinkDecor;
  dashed: boolean;
  /** G2 N2 (mechanism 3): copied from `Relationship.creationIndex`. */
  creationIndex?: number;
  /** G2 N2 (mechanism 3): the relationship's raw AST endpoints, for the
   *  `<g class="link" data-entity-1="..." data-entity-2="...">` wrapper
   *  and `<!--link X to Y-->` comment — `renderer-uid.ts` resolves these
   *  through the classifier/namespace uid maps. */
  from: string;
  to: string;
  /** G2 N9: copied from `Relationship.idEntity1`/`.idEntity2`/
   *  `.idEntity1Decor`/`.idEntity2Decor`/`.sourceLine` -- the `<path
   *  id="..." codeLine="...">` attributes (`renderer.ts#linkIdForSvg`).
   *  See `ast.ts#Relationship.idEntity1`'s doc comment. */
  idEntity1?: string;
  idEntity2?: string;
  idEntity1Decor?: LinkDecor;
  idEntity2Decor?: LinkDecor;
  sourceLine?: number;
  /**
   * G2/N16 Kind B: true when this edge's OWN connector was consumed by a
   * freestanding note's Opale zigzag notch (`note-freestanding.ts`) --
   * jar draws NO separate `<g class="link">` for it at all
   * (`SvekEdge#drawU`'s `if (opale) return;`), but the edge is kept in
   * `ClassGeometry.edges` (not filtered out) so `renderer-uid.ts`'s
   * dense-renumbering merge still counts its `creationIndex` slot -- jar's
   * real counter increments for EVERY parsed relationship regardless of
   * whether it ends up drawn, the same "consumed slot must still occupy a
   * rank" principle N15's own `phantomSlot` already established for notes.
   * Consulted by `renderer.ts`'s edge-render loop and
   * `layout-ink-extent.ts#buildInkBox` to skip drawing/ink-counting it.
   */
  consumedByOpaleNote?: true;
  /** G2 N19: copied unchanged from `Relationship.phantomSlot` (`ast.ts`'s
   *  doc comment) — feeds `renderer-uid.ts#buildClassUidPlan`'s
   *  synthetic-default-link phantom-rank bookkeeping. */
  phantomSlot?: true;
  /**
   * G2 N26: computed once (`class-geo-builders.ts#buildEdgeGeos`) via the
   * shared `core/svek/svek-edge-stroke.ts#strokeForStyle` formula from
   * `Relationship.lineStyleOverride`/`.thicknessOverride` — present ONLY
   * when the relationship carried a bracket-modifier override; absent
   * edges keep the pre-existing `dashed`-boolean-driven default below
   * (`renderer.ts#renderEdge`'s own fallback), zero behavior change for
   * the ~700 fixtures with no `-[...]->` bracket.
   */
  strokeWidth?: number;
  /** Paired with `strokeWidth` above — `UStroke#getDasharraySvg()`'s
   *  `[dashVisible, dashSpace]` tuple, `undefined` for a solid override. */
  strokeDasharray?: readonly [number, number];
  /** G2 N26: copied unchanged from `Relationship.colorOverride` (`ast.ts`'s
   *  doc comment) — raw, `#`-stripped color token, resolved through
   *  `HColorSet.ts#resolveColorToSvgHex` at render time. */
  colorOverride?: string;
}

export interface NamespaceGeo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** G2 N17: the folder-tab's own title-tab width/height, pre-computed at
   *  layout time (`class-namespace-shape.ts#getWTitle`/`getHTitle`) -- the
   *  render phase stays a pure `geometry -> SVG string` function with no
   *  `StringMeasurer` of its own, matching `ClassifierGeo.rows[].text`'s
   *  established "measure once, at layout time" convention. */
  wtitle: number;
  htitle: number;
  /** G2 N17: pre-computed title baseline Y offset (relative to `y`) --
   *  see `class-namespace-shape.ts#getTitleBaselineOffset`'s doc comment. */
  baselineOffset: number;
  /** G2 N2 (mechanism 3): parse-time creation order, copied unchanged from
   *  `Namespace.creationIndex`. */
  creationIndex?: number;
  /** G2 N60 (item 42): which klimt shape `Cluster#drawU` draws this
   *  namespace's outline as -- determines its `LimitFinder` ink rule
   *  (`layout-ink-extent.ts#addNamespaceInk`'s own doc comment carries the
   *  full jar-verified mechanism). `undefined` is the common case (default
   *  FOLDER style, non-`strictuml`): jar draws a rounded-arc `UPath`
   *  (`USymbolFolder#asBig`'s `roundCorner!=0` branch), which gets the
   *  PLAIN ink rule (`addPlainInk`, no correction needed -- this is what
   *  every namespace got before N60). `'polygon'`: FOLDER style WITH
   *  `strictuml` (`roundCorner=0` forces the sharp-corner `UPolygon`
   *  branch, `renderNamespaceFolder`'s own `theme.strictUml === true`
   *  gate) -- needs `LimitFinder#drawUPolygon`'s `HACK_X_FOR_POLYGON=10`
   *  x-padding. `'rect'`: `skinparam packageStyle rect` (`USymbolRectangle`
   *  draws a plain `URectangle`) -- needs the classic `-1` min/max inset,
   *  NOT the polygon hack. Computed once at layout time
   *  (`class-geo-builders.ts#buildNamespaceGeos`) from `theme.packageStyle`/
   *  `theme.strictUml`, mirroring `wtitle`/`htitle`'s own "resolve once,
   *  keep render/ink-extent theme-agnostic" precedent. */
  inkShape?: 'polygon' | 'rect';
}

export interface ClassGeometry {
  totalWidth: number;
  totalHeight: number;
  /**
   * G2 N46: the PRE-`CucaDiagram#getDefaultMargins()`/`SvgGraphics
   * #ensureVisible` ink-walk dims (`layout-ink-extent.ts
   * #computeClassRawInkDims`) -- what jar's `DiagramChromeFactory.create`
   * receives as `raw` and every `DecorateEntityImage#getTextX` centering
   * computation runs against, DISTINCT from `totalWidth`/`totalHeight`
   * (post-margin, post-quirk -- the correct value for a NO-chrome canvas).
   * Optional: `assembleShiftedGeometry`'s main DOT-driven path AND
   * `class-geo-builders.ts#degenerateSingleClassifier` (G2 N48, item 24's
   * first of 3 named sub-cases) both set it. The empty-diagram sentinel and
   * `layoutMultiPage`'s page-stacking combiner still leave it `undefined`
   * -- `renderer.ts#renderClass` and `index.ts#applyAnnotationChrome`'s
   * class branch fall back to `totalWidth`/`totalHeight` in that case
   * (today's behavior, unchanged; named remainder, not chased this
   * iteration -- see `plans/g2-class-svg/ledger.md` N48).
   */
  rawWidth?: number;
  rawHeight?: number;
  classifiers: ClassifierGeo[];
  edges: EdgeGeo[];
  namespaces: NamespaceGeo[];
  notes: NoteGeo[];
  /**
   * SI14 T3: the SAME `StringMeasurer` instance `SyncPlugin.layoutSync`
   * received, carried onto the geometry for the same reason `errors` above
   * `index.ts#classPlugin.layoutSync` is: `SyncPlugin.render(geo, theme)`
   * (`dispatcher.ts`) only receives the geo, not the measurer, so a
   * draw-time consumer that needs to measure text (T4: USymbol label
   * placement via the faithful `TextBlock` tree, mirroring the description
   * engine's `EntityImageDescriptionSupport.ts#buildTextBlock` precedent)
   * has nowhere else to get one. Set unconditionally by `index.ts`'s
   * `layoutSync` on every real `parseClass()`-driven diagram; optional only
   * so pre-existing hand-built `ClassGeometry` test fixtures that bypass
   * `layoutClass`/`layoutSync` entirely (unit tests constructing a geo
   * literal directly) compile unchanged.
   */
  measurer?: StringMeasurer;
  /**
   * SI14 T3: this diagram's `sprite $name { ... }` definitions, copied
   * unchanged from `ClassDiagramAST.sprites` (`ast.ts`'s doc comment) by
   * the same `layoutSync` spread as {@link measurer} above -- mirrors the
   * description engine's identical `ast.sprites` -> geo `sprites`
   * passthrough (`description/layout.ts:487`). Omitted (not merely
   * `undefined`) when the diagram declares no sprites, matching every
   * other optional field in this file.
   */
  sprites?: SpriteRegistry;
}

/**
 * One drawing operation of a `json` leaf's entries area, in
 * `TextBlockCucaJSon#drawU`'s OWN order (see
 * `class-json-sizing.ts#buildJsonItems`). Every coordinate is
 * box-relative, the same frame `rows[].y`/`indent` and `dividerYs` use.
 *
 * A separate, ordered list rather than more `dividerYs` entries because
 * upstream's order is a pre-order traversal, not a Y-order: a nested
 * table's `vline` is drawn between its parent's key text and its own first
 * `hline`, and both share the parent row's Y. Same "this body owns its own
 * draw order" dispatch `enhancedBody` established.
 *
 * @see ~/git/plantuml/.../cucadiagram/TextBlockCucaJSon.java:162-180 (object),
 *      :213-224 (array)
 */
export type JsonBodyItem =
  /** `ULine.hline(jsonTotalWidth)` — scoped to the emitting table's OWN
   *  width, which is the parent's minus the parent's key column. */
  | { readonly kind: 'hline'; readonly x: number; readonly y: number; readonly width: number }
  /** `ULine.vline(height)` at `dx = width1` — ONE per OBJECT table (never
   *  per row, unlike `TextBlockMap`; never at all for an array). */
  | { readonly kind: 'vline'; readonly x: number; readonly y: number; readonly height: number }
  /** A key or scalar-value cell. `row` is the SAME object that appears in
   *  `ClassifierGeo.rows`, not a copy. */
  | { readonly kind: 'text'; readonly row: ClassifierGeo['rows'][number] };
