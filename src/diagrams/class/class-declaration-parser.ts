/**
 * Classifier declaration line parsing for PlantUML class diagrams.
 *
 * Extracted from parser.ts (pure move, no behavior change) to keep
 * parser.ts under the repo's 500-line-per-file cap.
 */

import type { Classifier, ClassifierKind, RelationshipType, Visibility } from './ast.js';
import { parseMemberLine } from './class-member-parser.js';
import {
  DESCRIPTIVE_LEAF_KEYWORDS,
  USECASE_LEAF_KEYWORDS,
  STATE_LEAF_KEYWORD,
  ALL_DESCRIPTIVE_LEAF,
} from './class-descriptive-leaf-keywords.js';
import { ensureClassifier, type ParseState } from './parser.js';
import { idLeaf } from './class-relationship-parser.js';
import { type UrlInfo } from './class-url.js';
import { refuse } from '../../core/parse-refusal.js';
import { eventuallyRemoveStartingAndEndingDoubleQuote } from '../../core/url/Url.js';
import { extractBody, extractDecorations, extractInheritance, parseIdDisplay } from './class-declaration-extractors.js';

// ---------------------------------------------------------------------------
// Classifier declaration parser
// ---------------------------------------------------------------------------

export interface ClassifierDecl {
  id: string;
  display: string;
  kind: ClassifierKind;
  typeParams: string[];
  /** G2 N49: see `Classifier.typeParamsRawText`'s own doc comment -- threaded
   *  from `parseIdDisplay` unchanged. */
  typeParamsRawText?: string;
  stereotype?: string;
  color?: string;
  /**
   * True if the line ended with `{` with no inline closing `}`.
   * Indicates that subsequent lines until `}` are member definitions.
   */
  opensBody: boolean;
  /** Members found on the same line as the brace: class Foo { +bar(): int } */
  inlineMembers: string[];
  /** Source keyword for `kind: 'descriptive'` (database/node/…), else absent. */
  usymbol?: string;
  /** Parent ids from `extends A, B` (comma-separated; upstream CODES). */
  extendsIds: string[];
  /** Parent ids from `implements A, B` (comma-separated; upstream CODES). */
  implementsIds: string[];
  /** `$tag` names (without the `$`), e.g. `class Foo $a $b` -> ['a', 'b']. */
  tags: string[];
  /** G2 N15: inline `[[url]]` suffix, see `ast.ts#Classifier.url`'s doc
   *  comment. */
  url?: UrlInfo;
  /** cdd5-T4b: the leading VISIBILITY char -- see `Classifier.
   *  visibilityModifier`'s own doc comment. */
  visibilityModifier?: Visibility;
}

/**
 * Parse a classifier declaration line.
 *
 * Handles:
 *   class Foo
 *   abstract class Base
 *   interface IFoo<T, U>
 *   enum Color
 *   annotation MyAnnotation
 *   class "My Class" as MC
 *   class Foo << Stereotype >>
 *   class Foo #pink
 *   class Foo {
 *   class Foo { +bar(): String }    <- inline single-line body
 */
// Keyword tables live in class-descriptive-leaf-keywords.ts (500-line cap
// split; shared with class-descriptive-leaf-command.ts, no circular import).
// T3 (unknown-bucket-routing-repair): optional leading VISIBILITY char
// (`[-#+~]`, `VisibilityModifier.regexForVisibilityCharacter()`,
// `skin/VisibilityModifier.java:75-77`) -- both `CommandCreateClass.java:87`
// and `CommandCreateClassMultilines.java:100` carry
// `new RegexLeaf(1, "VISIBILITY", "(" + regexForVisibilityCharacter() +
// ")?")` immediately after `RegexLeaf.start()`, before `spaceZeroOrMore()`
// and the TYPE keyword. cdd5-T4b: captured (group 1) into
// `ClassifierDecl.visibilityModifier` -- `CommandCreateClass.java:172-175`:
// "visibilityModifier = VisibilityModifier.getVisibilityModifier(
// visibilityString + \"FOO\", false);", drawn by `EntityImageClassHeader.
// java:109-121`.
const VISIBILITY_PREFIX = '(?:([-#+~])\\s*)?';
const DECL_KIND_RE = new RegExp(
  // `abstract\s+class` must precede the bare `abstract` alternative — JS
  // regex alternation is leftmost-first, so `abstract class Foo` must try
  // (and succeed at) the two-word form before the bare keyword is offered.
  // Descriptive leaves take an optional unconditional `mix_` prefix (Mode.WITH_MIX_PREFIX).
  // T14 (dispatch-by-parse-attempt): `protocol` added -- see `ClassifierKind`'s
  // `'protocol'` member doc (class-classifier-ast.ts) for the citation.
  // T3: eight more TYPE alternatives, all present in the SAME upstream
  // alternation (`CommandCreateClassMultilines.java:103`,
  // `CommandCreateClass.java:87`) but previously unported --
  // `static\s+class` (LeafType.getLeafType: any TYPE starting "STATIC" maps
  // to LeafType.CLASS, `abel/LeafType.java:79-80`; `entity.setStatic(true)`
  // is XMI-export-only, `xmi/XmiClassDiagramAbstract.java:183-184`, no SVG
  // rendering effect -- so `static class` collapses onto plain `class`
  // below, matching upstream's own SVG-relevant behaviour exactly), and
  // `struct|exception|metaclass|stereotype|dataclass|record` (all
  // `LeafType.isLikeClass()` members, `abel/LeafType.java:88-91` --
  // `EntityImageClassHeader`/`badgeFill`/`badgeLetter`'s existing "default/
  // unsurveyed kind" fallback already renders them, the SAME posture T14
  // recorded for `protocol` before it was jar-verified). `diamond` is
  // `CommandCreateClass.java:87`-only (single-line; absent from
  // `CommandCreateClassMultilines`'s own TYPE list) but folded into this
  // port's ALREADY-merged single/multi regex alongside `circle`/`protocol`
  // (both themselves Multilines-only upstream) -- same existing-precedent
  // widening, not a new one. `LeafType.getLeafType`: any TYPE starting
  // "DIAMOND" maps to `LeafType.STATE_CHOICE` (`abel/LeafType.java:76-77`),
  // rendered by `EntityImageBranch` (`svek/GeneralImageBuilder.java:151`) --
  // geometrically IDENTICAL (`SIZE=12`, same `UPolygon`, same default
  // background) to `LeafType.ASSOCIATION`'s `EntityImageAssociation`
  // (`svek/GeneralImageBuilder.java:206-207`) already backing this port's
  // `<> name` command (`kind: 'association'`, rule 5c,
  // class-command-containers.ts) -- jar-verified byte-identical polygon
  // geometry on `gegosa-79-mini423`'s golden (`diamond diamond1`, no `as`)
  // and `taboco-79-pire192`'s (`diamond diamond1 as "..."` -- the display
  // text is never drawn for either LeafType, confirmed absent from both
  // goldens), so `diamond` reuses `kind: 'association'` for SIZE and DOT
  // shape. cdd5-T4b: the two images are NOT identical in structure --
  // `EntityImageBranch.java:86-94` opens an entity group ("group.put(
  // UGroupType.CLASS, \"entity\"); ... ug.startGroup(group);") that
  // `EntityImageAssociation#drawU` never does -- so the `diamond` keyword is
  // kept as `usymbol` and `renderer.ts` wraps it.
  '^' +
    VISIBILITY_PREFIX +
    '(abstract\\s+class|static\\s+class|abstract|class|interface|enum|annotation|entity|circle|diamond|protocol|' +
    'struct|exception|metaclass|stereotype|dataclass|record|' +
    '(?:mix_)?(?:' +
    ALL_DESCRIPTIVE_LEAF +
    ')' +
    ')\\s+(.+)$',
  'i',
);
const DESCRIPTIVE_LEAF_RE = new RegExp(`^(?:${DESCRIPTIVE_LEAF_KEYWORDS})$`, 'i');
const USECASE_LEAF_RE = new RegExp(`^(?:${USECASE_LEAF_KEYWORDS})$`, 'i');

/** Map a matched keyword to its ClassifierKind + optional descriptive usymbol.
 *  cdd5-T4b: `usecase/` keeps its raw keyword as `usymbol` (the same raw-
 *  keyword convention descriptive leaves use) -- `LeafType.USECASE_BUSINESS`,
 *  `CommandCreateElementFull2.java:236-237`: "} else if (symbol
 *  .equalsIgnoreCase(\"usecase/\")) { type = LeafType.USECASE_BUSINESS;". */
function resolveDeclKind(rawKind: string): {
  kind: ClassifierKind;
  usymbol?: string;
} {
  if (USECASE_LEAF_RE.test(rawKind))
    return rawKind === 'usecase/' ? { kind: 'usecase', usymbol: rawKind } : { kind: 'usecase' };
  if (rawKind === STATE_LEAF_KEYWORD) return { kind: 'state' };
  if (DESCRIPTIVE_LEAF_RE.test(rawKind)) return { kind: 'descriptive', usymbol: rawKind };
  if (rawKind === 'abstract class') return { kind: 'abstract' };
  // T3: see DECL_KIND_RE's own doc comment for both citations.
  if (rawKind === 'static class') return { kind: 'class' };
  // cdd5-T4b: the keyword rides along as `usymbol` so the renderer can tell
  // `EntityImageBranch` (grouped) from `<>`'s `EntityImageAssociation`
  // (bare) -- see DECL_KIND_RE's comment.
  if (rawKind === 'diamond') return { kind: 'association', usymbol: rawKind };
  return { kind: rawKind as ClassifierKind };
}

export function parseClassifierDecl(line: string): ClassifierDecl | null {
  const kindMatch = DECL_KIND_RE.exec(line);
  if (kindMatch === null) return null;

  // Strip the unconditional `mix_` prefix — it doesn't change kind/usymbol.
  // group 1 = VISIBILITY_PREFIX's capture; group 2 = TYPE; group 3 = the
  // rest of the line.
  const rawKind = kindMatch[2]!.replace(/\s+/, ' ').toLowerCase().replace(/^mix_/, '');
  const { kind, usymbol } = resolveDeclKind(rawKind);

  const { inlineMembers, opensBody, rest: body } = extractBody(kindMatch[3]!.trim());
  // EXTENDS/IMPLEMENTS sit to the right of COLOR/LINECOLOR in the grammar
  // (CommandCreateClass.java:99-108), so they must be stripped first — color
  // extraction is anchored to the current end of the remainder.
  const { rest: afterInheritance, extendsIds, implementsIds } = extractInheritance(body);
  const { rest, stereotype, color, tags, url } = extractDecorations(afterInheritance);
  const { id, display, typeParams, typeParamsRawText } = parseDeclIdDisplay(kind, rest);
  if (id === '' || display === '') return null;

  return {
    id,
    display,
    kind,
    typeParams,
    opensBody,
    inlineMembers,
    extendsIds,
    implementsIds,
    tags,
    ...(stereotype !== undefined ? { stereotype } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(usymbol !== undefined ? { usymbol } : {}),
    ...(url !== undefined ? { url } : {}),
    ...(typeParamsRawText !== undefined ? { typeParamsRawText } : {}),
    ...(kindMatch[1] !== undefined ? { visibilityModifier: kindMatch[1] as Visibility } : {}),
  };
}

/** The kinds `resolveDeclKind` maps from `CommandCreateElementFull2`'s
 *  SYMBOL (`state|` + `CommandCreateElementFull.ALL_TYPES`), never from a
 *  class-command TYPE. */
const ELEMENT_FULL2_KINDS: ReadonlySet<ClassifierKind> = new Set<ClassifierKind>(['descriptive', 'usecase', 'state']);

/** `StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote(String)`'s
 *  one-arg format, `StringUtils.java:83-87`. */
const ELEMENT_CODE_STRIP_FORMAT = '"([:';

const QUOTED_CODE_RE = new RegExp(String.raw`^"[^"]*"$`);
const AS_RE = new RegExp(String.raw`\s+as\s+`);
/** CODE_CORE's decorated alternatives (`CommandCreateElementFull.java:126`):
 *  one token even when an ` as ` sits inside them. */
const DECORATED_CODE_RE = new RegExp(String.raw`^(?:\([^()]+\)|\[[^[\]]+\]|:[^:]+:)$`);
/** `DISPLAY2 as CODE2` with a bare (unquoted) display. */
const BARE_ALIAS_RE = new RegExp(String.raw`^[^"\s]\S*\s+as\s+[^"\s]\S*$`);

function stripOnce(s: string): string {
  return eventuallyRemoveStartingAndEndingDoubleQuote(s, ELEMENT_CODE_STRIP_FORMAT) ?? s;
}

/**
 * cdd5-T4b: a descriptive/usecase/state leaf (`CommandCreateElementFull2`)
 * strips its CODE and its DISPLAY once each with the `"([:` format --
 * `CommandCreateElementFull2.java:201` ("displayRaw = StringUtils
 * .eventuallyRemoveStartingAndEndingDoubleQuote(arg.getLazzy(\"DISPLAY\",
 * 0))") and `:249-250` ("idShort = StringUtils.eventuallyRemoveStarting
 * AndEndingDoubleQuote(codeRaw); ... displayRaw == null ? idShort :
 * displayRaw"). `parseIdDisplay` already removed the quotes of a quoted
 * token, so only a BARE token is stripped here: a lone quoted CODE1 and a
 * quoted display keep whatever brackets were inside the quotes.
 *
 * Not ported: the `codeChar`/`codeDisplay` symbol override right above it
 * (java:202-215 -- a `(`, `:` or `[` first char turns the leaf into a
 * usecase, actor or component).
 */
function stripElementCode(rest: string, parsed: { id: string; display: string }): { id: string; display: string } {
  const r = rest.trim();
  if (QUOTED_CODE_RE.test(r)) return parsed;
  const id = stripOnce(parsed.id);
  const single = !AS_RE.test(r) || DECORATED_CODE_RE.test(r);
  if (single) return { id, display: id };
  return { id, display: BARE_ALIAS_RE.test(r) ? stripOnce(parsed.display) : parsed.display };
}

/** `parseIdDisplay`, then {@link stripElementCode} for a
 *  `CommandCreateElementFull2` kind. */
function parseDeclIdDisplay(kind: ClassifierKind, rest: string): ReturnType<typeof parseIdDisplay> {
  const parsed = parseIdDisplay(rest);
  return ELEMENT_FULL2_KINDS.has(kind) ? { ...parsed, ...stripElementCode(rest, parsed) } : parsed;
}

/**
 * A single `$tag` token — upstream `Stereotag.SINGLE`
 * (`\$[^%s{}%g<>$]+`: `$` followed by 1+ chars excluding whitespace, braces,
 * quotes, angle brackets, and `$`). The lookbehind/lookahead anchor each
 * match to a whole whitespace-delimited token so a literal `$` embedded
 * mid-identifier (e.g. an inner-class-style `Instruction$Visitor` id) is
 * never mistaken for a tag. Upstream's TAGS1 (before the stereotype) and
 * TAGS2 (after) slots are both stripped in one global pass inside
 * {@link extractDecorations} — removal is a set of independent substring
 * deletions, so order does not change the result.
 * @see ~/git/plantuml/.../stereo/Stereotag.java
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java#addTags
 */
export interface InheritanceParent {
  id: string;
  kind: ClassifierKind;
  relType: RelationshipType;
}

/**
 * Resolve a declaration's `extends`/`implements` clauses into the parent
 * classifiers to create-or-reuse plus the relationship type linking each back
 * to the child. Mirrors `CommandCreateClassMultilines#manageExtends`: EXTENDS
 * forces the parent to `class` unless the child is itself an `interface` (an
 * interface can only extend another interface), in which case the parent
 * follows as `interface` too — both cases render a solid triangle
 * ('extension'). IMPLEMENTS always forces the parent to `interface`; the
 * triangle is dashed ('implementation') unless the child is itself an
 * `interface` (interface-implements-interface renders solid, like EXTENDS).
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java:333-365
 */
export function resolveInheritance(
  childKind: ClassifierKind,
  extendsIds: readonly string[],
  implementsIds: readonly string[],
): InheritanceParent[] {
  const parents: InheritanceParent[] = [];
  for (const id of extendsIds) {
    const kind: ClassifierKind = childKind === 'interface' ? 'interface' : 'class';
    parents.push({ id, kind, relType: 'extension' });
  }
  for (const id of implementsIds) {
    const dashed = childKind !== 'interface';
    parents.push({ id, kind: 'interface', relType: dashed ? 'implementation' : 'extension' });
  }
  return parents;
}

/** Parse a run of whitespace-separated `$tag` tokens (a note command's TAGS
 *  capture, upstream `Stereotag.pattern()`) into bare tag names. */
export function parseTagTokens(raw: string): string[] {
  return raw
    .split(/\s+/)
    .filter((t) => t.startsWith('$'))
    .map((t) => t.slice(1));
}

/**
 * Apply a parsed classifier declaration to the AST (create + set fields + body).
 * (Moved from class-commands.ts for the line cap — declaration semantics.)
 *
 * `alwaysSetLastEntity` distinguishes two upstream commands that both funnel
 * through this helper:
 *  - native `class`/`interface`/`enum`/... keywords (`CommandCreateClass` /
 *    `CommandCreateClassMultilines`) call `diagram.setLastEntity(entity)`
 *    UNCONDITIONALLY, even when the declaration re-resolves an
 *    already-existing entity (e.g. `separator none` merging a bare name into
 *    one declared earlier in another scope) — pass `true`.
 *  - descriptive leaves (`database X`; `CommandCreateElementFull2`) have no
 *    such call — lastEntity only moves when `ensureClassifier` (the
 *    `reallyCreateLeaf` chokepoint) actually creates a new entity — pass
 *    `false`.
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClass.java:202
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java:254,403
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateElementFull2.java:254
 *      (reallyCreateLeaf only — no explicit setLastEntity)
 */
export function applyClassifierDecl(state: ParseState, decl: ClassifierDecl, alwaysSetLastEntity: boolean): void {
  const before = state.ast.classifiers.length;
  const classifier = ensureClassifier(state, decl.id, decl.kind, decl.display);
  if (alwaysSetLastEntity) {
    const existed = state.ast.classifiers.length === before && state.classifierIndex.has(classifier.id);
    if (existed && refuseFailedMute(state, decl, classifier.kind)) return;
    state.lastEntity = classifier.id;
    applyVisibilityModifier(classifier, decl.visibilityModifier);
  }
  classifier.kind = decl.kind;
  copyDeclDecorations(classifier, decl);
  // Accumulate + dedup — upstream Entity#addStereotag adds into a Set, so a
  // re-declaration's tags join the earlier ones instead of replacing them.
  if (decl.tags.length > 0) {
    classifier.tags = [...new Set([...(classifier.tags ?? []), ...decl.tags])];
  }
  for (const memberStr of decl.inlineMembers) {
    const member = parseMemberLine(memberStr);
    if (member !== null) classifier.members.push(member);
  }
  applyInheritanceClauses(state, classifier.id, decl);
  if (decl.opensBody) state.pendingBodyId = classifier.id;
}

/** The declaration's optional usymbol/generic/stereotype/color/url fields --
 *  split out of {@link applyClassifierDecl} purely for its CCN cap (pure
 *  move, no behaviour change). */
function copyDeclDecorations(classifier: Classifier, decl: ClassifierDecl): void {
  if (decl.usymbol !== undefined) classifier.usymbol = decl.usymbol;
  if (decl.typeParams.length > 0) classifier.typeParams = decl.typeParams;
  if (decl.typeParamsRawText !== undefined) classifier.typeParamsRawText = decl.typeParamsRawText;
  if (decl.stereotype !== undefined) classifier.stereotype = decl.stereotype;
  if (decl.color !== undefined) classifier.color = decl.color;
  if (decl.url !== undefined) classifier.url = decl.url;
}

/** `Entity#muteToType`'s two whitelists (`abel/Entity.java:212-222`): the
 *  kinds an existing entity may mute FROM, and (plus OBJECT) TO. Port kinds:
 *  `abstract` is `LeafType.ABSTRACT_CLASS` (`LeafType.java:72-73`). */
const MUTABLE_FROM: ReadonlySet<ClassifierKind> = new Set<ClassifierKind>([
  'annotation',
  'abstract',
  'class',
  'enum',
  'interface',
  'record',
  'dataclass',
]);
const MUTABLE_TO: ReadonlySet<ClassifierKind> = new Set<ClassifierKind>([...MUTABLE_FROM, 'object']);

/** `CommandCreateClass.java:196` ("Bad name") and
 *  `CommandCreateClassMultilines.java:246`'s message. */
const BAD_NAME = 'Bad name';

/**
 * cdd5-T4b: an existing entity re-declared with another TYPE must pass
 * `Entity#muteToType` (`abel/Entity.java:205-230`: "if (newType ==
 * this.leafType) return true;" then both whitelists, else "return false;").
 * On failure both class commands return an execution error before touching
 * the entity -- the single-line one "Bad name" (`CommandCreateClass.java:
 * 195-197`), the multi-line one "Cannot create " + idShort + " because it
 * already exists" (`CommandCreateClassMultilines.java:245-246`). A `{ ... }`
 * body or inline members mean the multi-line command matched.
 *
 * Not ported: the multi-line command's error is attributed to its block's
 * LAST line (the whole block is one `BlocLines`); this refusal carries the
 * opener's line, since the closing `}` is consumed in `parser.ts`.
 */
function refuseFailedMute(state: ParseState, decl: ClassifierDecl, oldKind: ClassifierKind): boolean {
  if (oldKind === decl.kind) return false;
  if (MUTABLE_FROM.has(oldKind) && MUTABLE_TO.has(decl.kind)) return false;
  const multiline = decl.opensBody || decl.inlineMembers.length > 0;
  const message = multiline ? `Cannot create ${decl.id} because it already exists` : BAD_NAME;
  const line = state.currentLine ?? 0;
  state.executionRefusal = refuse('execution', line, line, message, 0);
  return true;
}

/**
 * cdd5-T4b: `entity.setVisibilityModifier(visibilityModifier)` runs
 * unconditionally after `setLastEntity` in both class commands, so a plain
 * redeclaration clears an earlier marker (`null`). Descriptive leaves
 * (`CommandCreateElementFull2`) have no VISIBILITY slot and never call it --
 * hence gated on the same `alwaysSetLastEntity` flag.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClass.java:202-203
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClassMultilines.java:254-256
 */
function applyVisibilityModifier(classifier: Classifier, modifier: Visibility | undefined): void {
  if (modifier === undefined) delete classifier.visibilityModifier;
  else classifier.visibilityModifier = modifier;
}

/** `extends A, B` / `implements C`: create each parent (scope-local lookup —
 *  mirrors manageExtends' quarkInContext(false, ...)) and link back to
 *  `childId`. @see resolveInheritance */
function applyInheritanceClauses(state: ParseState, childId: string, decl: ClassifierDecl): void {
  for (const parent of resolveInheritance(decl.kind, decl.extendsIds, decl.implementsIds)) {
    const p = ensureClassifier(state, parent.id, parent.kind);
    // G2 N43 (tebito-30-cozi447/xemife-30-cada335, jar-verified uid off-by-
    // one): stamp AFTER the parent endpoint resolves/auto-creates -- mirrors
    // the primary relationship-dispatch site's own identical ordering
    // (class-commands.ts's "6. relationship" rule, same doc comment there)
    // -- an auto-created endpoint's own uid always precedes the link's. This
    // call site (inline `extends`/`implements`) never stamped `creationIndex`
    // on its own relationship at all, so `renderer-uid.ts#hasExactCreationOrder`
    // (`geo.edges.every((e) => e.creationIndex !== undefined)`) always failed
    // for ANY diagram containing one, silently dropping the WHOLE diagram to
    // the less-precise fallback numbering -- not just the inheritance edge's
    // own id.
    state.creationCounter.value += 1;
    state.ast.relationships.push({
      from: childId,
      to: p.id,
      type: parent.relType,
      creationIndex: state.creationCounter.value,
      // `manageExtends` builds `Link(cl1 = parent, cl2 = child)` and never
      // reverses it (see the jar-verified note below), so the parent leads
      // in dot regardless of which side was written first.
      parentIsLinkEntity1: true,
      // T1/B33: `manageExtends` builds `Link(cl1 = parent, cl2 = child)`
      // while this port normalizes to `from` = child / `to` = parent, so
      // the dot edge runs `to -> from`. Stated explicitly rather than
      // inferred from ids, same as the arrow-grammar path.
      dotEdgeReversed: true,
      // G2 N9: inline `extends`/`implements` builds the relationship
      // OUTSIDE the arrow-token grammar entirely (no `parseRelationshipLine`
      // call, hence no `swapDirection`/`upOrLeft` machinery) -- Java's own
      // `CommandCreateClassMultilines#manageExtends` always constructs
      // `Link(location, ..., cl1=parent, cl2=child, ...)`, decor at the
      // PARENT's end only (the triangle), NEVER reversed -- jar-verified
      // against every inline form (fexedu-26-dira713's four relationships,
      // fijali-69-pina030's "Servlet-backto-GenericServlet"): always
      // "parent-backto-child", never "child-to-parent". No `codeLine`
      // either (jar-verified: 0/5 sampled inline-extends edges carry one,
      // unlike arrow-token relationships) -- `sourceLine` deliberately
      // left unset.
      idEntity1: idLeaf(parent.id, state.namespaceSeparator),
      idEntity2: idLeaf(decl.id, state.namespaceSeparator),
      idEntity1Decor: 'triangle',
      idEntity2Decor: 'none',
      // G2 N30: full (non-leaf) ids for the SAME parent-backto-child pair --
      // see `ast.ts#Relationship.idEntity1FullId`'s doc comment.
      idEntity1FullId: parent.id,
      idEntity2FullId: decl.id,
    });
  }
}
