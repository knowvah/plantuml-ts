/**
 * gtc-T1 (rufopi): a container's fill cascades from `<style> root { BackgroundColor }`.
 * `Cluster#getStyle` (`Cluster.java:385-391`) merges the signature `root, element, <diagram>, group,
 * <uSymbol SNames>` (`Cluster.java:286-296`), and `Cluster.getBackColor` (`Cluster.java:701-710`) reads
 * `PName.BackGroundColor` from it. `plantuml.skin:102-103` gives `group` a `transparent` fill, but the user's
 * `root` declaration is merged after it (declaration order, `StyleStorage#computeMergedStyle`), so it wins.
 * Expected values: `test-results/dot-cache/unknown/rufopi-30-roro642/in.svg` (both container paths `fill="#DFD"`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:285-296,385-391,701-710
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

const ROOT_BG = '<style>\nroot {\n  BackgroundColor #DFD\n}\n</style>\n';

function clusterFills(prelude: string, keyword: string): string[] {
  const svg = renderSync(`@startuml\n${prelude}${keyword} "k" as p {\n  component c\n}\n@enduml`);
  const start = svg.indexOf('<g class="cluster"');
  const body = svg.slice(start, svg.indexOf('</g>', start));
  return [...body.matchAll(/<(?:path|rect) [^>]*fill="([^"]*)"/g)].map((m) => m[1] ?? '');
}

describe('container fill from root style', () => {
  it('fills both paths of a file container with the root BackgroundColor', () => {
    expect(clusterFills(ROOT_BG, 'file')).toEqual(['#DFD', '#DFD']);
  });

  it('fills a rectangle container the same way', () => {
    expect(clusterFills(ROOT_BG, 'rectangle')).toEqual(['#DFD']);
  });

  it('keeps an inline back colour over the root style', () => {
    const svg = renderSync(`@startuml\n${ROOT_BG}rectangle "k" as p #FFF {\n  component c\n}\n@enduml`);
    const start = svg.indexOf('<g class="cluster"');
    expect(svg.slice(start, svg.indexOf('</g>', start))).toContain('fill="#FFF"');
  });

  it('leaves the fill none when no style sets a background', () => {
    expect(clusterFills('', 'file')).toEqual(['none', 'none']);
  });
});
