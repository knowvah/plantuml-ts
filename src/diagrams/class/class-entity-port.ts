/**
 * cdd6-T3d (bonaco-71-xefu608): the DOT-input half of the class engine's
 * PORTIN/PORTOUT leaves. `CommandCreateElementFull2` makes `port`/`portin` a
 * `LeafType.PORTIN` and `portout` a `LeafType.PORTOUT`
 * (`classdiagram/command/CommandCreateElementFull2.java:224-232`), whose
 * `EntityPosition` is PORTIN/PORTOUT (`abel/Entity.java:331-335`). Those
 * positions reach the DOT in two places:
 *
 * - the leaf's own node: `EntityImagePort#getShapeType` is `RECTANGLE_PORT`
 *   (`svek/image/EntityImagePort.java:170-172`), emitted by
 *   `SvekNode#appendLabelHtmlSpecialForPort` (`svek/SvekNode.java:181-190`);
 * - the owning cluster: `ClusterDotString`'s `hasPort()` branch drops the
 *   protection wrappers (`svek/ClusterDotString.java:107-112`), prints the
 *   input ranks then the output ranks (`:136-137`, `EntityPosition
 *   .getInputs`/`getOutputs`, `abel/EntityPosition.java:58-64`) chained to
 *   the `empty()` anchor, and moves the cluster's title table onto that
 *   anchor (`:177-181`).
 *
 * The drawing half is `renderer-entity-port.ts` (`EntityImagePort`), the
 * post-layout cluster frontier `class-geo-builders-port.ts` (cdd7-T2a).
 */

import type { ClassDiagramAST, Classifier } from './ast.js';
import type { DotInputNode } from '../../core/graph-layout.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';

declare module './class-geo-types.js' {
  interface ClassifierGeo {
    /**
     * cdd7-T2a: `EntityImagePort#upPosition()` for a port leaf -- `true` when
     * the node's `minY` is above its parent cluster's post-frontier centre
     * (`svek/image/EntityImagePort.java:75-81`). Set at layout time by
     * `class-geo-builders-port.ts#stampEntityPortLeaves`, where both the
     * node and the frontier exist; read by `renderer-entity-port.ts`.
     * Declared here by module augmentation because `class-geo-types.ts` is
     * at its 500-line cap and owned by a sibling task this batch.
     */
    entityPortUp?: boolean;
  }
}

/** One `printRanks` call's members: rank and node ids in declaration order. */
export interface ClassPortRank {
  rank: 'source' | 'sink';
  nodeIds: string[];
}

/** `usymbol` keyword -> DOT rank of the `EntityPosition` it creates:
 *  PORTIN is in `getInputs()` (RANK_SOURCE), PORTOUT in `getOutputs()`
 *  (RANK_SINK). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:58-64 */
const PORT_RANK_BY_USYMBOL: ReadonlyMap<string, ClassPortRank['rank']> = new Map([
  ['port', 'source'],
  ['portin', 'source'],
  ['portout', 'sink'],
]);

/** `appendLabelHtmlSpecialForPort`'s `width2 > 40` switch.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:183-184 */
const PORT_LABEL_WIDE_THRESHOLD = 40;

/** `appendLabelHtmlSpecialForPortHtml`'s `if (fullWidth < 10) fullWidth = 10`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:189-190 */
const PORT_TABLE_PAD_FLOOR = 10;

/** The DOT rank a classifier's `EntityPosition` puts it on, or `undefined`
 *  for an ordinary (NORMAL) leaf. */
export function entityPortRank(classifier: Pick<Classifier, 'usymbol'>): ClassPortRank['rank'] | undefined {
  return classifier.usymbol === undefined ? undefined : PORT_RANK_BY_USYMBOL.get(classifier.usymbol);
}

/**
 * A cluster's `printRanks` groups: its direct PORTIN members (RANK_SOURCE)
 * then its PORTOUT members (RANK_SINK), each in member order, empty ranks
 * omitted (`printRanks`' `entries.size() > 0` guard, java:256). An
 * empty result means `entityPositionsExceptNormal()` is empty -- the
 * ordinary cluster branch.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:136-137
 */
export function clusterPortRanks(members: readonly string[], ast: ClassDiagramAST): ClassPortRank[] {
  const rankById = new Map(ast.classifiers.map((c) => [c.id, entityPortRank(c)] as const));
  const source = members.filter((id) => rankById.get(id) === 'source');
  const sink = members.filter((id) => rankById.get(id) === 'sink');
  return [
    ...(source.length > 0 ? [{ rank: 'source' as const, nodeIds: source }] : []),
    ...(sink.length > 0 ? [{ rank: 'sink' as const, nodeIds: sink }] : []),
  ];
}

/**
 * Stamp `RECTANGLE_PORT` on every port leaf's node: `isPort` always, and the
 * `shape=plaintext` PORT="P" table once the label's truncated width exceeds
 * 40px (`width2`, `SvekNode.java:181-190`; the label is `getDesc()` at the
 * `port` style's font, `AbstractEntityImageBorder.java:78-82`, whose default
 * is the root font). Mutates `nodes` in place (freshly built by the caller).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:181-190
 */
export function applyEntityPortShapes(
  nodes: readonly DotInputNode[],
  classifiers: readonly Classifier[],
  theme: Theme,
  measurer: StringMeasurer,
): void {
  const byId = new Map(classifiers.map((c) => [c.id, c] as const));
  const font = { family: theme.fontFamily, size: theme.fontSize };
  for (const node of nodes) {
    const classifier = byId.get(node.id);
    if (classifier === undefined || entityPortRank(classifier) === undefined) continue;
    node.isPort = true;
    const { lines } = splitDisplayLines(classifier.display);
    const width2 = Math.trunc(Math.max(0, ...lines.map((l) => measurer.measure(l, font).width)));
    if (width2 > PORT_LABEL_WIDE_THRESHOLD) {
      node.shape = 'plaintext';
      node.portPad = Math.max(PORT_TABLE_PAD_FLOOR, width2 - PORT_LABEL_WIDE_THRESHOLD);
    }
  }
}

/**
 * Add each port cluster's `empty()` anchor to the node list: it REPLACES a
 * same-id package-endpoint point anchor in place (that one is re-declared
 * first via `groupAnchorAlsoPoint`, `ClusterDotString.java:148-149`), else
 * it is appended.
 */
export function mergePortAnchorNodes(nodes: DotInputNode[], anchors: readonly DotInputNode[]): DotInputNode[] {
  if (anchors.length === 0) return nodes;
  const byId = new Map(anchors.map((a) => [a.id, a] as const));
  const merged = nodes.map((n) => byId.get(n.id) ?? n);
  const present = new Set(nodes.map((n) => n.id));
  return [...merged, ...anchors.filter((a) => !present.has(a.id))];
}
