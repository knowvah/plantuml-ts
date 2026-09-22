/**
 * Public geometry types for the class-diagram layout engine. Split out of
 * ./layout.ts (which re-exports them) to keep layout.ts under the
 * project's 500-line cap — mirrors `state/state-geo-types.ts`'s split.
 */
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing.js';
import type { ClassifierKind, LinkDecor, UrlInfo, Visibility } from './ast.js';
import type { ClassLeafGeo } from './class-leaf-geo.js';
import type { GenericTagGeo } from './class-stereotype.js';
import type { EmptyPackageLeafDim } from './class-namespace-shape.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { MiddleDecor } from './class-arrow-middle-decor.js';
import type { EdgeKalBoxes } from './class-geo-edge-extras.js';

export { isNoteGeo, isClassifierGeo, classifierLeaves, noteLeaves, type ClassLeafGeo } from './class-leaf-geo.js';

import type { JsonBodyItem } from './class-geo-json-types.js';
import type { NamespaceGeo } from './class-geo-namespace-types.js';
import type {
  EdgeConstraintGeo,
  EdgeNoteBoxGeo,
  QuantifierLinesGeo,
  SametailGeo,
  VisibilityIconGeo,
} from './class-geo-edge-extras.js';

// cdd-T6: re-exported so `class-geo-types.ts` stays the one import site for
// class geometry types (see `class-geo-edge-extras.ts`'s own doc comment).
export type {
  EdgeConstraintGeo,
  EdgeNoteBoxGeo,
  EdgeNoteLine,
  QuantifierLineGeo,
  QuantifierLinesGeo,
  SametailGeo,
  VisibilityIconGeo,
} from './class-geo-edge-extras.js';

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
    /** G2 N4: the row text's pre-measured (unmargined) width, from the SAME
     *  measurer `layoutClass` sized the box with -- feeds `<text
     *  textLength="..." lengthAdjust="spacing">` (`renderer.ts#renderRow`),
     *  jar's `-DPLANTUML_DETERMINISTIC_TEXT=true` output. Optional: hand-
     *  built test rows omit it (additive on `core/svg.ts#text()`). */
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
     * row `layoutClass` builds (hand-built test geometries may omit it, as
     * `width`). ABSENT on the header row (upstream's `EntityImageClassHeader`
     * name text is a separate, non-creole mechanism). `renderer-classifier-
     * box.ts#renderRowText` draws one `<text>`/`<image>` per atom, x-
     * advancing by each atom's measured width -- mirrors
     * `EntityImageDescriptionSupport.ts#drawAtoms`.
     */
    atoms?: readonly MemberRenderAtom[];
    /**
     * G2 N23: the header row's kind-badge `<ellipse>` cx, relative to
     * `geo.x` -- `HeaderLayout#drawU`'s `xCircle = h1` term (`h1`/`h2` in
     * `class-layout-helpers.ts#buildHeaderRow`'s doc comment) PLUS
     * `BADGE_LEFT_MARGIN + BADGE_RADIUS`. Header row (rows[0]) only;
     * `renderer-classifier-box.ts#renderBadge` reads it directly rather
     * than back-solving from the header text `indent` (`h1 !== h1 + h2`
     * once `h2 > 0`). Optional: hand-built test geometries omit it and
     * `renderBadge` falls back to its pre-N23 constant.
     */
    badgeIndent?: number;
    /**
     * G2 N23: `skinparam class { AttributeFontSize/AttributeFontName }`
     * (`FontParam.CLASS_ATTRIBUTE`) override -- header row (rows[0]) only,
     * when `measureGenericClassifier` used a non-default font (jar-verified
     * `jisanu-32-gado231`: the header's OWN `<text>` attrs move too --
     * `class-layout-helpers.ts#buildHeaderRow`'s doc comment). Member rows
     * carry theirs per atom (`class-member-creole.ts#buildMemberRow`).
     * Absent = `theme.fontFamily`/`theme.fontSize`.
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
  apointNameCreationIndex?: number; // cdd-T3: copied from `Classifier.apointNameCreationIndex` (`ast.ts` doc).
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
  /**
   * B5/M6: this `object` leaf's field list is EMPTY but still SHOWN, so
   * `EntityImageObject`'s ctor substituted the placeholder body
   * `TextBlockLineBefore(LineThickness, TextBlockEmpty(10, 16))`
   * (`svek/image/EntityImageObject.java:110-113`) for a real
   * `BodyFactory.create1` body. Read ONLY by `class-ink-box.ts
   * #addClassifierInk` -- see `addRectInkEmptyShownBody`'s doc comment for
   * the three-way jar-rendered control set that distinguishes this state
   * from both siblings. Absent for every other classifier, including the
   * `showFields == false` state, which is a DIFFERENT ink rule
   * ({@link addRectInkEmptyBody}) rather than a special case of this one.
   */
  emptyFieldPlaceholder?: true;
  /**
   * B35/M40: the width of this classifier body's own `UEmpty` reservation
   * -- upstream `dimFields.getWidth()`. Read ONLY by `class-ink-box.ts
   * #addRectInk`, whose doc comment carries the full jar-verified
   * mechanism. `undefined` means "this leaf's body reservation has not
   * been measured", and keeps the pre-B35 fixed `x + w` max-X; it is set
   * only on the `object` family, the only place the conditional rule is
   * jar-verified (see `addRectInk` for why `class`/`interface`/`enum`
   * reach `x + w` unconditionally and `map`/`json` are left unmeasured).
   */
  bodyInkWidth?: number;

  /** The DRAWN ink extent of a USymbol leaf's own shapes, relative to this
   *  classifier's own `x`/`y` — measured by a `LimitFinder` walk over the
   *  same `EntityImageDescription` instance that sized the leaf
   *  (`description/leaf-sizing-entity.ts#measureUsecaseOrActorLeafInk`).
   *
   *  Present only for an `actor` leaf. `addClassifierInk` reads it in place
   *  of `addRectInk`'s asymmetric `(x - 1, y - 1)` corner, which is wrong
   *  for a symbol that draws an ellipse+path+label rather than a box: the
   *  actor's drawn head top is `y + 0.5`, so the box rule sat 1.5 high and
   *  shifted every shape in the document by that much
   *  (`.agent-notes/class-ink-shared-offset-groups.md` item (b)). */
  symbolInk?: LeafSymbolInk;
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
   *  `class-edge-label-anchor.ts#multiLineLabelAnchor`. Mutually exclusive
   *  with `label` (`attachEdgeLabel` sets exactly one of the two).
   *  SI25 D1: `glyph` is present iff the label `hasSeveralGuideLines` AND
   *  that line carried a `< `/`> `/` <`/` >` token -- one magic-arrow
   *  triangle per line (`StringWithArrow#addSeveralMagicArrows`,
   *  `descdiagram/command/StringWithArrow.java:115-127`), 3 points in the
   *  same tip-then-two-back-corners order as {@link arrowGlyph}. */
  labelLines?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    glyph?: { points: Array<{ x: number; y: number }> };
  }>;
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
  /** cdd-T6 (A2a/M10): the SAME two quantifiers, `\n`-split into one anchor
   *  per physical line — see {@link QuantifierLinesGeo}. Present whenever
   *  either end carries a placed quantifier; `tailLabel`/`headLabel` stay
   *  set alongside it (the single-line, unsplit form) until T7 switches the
   *  renderer over. */
  quantifierLines?: QuantifierLinesGeo;
  /** cdd-T6 (A2a/M2): the link label's visibility-modifier icon block —
   *  see {@link VisibilityIconGeo} and `class-edge-visibility.ts`. Present
   *  only when the label's first line began with a visibility character
   *  AND `classAttributeIconSize > 0`; the character is then absent from
   *  `label`/`labelLines[0]`, matching `Display.java:415-416`. */
  visibilityIcon?: VisibilityIconGeo;
  /** cdd-T6 (A2a/M5): the `note on link` operand of the merged label block
   *  — see {@link EdgeNoteBoxGeo}. Absent unless the relationship carried
   *  `linkNote` and the layout placed its label box. */
  noteBox?: EdgeNoteBoxGeo;
  /** cdd-T6 (A2a/M9): `constraint on links` — see {@link EdgeConstraintGeo}.
   *  Present on the SECOND link of a constrained pair only. */
  constraint?: EdgeConstraintGeo;
  /** cdd-T15 (A2a/M1, D6): the qualified-association box(es) —
   *  see {@link EdgeKalBoxes}. */
  kalBox?: EdgeKalBoxes;
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
  /** B7/M8: copied unchanged from `Relationship.stereotypeTags` — the link's
   *  own `<<tag>>` style-class label(s). `renderer-edge.ts` looks each up in
   *  `theme.colors.graph.arrowTagCascade`. Absent for every link with no
   *  `<<...>>`. */
  stereotypeTags?: readonly string[];
  /** cdd-T7 (flagged extension, `.agent-notes/cdd-T7.md`): carry-only
   *  copies of `Relationship.url`/`.hidden`/`.middleDecor` -- the ONLY
   *  channel, since `renderClass(geo, theme)` has no AST access. */
  url?: UrlInfo;
  hidden?: true;
  middleDecor?: MiddleDecor;
  sametail?: SametailGeo; // cdd-T16 (M7/E11): see SametailGeo's own doc comment.
  leafContacts?: readonly SametailGeo[]; // cdd-T16b (allButSametails): see SametailGeo.
}

// cdd-T6: `NamespaceGeo` moved to `class-geo-namespace-types.ts` when the
// four new `EdgeGeo` fields pushed this file past the 500-line hook cap
// (pre-authorised split re-export) -- a pure move, re-exported below.
export type { NamespaceGeo } from './class-geo-namespace-types.js';
/** cdd-T15: re-exported alongside the other `EdgeGeo` member shapes. */
export type { EdgeKalBoxes } from './class-geo-edge-extras.js';
export type { KalBox } from './class-kal.js';

export interface ClassGeometry {
  /** cdd-T3 (A1 SB5): `class-directives-removal.ts#computeRemovedRanks`'s output (see its doc comment). */
  removedRanks?: readonly number[];
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
  edges: EdgeGeo[];
  namespaces: NamespaceGeo[];
  /** Single leaf collection, replacing `classifiers`/`notes` (T3) -- see `class-leaf-geo.ts`'s doc comment for jar mechanism + draw-order. */
  leaves: ClassLeafGeo[];
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

// cdd-T6: `JsonBodyItem` moved to `class-geo-json-types.ts` when the four
// new `EdgeGeo` fields pushed this file past the 500-line hook cap
// (pre-authorised split re-export) -- a pure move, re-exported below so no
// consumer's import path changed.
export type { JsonBodyItem } from './class-geo-json-types.js';
