/**
 * codd-T2 M1 -- a non-port container is drawn at the engine's published cluster rect
 * (`DotLayoutResult.clusters`, the middle `cluster<N>` subgraph), not at a padded union of its
 * children. Expected numbers are the jar's own `cluster<N>` bb in the cached `svek-1.dot`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:432-441
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDecoration.java:78,89-90
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import {
  layoutDescription,
  createClassifyCtx,
  type DescriptionNodeGeo,
} from '../../../src/diagrams/description/layout.js';
import { clusterBoxesByAstId } from '../../../src/diagrams/description/layout-cluster-boxes.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';

const measurer = new DeterministicMeasurer();

function layoutOf(puml: string) {
  const block: UmlSource = { lines: puml.split('\n'), type: 'description' };
  return layoutDescription(astOrThrow(parseDescription(block), 'description'), defaultTheme, measurer);
}

/** unknown/bamami-10-lava790 (trimmed): jar `svek-1.dot` `cluster6` bb="16,16.07,161,97.07" = 145 x 81. */
const BAMAMI = `file "file\\n" as package {
() " " as acc1
() " " as acc2
}
acc1 ~RIGHT~ acc2 : "access"
acc1 <~RIGHT~ acc2 : "r"
acc1 ~RIGHT~> acc2 : "w"
acc1 <~RIGHT~> acc2 : "rw"`;
const BAMAMI_CLUSTER_WIDTH = 161 - 16;
const BAMAMI_CLUSTER_HEIGHT = 97.07 - 16.07;

describe('container box = engine cluster rect (M1)', () => {
  it('draws the bamami group at the jar cluster6 size, not the padded union (145x62)', () => {
    const group: DescriptionNodeGeo | undefined = layoutOf(BAMAMI).nodes.find((n) => n.id === 'package');
    expect(group?.width).toBeCloseTo(BAMAMI_CLUSTER_WIDTH, 6);
    expect(group?.height).toBeCloseTo(BAMAMI_CLUSTER_HEIGHT, 6);
  });
});

describe('clusterBoxesByAstId', () => {
  it('carries the engine width/height verbatim (USymbolCloud.java:75 seeds Random from (long) width)', () => {
    const ctx = createClassifyCtx(
      astOrThrow(parseDescription({ lines: ['[A]'], type: 'description' }), 'description'),
      defaultTheme,
    );
    ctx.containers.push({ clusterId: 'cluster0', astId: 'grp', symbol: 'cloud', display: 'grp', directLeafAstIds: [] });
    // `x + width - x` would be 336.99999999999994 here, truncating to 336 instead of 337.
    const width = 337;
    const result: DotLayoutResult = {
      nodes: [],
      edges: [],
      width: 400,
      height: 300,
      clusters: [{ id: 'cluster0', x: 0.1, y: 7.3, width, height: 81 }],
    };
    expect(clusterBoxesByAstId(ctx, result).get('grp')).toEqual({ x: 0.1, y: 7.3, width: 337, height: 81 });
  });

  it('omits a container the engine published no rect for', () => {
    const ctx = createClassifyCtx(
      astOrThrow(parseDescription({ lines: ['[A]'], type: 'description' }), 'description'),
      defaultTheme,
    );
    ctx.containers.push({
      clusterId: 'cluster9',
      astId: 'ghost',
      symbol: 'package',
      display: 'ghost',
      directLeafAstIds: [],
    });
    expect(clusterBoxesByAstId(ctx, { nodes: [], edges: [], width: 1, height: 1 }).has('ghost')).toBe(false);
  });
});
