/**
 * codd-T2 M4 -- `set separator` phantom groups are laid out AND put in the geo tree. The DOT already had
 * their clusters (`layout.ts` classified `buildNamespaceGroups`), but the geo tree was built from the
 * ungrouped `ast.nodes`, so the renderer saw no container: fidati/kofovu/tojitu drew none of the jar's
 * `<g class="cluster">` groups.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:325-336,464
 *      (`eventuallyBuildPhantomGroups` creates real `GroupType.PACKAGE` groups that `Cluster.drawU` draws)
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { layoutDescription, type DescriptionNodeGeo } from '../../../src/diagrams/description/layout.js';

/** component/fidati-41-kofe029 (trimmed to two leaves): the jar draws clusters aaa, aaa.bbb1, aaa.bbb2. */
const SOURCE = `set separator .
component aaa.bbb1.ccc01
component aaa.bbb2.ccc02`;

function layout() {
  const block: UmlSource = { lines: SOURCE.split('\n'), type: 'description' };
  return layoutDescription(
    astOrThrow(parseDescription(block), 'description'),
    defaultTheme,
    new DeterministicMeasurer(),
  );
}

const idsOf = (nodes: readonly DescriptionNodeGeo[]): string[] => nodes.map((n) => n.id);

describe('phantom namespace groups in the geo tree (M4)', () => {
  it('nests the leaves under the aaa package and its bbb1/bbb2 packages', () => {
    const { nodes } = layout();
    expect(idsOf(nodes)).toEqual(['aaa']);
    const aaa = nodes[0]!;
    expect(aaa.symbol).toBe('package');
    expect(idsOf(aaa.children)).toEqual(['aaa.bbb1', 'aaa.bbb2']);
    expect(aaa.children.map((g) => idsOf(g.children))).toEqual([['aaa.bbb1.ccc01'], ['aaa.bbb2.ccc02']]);
  });

  it('draws each group around its children (engine cluster rect contains them)', () => {
    const aaa = layout().nodes[0]!;
    expect(aaa.children).toHaveLength(2);
    for (const group of aaa.children) {
      const leaf = group.children[0]!;
      expect(group.x).toBeLessThan(leaf.x);
      expect(group.y).toBeLessThan(leaf.y);
      expect(group.x + group.width).toBeGreaterThan(leaf.x + leaf.width);
      expect(group.y + group.height).toBeGreaterThan(leaf.y + leaf.height);
    }
  });
});
