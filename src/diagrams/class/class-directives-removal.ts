/**
 * Directive APPLICATION + removal/hidden-id computation for class diagrams
 * (applyDirectives, computeRemovedIds/HiddenIds, filterRemovedEntities and
 * their link/pattern helpers). Split out of `class-directives.ts` (line cap);
 * depends one-way on the parse cluster there. Re-exported from it so import
 * sites are unchanged.
 */

import type { ClassDiagramAST, ClassNote, HideTarget } from './ast.js';
import { isMethodMember } from './class-layout-helpers.js';
import { NEVER_UNLINKED, cascadeHidden } from './class-directives-hide-cascade.js';

/**
 * cdd-T31 (E5 defect a): `ast.namespaceSeparator`'s DEFAULT is `"."`
 * (unset/`undefined` -- a hand-authored AST literal fixture, or a diagram
 * that never wrote `set separator`), but an EXPLICIT `null` (`set separator
 * none`) must stay `null`, not fold into the default -- `??` alone would
 * coalesce both. `undefined` and `null` are deliberately distinct here (see
 * the field's own doc comment on `ast.ts`).
 */
function resolveSeparator(ast: ClassDiagramAST): string | null {
  return ast.namespaceSeparator === undefined ? '.' : ast.namespaceSeparator;
}

/**
 * A2s R2g: does this hide/show directive reach this classifier? Upstream
 * `CommandHideShowByGender#executeArg` ANDs every gender with
 * `byPackage(getCurrentGroup())` when the directive line sits inside a
 * non-root group (classdiagram/command/CommandHideShowByGender.java:272-273),
 * and `byPackage.contains` is DIRECT parent-container equality only
 * (`group == test.getParentContainer()`, abel/EntityGenderUtils.java:91-104)
 * — a nested subpackage's entity does NOT match, and a root entity never
 * matches a scoped directive (jar-probe h1, jecopa-66-vepe168). An unscoped
 * (root-level) directive reaches everything.
 */
export function directiveAppliesTo(directive: { scopeNsId?: string }, classifier: { namespace?: string }): boolean {
  return directive.scopeNsId === undefined || classifier.namespace === directive.scopeNsId;
}

/**
 * Apply the accumulated hide/show directives to classifiers and their members.
 * Later directives (higher index in the array) override earlier ones because
 * show/hide are additive and last-writer-wins per target.
 *
 * A2s R2g: the fold is PER ENTITY — each classifier folds only the
 * directives that reach it ({@link directiveAppliesTo}: a directive parsed
 * inside a `package { }` block applies to that package's direct children
 * only), then the last applicable action per target wins. This mirrors
 * upstream's ordered `hideOrShow` rule list, where each entity asks
 * `gender.contains(this)` per rule (net/atmp/CucaDiagram.java#hideOrShow).
 *
 * Note on hide empty fields / hide empty methods:
 *   These directives affect the divider/section visibility, which is computed in
 *   layout (layoutClass reads ast.directives directly). No per-member flag is
 *   needed here — the directives are already stored in ast.directives for layout.
 */
export function applyDirectives(ast: ClassDiagramAST): void {
  if (ast.directives.length === 0) return;

  for (const classifier of ast.classifiers) {
    applyDirectivesToClassifier(classifier, foldEffectiveActions(ast.directives, classifier));
  }
}

/**
 * Resolve the final effective action per target for ONE classifier — folds
 * only the directives that reach it ({@link directiveAppliesTo}), last
 * applicable writer wins per target. Shared with `layout.ts`'s
 * pre-measurement fold (the `empty members`/`empty fields`/`empty methods`
 * consumers) so both sides gate group scope identically.
 */
export function foldEffectiveActions(
  directives: ClassDiagramAST['directives'],
  classifier: { namespace?: string },
): Map<HideTarget, 'hide' | 'show'> {
  const effectiveAction = new Map<HideTarget, 'hide' | 'show'>();
  for (const directive of directives) {
    if (!directiveAppliesTo(directive, classifier)) continue;
    effectiveAction.set(directive.target, directive.action);
  }
  return effectiveAction;
}

/** One classifier's share of {@link applyDirectives} (split for the
 *  complexity cap; body unchanged from the pre-R2g global version). */
function applyDirectivesToClassifier(
  classifier: ClassDiagramAST['classifiers'][number],
  effectiveAction: ReadonlyMap<HideTarget, 'hide' | 'show'>,
): void {
  const hideMembers = effectiveAction.get('members') === 'hide';
  const hideCircle = effectiveAction.get('circle') === 'hide';
  // G2 N27: bare `hide fields`/`hide methods` -- unconditional (no
  // emptiness gate, unlike `empty fields`/`empty methods` below in
  // layout.ts; no entity-id gate, unlike class-directives.ts's own
  // `applyHideShowEntityDirectives`).
  const hideFields = effectiveAction.get('fields') === 'hide';
  const hideMethods = effectiveAction.get('methods') === 'hide';

  // hide circle — suppress the C/I/A/E badge in the renderer
  if (hideCircle) {
    classifier.hideCircle = true;
  }

  // hide members — mark every member as hidden regardless of type
  if (hideMembers) {
    for (const member of classifier.members) {
      member.hidden = true;
    }
  }

  if (hideFields) {
    for (const member of classifier.members) {
      if (!isMethodMember(member)) member.hidden = true;
    }
  }
  if (hideMethods) {
    for (const member of classifier.members) {
      if (isMethodMember(member)) member.hidden = true;
    }
  }
  // #lizard forgives -- faithfully-ported directive marking (4 independent
  // target flags, one loop each), moved verbatim out of the pre-R2g
  // applyDirectives; porting discipline forbids restructuring it further
  // (CLAUDE.md "do not refactor while porting").
}

// ---------------------------------------------------------------------------
// remove / restore (CommandRemoveRestore → CucaDiagram#removeOrRestore)
// ---------------------------------------------------------------------------
//
// Unlike hide/show — which never reaches the svek export (a hidden entity
// still occupies its node in the DOT graph; verified against the oracle:
// doseko-41-mavu661's `hide *` + `show $z` DOT is byte-identical to the
// directive-free sevaxa-72-pudi231) — `remove` excludes the matched entities
// from the exported graph entirely. The predicate is evaluated LAZILY at
// export time (GraphvizImageBuilder#printEntities / printGroups / the
// link.isRemoved() skip), after ALL parsing, over the accumulated directive
// list in source order with last-applicable-writer-wins per entity.
// @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:230,350,413
// @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:762-806
// @see ~/git/plantuml/.../cucadiagram/HideOrShow.java

/** A non-invisible link (relationship or attached-note connector), the unit
 *  the `@unlinked` predicate and note-delegation both iterate. Member-anchored
 *  notes (`targetPort` set) route as `style=invis` (note-layout.ts), matching
 *  upstream's invisible note link — those are excluded here, which is exactly
 *  what makes cejili-77's member-note "@unlinked" while its host stays linked. */
interface VisibleLink {
  a: string;
  b: string;
}

function collectVisibleLinks(ast: ClassDiagramAST): VisibleLink[] {
  const links: VisibleLink[] = [];
  for (const rel of ast.relationships) {
    if (rel.invis !== true) links.push({ a: rel.from, b: rel.to });
  }
  for (const note of ast.notes) {
    if (note.target !== undefined && note.targetPort === undefined) {
      links.push({ a: note.id, b: note.target });
    }
  }
  return links;
}

/** What an entity exposes to directive matching (classifier or note). */
interface RemovableEntity {
  id: string;
  tags?: string[];
  stereotype?: string;
}

/** `what.equalsIgnoreCase("@unlinked")` — HideOrShow#isAboutUnlinked. */
function isAboutUnlinked(what: string): boolean {
  return what.toLowerCase() === '@unlinked';
}

/**
 * HideOrShow#match: `*` wildcards become `.*` (other regex metacharacters are
 * NOT escaped — faithful to upstream's raw `pattern.replace("*", ".*")`);
 * a non-wildcard pattern is plain string equality.
 */
function matchPattern(name: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    return new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(name);
  }
  return name === pattern;
}

/**
 * cdd-T31 (A2b E5 defect a): entity-name matching strips the qualified name
 * down to its leaf segment ONLY when the diagram's ACTIVE separator is
 * magic (`sep === null`, `set separator none` -- upstream:
 * `name.lastIndexOf(Plasma.MAGIC_SEPARATOR)`, cucadiagram/HideOrShow.java:
 * 107-122, plasma/Plasma.java:52,85-88). A class diagram's DEFAULT
 * separator is `"."` (AbstractClassOrObjectDiagram.java:65 -> net/atmp/
 * CucaDiagram.java:144-148), not magic, so `pack1.Foo1` (built at
 * class-namespace-resolve.ts#qualifiedId) keeps its full qualified id here
 * and a bare `hide Foo1` no longer wrongly matches it (cicovi-23-zipe215).
 * `sep` is `ast.namespaceSeparator` -- see its own doc comment for why this
 * is a diagram-level (not upstream's per-entity-creation-time) flag. Tag
 * and stereotype matching (isApplyableTag/-Stereotype) use
 * {@link matchPattern} directly — upstream applies match() to them too, but
 * tag/stereotype labels never contain the separator, so the strip is a
 * no-op there.
 */
function matchEntityName(id: string, pattern: string, sep: string | null): boolean {
  if (sep !== null) return matchPattern(id, pattern);
  const m = /(?:::|\.)([^.:]+)$/.exec(id);
  return matchPattern(m !== null ? m[1]! : id, pattern);
}

/**
 * cdd-T31 (A2b E5 defect c): `CucaDiagram#fixWhat` (net/atmp/
 * CucaDiagram.java:638-646) -- a pattern-form directive parsed INSIDE a
 * non-root package/namespace has `what` PREFIXED with that group's
 * qualified id + separator, UNCONDITIONALLY (even for a `$tag`/
 * `<<stereotype>>`/`@unlinked` target -- upstream applies this before
 * `HideOrShow`'s own shape dispatch, so an in-package `hide $tag` stops
 * looking like a tag selector once prefixed; a faithfully preserved quirk,
 * not special-cased away here). No-op at the root (`scopeNsId` undefined)
 * or when the separator is magic (`sep === null`, fixWhat's own `sep !=
 * null` guard -- upstream never prefixes under `set separator none`).
 */
function fixWhat(what: string, scopeNsId: string | undefined, sep: string | null): string {
  if (sep === null || scopeNsId === undefined) return what;
  return `${scopeNsId}${sep}${what}`;
}

/** HideOrShow#isApplyable(Entity): `$tag` → stereotags; `<<s>>` → stereotype;
 *  `@unlinked` → isAloneAndUnlinked; else leaf-name match. `directive.what`
 *  is resolved through {@link fixWhat} FIRST (cdd-T31 defect c) -- every
 *  branch below dispatches on the (possibly group-prefixed) result. */
function isApplyable(
  e: RemovableEntity,
  directive: { what: string; scopeNsId?: string },
  unlinked: (id: string) => boolean,
  sep: string | null,
): boolean {
  const what = fixWhat(directive.what, directive.scopeNsId, sep);
  if (what.startsWith('$')) {
    return (e.tags ?? []).some((t) => matchPattern(t, what.slice(1)));
  }
  if (what.startsWith('<<') && what.endsWith('>>')) {
    return e.stereotype !== undefined && matchPattern(e.stereotype, what.slice(2, -2).trim());
  }
  if (isAboutUnlinked(what)) return unlinked(e.id);
  return matchEntityName(e.id, what, sep);
}

/** A `remove`/`restore` OR `hide`/`show`-pattern directive — both upstream
 *  command families accumulate into the SAME `HideOrShow` matcher shape
 *  (`what` + a two-valued action), just into different lists consulted at
 *  different boundaries (G2 N7 — {@link HideShowPatternDirective}'s own doc
 *  comment). Generic over the action's literal union so `foldDirectives`/
 *  `buildUnlinkedPredicate` serve both `computeRemovedIds` and
 *  `computeHiddenIds` without duplicating the matching logic. */
interface PatternDirective<A extends string> {
  what: string;
  action: A;
  /** cdd-T31 (E5 defect c): present only for {@link HideShowPatternDirective}
   *  (`RemoveRestoreDirective` has no such field, structurally `undefined`
   *  here -- `remove`/`restore`'s own in-package `fixWhat` prefix stays
   *  unported, matching `filterRemovedEntities`'s pre-existing "group
   *  removal not implemented" note). */
  scopeNsId?: string;
}

/** Fold the directive list over one entity — HideOrShow#apply chain: each
 *  applicable directive overwrites the running verdict (`return !show`), so
 *  the LAST applicable directive wins (`remove *` then `restore $tag1` /
 *  `hide *` then `show $tag1`). `positiveAction` is the action value that
 *  sets the verdict true (`'remove'` for remove/restore, `'hide'` for
 *  hide/show-pattern). `sep` is `ast.namespaceSeparator` (defect a/c). */
function foldDirectives<A extends string>(
  dirs: readonly PatternDirective<A>[],
  e: RemovableEntity,
  includeUnlinked: boolean,
  unlinked: (id: string) => boolean,
  positiveAction: A,
  sep: string | null,
): boolean {
  let matched = false;
  for (const d of dirs) {
    if (!includeUnlinked && isAboutUnlinked(d.what)) continue;
    if (isApplyable(e, d, unlinked, sep)) matched = d.action === positiveAction;
  }
  return matched;
}

/**
 * CucaDiagram#isNoteWithSingleLinkAttachedTo: a note with exactly ONE
 * non-invisible link whose other end is not itself a note delegates its
 * entire removed/hidden status to that neighbor. Returns the neighbor id, or
 * null when the note has zero, several, invisible-only, or note-to-note links
 * (then the note answers for itself).
 */
function noteSingleLinkOther(
  note: ClassNote,
  links: readonly VisibleLink[],
  noteIds: ReadonlySet<string>,
): string | null {
  let other: string | null = null;
  for (const l of links) {
    const o = l.a === note.id ? l.b : l.b === note.id ? l.a : null;
    if (o === null) continue;
    if (other !== null) return null; // more than one link
    if (noteIds.has(o)) return null; // other end is a note
    other = o;
  }
  return other;
}

/** Fold `dirs` over every classifier, adding a match to `into` -- shared
 *  loop body for {@link computeRemovedIds}/{@link computeHiddenIds} (T31
 *  CCN split; no behavior change). */
function foldClassifiersInto<A extends string>(
  into: Set<string>,
  ast: ClassDiagramAST,
  dirs: readonly PatternDirective<A>[],
  unlinked: (id: string) => boolean,
  positiveAction: A,
  sep: string | null,
): void {
  for (const c of ast.classifiers) {
    if (foldDirectives(dirs, c, true, unlinked, positiveAction, sep)) into.add(c.id);
  }
}

/** Fold `dirs` over every note (single-link delegation first) -- shared
 *  loop body for {@link computeRemovedIds}/{@link computeHiddenIds}. `into`
 *  is read for delegation AND written for the note's own verdict, matching
 *  the original inline loops' semantics exactly. */
function foldNotesInto<A extends string>(
  into: Set<string>,
  ast: ClassDiagramAST,
  dirs: readonly PatternDirective<A>[],
  links: readonly VisibleLink[],
  noteIds: ReadonlySet<string>,
  unlinked: (id: string) => boolean,
  positiveAction: A,
  sep: string | null,
): void {
  for (const n of ast.notes) {
    const other = noteSingleLinkOther(n, links, noteIds);
    const isMatch = other !== null ? into.has(other) : foldDirectives(dirs, n, true, unlinked, positiveAction, sep);
    if (isMatch) into.add(n.id);
  }
}

/**
 * Compute the set of removed entity ids (classifiers AND notes) for the
 * accumulated `remove`/`restore` directives. Pure — evaluated once at the
 * layout-input boundary (mirroring upstream's export-time evaluation; by then
 * all parsing is done, which is what makes `@unlinked` see the final link
 * set).
 *
 * `Entity#isAloneAndUnlinked`: an entity is unlinked when every one of its
 * non-invisible links connects to an entity already removed by a
 * NON-`@unlinked` directive (`isRemovedIgnoreUnlinked` — no delegation, no
 * unlinked recursion; that restriction is what keeps the predicate
 * terminating and order-independent).
 * @see ~/git/plantuml/.../abel/Entity.java:457-476
 */
export function computeRemovedIds(ast: ClassDiagramAST): Set<string> {
  const dirs = ast.removeDirectives ?? [];
  const removed = new Set<string>();
  if (dirs.length === 0) return removed;

  const sep = resolveSeparator(ast);
  const links = collectVisibleLinks(ast);
  const noteIds = new Set(ast.notes.map((n) => n.id));
  const unlinked = buildUnlinkedPredicate(ast, dirs, links, 'remove', sep);

  foldClassifiersInto(removed, ast, dirs, unlinked, 'remove', sep);
  foldNotesInto(removed, ast, dirs, links, noteIds, unlinked, 'remove', sep);
  return removed;
}

/**
 * Compute the set of HIDDEN entity ids (classifiers, NAMESPACES, AND notes)
 * for the accumulated `hide`/`show <entity|$tag|<<stereotype>>|*|@unlinked>`
 * directives ({@link HideShowPatternDirective}) — same shape and same
 * matching engine as {@link computeRemovedIds} (upstream shares the
 * `HideOrShow` class between `hides2` and `removed`), but the caller MUST
 * NOT filter the AST with this set — a hidden entity keeps its svek/DOT
 * node; only its drawn content is suppressed (`layout.ts` marks
 * `ClassifierGeo.hidden` from this set; `renderer.ts` skips content for a
 * hidden classifier while every uid/creationIndex/layout computation runs
 * exactly as if it were visible).
 *
 * cdd-T31 (E5 defect b): NAMESPACES are folded too (a `hide util`/`hide
 * $tag` on a `package`/`namespace` header), and the result is CASCADED down
 * `parentId`/`namespace` ancestor chains — `Entity#isHidden` makes no leaf/
 * group distinction (`parentContainer.isHidden()` recurses up before the
 * entity's own fold is even consulted, abel/Entity.java:428-440). Namespace
 * folding excludes `@unlinked` (`includeUnlinked=false` below): the shared
 * `unlinked` predicate is built from `links`, which never references a
 * namespace id, so it would vacuously match every namespace (`.every()` on
 * zero relevant links) — `Entity#isAloneAndUnlinked`'s GROUP branch (a
 * recursive descendant check, abel/Entity.java:456-462) is not ported.
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java#isHidden
 */
/** Fold `dirs` over every namespace, adding a match to `into` -- see
 *  {@link computeHiddenIds}'s own comment for why `@unlinked` is excluded
 *  (`NEVER_UNLINKED`) for this walk only. */
function foldNamespacesInto<A extends string>(
  into: Set<string>,
  ast: ClassDiagramAST,
  dirs: readonly PatternDirective<A>[],
  positiveAction: A,
  sep: string | null,
): void {
  for (const ns of ast.namespaces) {
    if (foldDirectives(dirs, ns, false, NEVER_UNLINKED, positiveAction, sep)) into.add(ns.id);
  }
}

export function computeHiddenIds(ast: ClassDiagramAST): Set<string> {
  const dirs = ast.hidePatternDirectives ?? [];
  if (dirs.length === 0) return new Set();

  const sep = resolveSeparator(ast);
  const links = collectVisibleLinks(ast);
  const noteIds = new Set(ast.notes.map((n) => n.id));
  const unlinked = buildUnlinkedPredicate(ast, dirs, links, 'hide', sep);

  const own = new Set<string>();
  foldClassifiersInto(own, ast, dirs, unlinked, 'hide', sep);
  foldNamespacesInto(own, ast, dirs, 'hide', sep);
  foldNotesInto(own, ast, dirs, links, noteIds, unlinked, 'hide', sep);

  return cascadeHidden(ast, own);
}

/** `Entity#isAloneAndUnlinked`'s core: an id is unlinked when every visible
 *  link touching it connects to an entity removed by a NON-`@unlinked`
 *  directive (`isRemovedIgnoreUnlinked` — folded directly, no note delegation,
 *  no unlinked recursion — which keeps the predicate terminating). */
function buildUnlinkedPredicate<A extends string>(
  ast: ClassDiagramAST,
  dirs: readonly PatternDirective<A>[],
  links: readonly VisibleLink[],
  positiveAction: A,
  sep: string | null,
): (id: string) => boolean {
  const byId = new Map<string, RemovableEntity>();
  for (const c of ast.classifiers) byId.set(c.id, c);
  for (const n of ast.notes) byId.set(n.id, n);

  const removedIgnoreUnlinked = (id: string): boolean => {
    const e = byId.get(id);
    return e !== undefined && foldDirectives(dirs, e, false, NEVER_UNLINKED, positiveAction, sep);
  };
  return (id: string): boolean =>
    links.every((l) => {
      const o = l.a === id ? l.b : l.b === id ? l.a : null;
      return o === null || removedIgnoreUnlinked(o);
    });
}

/**
 * Exclude removed entities from the AST handed to the DOT-graph builder —
 * the port's equivalent of upstream's export-boundary `isRemoved()` skips
 * (printEntities / printGroups / link.isRemoved()). Returns the SAME object
 * when nothing is removed so the common no-directive path costs nothing.
 *
 * Group (namespace) removal — `remove aPackageName` — is not implemented:
 * `Namespace` carries no tags and no fixture in the current group exercises
 * it; membership lists are still filtered so clusters shrink with their
 * removed members.
 */
export function filterRemovedEntities(ast: ClassDiagramAST): ClassDiagramAST {
  const removed = computeRemovedIds(ast);
  if (removed.size === 0) return ast;
  return {
    ...ast,
    classifiers: ast.classifiers.filter((c) => !removed.has(c.id)),
    notes: ast.notes.filter((n) => !removed.has(n.id)),
    relationships: ast.relationships.filter((r) => !removed.has(r.from) && !removed.has(r.to)),
    namespaces: ast.namespaces.map((ns) => ({
      ...ns,
      classifiers: ns.classifiers.filter((id) => !removed.has(id)),
    })),
  };
}

// cdd-T31 (line cap): computeRemovedRanks (cdd-T3, A1 SB5) moved to
// class-directives-remove-ranks.ts -- re-exported so every existing
// `from './class-directives-removal.js'`/`from './class-directives.js'`
// site is unchanged.
export { computeRemovedRanks } from './class-directives-remove-ranks.js';
