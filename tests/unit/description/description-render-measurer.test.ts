/**
 * cdd3-T28 E3-9 (split out) -- `sokevu-87-toce485`, a description
 * diagram (an `interface` feeding three ports of a `node`) that sits in the
 * class corpus. Every expected value below is read from the jar's own output
 * for the fixture (`test-results/dot-cache/class/sokevu-87-toce485/svek-1.dot`
 * and `in.svg`), rendered with `-DPLANTUML_DETERMINISTIC_TEXT=true`, which is
 * what `WidthTableMeasurer` models.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
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
    return { svg: renderSync(SOKEVU, { measurer: new WidthTableMeasurer() }), inputs };
  } finally {
    setLayoutInputObserver(undefined);
  }
}

describe('sokevu-87-toce485 description render measurer (E3-9)', () => {
  it('E3-9: draw-time text uses the renderSync measurer, not jarMeasurer (jar textLength 81.55)', () => {
    // Upstream measures layout and draw with ONE StringBounder
    // (`svek/GeneralImageBuilder.java` builds the images with the same
    // `stringBounder` `SvekResult#drawU` draws through). The jar writes
    // `textLength="81.55"` for `firstportname` -- the WidthTable width.
    const { svg } = renderCapturing();
    expect(svg).toMatch(/textLength="81\.55"[^>]*>firstportname</);
    expect(svg).toMatch(/textLength="99\.575"[^>]*>name-with-dash</);
  });

  it('E3-10b: the hasPort() cluster lays out as the jar DOT does -- every edge path is the jar path', () => {
    // Before cdd4-T6 the builder kept `label=n` on the cluster, had no `ee`,
    // no printRanks chain and no `:P` ports (`ClusterDotString.java:117-184,
    // 254-287`, `Link.java:227-231`): i->p left at 96.13,22.81 and bent
    // through the cluster. These four `d` strings are the jar's own in.svg.
    const { svg } = renderCapturing();
    expect(svg).toContain('d="M98.74,22.74 C85.13,42.77 51.839,91.744 40.369,108.634"');
    expect(svg).toContain('d="M104,22.74 C104,42.95 104,91.87 104,108.23"');
    expect(svg).toContain('d="M111.59,22.74 C131.41,42.95 180.78,93.3 196.82,109.66"');
    expect(svg).toContain('d="M191.3,119 C171.17,119 137.4,119 119.49,119"');
  });

  it('cdd4-T6b: the node frame is the frontier over the REAL cluster rect (jar polygon, 261x260 page)', () => {
    // `Cluster#manageEntryExitPoint` seeds FrontierCalculator with
    // `getRectangleArea()` (`Cluster.java:410-430`), graphviz's own cluster
    // box (`Cluster#setPosition`, `:511-512`); the shadow graph gave 217.
    const { svg } = renderCapturing();
    expect(svg).toContain('points="16,129,26,119,215.17,119,215.17,225,205.17,235,16,235,16,129"');
    expect(svg).toContain('width="261px" height="260px"');
  });
});
