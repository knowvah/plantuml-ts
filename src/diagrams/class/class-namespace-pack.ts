/**
 * cdd3-T9 S-1: `!pragma useIntermediatePackages false` -- the end-of-parse
 * group packing pass.
 *
 * Upstream does NOT collapse a dotted qualifier when it resolves it: every
 * segment is registered as its own Quark and materialised as a PACKAGE group
 * (minting its uid) exactly as with the pragma on. Only `checkFinalError`
 * (`classdiagram/ClassDiagram.java:84-85`) runs `packSomePackage`, which
 * marks each single-child group `packed` and prepends its first display
 * line to its child's. Downstream a packed group emits no DOT subgraph
 * (`svek/ClusterDotString.java:83-88`) and is never drawn
 * (`svek/SvekResult.java:72-74`, `svek/DotStringFactory.java:432-434`), but
 * the uid its `Entity` constructor burned stays burned.
 */

import type { ClassDiagramAST, Namespace } from './ast.js';
import { isLinkFromOrToGroup } from './class-cluster-levels.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';

/** `AbstractEntityDiagram#packSomePackage`'s fallback separator. */
const DEFAULT_SEPARATOR = '.';

/** `Quark#countChildren` (`plasma/Quark.java:157-159`) for a group: its
 *  DISTINCT direct children -- member leaves and nested groups alike. */
function countChildren(ast: ClassDiagramAST, id: string): number {
  const ns = ast.namespaces.find((n) => n.id === id);
  const children = new Set<string>(ns?.classifiers ?? []);
  for (const c of ast.classifiers) if (c.namespace === id) children.add(c.id);
  for (const n of ast.namespaces) if (n.parentId === id) children.add(n.id);
  return children.size;
}

/** `Entity#leafs()` (`abel/Entity.java:649-657`) is non-empty. */
function hasLeaf(ast: ClassDiagramAST, ns: Namespace): boolean {
  return ns.classifiers.length > 0 || ast.classifiers.some((c) => c.namespace === ns.id);
}

/** `Entity#groups().iterator().next()` (`abel/Entity.java:659-667`): the
 *  first child quark carrying GROUP data. A child namespace with no
 *  `creationIndex` is a data-less quark (cdd-T1), not a group. */
function firstChildGroup(ast: ClassDiagramAST, id: string): Namespace | undefined {
  return ast.namespaces.find((n) => n.parentId === id && n.creationIndex !== undefined);
}

/**
 * `Entity#canBePacked`, returning the child to pack into. Upstream's
 * `groups().iterator().next()` would throw on a lone data-less child; that
 * state is unreachable here for a like-class leaf (its sweep materialises
 * every ancestor), and is treated as "not packable".
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:717-733
 */
function packTarget(ast: ClassDiagramAST, group: Namespace): Namespace | undefined {
  if (group.packed === true) return undefined;
  if (countChildren(ast, group.id) !== 1) return undefined;
  if (hasLeaf(ast, group)) return undefined;
  if (isLinkFromOrToGroup(group.id, ast)) return undefined;
  const child = firstChildGroup(ast, group.id);
  if (child === undefined || countChildren(ast, child.id) === 0) return undefined;
  return child;
}

/** `Display#get(0)` of a raw display string, re-escaped so that prepending
 *  it to another RAW display re-parses to the same text (`\` is the only
 *  character `splitDisplayLines` consumes inside a line). */
function firstDisplayLine(display: string): string {
  const first = splitDisplayLines(display).lines[0] ?? '';
  return first.replace(/\\/g, '\\\\');
}

/**
 * Port of `AbstractEntityDiagram#packSomePackage`. Iterates the groups in
 * registration order (`CucaDiagram#groups()`, `net/atmp/CucaDiagram.java:
 * 871-882` -- only quarks carrying group data) until a pass packs nothing.
 * Mutates `ast.namespaces` in place (`Entity#setDisplay`/`#setPacked` are
 * in-place upstream too).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/AbstractEntityDiagram.java:85-106
 */
export function packSomePackage(ast: ClassDiagramAST, separator: string | null): void {
  const sep = separator ?? DEFAULT_SEPARATOR;
  let changed = true;
  while (changed) {
    changed = false;
    for (const group of ast.namespaces) {
      if (group.creationIndex === undefined) continue;
      const child = packTarget(ast, group);
      if (child === undefined) continue;
      child.display = firstDisplayLine(group.display) + sep + child.display;
      group.packed = true;
      changed = true;
    }
  }
}

/**
 * `ClassGeometry.packedGroupRanks` for a page AST, as a spreadable field
 * (absent when nothing is packed): each packed group's burned uid tick.
 */
export function packedGroupRanksField(ast: ClassDiagramAST): { packedGroupRanks?: readonly number[] } {
  const ranks = ast.namespaces.flatMap((n) =>
    n.packed === true && n.creationIndex !== undefined ? [n.creationIndex] : [],
  );
  return ranks.length > 0 ? { packedGroupRanks: ranks } : {};
}
