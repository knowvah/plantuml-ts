/**
 * Classifier declaration line parsing for PlantUML class diagrams.
 *
 * Extracted from parser.ts (pure move, no behavior change) to keep
 * parser.ts under the repo's 500-line-per-file cap.
 */

import type { ClassifierKind, RelationshipType } from './ast.js';
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
const DECL_KIND_RE = new RegExp(
  // `abstract\s+class` must precede the bare `abstract` alternative — JS
  // regex alternation is leftmost-first, so `abstract class Foo` must try
  // (and succeed at) the two-word form before the bare keyword is offered.
  // Descriptive leaves take an optional unconditional `mix_` prefix (Mode.WITH_MIX_PREFIX).
  '^(abstract\\s+class|abstract|class|interface|enum|annotation|entity|circle|' +
    '(?:mix_)?(?:' + ALL_DESCRIPTIVE_LEAF + ')' +
    ')\\s+(.+)$',
  'i',
);
const DESCRIPTIVE_LEAF_RE = new RegExp(`^(?:${DESCRIPTIVE_LEAF_KEYWORDS})$`, 'i');
const USECASE_LEAF_RE = new RegExp(`^(?:${USECASE_LEAF_KEYWORDS})$`, 'i');

/** Map a matched keyword to its ClassifierKind + optional descriptive usymbol.
 *  `usecase/` (business) collapses onto plain `usecase` — same ellipse; the
 *  double-border decoration is SVG-only and deferred (DOT parity first). */
function resolveDeclKind(rawKind: string): {
  kind: ClassifierKind;
  usymbol?: string;
} {
  if (USECASE_LEAF_RE.test(rawKind)) return { kind: 'usecase' };
  if (rawKind === STATE_LEAF_KEYWORD) return { kind: 'state' };
  if (DESCRIPTIVE_LEAF_RE.test(rawKind))
    return { kind: 'descriptive', usymbol: rawKind };
  if (rawKind === 'abstract class') return { kind: 'abstract' };
  return { kind: rawKind as ClassifierKind };
}

export function parseClassifierDecl(line: string): ClassifierDecl | null {
  const kindMatch = DECL_KIND_RE.exec(line);
  if (kindMatch === null) return null;

  // Strip the unconditional `mix_` prefix — it doesn't change kind/usymbol.
  const rawKind = kindMatch[1]!.replace(/\s+/, ' ').toLowerCase().replace(/^mix_/, '');
  const { kind, usymbol } = resolveDeclKind(rawKind);

  const { inlineMembers, opensBody, rest: body } = extractBody(
    kindMatch[2]!.trim(),
  );
  // EXTENDS/IMPLEMENTS sit to the right of COLOR/LINECOLOR in the grammar
  // (CommandCreateClass.java:99-108), so they must be stripped first — color
  // extraction is anchored to the current end of the remainder.
  const { rest: afterInheritance, extendsIds, implementsIds } =
    extractInheritance(body);
  const { rest, stereotype, color, tags, url } = extractDecorations(afterInheritance);
  const { id, display, typeParams, typeParamsRawText } = parseIdDisplay(rest);
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
  };
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
export function applyClassifierDecl(
  state: ParseState,
  decl: ClassifierDecl,
  alwaysSetLastEntity: boolean,
): void {
  const classifier = ensureClassifier(state, decl.id, decl.kind, decl.display);
  if (alwaysSetLastEntity) state.lastEntity = classifier.id;
  classifier.kind = decl.kind;
  if (decl.usymbol !== undefined) classifier.usymbol = decl.usymbol;
  if (decl.typeParams.length > 0) classifier.typeParams = decl.typeParams;
  if (decl.typeParamsRawText !== undefined) classifier.typeParamsRawText = decl.typeParamsRawText;
  if (decl.stereotype !== undefined) classifier.stereotype = decl.stereotype;
  if (decl.color !== undefined) classifier.color = decl.color;
  if (decl.url !== undefined) classifier.url = decl.url;
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
      from: childId, to: p.id, type: parent.relType,
      creationIndex: state.creationCounter.value,
      // `manageExtends` builds `Link(cl1 = parent, cl2 = child)` and never
      // reverses it (see the jar-verified note below), so the parent leads
      // in dot regardless of which side was written first.
      parentIsLinkEntity1: true,
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
