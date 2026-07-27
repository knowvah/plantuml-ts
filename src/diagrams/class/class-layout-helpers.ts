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
 * ./class-layout-edge-labels.ts, same reason.
 */

import type { Classifier, ClassDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import { measureObjectClassifier } from './class-object-map-sizing.js';
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
  CLASS_STEREOTYPE_FONT_SIZE,
  type GuillemetPair,
  type GenericTagGeo,
} from './class-stereotype.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { ROW_TEXT_LEFT_MARGIN, isMethodMember } from './class-member-rows.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import {
  CARDINALITY_FONT_SIZE,
  splitEdgeLabelLines,
  wrapPlainTextLine,
  edgeLabelAttrs,
  type EdgeLabelAlign,
  type EdgeLabelLines,
} from './class-layout-edge-labels.js';
import { measureGenericClassifier } from './class-layout-generic-classifier.js';
import { measureUsecaseOrActor, measureLollipop } from './class-layout-leaf-shapes.js';
// Re-exported for existing external consumers (class-directives.ts, layout.ts,
// note-layout.ts) -- G2/N14 moved the implementations to class-member-rows.ts
// to keep this file under the 500-line cap; the public import path is unchanged.
export { ROW_TEXT_LEFT_MARGIN, isMethodMember };
// Re-exported for existing external consumers (class-edge-geo.ts,
// renderer-edge.ts, tests) -- moved to class-layout-edge-labels.ts to keep
// this file under the 500-line cap; the public import path is unchanged.
export {
  CARDINALITY_FONT_SIZE, splitEdgeLabelLines, wrapPlainTextLine, edgeLabelAttrs,
  type EdgeLabelAlign, type EdgeLabelLines,
};

/**
 * Classifiers that svek wraps in a `shape=plaintext` HTML table because a
 * relationship attaches a `[Qualifier]` shield or a `::member` port to them.
 * Maps the classifier id to whether it is a PORT target (port table) vs a
 * qualifier shield — both emit `shape=plaintext`, differing only in the table.
 */
/**
 * Package/namespace ids used as a relationship endpoint OR a `note <pos> of
 * <package>` target. svek routes such an edge to a `zaent` point anchor
 * INSIDE that cluster (ClusterDotString) instead of drawing a separate node
 * for the package. Maps the endpoint id → anchor id. Only populated when a
 * namespace id actually appears as an endpoint/note-target, so the transform
 * is a no-op for every diagram that does not hit this case.
 */
export function packageEndpointAnchors(
  ast: ClassDiagramAST,
  clusterNsIds: ReadonlySet<string>,
): Map<string, string> {
  // Only a NON-EMPTY package (an actual cluster) gets an anchor; an empty
  // package used as an endpoint stays a plain rect node (oracle: mujopi p1/p3).
  const anchors = new Map<string, string>();
  for (const rel of ast.relationships) {
    if (clusterNsIds.has(rel.from)) anchors.set(rel.from, `zaent-${rel.from}`);
    if (clusterNsIds.has(rel.to)) anchors.set(rel.to, `zaent-${rel.to}`);
  }
  for (const note of ast.notes) {
    if (note.target !== undefined && clusterNsIds.has(note.target)) {
      anchors.set(note.target, `zaent-${note.target}`);
    }
  }
  return anchors;
}

export function shieldedClassifierIds(ast: ClassDiagramAST): Map<string, { isPort: boolean }> {
  const shielded = new Map<string, { isPort: boolean }>();
  const mark = (id: string, isPort: boolean): void => {
    const existing = shielded.get(id);
    if (existing === undefined) shielded.set(id, { isPort });
    else if (isPort) existing.isPort = true;
  };
  for (const rel of ast.relationships) {
    if (rel.fromPort !== undefined) mark(rel.from, true);
    if (rel.toPort !== undefined) mark(rel.to, true);
    if (rel.fromQualifier !== undefined) mark(rel.from, false);
    if (rel.toQualifier !== undefined) mark(rel.to, false);
  }
  return shielded;
}


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
  name: string;
  type?: string;
  /** G2 N31: the raw separator between name/params and `type`, when the
   *  source used something other than the canonical `': '` -- see
   *  `ast.ts#Member.typeSeparator`'s doc comment. */
  typeSeparator?: string;
  params?: string[];
  rawDisplay?: string;
}): string {
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
 *
 * @param suppress - Per-compartment suppression (see `MemberSuppression`). A
 *   suppressed compartment omits its divider + rows + height entirely,
 *   independent of the other compartment (G2 N10 — was previously a single
 *   boolean that suppressed BOTH or neither, wrong per
 *   `CommandHideShowByGender.java`'s per-portion `emptyMembers` expansion).
 */
/**
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
  if (isCollapsedGroup(classifier)) {
    const dim = measureEmptyPackageLeafDim(measurer, theme, classifier.display);
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
    return measureUsecaseOrActor(classifier, fontSpec, measurer);
  }
  // G2 N20: the lollipop interface's own small circle+label -- NOT the
  // generic name+members box (see measureLollipop's own doc comment).
  if (classifier.kind === 'lollipop') return measureLollipop(classifier, fontSpec, measurer);
  return undefined;
}

/**
 * G2 N37: `.tagname` `<style>` cascade FontStyle wins over the more general
 * `skinparam`-resolved style value when set (more specific), which in turn
 * wins over `fallback`. Shared by both the attribute and header font
 * resolvers below -- factored out purely to keep each under the project's
 * per-function CCN cap (a bare `a ?? b ?? c` chain, repeated 4x across the
 * two callers, was the CCN driver).
 */
function resolveCascadedFontFlag(
  tagCascadeValue: boolean | undefined,
  styleValue: boolean | undefined,
  fallback: boolean,
): boolean {
  return tagCascadeValue ?? styleValue ?? fallback;
}

/**
 * G2 N23/N32: `skinparam class { AttributeFontSize/AttributeFontName/
 * AttributeFontStyle }` (`FontParam.CLASS_ATTRIBUTE`) overrides the generic
 * classifier box's ATTRIBUTE (member-row) font -- style-mapped by
 * `FromSkinparamToStyle.java:190-193` to the `element.class` selector. G2
 * N37: `.tagname` `<style>` cascade FontStyle wins over the ancestor
 * `classAttributeFontBold`/`Italic` value when set (more specific).
 * Split out of `measureClassifier` purely to keep that function's CCN
 * under the project's per-function cap.
 */
function resolveAttributeFont(
  theme: Theme,
  fontSpec: { family: string; size: number },
  tagCascadeEntry: ReturnType<typeof resolveClassTagCascadeEntry> | undefined,
) {
  return {
    family: theme.colors.graph.classAttributeFontFamily ?? fontSpec.family,
    size: theme.colors.graph.classAttributeFontSize ?? fontSpec.size,
    bold: resolveCascadedFontFlag(tagCascadeEntry?.fontBold, theme.colors.graph.classAttributeFontBold, false),
    italic: resolveCascadedFontFlag(tagCascadeEntry?.fontItalic, theme.colors.graph.classAttributeFontItalic, false),
  };
}

/**
 * `skinparam classFontSize/classFontName/classFontStyle`
 * (`FromSkinparamToStyle.java:185-188`, `element.class.header`) is the
 * classifier HEADER's own, independently-overridable font, which CASCADES
 * from the attribute-level values when unset (CSS-selector-specificity
 * semantics) -- jar-verified two ways: `jisanu-32-gado231` (attribute-only
 * override) shows the header ALSO adopting the overridden size/family;
 * `xabije-20-xusi569` (BOTH set, to DIFFERENT values) shows the header
 * using its OWN `classFont*` values instead. Split out of
 * `measureClassifier` purely to keep that function's CCN under the
 * project's per-function cap.
 */
function resolveHeaderFont(
  theme: Theme,
  attributeFont: ReturnType<typeof resolveAttributeFont>,
  tagCascadeEntry: ReturnType<typeof resolveClassTagCascadeEntry> | undefined,
) {
  return {
    family: theme.colors.graph.classFontFamily ?? attributeFont.family,
    size: theme.colors.graph.classFontSize ?? attributeFont.size,
    bold: resolveCascadedFontFlag(tagCascadeEntry?.fontBold, theme.colors.graph.classFontBold, attributeFont.bold),
    italic: resolveCascadedFontFlag(tagCascadeEntry?.fontItalic, theme.colors.graph.classFontItalic, attributeFont.italic),
  };
}

/**
 * G2 N27: `skinparam guillemet <value>` -- both fields undefined means the
 * default `«`/`»` wrapper (`measureGenericClassifier`'s own `guillemet`
 * param default), so this is safe to pass through unconditionally rather
 * than gating on presence. Split out of `measureClassifier` purely to keep
 * that function's CCN under the project's per-function cap.
 */
function resolveGuillemetOption(theme: Theme): GuillemetPair | undefined {
  return theme.colors.graph.guillemetStart !== undefined || theme.colors.graph.guillemetEnd !== undefined
    ? { start: theme.colors.graph.guillemetStart ?? '«', end: theme.colors.graph.guillemetEnd ?? '»' }
    : undefined;
}

/**
 * G2 N39: `skinparam classStereotypeFontSize`/`FontName`/`FontStyle` --
 * `italic` has NO `false` fallback -- `FontParam.CLASS_STEREOTYPE`'s own
 * default face IS italic (see `theme.ts#classStereotypeFontSize`'s doc
 * comment), unlike every OTHER class font param. Split out of
 * `measureClassifier` purely to keep that function's CCN under the
 * project's per-function cap.
 */
function resolveStereoFont(theme: Theme, headerFont: ReturnType<typeof resolveHeaderFont>) {
  return {
    family: theme.colors.graph.classStereotypeFontFamily ?? headerFont.family,
    size: theme.colors.graph.classStereotypeFontSize ?? CLASS_STEREOTYPE_FONT_SIZE,
    bold: theme.colors.graph.classStereotypeFontBold ?? false,
    italic: theme.colors.graph.classStereotypeFontItalic ?? true,
  };
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

  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  // G2 N37: resolved ONCE here (not per-render) since a classifier's OWN
  // stereotype never changes between layout and render -- see
  // `style-cascade-class.ts#resolveClassTagCascadeEntry`'s own doc comment
  // for why this is render-only and carries no DOT-gate width risk.
  const tagCascadeEntry = classifier.stereotype !== undefined
    ? resolveClassTagCascadeEntry(theme, resolveStyleStereotypeTags(classifier), classifier.styleGeneration)
    : undefined;
  const attributeFont = resolveAttributeFont(theme, fontSpec, tagCascadeEntry);
  const headerFont = resolveHeaderFont(theme, attributeFont, tagCascadeEntry);
  const guillemet = resolveGuillemetOption(theme);
  // G2 N38: `skinparam circledCharacterFontSize`/`circledCharacterRadius`
  // -- resolved ONCE here (theme is only available at this level) and
  // threaded through as a plain number, matching `tagCascadeEntry`'s own
  // "resolve once, pass down" precedent above.
  const badgeRadius = resolveBadgeRadius(
    theme.colors.graph.circledCharacterFontSize,
    theme.colors.graph.circledCharacterRadius,
  );
  const stereoFont = resolveStereoFont(theme, headerFont);
  // G2 N65 item 35: resolved ONCE here (theme is only available at this
  // level), matching `badgeRadius`/`stereoFont`'s own "resolve once, pass
  // down" precedent above -- see `theme.ts#classCascadeMaximumWidth`'s doc
  // comment for the header-vs-member split.
  const headerMaxWidth = theme.colors.graph.classCascadeHeaderMaximumWidth ?? 0;
  const memberMaxWidth = theme.colors.graph.classCascadeMaximumWidth ?? 0;
  return measureGenericClassifier(
    classifier, { header: headerFont, attribute: attributeFont }, measurer, suppress,
    { sprites, guillemet, badgeRadius, stereoFont, strictUml: theme.strictUml === true, headerMaxWidth, memberMaxWidth },
  );
}
