/**
 * dsw-T9 mechanism A -- a port label that spans several lines is measured by
 * its WIDEST line. Expected values are the jar's own `svek-1.dot` for
 * `test-results/dot-cache/unknown/deroxu-29-gude369` (lines 110 and the PGT
 * port): `<TD WIDTH="29" ...>` for "PM API\n(Protected)" and `WIDTH="61"` for
 * "PDF Generation\nSNS Topic", rendered with -DPLANTUML_DETERMINISTIC_TEXT.
 * Jar line widths (in.svg textLength): 47.425 / 69.125 and 101.15 / 67.025.
 *
 * Java: svek/SvekNode.java:181-190 <- svek/image/EntityImagePort.java:90-94
 * <- svek/image/AbstractEntityImageBorder.java:79-82 (a multi-line TextBlock).
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const SOURCE = [
  '@startuml',
  'node n {',
  '  port "PM API\\n(Protected)" as pmh',
  '  port "PDF Generation\\nSNS Topic" as pgt',
  '}',
  'actor a',
  'a --> pmh',
  'a --> pgt',
  '@enduml',
].join('\n');

function capture(): DotInputGraph {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => inputs.push(graph));
  try {
    renderSync(SOURCE, { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return inputs[0]!;
}

describe('port label width2 is the widest line (SvekNode.java:181-190)', () => {
  it('PM API / (Protected): trunc(69.125) - 40 = 29 (jar WIDTH="29")', () => {
    expect(capture().nodes.find((n) => n.id === 'pmh')!.portPad).toBe(29);
  });
  it('PDF Generation / SNS Topic: trunc(101.15) - 40 = 61 (jar WIDTH="61")', () => {
    expect(capture().nodes.find((n) => n.id === 'pgt')!.portPad).toBe(61);
  });
});
