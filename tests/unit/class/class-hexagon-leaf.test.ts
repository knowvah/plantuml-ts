/**
 * cdd8 T1e (`unknown/xagomi-49-caki729`): a class-routed `hexagon` leaf is a
 * `ShapeType.HEXAGON` svek node (`EntityImageDescription.java:127-128`), so
 * the jar emits `shape=hexagon` (`SvekNode.java:337-338`), reads the node's
 * polygon back off graphviz (`DotStringFactory.java:414-420`) and draws it
 * before the label (`EntityImageDescription.java:307-341`).
 *
 * Oracle values are the jar's own `svek-1.dot` / `in.svg` for xagomi
 * (1.2026.8beta1, re-captured without the smetana pragma by cdd8-T0b).
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { hexagonPolygonPoints, isHexagonLeaf } from '../../../src/diagrams/class/class-hexagon-leaf.js';

/** `test-results/dot-cache/unknown/xagomi-49-caki729/in.puml`. */
const XAGOMI = '@startuml\nhexagon h [\nmore\nand\nmore\ncombinatorial\n]\n@enduml\n';

/** The jar's `sh0006` line in xagomi's `svek-1.dot`. */
const JAR_NODE_LINE = 'sh0006 [shape=hexagon,label="",width=2.313889,height=0.916667,color="#000006"];';

/** The jar's entity polygon in xagomi's `in.svg`. */
const JAR_POLYGON = 'points="182.6,39,140.95,6,57.65,6,16,39,57.65,72,140.95,72,182.6,39"';

function captureSvekDot(puml: string): string {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => captured.push(graph));
  try {
    renderSync(puml, { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  expect(captured).toHaveLength(1);
  return toSvekDot(captured[0]!);
}

describe('class hexagon leaf (cdd8 T1e)', () => {
  it('emits shape=hexagon for the descriptive hexagon leaf, as the jar DOT does', () => {
    expect(captureSvekDot(XAGOMI)).toContain(JAR_NODE_LINE);
  });

  it('draws the jar polygon before the label, on the jar canvas', () => {
    const svg = renderSync(XAGOMI, { measurer: new DeterministicMeasurer() });
    expect(svg).toContain('width="207px" height="87px" viewBox="0 0 207 87"');
    const entity = /<g class="entity"[^>]*>(.*?)<\/g>/s.exec(svg)?.[1] ?? '';
    expect(entity.startsWith(`<polygon ${JAR_POLYGON} fill="#F1F1F1"`)).toBe(true);
    expect(entity).toContain('<text x="57.65" y="21.889"');
    expect(entity).toContain('<text x="57.65" y="63.889"');
  });

  it('under !pragma layout smetana draws no polygon: Smetana never calls setPolygon', () => {
    // `SvekNode#setPolygon`'s only caller is `DotStringFactory.java:420`;
    // `CucaDiagramFileMakerSmetana` never stores one, so `drawHexagon`'s
    // `getPolygon()` is null and only the label is drawn.
    const smetana = XAGOMI.replace('@startuml\n', '@startuml\n!pragma layout smetana\n');
    const svg = renderSync(smetana, { measurer: new DeterministicMeasurer() });
    const entity = /<g class="entity"[^>]*>(.*?)<\/g>/s.exec(svg)?.[1] ?? '';
    expect(entity.startsWith('<text x=')).toBe(true);
    expect(entity).not.toContain('<polygon');
  });

  it('isHexagonLeaf: descriptive + hexagon usymbol only', () => {
    expect(isHexagonLeaf({ kind: 'descriptive', usymbol: 'hexagon' })).toBe(true);
    expect(isHexagonLeaf({ kind: 'descriptive', usymbol: 'rectangle' })).toBe(false);
    expect(isHexagonLeaf({ kind: 'descriptive' })).toBe(false);
    expect(isHexagonLeaf({ kind: 'class', usymbol: 'hexagon' })).toBe(false);
  });

  it('hexagonPolygonPoints: shapes.c regular-hexagon vertices, node-local, closed', () => {
    expect(hexagonPolygonPoints(166.6, 66)).toEqual([
      { x: 166.6, y: 33 },
      { x: 124.95, y: 0 },
      { x: 41.65, y: 0 },
      { x: 0, y: 33 },
      { x: 41.65, y: 66 },
      { x: 124.95, y: 66 },
      { x: 166.6, y: 33 },
    ]);
  });
});
