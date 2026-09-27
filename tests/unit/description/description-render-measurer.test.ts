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
  setLayoutInputObserver((g) => inputs.push(g));
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
});
