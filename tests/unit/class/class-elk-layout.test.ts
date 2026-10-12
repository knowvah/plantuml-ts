/**
 * cdd8 T3a: the class engine under `!pragma layout elk` -- `class-elk-layout.ts`,
 * `class-elk-adapter.ts`, `renderer-elk.ts`. Expected values are the jar's
 * (`test-results/dot-cache/class/<slug>/in.svg`, 1.2026.8beta1, ELK 0.12.0).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { classPlugin } from '../../../src/diagrams/class/index.js';
import { classifierLeaves, type ClassGeometry } from '../../../src/diagrams/class/class-geo-types.js';
import type { ElkBackend } from '../../../src/core/elk/elk-backend.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSync } from '../../../src/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseClass } from './parse-helper.js';

const DOT_CACHE = join(__dirname, '../../../test-results/dot-cache/class');
const ELK_PRAGMA_LINE = '!pragma layout elk';

function cachedSource(slug: string): string {
  return readFileSync(join(DOT_CACHE, slug, 'in.puml'), 'utf8');
}

/** The `@startuml` body lines of a cached fixture, the pragma optionally dropped. */
function body(slug: string, keepPragma: boolean): string[] {
  return cachedSource(slug)
    .split('\n')
    .filter((l) => !/^@(start|end)uml/.test(l.trim()))
    .filter((l) => keepPragma || l.trim() !== ELK_PRAGMA_LINE);
}

function layout(lines: readonly string[], elk?: ElkBackend): ClassGeometry {
  const block: UmlSource = { lines: [...lines], type: 'class' };
  return classPlugin.layoutSync(parseClass(block), defaultTheme, new DeterministicMeasurer(), { elk });
}

let elk: ElkBackend;
beforeAll(async () => {
  elk = await loadElk();
});

describe('class ELK leaf size (CucaDiagramFileMakerElk.java:375-378)', () => {
  it("gives each lagudi leaf the svek path's own size for the same entity", () => {
    const svek = classifierLeaves(layout(body('lagudi-03-rucu383', false)).leaves);
    const elkGeo = layout(body('lagudi-03-rucu383', true), elk).elk!;
    const bounder = new MeasurerStringBounder(new DeterministicMeasurer());
    expect(svek.map((c) => c.id).sort()).toEqual([...elkGeo.leafGeos.keys()].sort());
    for (const c of svek) {
      const dim = elkGeo.adapter.calculateDimension(c.id, bounder);
      expect([c.id, dim.getWidth(), dim.getHeight()]).toEqual([c.id, c.width, c.height]);
    }
  });
});

describe('class ELK layout', () => {
  it('carries the maker result and draws no svek geometry', () => {
    const geo = layout(body('cadutu-02-lazu601', true), elk);
    expect(geo.leaves).toEqual([]);
    expect(geo.edges).toEqual([]);
    expect([...geo.elk!.result.nodes.keys()]).toEqual(['foo1', 'foo2', 'foo', 'bar', 'bar2']);
    expect(geo.elk!.result.edges.size).toBe(3);
  });

  it("lays out applySingleStrategy's invisible chain links (temofi: CucaDiagram.java:701-726)", () => {
    const adapter = layout(body('temofi-63-vega763', true), elk).elk!.adapter;
    const links = adapter.getLinks();
    expect(links.map((l) => [adapter.getEntity1(l), adapter.getEntity2(l), adapter.isInvis(l)])).toEqual([
      ['foo1', 'foo3', true],
      ['foo1', 'foo4', true],
    ]);
  });

  it('presents a reversed arrow with upstream entity order and decors (A <|-- B)', () => {
    const adapter = layout(['!pragma layout elk', 'class A', 'class B', 'A <|-- B'], elk).elk!.adapter;
    const [link] = adapter.getLinks();
    expect([adapter.getEntity1(link!), adapter.getEntity2(link!)]).toEqual(['A', 'B']);
    expect(adapter.getType(link!).toString()).toBe('NONE-NORMAL(null)-EXTENDS');
  });

  it('prints groups before root leaves and mutes an empty package to a node (CucaDiagramFileMakerElk.java:315-346)', () => {
    const geo = layout(
      [
        '!pragma layout elk',
        'package outer {',
        '  package inner {',
        '    class X',
        '  }',
        '  class Y',
        '}',
        'package empty {',
        '}',
        'class Z',
        'Z --> outer',
        'X ..> Z : uses',
        'Y -[hidden]-> Z',
      ],
      elk,
    ).elk!;
    expect([...geo.result.clusters.keys()]).toEqual(['outer', 'outer.inner']);
    expect([...geo.result.nodes.keys()]).toEqual(['outer.Y', 'outer.inner.X', 'empty', 'Z']);
    const links = geo.adapter.getLinks();
    expect(links.map((l) => geo.adapter.isHidden(l))).toEqual([false, false, true]);
    expect(geo.adapter.getType(links[1]!).toString()).toBe('ARROW-DASHED(null)-NONE');
  });

  it('refuses class features the ELK path does not port yet', () => {
    expect(() => layout(['!pragma layout elk', 'class A', 'note "n" as N1'], elk)).toThrow(/notes not yet supported/);
  });
});

describe('class ELK render', () => {
  it('draws cadutu where the jar does', () => {
    const svg = renderSync(cachedSource('cadutu-02-lazu601'), { measurer: new DeterministicMeasurer(), elk });
    const rects = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="48"/g)].map((m) =>
      m.slice(1, 4).map(Number),
    );
    expect(rects).toEqual([
      [48.356, 12, 59.212],
      [48.356, 173, 59.212],
      [212.127, 12, 51.425],
      [203.162, 173, 52.212],
      [275.375, 173, 60],
    ]);
    expect(svg).toContain('width="349px" height="236px"');
    expect(svg).toContain('<line x1="246.41" y1="85" x2="305.375" y2="85"');
  });

  it("numbers entities as the jar does (cirojo: ent0002 inside package 'color')", () => {
    const svg = renderSync(cachedSource('cirojo-62-dubo306'), { measurer: new DeterministicMeasurer(), elk });
    expect([...svg.matchAll(/data-qualified-name="([^"]+)" id="(ent\d+)"/g)].map((m) => `${m[1]}=${m[2]}`)).toEqual([
      'color.red=ent0002',
      'color.green=ent0003',
      'foo=ent0005',
      'bar=ent0006',
    ]);
  });

  it('strips the magic-arrow token from a link label, drawing no glyph (StringWithArrow.java:80-82)', () => {
    const svg = renderSync('@startuml\n!pragma layout elk\nclass A\nclass B\nA --> B : owns >\n@enduml', {
      measurer: new DeterministicMeasurer(),
      elk,
    });
    expect(svg).toMatch(/>owns<\/text>/);
    expect(svg).not.toContain('owns &gt;');
  });
});

describe('class ELK: USymbol leaves and the adapter seams', () => {
  const MIXED = [
    '!pragma layout elk',
    'allowmixing',
    'class A',
    'component C',
    'actor U',
    'folder F',
    'A --> C',
    'U --> A',
    'A --> F',
  ];

  it("draws EntityImageDescription leaves through the svek leaf draw (jar: 167x279, '<!--entity C-->')", () => {
    const svg = renderSync(['@startuml', ...MIXED, '@enduml'].join('\n'), {
      measurer: new DeterministicMeasurer(),
      elk,
    });
    expect(svg).toContain('width="167px" height="279px"');
    expect([...svg.matchAll(/<!--(class|entity) (\w)-->/g)].map((m) => m[2])).toEqual(['A', 'C', 'U', 'F']);
  });

  it("answers the folder leaf's tab border and no border for a class box (EntityImageDescription.java:362-366)", () => {
    const adapter = layout(MIXED, elk).elk!.adapter;
    expect(adapter.getMagneticBorder('F').constructor.name).not.toBe('MagneticBorderNone');
    expect(adapter.getMagneticBorder('A').constructor.name).toBe('MagneticBorderNone');
  });

  it('the layout adapter draws leaves into a LimitFinder only', () => {
    const geo = layout(body('rutefe-49-xeju709', true), elk).elk!;
    expect(() =>
      geo.adapter.drawLeaf('foo1', { getTranslate: () => undefined } as never, { x: 0, y: 0 } as never),
    ).toThrow('class ELK: the layout adapter draws into a LimitFinder only');
  });
});
