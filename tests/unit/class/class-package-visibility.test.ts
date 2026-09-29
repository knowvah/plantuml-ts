/**
 * cdd6-T3d (topave-65-ceso890): a `package` header's visibility character.
 * `CommandPackage.java:74` captures it and `:189-192` stores
 * `getVisibilityModifier(visibility + "FOO", false)` on the group;
 * `ClusterHeader#getTitleBlock` merges `withMargin(modifier.getUBlock(size,
 * ...), 0, 0, 4, 0)` LEFT of the title (`ClusterHeader.java:130-138`), and
 * that merged block is the `dimLabel` sizing the DOT title table (`:78-90`)
 * and the folder tab (`USymbolFolder#getWTitle`/`getHTitle`).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';
import { renderSync } from '../../../src/index.js';

const measurer = new FormulaMeasurer();
/** `classAttributeIconSize` default 10: block `size + 1` wide, `+ 4` top margin. */
const ICON_W = 11;
const ICON_H = 15;

function layout(lines: string[]) {
  const ast = parseClass({ lines, type: 'class' });
  let g: DotInputGraph | undefined;
  setLayoutInputObserver(({ graph: x }) => {
    g = x;
  });
  try {
    const geo = layoutClass(ast, defaultTheme, measurer);
    return { ast, geo, graph: g! };
  } finally {
    setLayoutInputObserver(undefined);
  }
}

const TOPAVE = ['- package foo {', '- class alice', '}', '+ package Dummy {', '+ class Bob {', '- field', '}', '}'];

describe('package visibility modifier', () => {
  it('stores the modifier on the namespace', () => {
    const { ast } = layout([...TOPAVE, 'package plain {', 'class C', '}']);
    expect(ast.namespaces.map((n) => [n.id, n.visibilityModifier])).toEqual([
      ['foo', '-'],
      ['Dummy', '+'],
      ['plain', undefined],
    ]);
  });

  it('widens and heightens the DOT title table by the icon block', () => {
    const { graph } = layout(TOPAVE);
    const plain = namespaceTitleTableDims('foo', defaultTheme, measurer);
    const foo = graph.clusters?.find((c) => c.label === 'foo');
    expect(foo?.labelWidth).toBeCloseTo(plain.width + ICON_W, 6);
    // mergeLR: max(14, 15) - 5 = 10 (jar WIDTH="30" HEIGHT="10").
    expect(foo?.labelHeight).toBe(ICON_H - 5);
    expect(foo?.titleTableHeight).toBe(ICON_H - 5);
  });

  it('widens the folder tab and centres the title on the merged block', () => {
    const plainGeo = layout(['package foo {', 'class alice', '}']).geo.namespaces[0]!;
    const geo = layout(TOPAVE).geo.namespaces.find((n) => n.id === 'foo')!;
    expect(geo.wtitle).toBeCloseTo(plainGeo.wtitle + ICON_W, 6);
    expect(geo.htitle).toBe(ICON_H + 6);
    const textH = plainGeo.htitle - 6;
    expect(geo.baselineOffset).toBeCloseTo(plainGeo.baselineOffset + (ICON_H - textH) / 2, 6);
    expect(geo.visibilityBlock).toEqual({ modifier: '-', width: ICON_W, height: ICON_H });
  });

  it('draws the METHOD icon left of the title', () => {
    const svg = renderSync(['@startuml', ...TOPAVE, '@enduml'].join('\n'), { measurer });
    const fooCluster = /<g class="cluster" data-qualified-name="foo".*?<\/text><\/g>/s.exec(svg)?.[0] ?? '';
    const rect =
      /<g data-visibility-modifier="PRIVATE_METHOD"><rect x="([\d.]+)" y="([\d.]+)" width="6" height="6"/.exec(
        fooCluster,
      );
    const text = /<text x="([\d.]+)"[^>]*>foo<\/text>/.exec(fooCluster);
    expect(rect).not.toBeNull();
    expect(Number(text![1]) - Number(rect![1])).toBeCloseTo(ICON_W - 2, 6);
    expect(svg).toContain('data-visibility-modifier="PUBLIC_METHOD"');
  });

  it('draws the title icon with the cluster stroke, member icons with the default', () => {
    // USymbolFolder.java:224 applies symbolContext (the 1.5 border) before
    // :228 draws the title; VisibilityModifier#drawInternal sets no UStroke.
    const svg = renderSync(['@startuml', ...TOPAVE, '@enduml'].join('\n'), { measurer });
    const clusters = svg.match(/<g class="cluster".*?<\/text><\/g>/gs) ?? [];
    const headerIcons = clusters.flatMap((c) => c.match(/<g data-visibility-modifier="[A-Z_]+">.*?<\/g>/g) ?? []);
    expect(headerIcons).toHaveLength(2);
    for (const icon of headerIcons) expect(icon).toContain('stroke-width:1.5;');
    const memberIcons = svg.match(/<g data-visibility-modifier="[A-Z_]+_FIELD">.*?<\/g>/g) ?? [];
    expect(memberIcons.length).toBeGreaterThan(0);
    for (const icon of memberIcons) expect(icon).toContain('stroke-width:1;');
  });
});
