/**
 * cdd2-T19b — `ClusterHeader#getStereoBlock` for a class/object package
 * cluster: the group's displayed stereotype merged with its OWN legend.
 *
 * Every expected number is the pinned oracle's own bytes/DOT, read from
 * `test-results/dot-cache/class/xenere-07-kuji864/` and `sijoba-16-rari847/`
 * (rendered with `-DPLANTUML_DETERMINISTIC_TEXT=true`):
 *
 * - `package pack1 <<st>>` + two-line legend: `svek-1.dot` `WIDTH="229"
 *   HEIGHT="86"`; `in.svg` legend `<rect x="107.31" y="40" width="204.6"
 *   height="38" rx="7.5">`, `«st»` at `x="196.897" y="101.889"` in a box at
 *   `x=83.61 y=6 width=245`.
 * - `rectangle pack2 <<ddd>>` + one-line legend: `WIDTH="229" HEIGHT="72"`.
 * - `package pack2` (no stereotype) + one-line legend: `WIDTH="229"
 *   HEIGHT="58"`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:173-220
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DecorateEntityImage.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/AbstractClassOrObjectDiagram.java:353-363
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { ClassDiagramAST, Namespace } from '../../../src/diagrams/class/ast.js';
import {
  buildClusterHeaderStereo,
  visibleNamespaceStereotypeLabels,
} from '../../../src/diagrams/class/class-cluster-header.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';
import {
  getHTitle,
  getTitleBaselineOffset,
  getWTitle,
  renderNamespaceFolder,
  renderNamespaceRect,
} from '../../../src/diagrams/class/class-namespace-shape.js';
import { renderNamespaceUSymbol } from '../../../src/diagrams/class/class-namespace-usymbol-shape.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';

/** `[x, y]` of the first `<tag ...>` whose own markup contains `marker`
 *  (`shiftFragmentBody` bakes offsets without re-rounding, as on the root
 *  legend path, so coordinates are compared numerically). */
function xyOf(svg: string, tag: string, marker: string): [number, number] {
  const re = new RegExp(`<${tag} x="([\\d.]+)" y="([\\d.]+)"[^>]*${marker}`);
  const m = re.exec(svg);
  if (m === null) throw new Error(`${tag} ${marker} not found`);
  return [Number(m[1]), Number(m[2])];
}

const XENERE = [
  'class foo1',
  'package pack1 <<st>> {',
  'legend',
  'This is the legend for the package1',
  'on several lines',
  'end legend',
  'class foo2',
  '}',
  'rectangle pack2 <<ddd>> {',
  'legend',
  'This is the legend for the package2',
  'end legend',
  'class foo3',
  '}',
  'legend',
  'This is the legend for the diagram',
  'on several lines',
  'end legend',
];

function parse(lines: readonly string[]): ClassDiagramAST {
  const block: UmlSource = { lines: [...lines], type: 'class' };
  return parseClass(block);
}

function ns(ast: ClassDiagramAST, id: string): Namespace {
  const found = ast.namespaces.find((n) => n.id === id);
  if (found === undefined) throw new Error(`namespace ${id} missing`);
  return found;
}

const measurer = new WidthTableMeasurer();

describe('per-group legend routing (AbstractClassOrObjectDiagram.java:353-363)', () => {
  it('stores a legend written inside a group on that group, not the diagram', () => {
    const ast = parse(XENERE);
    expect(ns(ast, 'pack1').legend?.display).toEqual(['This is the legend for the package1', 'on several lines']);
    expect(ns(ast, 'pack2').legend?.display).toEqual(['This is the legend for the package2']);
    expect(ast.annotations?.legend.display).toEqual(['This is the legend for the diagram', 'on several lines']);
  });

  it('leaves the root legend unset when the only legend is inside a group', () => {
    const ast = parse(['package p {', 'legend', 'inner', 'end legend', 'class a', '}']);
    expect(ns(ast, 'p').legend?.display).toEqual(['inner']);
    expect(ast.annotations?.legend.display).toBeNull();
  });

  it('keeps a top-level legend on the diagram (TitledDiagram#setLegend)', () => {
    const ast = parse(['class a', 'legend', 'root', 'end legend']);
    expect(ast.annotations?.legend.display).toEqual(['root']);
  });
});

describe('displayed stereotype of a direct-keyword container (CommandPackageWithUSymbol.java:204-206)', () => {
  it('stores rectangle pack2 <<ddd>> as a displayed stereotype', () => {
    expect(ns(parse(XENERE), 'pack2').stereotype).toBe('ddd');
  });
});

describe('visible stereotype labels (CucaDiagram.java:596-620)', () => {
  it('drops a label hidden by hide <<st>> stereotype', () => {
    const ast = parse(['hide <<st>> stereotype', 'package p <<st>> {', 'class a', '}']);
    expect(visibleNamespaceStereotypeLabels(ns(ast, 'p'), ast.hideStereotypeDirectives ?? [])).toEqual([]);
  });

  it('keeps every label when no directive matches', () => {
    const ast = parse(['package p <<st>> {', 'class a', '}']);
    expect(visibleNamespaceStereotypeLabels(ns(ast, 'p'), ast.hideStereotypeDirectives ?? [])).toEqual(['st']);
  });
});

describe('ClusterHeader#getStereoBlock dimensions', () => {
  const ast = parse(XENERE);

  it('pack1: legend (63 = 38+1+24) over «st» (14), width 204.6+1+24', () => {
    const h = buildClusterHeaderStereo(ns(ast, 'pack1'), ast, defaultTheme, measurer);
    expect(h?.width).toBeCloseTo(229.6, 6);
    expect(h?.height).toBe(77);
  });

  it('pack1 body: legend rect at margin 12, «st» centred below the legend', () => {
    const h = buildClusterHeaderStereo(ns(ast, 'pack1'), ast, defaultTheme, measurer)!;
    // Jar box x=83.61 w=245 draws the block at 4 + (245-229.6)/2 = 11.7
    // (USymbolFolder#asBig), so the rect's local x is 107.31-83.61-11.7 = 12.
    expect(h.body).toContain('<rect x="12" y="12" width="204.6" height="38"');
    // «st»: x (229.6-26.425)/2 = 101.5875; baseline 63 + 14 - descent.
    const st = /<text x="([\d.]+)" y="([\d.]+)"[^>]*font-style="italic"[^>]*>«st»<\/text>/.exec(h.body);
    expect(Number(st?.[1])).toBeCloseTo(101.5875, 6);
    expect(Number(st?.[2])).toBeCloseTo(73.889, 6);
  });

  it('returns undefined when there is neither a stereotype nor a legend', () => {
    const plain = parse(['package p {', 'class a', '}']);
    expect(buildClusterHeaderStereo(ns(plain, 'p'), plain, defaultTheme, measurer)).toBeUndefined();
  });
});

describe('ClusterHeader title table (ClusterHeader.java:78-94) -> svek-1.dot', () => {
  const ast = parse(XENERE);

  it('pack1: WIDTH 229, HEIGHT 86', () => {
    const header = buildClusterHeaderStereo(ns(ast, 'pack1'), ast, defaultTheme, measurer);
    const dims = namespaceTitleTableDims('pack1', defaultTheme, measurer, undefined, header);
    expect(Math.floor(dims.width)).toBe(229);
    expect(dims.height).toBe(86);
  });

  it('pack2 (rectangle <<ddd>>): WIDTH 229, HEIGHT 72', () => {
    const header = buildClusterHeaderStereo(ns(ast, 'pack2'), ast, defaultTheme, measurer);
    const dims = namespaceTitleTableDims('pack2', defaultTheme, measurer, 'rectangle', header);
    expect(Math.floor(dims.width)).toBe(229);
    expect(dims.height).toBe(72);
  });

  it('sijoba pack2 (no stereotype): WIDTH 229, HEIGHT 58', () => {
    const sij = parse([
      'package pack2 {',
      'legend',
      'This is the legend for the package2',
      'end legend',
      'class foo3',
      '}',
    ]);
    const header = buildClusterHeaderStereo(ns(sij, 'pack2'), sij, defaultTheme, measurer);
    const dims = namespaceTitleTableDims('pack2', defaultTheme, measurer, undefined, header);
    expect(Math.floor(dims.width)).toBe(229);
    expect(dims.height).toBe(58);
  });
});

describe('draw sites place the header block (USymbolFolder / USymbolRectangle #asBig)', () => {
  const ast = parse(XENERE);
  const theme = scaleClassTheme(defaultTheme, 1);

  function geoFor(id: string, box: { x: number; y: number; width: number; height: number }): NamespaceGeo {
    const n = ns(ast, id);
    const header = buildClusterHeaderStereo(n, ast, defaultTheme, measurer);
    return {
      id,
      ...box,
      label: n.display,
      wtitle: getWTitle(measurer, defaultTheme, n.display, 0),
      htitle: getHTitle(measurer, defaultTheme, n.display),
      baselineOffset: getTitleBaselineOffset(measurer, defaultTheme, n.display),
      ...(n.usymbol !== undefined ? { usymbol: n.usymbol } : {}),
      ...(header !== undefined ? { clusterHeaderStereo: header } : {}),
    };
  }

  it('folder: legend rect at (107.31, 40), «st» at x 196.897 after the title', () => {
    const svg = renderNamespaceFolder(geoFor('pack1', { x: 83.61, y: 6, width: 245, height: 174 }), theme, measurer);
    const [rx, ry] = xyOf(svg, 'rect', 'width="204.6" height="38"');
    expect(rx).toBeCloseTo(107.31, 6);
    expect(ry).toBeCloseTo(40, 6);
    expect(svg.indexOf('>pack1<')).toBeLessThan(svg.indexOf('«st»'));
    const st = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>«st»/.exec(svg);
    expect(Number(st?.[1])).toBeCloseTo(196.8975, 3);
    expect(Number(st?.[2])).toBeCloseTo(101.889, 6);
  });

  it('rectangle USymbol: legend rect at (372.31, 34), «ddd» then pack2 centred below it', () => {
    const svg = renderNamespaceUSymbol(
      geoFor('pack2', { x: 352.61, y: 20, width: 245, height: 160 }),
      theme,
      measurer,
      {
        backColor: 'none',
        borderColor: '#181818',
        roundCorner: 5,
        fontColor: '#000000',
      },
    )!;
    const [rx, ry] = xyOf(svg, 'rect', 'width="204.6" height="24"');
    expect(rx).toBeCloseTo(372.31, 6);
    expect(ry).toBeCloseTo(34, 6);
    expect(svg).not.toContain('<!--');
    expect(svg.indexOf('«ddd»')).toBeLessThan(svg.indexOf('>pack2<'));
    const [dx, dy] = xyOf(svg, 'text', '>«ddd»');
    expect(dx).toBeCloseTo(455.641, 2);
    expect(dy).toBeCloseTo(81.889, 6);
    expect(xyOf(svg, 'text', '>pack2')).toEqual([456.429, 95.889]);
  });

  it('packageStyle rect: stereo block at y+2, title pushed down by its height', () => {
    const svg = renderNamespaceRect(geoFor('pack1', { x: 0, y: 0, width: 245, height: 174 }), theme, measurer);
    const [rx, ry] = xyOf(svg, 'rect', 'width="204.6" height="38"');
    expect(rx).toBeCloseTo(19.7, 6);
    expect(ry).toBeCloseTo(14, 6);
    const title = /<text x="[\d.]+" y="([\d.]+)"[^>]*>pack1/.exec(svg);
    expect(Number(title?.[1])).toBeCloseTo(77 + 12.889, 6);
  });
});
