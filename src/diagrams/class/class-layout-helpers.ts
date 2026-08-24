/**
 * Classifier sizing/measurement helpers for the class diagram layout engine
 * (src/diagrams/class/layout.ts).
 *
 * Split out of layout.ts purely to keep every function under the project's
 * per-function complexity/size caps (CCN <= 10, <= 30 NLOC) and the file
 * under the 500-line cap. No behavior differs from the original inline code
 * — this is a pure move.
 *
 * `kind:'object'`, `kind:'map'`, and `kind:'json'` leaves are measured by a
 * dedicated upstream-faithful formula (EntityImageObject / EntityImageMap /
 * EntityImageJson) in ./class-object-map-sizing.ts and ./class-json-sizing.ts,
 * dispatched from measureClassifier below — they no longer share the generic
 * name+members box formula in this file.
 *
 * The generic name+members box formula itself (`measureGenericClassifier`)
 * and the usecase/actor/lollipop USymbol leaves live in
 * ./class-layout-generic-classifier.ts / ./class-layout-header-geo.ts /
 * ./class-layout-leaf-shapes.ts (same split rationale -- this file was
 * already at the 500-line cap; re-exported below so import sites are
 * unchanged). Edge-label sizing (`edgeLabelAttrs` and friends) lives in
 * ./class-layout-edge-labels.ts, same reason. The port/qualifier "shield"
 * helpers (`packageEndpointAnchors`/`shieldedClassifierIds`/
 * `memberPortIsP`) moved to ./class-shield-helpers.ts (S2 -- same reason;
 * that module imports `LIKE_CLASS_KINDS` back from here).
 */

import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing.js';
import type { Classifier, ClassifierKind } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import { measureObjectClassifier } from './class-object-sizing.js';
import { measureMapClassifier } from './class-map-sizing.js';
import { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import { measureJsonClassifier } from './class-json-sizing.js';
import { isCollapsedGroup } from './class-magma.js';
import {
  measureEmptyPackageLeafDim,
  type EmptyPackageLeafDim,
} from './class-namespace-shape.js';
import { resolveBadgeRadius } from './class-badge.js';
import {
  resolveStyleStereotypeTags,
  resolveVisibleStereotypeLabels,
  type GenericTagGeo,
} from './class-stereotype.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { resolveElementMinimumWidth } from '../../core/theme-element-resolve.js';
import { ROW_TEXT_LEFT_MARGIN, isMethodMember, type FlatMemberRows } from './class-member-rows.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import type { JsonBodyItem } from './class-geo-types.js';
import {
  CARDINALITY_FONT_SIZE,
  wrapPlainTextLine,
  edgeLabelAttrs,
  type NoteBoxContext,
} from './class-layout-edge-labels.js';
import { measureGenericClassifier, tryMeasureDescriptionLeaf } from './class-layout-generic-classifier.js';
// R2j: the attribute/header/stereotype font + guillemet resolvers moved to
// class-layout-fonts.ts (this file was at the 500-line cap) -- see that
// module's own doc comment for the two R2j mechanism additions.
import {
  resolveAttributeFont,
  resolveHeaderFont,
  resolveGuillemetOption,
  resolveStereoFont,
} from './class-layout-fonts.js';
import { measureUsecaseOrActor, measureLollipop, measureAssociationDiamond } from './class-layout-leaf-shapes.js';
// Re-exported for existing external consumers (class-directives.ts, layout.ts,
// note-layout.ts) -- G2/N14 moved the implementations to class-member-rows.ts
// to keep this file under the 500-line cap; the public import path is unchanged.
export { ROW_TEXT_LEFT_MARGIN, isMethodMember };
// Re-exported for existing external consumers (renderer-edge.ts, tests) --
// moved to class-layout-edge-labels.ts to keep this file under the 500-line
// cap; the public import path is unchanged. T1 retired the SIBLING
// `splitEdgeLabelLines`/`EdgeLabelAlign`/`EdgeLabelLines` re-exports that
// used to live here -- `class-edge-geo.ts` (this re-export's only other
// consumer) now imports `splitDisplayLines` from
// `core/klimt/creole/DisplayNewlines.ts` directly.
export {
  CARDINALITY_FONT_SIZE, wrapPlainTextLine, edgeLabelAttrs,
  type NoteBoxContext,
};

/**
 * Format a member text string for class/interface/enum members (no
 * visibility prefix). G2 N4: the `: <type>` suffix is OMITTED entirely
 * when `type` is `undefined` (no `:` in the source line at all) -- was
 * unconditional (`: ${type ?? ''}`, always printing at least a bare
 * trailing colon), jar-verified against `jobuco-44-zife032`/`nubisa-82-
 * tuji339` (`class Foo { Bar }` -> jar's member row text is plain `"Bar"`,
 * never `"Bar: "`). Upstream stores each member line close to verbatim
 * (`cucadiagram/Member.java` -- a raw `CharSequence` wrapper, not a
 * name/type reconstruction), so a field/method the user wrote with no `:
 * Type` at all should round-trip with no `:` either -- this port's AST
 * splits name/type/params at parse time, so `formatMemberText` is the
 * reconstruction point that must reproduce that same "nothing typed,
 * nothing shown" behavior.
 */
export function formatMemberText(member: {
  visibility: string;
  visibilityExplicit?: boolean;
  name: string;
  type?: string;
  /** G2 N31: the raw separator between name/params and `type`, when the
   *  source used something other than the canonical `': '` -- see
   *  `ast.ts#Member.typeSeparator`'s doc comment. */
  typeSeparator?: string;
  params?: string[];
  rawDisplay?: string;
}, keepVisibilityChar = false): string {
  // A13 (`classAttributeIconSize 0`): `MethodsOrFieldsArea#createTextBlock`'s
  // `withVisibilityChar` path (java:244-246) -- `m.getDisplay(true)`
  // re-prepends the member's OWN explicit char (Member.java:161-178;
  // modifier-less members get none). Upstream tilde-escapes a leading '#'
  // (CharHidder.java:41-43) only to shield it from ITS creole layer (net
  // result: one literal '#' glyph); this port's member creole has no
  // '~'-escape pass and '#' is not markup there, so the plain char IS the
  // same observable.
  if (keepVisibilityChar && member.visibilityExplicit === true) {
    return member.visibility + formatMemberText(member);
  }
  // G2 N12: a raw-fallback member (class-member-parser.ts's non-canonical-
  // syntax branch) carries its ENTIRE display text verbatim in `rawDisplay`
  // -- `name` duplicates it only so callers that key on `.name` still see
  // something -- so it must win over the structured name/type/params
  // reconstruction below (mirrors `class-object-map-sizing.ts#
  // formatObjectMemberText`'s identical `rawDisplay`-first precedence for
  // object leaves, the same upstream Member/BodierLikeClassOrObject
  // mechanism).
  if (member.rawDisplay !== undefined) return member.rawDisplay;
  const typeSuffix = member.type !== undefined ? `${member.typeSeparator ?? ': '}${member.type}` : '';
  if (member.params !== undefined) {
    return `${member.name}(${member.params.join(', ')})${typeSuffix}`;
  }
  return `${member.name}${typeSuffix}`;
}

/** Pre-measured classifier dimensions and row/divider layout (no layout coordinates). */
export interface MeasuredClassifier {
  width: number;
  height: number;
  /** The DRAWN ink extent of a USymbol leaf's own shapes, in the leaf's own
   *  frame (origin at its box top-left) — from a `LimitFinder` walk over the
   *  same `EntityImageDescription` instance that sizes it
   *  (`description/leaf-sizing-entity.ts#measureUsecaseOrActorLeafInk`).
   *  Present only for an `actor` leaf; see that function's doc comment for
   *  why usecase is excluded. Read by `class-ink-box.ts#addClassifierInk`
   *  in place of `addRectInk`'s box rule. */
  symbolInk?: LeafSymbolInk;
  rows: ClassifierGeo['rows'];
  dividerYs: number[];
  /** G2 N24: number of LEADING `rows[]` entries that belong to the header
   *  bundle (stacked stereotype line(s) + the name row), rather than the
   *  member/body section -- `renderer-classifier-box.ts#buildHeaderPrimitive`/
   *  `#buildBodyPrimitives` read this to know how many rows to draw as part
   *  of the header vs. as member/body rows. Omitted (defaults to 1, the
   *  pre-N24 assumption of exactly one header row) for every classifier with
   *  no stereotype -- zero behavior change for the common case, and for
   *  `object`/`map`/`json` leaves (their own separate, unaffected header
   *  convention, `class-object-map-sizing.ts#headerRows`). */
  headerRowCount?: number;
  /** G2 N64 item 45: number of TRAILING `headerRowCount` rows that are
   *  classifier-NAME lines (a multi-line `\n`/`\l`/`\r`-split display
   *  name), rather than genuine stacked `<<stereotype>>` label rows.
   *  `renderer-classifier-box.ts#buildHeaderPrimitive` uses this to decide
   *  which leading rows get the stereotype-label font-color-cascade
   *  treatment (`isStereoLabelRow`) -- omitted (defaults to 1, the
   *  pre-N64 assumption of exactly one name row) for every classifier
   *  whose display name has no line-break escape. */
  nameRowCount?: number;
  /** G2 N26: `class Foo << (F,orange) >>`'s badge-customization override --
   *  see `class-stereotype.ts#parseCircledCharDecoration`'s doc comment.
   *  Omitted for every classifier with no `(CHAR[,COLOR])` decoration. */
  badgeChar?: string;
  badgeColor?: string;
  /** G2 N32: `class Foo<T>`'s generic type-parameter tag box -- see
   *  `class-stereotype.ts#buildGenericTagGeo`'s doc comment. Omitted for
   *  every classifier with no `typeParams` (zero behavior change). */
  genericTag?: GenericTagGeo;
  /** G2 N33: present only for a collapsed-empty `package`/`namespace` leaf
   *  (`class-magma.ts#isCollapsedGroup`) -- see
   *  `class-namespace-shape.ts#measureEmptyPackageLeafDim`'s doc comment.
   *  `renderer.ts` reads this to draw the folder-tab icon UNWRAPPED instead
   *  of the generic classifier box. */
  folderTab?: EmptyPackageLeafDim;
  /** G2 N42: present only for a classifier whose body triggers upstream's
   *  "enhanced body" render strategy (`class-body-enhanced.ts
   *  #isEnhancedBody`) -- a `--`/`==`/`..`/`__` block separator or a `|_`
   *  tree-list line. `renderer-classifier-box.ts#buildBodyPrimitives`
   *  draws this INSTEAD OF the classic fields/methods `dividerYs`/`rows`
   *  split (both fields still populated for backward-compat parity with
   *  every other `MeasuredClassifier`, but left EMPTY-equivalent for an
   *  enhanced classifier -- `rows` carries only the header bundle). */
  enhancedBody?: EnhancedBodyGeo;
  /** M3(c): present only for a `kind:'json'` leaf — the ordered
   *  `TextBlockCucaJSon#drawU` operation list
   *  (`class-json-sizing.ts#buildJsonItems`). `rows`/`dividerYs` stay
   *  populated (the ink box and the header-background split both read
   *  `dividerYs[0]`), but the LINES are drawn from this, not from
   *  `dividerYs`. */
  jsonBody?: readonly JsonBodyItem[];
  /** B35/M40: see `ClassifierGeo.bodyInkWidth`'s doc comment (the geo
   *  field this one feeds) and `class-ink-box.ts#addRectInk`'s (the
   *  jar-verified rule that consumes it). */
  bodyInkWidth?: number;
  /** B5/M6: see `ClassifierGeo.emptyFieldPlaceholder`'s doc comment
   *  (./class-geo-types.ts). Set only by `class-object-map-sizing.ts
   *  #buildFieldBasedObjectGeo`. */
  emptyFieldPlaceholder?: true;
  /**
   * T2 (SI17) publish-only plumbing -- see `plans/si17-class-row-ports/
   * decision-journal.md`'s "SCOPE DECISION" entry. `class-port-rows.ts
   * #classPortRows` (ADR-1's block-tree frame) needs the header height plus
   * each compartment's OWN per-member measured height, both of which this
   * file's `buildNormalClassifierResult` already computes and then discards
   * -- `rows[].y` keeps only the baked-in text BASELINE
   * (`class-member-rows.ts:200-201`). `fields`/`methods` are each the SAME
   * `FlatMemberRows` that function already built for its own row/height
   * math; `undefined` for a compartment means it was SUPPRESSED
   * (`MemberSuppression`) and contributes NOTHING (not an empty 8px-floor
   * compartment) -- matches `fieldsH`/`methodsH`'s own suppress gate.
   * Present for a row-port leaf: a `LIKE_CLASS_KINDS` one via
   * `buildNormalClassifierResult`, or an `object` via SI20's
   * `buildFieldBasedObjectGeo`; `undefined` for every other shape
   * (map/json/usecase/lollipop/…, none of which use `classPortRows`).
   */
  portMemberSections?: {
    readonly headerHeight: number;
    readonly fields?: FlatMemberRows;
    readonly methods?: FlatMemberRows;
  };
}

/**
 * Per-compartment hide state for a classifier's member section (G2 N10).
 * `fields`/`methods` are independent: `hide empty fields`/`hide empty
 * methods` set exactly one; `hide empty members` (upstream's `emptyMembers`
 * special case, CommandHideShowByGender.java:267-279) sets whichever
 * compartment is itself empty for a given classifier -- possibly both,
 * possibly neither, possibly just one. `hide members` (bare, unconditional)
 * sets both regardless of emptiness.
 */
export interface MemberSuppression {
  fields: boolean;
  methods: boolean;
}

/**
 * Compute the pre-measured dimensions and row/divider layout for a classifier.
 * Members with hidden=true are excluded from height calculations and row output.
 * @param suppress - Per-compartment suppression (see `MemberSuppression`). A
 *   suppressed compartment omits its divider + rows + height entirely,
 *   independent of the other compartment (G2 N10 — was previously a single
 *   boolean that suppressed BOTH or neither, wrong per
 *   `CommandHideShowByGender.java`'s per-portion `emptyMembers` expansion).
 *
 * The dispatch branch of `measureClassifier` for every classifier kind
 * whose svek box is NOT the generic name+members rect (collapsed-empty
 * package/namespace, object/map/json leaves, usecase/actor, lollipop).
 * Split out purely to keep `measureClassifier` under the project's
 * per-function CCN cap; see that function's own doc comment for the
 * upstream derivation of each branch.
 */
function tryMeasureNonGenericClassifier(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  suppress: MemberSuppression,
  sprites: SpriteRegistry | undefined,
): MeasuredClassifier | undefined {
  // G2 N33: a collapsed-empty `package`/`namespace` draws its OWN small
  // folder-tab icon (`EntityImageEmptyPackage`), never the generic
  // name+members box -- must be checked before every other branch below
  // since `isCollapsedGroup` classifiers carry `kind: 'descriptive'` with
  // no `usymbol` (would otherwise fall through to the generic box).
  // A2s F-D mechanism A8: the leaf's `<<stereotype>>` block merges into the
  // dim (EntityImageEmptyPackage.java:126-145) -- labels currently reach
  // this classifier only for hand-built ASTs; the parser drops a package's
  // stereotype before collapse (plumbing gap, see the F-D report).
  if (isCollapsedGroup(classifier)) {
    const dim = measureEmptyPackageLeafDim(
      measurer, theme, classifier.display, resolveVisibleStereotypeLabels(classifier),
    );
    // `rows[0].text` carries the label for `renderer.ts#renderEmptyPackageLeaf`
    // (mirrors `tryRenderUSymbol`'s identical `rows[0]?.text ?? id` convention)
    // -- no `y`/`indent` meaning here since this leaf never draws through the
    // generic `renderRow` path.
    return {
      width: dim.width, height: dim.height, dividerYs: [],
      rows: [{ text: classifier.display, y: 0, indent: 0 }],
      folderTab: dim,
    };
  }
  // object/map/json leaves are NOT the generic name+members box — each has
  // its own upstream-faithful formula (EntityImageObject / EntityImageMap /
  // EntityImageJson + TextBlockMap / TextBlockCucaJSon). Objects have no
  // methods compartment concept (`BodierLikeClassOrObject#getFieldsToDisplay`
  // routes EVERY object member into "fields" regardless of method-like
  // syntax) — only `suppress.fields` is meaningful for them.
  if (classifier.kind === 'object') return measureObjectClassifier(classifier, theme, measurer, suppress.fields, sprites);
  if (classifier.kind === 'map') return measureMapClassifier(classifier, theme, measurer);
  if (classifier.kind === 'json') return measureJsonClassifier(classifier, theme, measurer);
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  // usecase (LeafType.USECASE) and the `actor` descriptive leaf are the two
  // allowmixing kinds whose svek box is NOT the generic name+members rect —
  // upstream sizes them via EntityImageDescription's USymbol-specific
  // formula (ContainingEllipse / ActorStickMan+label), ported in the
  // description engine's leaf-sizing.ts. Every other descriptive leaf
  // (database/component/rectangle) keeps the generic box below unchanged.
  if (classifier.kind === 'usecase' || (classifier.kind === 'descriptive' && classifier.usymbol === 'actor')) {
    return measureUsecaseOrActor(classifier, fontSpec, measurer, sprites);
  }
  // A2s F-D mechanism A2: every OTHER USymbol-bearing descriptive leaf
  // (allowmixing `database`/`component`/`rectangle`/... and an empty
  // brace-group that kept its usymbol) routes to the description engine's
  // faithful EntityImageDescription sizing too -- see
  // `tryMeasureDescriptionLeaf`'s own doc comment (class-layout-generic-
  // classifier.ts) for the upstream cite and the deliberate exclusions.
  const descLeaf = tryMeasureDescriptionLeaf(classifier, theme, measurer, sprites);
  if (descLeaf !== undefined) return descLeaf;
  // G2 N20 lollipop / A2s R2h association diamond -- see each helper's doc.
  if (classifier.kind === 'lollipop') return measureLollipop(classifier, fontSpec, measurer);
  if (classifier.kind === 'association') return measureAssociationDiamond();
  // #lizard forgives -- kind-dispatch table (one branch per non-generic
  // svek EntityImage kind, mirroring upstream's own dispatch; R2h +1).
  return undefined;
}

/**
 * Resolve the attribute/header fonts + the `.tagname` cascade entry for one
 * classifier -- extracted from {@link measureClassifier} purely for the
 * per-function NLOC cap (R2j). G2 N37: resolved ONCE per classifier (not
 * per-render) since a classifier's OWN stereotype never changes between
 * layout and render -- see `style-cascade-class.ts
 * #resolveClassTagCascadeEntry`'s own doc comment. R2j: the SAME resolved
 * tag list also keys the `classAttributeFontSize<<X>>` direct-value lookup
 * (`class-layout-fonts.ts#resolveAttributeFont`).
 */
function resolveMeasureFonts(classifier: Classifier, theme: Theme) {
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const styleTags = classifier.stereotype !== undefined
    ? resolveStyleStereotypeTags(classifier) : undefined;
  const tagCascadeEntry = styleTags !== undefined
    ? resolveClassTagCascadeEntry(theme, styleTags, classifier.styleGeneration)
    : undefined;
  const attributeFont = resolveAttributeFont(theme, fontSpec, tagCascadeEntry, styleTags);
  const headerFont = resolveHeaderFont(theme, attributeFont, tagCascadeEntry, styleTags);
  return { attributeFont, headerFont };
}

export function measureClassifier(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  suppress: MemberSuppression,
  sprites?: SpriteRegistry,
): MeasuredClassifier {
  const nonGeneric = tryMeasureNonGenericClassifier(classifier, theme, measurer, suppress, sprites);
  if (nonGeneric !== undefined) return nonGeneric;

  const { attributeFont, headerFont } = resolveMeasureFonts(classifier, theme);
  const guillemet = resolveGuillemetOption(theme);
  // G2 N38: `skinparam circledCharacterFontSize`/`circledCharacterRadius`
  // -- resolved ONCE here (theme is only available at this level) and
  // threaded through as a plain number, matching `tagCascadeEntry`'s own
  // "resolve once, pass down" precedent above. R2j (mizupo-59): an EXPLICIT
  // `skinparam defaultFontSize` is `SkinParam#getFontSize`'s middle tier
  // (SkinParam.java:441-448) feeding `getCircledCharacterRadius()`
  // (:548-551), BELOW the per-param circledCharacterFontSize and ABOVE
  // `FontParam.CIRCLED_CHARACTER`'s own default 17.
  const badgeRadius = resolveBadgeRadius(
    theme.colors.graph.circledCharacterFontSize ?? theme.defaultFontSize,
    theme.colors.graph.circledCharacterRadius,
  );
  const stereoFont = resolveStereoFont(theme, headerFont);
  // G2 N65 item 35: headerMaxWidth/memberMaxWidth resolved ONCE here (theme
  // is only available at this level), matching `badgeRadius`/`stereoFont`'s
  // own "resolve once, pass down" precedent above -- see
  // `theme.ts#classCascadeMaximumWidth`'s doc comment.
  return measureGenericClassifier(
    classifier, { header: headerFont, attribute: attributeFont }, measurer, suppress,
    {
      sprites, guillemet, badgeRadius, stereoFont, strictUml: theme.strictUml === true,
      headerMaxWidth: theme.colors.graph.classCascadeHeaderMaximumWidth ?? 0,
      memberMaxWidth: theme.colors.graph.classCascadeMaximumWidth ?? 0,
      minClassWidth: resolveMinClassWidth(theme, classifier.kind),
      classAttributeIconSize: theme.classAttributeIconSize,
    },
  );
}

/**
 * A2s F-D mechanism A7: `skinparam minClassWidth` / `<style> MinimumWidth`
 * floors the box width -- EntityImageClass.java:104-106. Like-class kinds
 * only (`EntityImageClass` is only built for `LeafType#isLikeClass` leaves,
 * GeneralImageBuilder.java:110-116), never the state/circle/association
 * leaves that share the generic formula. Resolver: S1L-b T5's
 * `resolveElementMinimumWidth` (element bucket over bare
 * `theme.minimumWidth`, theme-element-resolve.ts:104).
 */
function resolveMinClassWidth(theme: Theme, kind: ClassifierKind): number {
  return LIKE_CLASS_KINDS.has(kind) ? resolveElementMinimumWidth(theme, 'class') ?? 0 : 0;
}

/**
 * The `ClassifierKind`s upstream's `LeafType#isLikeClass` covers
 * (LeafType.java:85-96: ANNOTATION, ABSTRACT_CLASS, CLASS, INTERFACE, ENUM,
 * ENTITY, PROTOCOL, STRUCT, EXCEPTION, METACLASS, STEREOTYPE, DATACLASS,
 * RECORD -- struct/exception/metaclass/stereotype/dataclass/record are still
 * unported (no fixture exercises them; see `ClassifierKind`'s `'protocol'`
 * member doc, class-classifier-ast.ts, T14 dispatch-by-parse-attempt), so
 * the set here is the kinds that exist -- PROTOCOL joined it as its own
 * distinct kind rather than folding into `class`, matching how `entity` and
 * `circle` are already handled: `badgeLetter`/`ClassifierKind` is the
 * natural home for "which keyword was declared", not a synthesized
 * stereotype decoration).
 * Gates `EntityImageClass`-only behavior: the `minClassWidth` /
 * `sameClassWidth` width floors (EntityImageClass.java:104-110) and the
 * groupInheritance `EntityImageProtected` wrap (GeneralImageBuilder
 * .java:110-116).
 */
export const LIKE_CLASS_KINDS: ReadonlySet<ClassifierKind> = new Set<ClassifierKind>([
  'class', 'abstract', 'interface', 'enum', 'annotation', 'entity', 'protocol',
]);

