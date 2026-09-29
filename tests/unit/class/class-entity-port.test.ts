/**
 * cdd6-T3d (bonaco-71-xefu608): the class engine's PORTIN/PORTOUT leaves on
 * the DOT side. `port`/`portin` make a `LeafType.PORTIN`, `portout` a
 * `PORTOUT` (`CommandCreateElementFull2.java:224-232`); the owning cluster
 * takes `ClusterDotString`'s `hasPort()` branch: no protection wrappers
 * (`:107-112`), `printRanks` source then sink (`:136-137`), the title table
 * moved onto the `empty()` anchor (`:177-181`); the port node itself is a
 * `RECTANGLE_PORT` (`EntityImagePort.java:170-172`, `SvekNode.java:181-190`).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';

const measurer = new FormulaMeasurer();

function captureDotGraph(lines: string[]): DotInputGraph {
  const ast = parseClass({ lines, type: 'class' });
  let g: DotInputGraph | undefined;
  setLayoutInputObserver(({ graph: x }) => {
    g = x;
  });
  try {
    layoutClass(ast, defaultTheme, measurer);
  } finally {
    setLayoutInputObserver(undefined);
  }
  if (g === undefined) throw new Error('no layout input captured');
  return g;
}

const BONACO = ['allowmixing', 'Package Pa {', 'portin Pi', 'component C {', '}', '}'];

describe('class PORTIN/PORTOUT leaves: DOT input', () => {
  it('puts the cluster on the hasPort branch with a source rank and a titled anchor', () => {
    const graph = captureDotGraph(BONACO);
    const cluster = graph.clusters?.[0];
    expect(cluster?.portRanks).toEqual([{ rank: 'source', nodeIds: ['Pa.Pi'] }]);
    expect(cluster?.portAnchorId).toBe('zaent-Pa');
    expect(cluster?.nodeIds).toEqual(['Pa.Pi', 'Pa.C', 'zaent-Pa']);
    expect(cluster?.innerMarginLevels).toBeUndefined();
    expect(cluster?.titleTableWidth).toBeUndefined();
    const dims = namespaceTitleTableDims('Pa', defaultTheme, measurer);
    const anchor = graph.nodes.find((n) => n.id === 'zaent-Pa');
    expect(anchor).toMatchObject({ shape: 'rect', titleLabelWidth: dims.width, titleLabelHeight: dims.height });
    const port = graph.nodes.find((n) => n.id === 'Pa.Pi');
    expect(port).toMatchObject({ isPort: true, width: 12, height: 12 });
    expect(port?.shape).toBeUndefined();
  });

  it('emits the rank group, the chain to the anchor and the ee subgraph', () => {
    const dot = toSvekDot(captureDotGraph(BONACO));
    expect(dot).toContain('{rank=source;sh0010;}');
    expect(dot).toContain('sh0010->zaent0001;');
    expect(dot).toContain('subgraph cluster0ee {label="";');
    expect(dot).not.toContain('cluster0p0');
  });

  it('ranks portout as sink after the source ports', () => {
    const graph = captureDotGraph(['allowmixing', 'package P {', 'portout O', 'port I', 'class C', '}']);
    expect(graph.clusters?.[0]?.portRanks).toEqual([
      { rank: 'source', nodeIds: ['P.I'] },
      { rank: 'sink', nodeIds: ['P.O'] },
    ]);
  });

  it('switches a port whose label is wider than 40px to the plaintext PORT table', () => {
    const label = 'AVeryLongPortLabelName';
    const graph = captureDotGraph(['allowmixing', 'package P {', `portin ${label}`, 'class C', '}']);
    const width2 = Math.trunc(
      measurer.measure(label, { family: defaultTheme.fontFamily, size: defaultTheme.fontSize }).width,
    );
    const port = graph.nodes.find((n) => n.id === `P.${label}`);
    expect(port).toMatchObject({ isPort: true, shape: 'plaintext', portPad: Math.max(10, width2 - 40) });
  });
});
