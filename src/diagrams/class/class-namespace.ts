/**
 * Namespace-splitting helpers for class diagrams.
 *
 * PlantUML derives nested namespaces from dotted (qualified) ids using the
 * namespace separator (default `.`, AbstractEntityDiagram.java:88), mirroring
 * its Quark hierarchy. Split out of `parser.ts` to keep that file within the
 * module line budget; these functions take explicit inputs rather than the
 * parser's mutable state.
 */

import type {
  Classifier,
  ClassifierKind,
  ClassDiagramAST,
  Namespace,
} from './ast.js';

/**
 * Register an id (classifier or note) as a direct member of the given
 * namespace, if one is set. Shared by `parser.ts` (classifiers) and
 * `class-notes.ts` (notes) — both are leaves that must land in
 * `Namespace.classifiers`, the sole source `buildDotClusters` (class-dot-graph.ts)
 * reads for cluster membership.
 */
export function registerInNamespace(
  namespaces: Namespace[],
  nsId: string | null,
  id: string,
): void {
  if (nsId === null) return;
  const ns = namespaces.find((n) => n.id === nsId);
  if (ns !== undefined) {
    ns.classifiers.push(id);
  }
}

/** Build a fresh Classifier assigned to the given namespace id (or none). */
export function makeClassifier(
  id: string,
  kind: ClassifierKind,
  display: string | undefined,
  nsId: string | null,
): Classifier {
  return {
    id,
    display: display ?? id,
    kind,
    typeParams: [],
    members: [],
    ...(nsId !== null ? { namespace: nsId } : {}),
  };
}

/**
 * Collapse a namespace/package into a plain rect leaf classifier when it is
 * empty, mirroring upstream `CommandNamespaceEmpty`/`CommandPackageEmpty`'s
 * `gotoGroup` + immediate `endGroup()` pair. Two callers, both immediate
 * (never look ahead): `class-commands.ts`'s same-line `X {}` handler, and
 * `class-container.ts#closeContainer`'s multi-line `}` close — but the
 * latter ONLY for descriptive containers (`rectangle`/`component`/…), which
 * cannot be reopened by name afterward. A plain `package`/`namespace` CAN be
 * reopened by a later block adding real content under it, so collapsing it
 * immediately on close is unsound in general — see
 * `collapseEmptyNamespacesFinal` below, which handles that case once on the
 * fully-parsed tree. Verified against the oracle DOT for gatula-10-bifu561
 * (same-line: `package foo {}` / `namespace bar {}` / `class qux {}`, all
 * three flat `shape=rect` leaves, no cluster).
 *
 * "Empty" means no direct classifier members AND no live child namespace —
 * `ns.classifiers` tracks only direct classifier ids (registered by
 * `registerInNamespace`), not nested sub-namespaces, which are separate
 * `Namespace` objects until THEY collapse or close. A namespace whose only
 * content is a still-open child namespace (e.g. `package P { rectangle R {
 * class C } }` closing `P` after `R` closed non-empty) is not empty, even
 * though `P.classifiers` is itself empty — mirrors upstream's
 * `Entity.isEmpty()` (abel/Entity.java:677-682), which iterates ALL quark
 * children (leaves and sub-groups alike), not just leaf classifiers.
 * Returns the updated namespaces array (the caller reassigns
 * `state.ast.namespaces`).
 * @see ~/git/plantuml/.../command/CommandNamespaceEmpty.java:104-135
 * @see ~/git/plantuml/.../command/CommandPackageEmpty.java:105-134
 */
export function collapseEmptyNamespace(
  namespaces: Namespace[],
  classifierIndex: Map<string, number>,
  classifiers: Classifier[],
  nsId: string,
): Namespace[] {
  const ns = namespaces.find((n) => n.id === nsId);
  const hasChildNamespace = namespaces.some((n) => n.parentId === nsId);
  if (ns === undefined || ns.classifiers.length > 0 || hasChildNamespace) return namespaces;
  const remaining = namespaces.filter((n) => n.id !== nsId);
  const parentId = ns.parentId ?? null;
  const classifier = makeClassifier(nsId, 'descriptive', ns.display, parentId);
  // leaf-draw-order option (b): mark the mute so `class-leaf-order.ts` can
  // keep this leaf at its GROUP slot even when `closeContainer` later stamps
  // a `usymbol` on it (a `<<Database>>` package, daxeno-00-kasu166) -- see
  // `Classifier.collapsedGroup`'s own doc comment.
  classifier.collapsedGroup = true;
  // G2 N33: without this, the synthesized classifier's DRAW-ORDER position
  // (both uid numbering, `renderer-uid.ts`, and the plain array-iteration
  // order `renderer.ts`'s classifier loop pushes children in) defaults to
  // wherever `classifiers.push` below lands it -- END of the array,
  // regardless of the namespace's own SOURCE position -- rather than its
  // real creation order. Jar draws an empty package/namespace's folder icon
  // at its OWN source position among sibling classifiers (jar-verified
  // `xitobu-41-lame230`: `package package {}` before `class foo` in source
  // draws the folder icon FIRST).
  if (ns.creationIndex !== undefined) classifier.creationIndex = ns.creationIndex;
  // A2s F-G mechanism A8: the group's stereotype survives the mute to
  // EMPTY_PACKAGE -- upstream reads `entity.getStereotype()` off the SAME
  // entity when building the leaf's stereo block, so the collapsed leaf
  // inherits it verbatim (widens the node via `measureEmptyPackageLeafDim`).
  // @see ~/git/plantuml/.../svek/image/EntityImageEmptyPackage.java:126-137
  if (ns.stereotype !== undefined) classifier.stereotype = ns.stereotype;
  classifierIndex.set(nsId, classifiers.length);
  classifiers.push(classifier);
  if (parentId !== null) {
    remaining.find((n) => n.id === parentId)?.classifiers.push(nsId);
  }
  return remaining;
}

/**
 * Collapse every remaining EMPTY namespace/package (no direct classifiers,
 * no live child namespace) once, on the fully-parsed + remove-filtered AST —
 * the reopen-safe counterpart of `collapseEmptyNamespace`'s parse-time
 * collapse. Mirrors upstream `GraphvizImageBuilder#printGroups`
 * (svek/GraphvizImageBuilder.java:406-419), which mutes ANY still-empty
 * `GroupType.PACKAGE` to `LeafType.EMPTY_PACKAGE` at DOT-export time, on the
 * COMPLETE diagram model — not per-block-close. Call after
 * `filterRemovedEntities` (class-directives.ts) so a namespace emptied only
 * because its sole member was excluded by `remove`/`restore` (which already
 * strips removed ids from `Namespace.classifiers`) is caught too, alongside
 * one declared empty in source.
 *
 * A namespace closed empty at parse time but later reopened with real
 * content (`namespace f1 {}` … `namespace f1.function { class Fox }`) is
 * fine here: by the time this runs, `f1` already has `f1.function` as a
 * live child namespace, so it fails the emptiness check and is left alone —
 * confirmed against the oracle DOT for delano-03-xino845/faxoga-34-moja699/
 * jabeme-35-logi109 (all reopen a previously-empty-closed namespace; all
 * regressed when this collapse was attempted eagerly at parse-time close
 * instead).
 *
 * Loops because collapsing one empty leaf can make its now-childless parent
 * eligible in turn (a chain of nested empty packages); each iteration either
 * collapses exactly one namespace or halts, so it terminates in at most
 * `ast.namespaces.length` steps. Returns `ast` unchanged (same reference)
 * when nothing collapses.
 */
export function collapseEmptyNamespacesFinal(ast: ClassDiagramAST): ClassDiagramAST {
  if (ast.namespaces.length === 0) return ast;
  let namespaces = ast.namespaces;
  const classifiers = [...ast.classifiers];
  const classifierIndex = new Map(classifiers.map((c, i) => [c.id, i] as const));
  for (;;) {
    const emptyLeaf = namespaces.find(
      (ns) => ns.classifiers.length === 0 && !namespaces.some((n) => n.parentId === ns.id),
    );
    if (emptyLeaf === undefined) break;
    namespaces = collapseEmptyNamespace(namespaces, classifierIndex, classifiers, emptyLeaf.id);
  }
  if (namespaces === ast.namespaces) return ast;
  return { ...ast, namespaces, classifiers };
}

// Namespace-qualified id parsing & reference resolution moved to a sibling
// module (line cap); re-exported so `from './class-namespace.js'` is unchanged.
export {
  splitTopLevelCommas, splitOnSeparator, ensureNamespaceChain, qualifiedId,
  countByName, firstWithName, resolveReference, normalizeSameConnectionLengths,
  GENERIC_BODY_PATTERN, GENERIC_CLAUSE_RE,
} from './class-namespace-resolve.js';
export type { ResolveInput, ResolvedRef } from './class-namespace-resolve.js';
