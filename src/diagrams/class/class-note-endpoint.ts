/**
 * cdd5-T5d: relationship-endpoint -> freestanding-note resolution, split out
 * of `class-notes.ts` (file cap). A freestanding note's id is its alias
 * resolved against the current group (`class-notes.ts#addFreestandingNote`,
 * `CommandFactoryNote.java:192`), so an endpoint must reach it through the
 * same quark resolution, not by raw string equality.
 */
import type { ClassDiagramAST } from './ast.js';
import { resolveReference } from './class-namespace-resolve.js';
import { stripQuotes } from './class-relationship-parser.js';

/** `ast.namespaceSeparator`'s default is `"."` when unset (a hand-built AST);
 *  an explicit `null` (`set separator none`) stays `null`. */
export function noteSeparator(ast: ClassDiagramAST): string | null {
  return ast.namespaceSeparator === undefined ? '.' : ast.namespaceSeparator;
}

/**
 * The note a relationship endpoint names, or `undefined`. Upstream resolves
 * every endpoint with `quarkInContextSafe(true, …)` (`CommandLinkClass.java
 * :320-325`) over ONE quark tree in which a note is a quark like any
 * classifier, so its `countByName(full) == 1` reuse (`CucaDiagram.java
 * :264-271`) counts notes too -- hence classifiers AND notes as the reuse
 * pool. A probe only: `resolveReference` runs over a COPY of the namespace
 * list, so a non-note endpoint registers no group chain here (the
 * classifier path that follows registers its own, in source order).
 * `activeNamespace` is `null` where the caller has no parse scope
 * (`class-assoc-couple.ts`).
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:249-275
 */
export function resolveNoteEndpoint(
  ast: ClassDiagramAST,
  name: string,
  activeNamespace: string | null,
): string | undefined {
  if (ast.notes.length === 0) return undefined;
  const { id } = resolveReference({
    namespaces: [...ast.namespaces],
    sep: noteSeparator(ast),
    activeNamespace,
    name: stripQuotes(name),
    display: undefined,
    classifiers: [...ast.classifiers, ...ast.notes],
    reuseExistingChild: true,
  });
  return ast.notes.some((n) => n.id === id) ? id : undefined;
}
