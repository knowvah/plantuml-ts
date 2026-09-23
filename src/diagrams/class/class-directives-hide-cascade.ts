/**
 * cdd-T31 (A2b E5 defect b): the namespace-ancestor cascade half of
 * `computeHiddenIds`, split out of `class-directives-removal.ts` (line
 * cap) -- re-exported nowhere (module-private consumer only), mirroring
 * this file family's own "split for the hook, no behavior change"
 * convention (see `class-directives-removal.ts`'s own header comment).
 *
 * `Entity#isHidden()` (abel/Entity.java:428-440) makes no leaf/group
 * distinction: a classifier, namespace, or note is hidden when its OWN
 * pattern-fold/note-delegation says so OR any enclosing container
 * (`getParentContainer()`, walked recursively) is.
 */
import type { ClassDiagramAST } from './ast.js';

/** cdd-T31: a directive that can never be `@unlinked`-applyable --
 *  {@link isApplyable}-equivalent callers only reach `unlinked` when `what`
 *  IS about `@unlinked`, so this never actually runs; it exists because the
 *  namespace fold passes `includeUnlinked=false` (see `computeHiddenIds`'s
 *  own comment for why) and `foldDirectives` still requires a callback of
 *  this shape. */
export const NEVER_UNLINKED = (): boolean => false;

/** `id`'s direct container -- a Namespace's `parentId`, or a classifier/
 *  note's `namespace` (its enclosing group) -- the port's stand-in for
 *  `Entity#getParentContainer()`. */
function buildContainerParentMap(ast: ClassDiagramAST): Map<string, string> {
  const parentOf = new Map<string, string>();
  for (const ns of ast.namespaces) if (ns.parentId !== undefined) parentOf.set(ns.id, ns.parentId);
  for (const c of ast.classifiers) if (c.namespace !== undefined) parentOf.set(c.id, c.namespace);
  for (const n of ast.notes) if (n.namespace !== undefined) parentOf.set(n.id, n.namespace);
  return parentOf;
}

/**
 * `Entity#isHidden()`'s ancestor half (abel/Entity.java:428-440) — a
 * classifier/namespace/note is hidden when its OWN fold/delegation says so
 * (`own`, computed by the caller) OR any enclosing container is (walking
 * {@link buildContainerParentMap} to the root). Memoized: `resolve` is
 * called once per id but ancestor chains overlap across siblings.
 * @see ~/git/plantuml/.../abel/Entity.java:428-440
 */
export function cascadeHidden(ast: ClassDiagramAST, own: ReadonlySet<string>): Set<string> {
  const parentOf = buildContainerParentMap(ast);
  const cache = new Map<string, boolean>();
  const resolve = (id: string): boolean => {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;
    cache.set(id, false); // cycle guard while this id is being resolved
    const parent = parentOf.get(id);
    const result = own.has(id) || (parent !== undefined && resolve(parent));
    cache.set(id, result);
    return result;
  };
  const hidden = new Set<string>();
  const allIds = [
    ...ast.classifiers.map((c) => c.id),
    ...ast.namespaces.map((n) => n.id),
    ...ast.notes.map((n) => n.id),
  ];
  for (const id of allIds) if (resolve(id)) hidden.add(id);
  return hidden;
}
