/**
 * Public geometry types for the class-diagram layout engine. Split out of
 * ./layout.ts (which re-exports them) to keep layout.ts under the
 * project's 500-line cap — mirrors `state/state-geo-types.ts`'s split.
 */
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing.js';
import type { ClassifierKind, UrlInfo } from './ast.js';
import type { GenericTagGeo } from './class-stereotype.js';
import type { EmptyPackageLeafDim } from './class-namespace-shape.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import type { ClassifierRowGeo } from './class-geo-row-types.js';

export type { ClassifierRowGeo } from './class-geo-row-types.js';

export { isNoteGeo, isClassifierGeo, classifierLeaves, noteLeaves, type ClassLeafGeo } from './class-leaf-geo.js';

import type { JsonBodyItem } from './class-geo-json-types.js';
// cdd-T6: re-exported so `class-geo-types.ts` stays the one import site for
// class geometry types (see `class-geo-edge-extras.ts`'s own doc comment).
export type {
  EdgeConstraintGeo,
  EdgeNoteBoxGeo,
  EdgeNoteLine,
  QuantifierLineGeo,
  QuantifierLinesGeo,
  RoleLinesGeo,
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
  /** Text rows to render: [header display, ...member strings] with y offset.
   *  cdd3-T7: element type split to `class-geo-row-types.ts` (500-line cap
   *  split, see that file's own doc comment) -- a pure move. */
  rows: ClassifierRowGeo[];
  hideCircle?: boolean; // suppress the circle badge (hide circle directive)
  /**
   * G2 N7: true when `hide <entity|$tag|<<stereotype>>|*|@unlinked>`
   * (`class-directives.ts#computeHiddenIds`) matched this classifier — the
   * renderer skips ALL drawn content for it, but layout/uid numbering runs
   * exactly as if it were visible (matches jar: the entity keeps its svek
   * node/creationIndex slot, only its `<g class="entity">` disappears).
   */
  hidden?: boolean;
  /** cdd-B10FU (`pijiju-95-xexi872`): the `EntityImageProtected` border
   *  (`svek/EntityImageProtected.java:76-83`) this classifier was padded
   *  by (`class-dot-graph.ts#protectedPad`). `x`/`y`/`width`/`height`
   *  stay the OUTER (padded/DOT-node) box, still needed by
   *  `renderer-group.ts#renderGroupInheritanceNeighborhood`; the visible
   *  content draws at the INNER box this field derives (`UTranslate
   *  (border, border)`). */
  protectedBorder?: number;
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
  /** E3-16: copied unchanged from `Classifier.subsumedLinkPhantomSlot`
   *  (`ast.ts`'s doc comment) — feeds `renderer-uid.ts`'s extra-phantom-
   *  rank injection for a subsumed link that was itself inverted. */
  subsumedLinkPhantomSlot?: true;
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
  /** CDD B7FU-R2 item (c-b): copied unchanged from `MeasuredClassifier
   *  .badgeSpriteImage` (`class-layout-helpers.ts`'s doc comment) — feeds
   *  `renderer-classifier-box.ts#buildHeaderPrimitive`'s sprite-badge draw
   *  (wins over `badgeChar`/the default kind badge). */
  badgeSpriteImage?: { href: string; width: number; height: number };
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
  /** cdd6 b2 (journal row 39): the `hide|show stereotype`-FILTERED labels
   *  (`class-stereotype.ts#resolveVisibleStereotypeLabels`) -- what
   *  `EntityImageDescription.java:193-202` draws as a USymbol leaf's `stereo`
   *  block (`portionShower.getVisibleStereotypeLabels(entity)`), distinct
   *  from {@link stereotypeLabels}' unfiltered style-matching list. Omitted
   *  with it. */
  visibleStereotypeLabels?: readonly string[];
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
   * B35/M40, cdd2-T17: the rightmost `UEmpty` reservation inside this
   * classifier, relative to `x` -- for an `object`, its body's
   * (`dimFields.getWidth()`); for an `isLikeClass` leaf, the max over its
   * header and body marged blocks
   * (`class-classifier-ink-reservation.ts#genericClassifierInkWidth`). Read
   * ONLY by `class-ink-shapes.ts#addRectInk`, whose doc comment carries the
   * jar-verified mechanism. `undefined` means "not measured" and keeps the
   * fixed `x + w` max-X (`map`/`json`, the enhanced body, every other kind).
   */
  bodyInkWidth?: number;

  /** cdd3-T7 (R-VP): Y analogue of {@link bodyInkWidth} -- header's own
   *  `UEmpty` max-Y, set only when the body is fully hidden
   *  (`BodierLikeClassOrObject.java:249-250`); `undefined` keeps `y + h`. */
  bodyInkHeight?: number;

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

// cdd7 T2b: `EdgeGeo` moved to `class-geo-edge-types.ts` (500-line cap) --
// a pure move, re-exported so no consumer's import path changed.
export type { EdgeGeo } from './class-geo-edge-types.js';

// cdd-T6: `NamespaceGeo` moved to `class-geo-namespace-types.ts` when the
// four new `EdgeGeo` fields pushed this file past the 500-line hook cap
// (pre-authorised split re-export) -- a pure move, re-exported below.
export type { NamespaceGeo } from './class-geo-namespace-types.js';
/** cdd-T15: re-exported alongside the other `EdgeGeo` member shapes. */
export type { EdgeKalBoxes } from './class-geo-edge-extras.js';
export type { KalBox } from './class-kal.js';

// cdd-T17: `ClassGeometry` moved to `class-geo-geometry-types.ts` when
// `EdgeGeo.roleLines` pushed this file back over the 500-line hook cap
// (pre-authorised split re-export, same precedent as `NamespaceGeo`/
// `JsonBodyItem` below) -- a pure move, re-exported so no consumer's import
// path changed.
export type { ClassGeometry, ClassPageBoundary } from './class-geo-geometry-types.js';

// cdd-T6: `JsonBodyItem` moved to `class-geo-json-types.ts` when the four
// new `EdgeGeo` fields pushed this file past the 500-line hook cap
// (pre-authorised split re-export) -- a pure move, re-exported below so no
// consumer's import path changed.
export type { JsonBodyItem } from './class-geo-json-types.js';
