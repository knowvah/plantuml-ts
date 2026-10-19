/**
 * gtc-T2 (zosuje, banatu): a container's fill and border come from the merged style of
 * `root, element, <diagram>, group, <uSymbol SNames>` (`Cluster.java:285-296,385-391`):
 * `Cluster.getBackColor` (`:701-710`) reads BackGroundColor and `drawU` (`:312-319`) LineColor off it.
 * Expected values: `test-results/dot-cache/component/zosuje-43-zebi775/in.svg` (both file-container paths
 * `fill="#FFE4C4"`, `stroke:#F00`) and `component/banatu-09-koce254` (node containers `stroke:#00F`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:285-296,312-319,385-391,701-710
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

const GROUP_STYLE =
  '<style>\nroot {\n  BackgroundColor paleGreen\n}\ngroup {\n  BackgroundColor bisque\n  LineColor Red\n}\n</style>\n';

function clusterBody(prelude: string, keyword: string): string {
  const svg = renderSync(`@startuml\n${prelude}${keyword} "k" as p {\n  component c\n}\n@enduml`);
  const start = svg.indexOf('<g class="cluster"');
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('container colours from group / root styles', () => {
  it('fills and strokes both file-container paths from the group style', () => {
    const body = clusterBody(GROUP_STYLE, 'file');
    expect([...body.matchAll(/<path [^>]*fill="([^"]*)"/g)].map((m) => m[1])).toEqual(['#FFE4C4', '#FFE4C4']);
    expect([...body.matchAll(/stroke:([^;]*);/g)].map((m) => m[1])).toEqual(['#F00', '#F00']);
  });

  it('lets a symbol bucket beat the group bucket', () => {
    const body = clusterBody(`${GROUP_STYLE}<style>\nrectangle {\n  LineColor blue\n}\n</style>\n`, 'rectangle');
    expect(body).toContain('stroke:#00F;');
    expect(body).toContain('fill="#FFE4C4"');
  });

  it('takes the border from a root LineColor when no group style sets one', () => {
    const body = clusterBody('<style>\nroot {\n  LineColor blue\n}\n</style>\n', 'node');
    expect(body).toContain('stroke:#00F;');
  });

  it('keeps the skin border with no style', () => {
    expect(clusterBody('', 'rectangle')).toContain('stroke:#181818;');
    expect(clusterBody('', 'package')).toContain('stroke:#000;');
  });
});
