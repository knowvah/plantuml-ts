/**
 * codd-T4: `UgDiagram#getExporter` (`UgDiagram.java:123-135`) chrome-composes
 * the diagram (`addChrome`) and only THEN wraps the result in `TextBlockUtils
 * .addBackcolor`, so the jar's background `<rect>` spans the FINAL canvas and
 * precedes the title group (`sugaca-11-boma467`:
 * `<rect x="0" y="0" width="241" height="232" fill="#808080" .../>` then
 * `<g class="title">`). The klimt body's own rect is sized to the margin-less
 * body and is drawn after the chrome; the description chrome path hands the
 * full-canvas rect over instead (`RenderFragment.documentBackgroundRect`, the
 * class engine's N48 mechanism).
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = '@startuml\nskinparam backgroundColor gray\n[component1]\ntitle\n this is a\n long\nendtitle\n@enduml';

function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

describe('codd-T4 description chrome: background rect first', () => {
  const svg = render(SRC);
  const dims = /<svg[^>]* width="(\d+)px" height="(\d+)px"/.exec(svg);

  it('draws one full-canvas background rect before the title group', () => {
    const w = dims?.[1];
    const h = dims?.[2];
    const rects = [...svg.matchAll(/<rect x="0" y="\d+" width="\d+" height="\d+" fill="#808080"[^>]*\/>/g)];
    expect(rects).toHaveLength(1);
    expect(rects[0]?.[0]).toBe(`<rect x="0" y="0" width="${w}" height="${h}" fill="#808080" stroke="none"/>`);
    expect(svg.indexOf(rects[0]![0])).toBeLessThan(svg.indexOf('<g class="title"'));
  });

  it('leaves a default-background chromed diagram without a background rect', () => {
    const plain = render('@startuml\n[component1]\ntitle t\n@enduml');
    expect(plain).not.toContain('stroke="none"');
  });

  it('keeps the unchromed klimt rect first (unchanged)', () => {
    const bare = render('@startuml\nskinparam backgroundColor gray\n[component1]\n@enduml');
    expect(bare).toMatch(/<g[^>]*>\s*<rect x="0" y="0" width="\d+" height="\d+" fill="#808080"/);
  });
});
