/**
 * codd-T7b colour track: a container's inline `#back;line:x;text:y` / `line.dashed` colours are drawn.
 * `Cluster.java:312-319` takes the border from `group.getColors().getColor(ColorType.LINE)`, `getBackColor`
 * (:683-692) from `ColorType.BACK`, and `getStrokeInternal` (:402-408) from `getSpecificLineStroke()`;
 * `ClusterHeader.java:111` builds the title font with `g.getColors()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:312-319,402-408,683-692
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:111
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

function clusterSvg(decor: string): string {
  const svg = renderSync(`@startuml\nrectangle "R" as r ${decor} {\n  component c\n}\n@enduml`);
  const start = svg.indexOf('<g class="cluster"');
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('container inline colours (colour track)', () => {
  it('draws the back colour as the cluster fill', () => {
    expect(clusterSvg('#FFF')).toContain('fill="#FFF"');
  });

  it('draws line:colour as the border', () => {
    expect(clusterSvg('#FFF;line:red')).toContain('stroke:#F00;');
  });

  it('draws line.dashed as a dashed border', () => {
    expect(clusterSvg('#FFF;line.dashed')).toContain('stroke-dasharray:7,7;');
  });

  it('draws text:colour on the title', () => {
    const svg = renderSync('@startuml\nrectangle "Title" as r #FFF;text:blue {\n  component c\n}\n@enduml');
    expect(svg).toMatch(/<text [^>]*fill="#00F"[^>]*>Title<\/text>/);
  });

  it('keeps the skin defaults with no inline colour', () => {
    const cluster = clusterSvg('');
    expect(cluster).toContain('fill="none"');
    expect(cluster).toContain('stroke:#181818;');
  });
});
