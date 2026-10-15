/**
 * A collision-resolved container/leaf/note id is the scoped key `<scope>\u0000<name>` (namespace-groups.ts);
 * the jar prints the bare name (`Quark#getName`), so the NUL must never reach the `<!--cluster NAME-->` comment.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java (UComment "cluster " + group.getName())
 */
import { describe, it, expect } from 'vitest';
import { renderDescription } from '../../../src/diagrams/description/renderer.js';
import type { DescriptionGeometry } from '../../../src/diagrams/description/layout.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const SCOPED = (name: string): string => `first\u0000${name}`;

function geoOf(nodes: DescriptionNodeGeo[]): DescriptionGeometry {
  return { totalWidth: 300, totalHeight: 300, nodes, edges: [] };
}

function node(over: Partial<DescriptionNodeGeo>): DescriptionNodeGeo {
  return { id: 'x', symbol: 'rectangle', display: 'x', x: 10, y: 10, width: 100, height: 60, children: [], ...over };
}

describe('scoped ids never leak NUL into comments', () => {
  it('cluster', () => {
    const child = node({ id: 'c', symbol: 'component', x: 20, y: 40, width: 40, height: 20 });
    const svg = renderDescription(
      geoOf([node({ id: SCOPED('physical1'), symbol: 'rectangle', children: [child] })]),
      defaultTheme,
      new FormulaMeasurer(),
    );
    expect(svg).toContain('<!--cluster physical1-->');
    expect(svg).not.toContain('\u0000');
  });

  it('leaf', () => {
    const svg = renderDescription(
      geoOf([node({ id: SCOPED('leaf1'), symbol: 'component' })]),
      defaultTheme,
      new FormulaMeasurer(),
    );
    expect(svg).toContain('<!--entity leaf1-->');
    expect(svg).not.toContain('\u0000');
  });

  it('note', () => {
    const svg = renderDescription(
      geoOf([node({ id: SCOPED('n1'), symbol: 'note' })]),
      defaultTheme,
      new FormulaMeasurer(),
    );
    expect(svg).not.toContain('\u0000');
  });
});
