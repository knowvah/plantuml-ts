/**
 * cdd3-T28 (E3-9, E3-10, E3-22, E3-23) -- `sokevu-87-toce485`, a description
 * diagram (an `interface` feeding three ports of a `node`) that sits in the
 * class corpus. Every expected value below is read from the jar's own output
 * for the fixture (`test-results/dot-cache/class/sokevu-87-toce485/svek-1.dot`
 * and `in.svg`), rendered with `-DPLANTUML_DETERMINISTIC_TEXT=true`, which is
 * what `WidthTableMeasurer` models.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver, layoutGraph } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const SOKEVU = [
  '@startuml',
  'interface i',
  'node n {',
  '  port p',
  '  port firstportname',
  '  port "name-with-dash" as nwd',
  '}',
  '',
  'i --> p',
  'i --> firstportname',
  'i --> nwd',
  'nwd --> firstportname',
  '@enduml',
].join('\n');

function renderCapturing(): { svg: string; inputs: DotInputGraph[] } {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph: g }) => inputs.push(g));
  try {
    return { svg: renderSync(SOKEVU, { measurer: new DeterministicMeasurer() }), inputs };
  } finally {
    setLayoutInputObserver(undefined);
  }
}

function nodeById(input: DotInputGraph, id: string) {
  const n = input.nodes.find((x) => x.id === id);
  if (n === undefined) throw new Error(`node ${id} missing from the layout input`);
  return n;
}

describe('sokevu-87-toce485 description layout/render (cdd3-T28)', () => {
  it('E3-23: the port table pad truncates width2 before subtracting 40 (SvekNode.java:181-186)', () => {
    // `final int width2 = (int) getMaxWidthFromLabelForEntryExit(...)`, then
    // `width2 - 40`: jar svek-1.dot writes `WIDTH="41"` and `WIDTH="59"`.
    const { inputs } = renderCapturing();
    expect(nodeById(inputs[0]!, 'firstportname').portPad).toBe(41);
    expect(nodeById(inputs[0]!, 'nwd').portPad).toBe(59);
  });

  it('E3-22: a shielded interface carries its getShield margins (EntityImageDescription.java:239-262)', () => {
    // jar svek-1.dot: `WIDTH="0.5"` side cells, `HEIGHT="14.0"` top/bottom.
    const { inputs } = renderCapturing();
    expect(nodeById(inputs[0]!, 'i').shieldMargins).toEqual({ x1: 0.5, x2: 0.5, y1: 14, y2: 14 });
  });

  it('E3-10: ports rank only inside their cluster (ClusterDotString.java:136-137), so `i` stays on top', () => {
    // jar in.svg: the interface circle at cy=14, the port rects at y=113.
    const { inputs } = renderCapturing();
    const result = layoutGraph(inputs[0]!);
    const cy = (id: string): number => {
      const n = result.nodes.find((x) => x.id === id)!;
      return n.y + n.height / 2;
    };
    expect(cy('i')).toBeLessThan(cy('p'));
    expect(cy('i')).toBeLessThan(cy('firstportname'));
  });
});
