/**
 * cdd7 T2b (xuloxo-85-vibu502, leaf height Δ2): a class USymbol leaf's DOT
 * node is sized with the STEREOTYPE font the draw uses. `fcStereo` is
 * `styleStereo.getFontConfiguration(...)` (`EntityImageDescription.java
 * :155-157,174`), and `skinparam <sname>StereotypeFontSize N` registers
 * `PName.FontSize` on `{stereotype, <sname>}` (`FromSkinparamToStyle.java
 * :280`, `addMagic`). The draw (`renderer-usymbol-entity-style.ts
 * #resolveLeafFonts`) already read it; the sizer
 * (`class-layout-generic-classifier.ts#buildDescriptionLeafOpts`) did not,
 * so the node was measured with a 14pt «label» line (C4's
 * `StereotypeFontSize 12` leaves were 2px too tall).
 *
 * Expected values: oracle probe (`scripts/oracle-render.sh`, 1.2026.8beta1)
 * of the exact source below -- `svek-1.dot` `sh0007 width=1.000347,
 * height=0.638889` (72.025 x 46 px).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';

const SOURCE = [
  '@startuml',
  'allowmixing',
  'class A',
  'skinparam rectangle {',
  '  StereotypeFontSize 12',
  '}',
  'rectangle "Label" <<person>> as R',
  'A --> R',
  '@enduml',
].join('\n');

function nodeDims(markup: string): { width: number; height: number }[] {
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => graphs.push(graph));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return (graphs[0]?.nodes ?? []).map((n) => ({ width: n.width, height: n.height }));
}

describe('class USymbol leaf sizes its stereotype at <sname>StereotypeFontSize', () => {
  it('reserves the jar node for a 12pt «person» line', () => {
    const r = nodeDims(SOURCE)[1]!;
    expect(r.width).toBeCloseTo(72.025, 3);
    expect(r.height).toBeCloseTo(46, 6);
  });
});
