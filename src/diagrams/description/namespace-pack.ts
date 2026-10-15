/**
 * `!pragma useIntermediatePackages false` for descriptive diagrams -- the end-of-parse group packing
 * pass `DescriptionDiagram#checkFinalError` runs (before `applySingleStrategy`) through
 * `AbstractEntityDiagram#packSomePackage`: a package whose ONLY child is a package that itself has
 * children is folded into that child, whose title becomes `<parent title><separator><child title>`.
 *
 * Upstream keeps the folded group as a `packed` entity: it emits no DOT subgraph
 * (`svek/ClusterDotString.java:83-88`) and is never drawn (`svek/SvekResult.java:72-74`,
 * `svek/DotStringFactory.java:432-434`), but the uid its constructor burned stays burned. This port
 * hoists the child into the folded group's slot instead; the burned uid is simply the gap left in
 * `creationIndex`, and nothing downstream reads the folded group.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/AbstractEntityDiagram.java:85-106
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:717-733
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/DescriptionDiagram.java:91-98
 */
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { DescriptiveLink, DescriptiveNode } from './ast.js';
import { SCOPE_KEY_SEP, scopedKey, splitNamespacePath } from './namespace-groups.js';

/** `AbstractEntityDiagram#packSomePackage`'s fallback when no separator is set (:86-88). */
const DEFAULT_SEPARATOR = '.';

/** `Quark#countChildren` for a group: its DISTINCT direct quarks (a dotted id contributes its first segment). */
function countChildren(group: DescriptiveNode, sep: string | null): number {
  return new Set(group.children.map((c) => splitNamespacePath(c.id, sep)?.[0] ?? c.id)).size;
}

/** `Entity#canBePacked`, returning the child group to fold into (undefined == not packable). */
function packTarget(
  group: DescriptiveNode,
  path: readonly string[],
  links: readonly DescriptiveLink[],
  sep: string | null,
): DescriptiveNode | undefined {
  if (group.declaredAsGroup !== true || countChildren(group, sep) !== 1) return undefined;
  const child = group.children[0]!;
  if (child.declaredAsGroup !== true || child.children.length === 0) return undefined;
  const key = scopedKey(path);
  const touches = (end: string): boolean => end === group.id || end === key;
  return links.some((l) => touches(l.from) || touches(l.to)) ? undefined : child;
}

/** `Display#get(0)` re-escaped so prepending it to another raw display re-parses to the same text. */
function firstDisplayLine(display: string): string {
  return (splitDisplayLines(display).lines[0] ?? '').replace(/\\/g, '\\\\');
}

/** Drops `removedKey`'s last segment from a scoped link endpoint that runs through the folded group. */
function rewriteEnd(end: string, removedKey: string): string {
  const prefix = removedKey + SCOPE_KEY_SEP;
  if (!end.startsWith(prefix)) return end;
  const parent = removedKey.slice(0, Math.max(0, removedKey.lastIndexOf(SCOPE_KEY_SEP)));
  const rest = end.slice(prefix.length);
  return parent === '' ? rest : parent + SCOPE_KEY_SEP + rest;
}

/** One pass over `siblings`; true when a group was folded (the caller then rescans, as upstream's `while`). */
function packLevel(
  siblings: DescriptiveNode[],
  ancestors: readonly string[],
  links: readonly DescriptiveLink[],
  sep: string | null,
  rewrite: (removedKey: string) => void,
): boolean {
  for (let i = 0; i < siblings.length; i++) {
    const group = siblings[i]!;
    const path = [...ancestors, group.id];
    const child = packTarget(group, path, links, sep);
    if (child !== undefined) {
      child.display = firstDisplayLine(group.display) + (sep ?? DEFAULT_SEPARATOR) + child.display;
      siblings[i] = child;
      rewrite(scopedKey(path));
      return true;
    }
    if (packLevel(group.children, path, links, sep, rewrite)) return true;
  }
  return false;
}

/**
 * Port of `AbstractEntityDiagram#packSomePackage`. Mutates `nodes` (and `links`' scoped endpoints) in
 * place, like the upstream `setDisplay`/`setPacked`.
 */
export function packSomePackage(nodes: DescriptiveNode[], links: DescriptiveLink[], sep: string | null): void {
  const rewrite = (removedKey: string): void => {
    for (const l of links) {
      l.from = rewriteEnd(l.from, removedKey);
      l.to = rewriteEnd(l.to, removedKey);
    }
  };
  while (packLevel(nodes, [], links, sep, rewrite));
}
