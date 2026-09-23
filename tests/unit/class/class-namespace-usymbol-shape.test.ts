/**
 * cdd-T12 (diagnosis A2b E3/E4, A3 M3): a NON-EMPTY container's USymbol
 * shape, its `[[url]]` wrap, and the paint that reaches it.
 *
 * Every expectation is the PINNED ORACLE's own bytes, read out of
 * `test-results/dot-cache/class/<slug>/in.svg` (rendered with
 * `-DPLANTUML_DETERMINISTIC_TEXT=true`), not a re-derivation:
 *
 * `dativu-93-pona469` — `package foo <<Node>>` at cluster box
 * `(16, 6, 150, 102)`:
 *   <polygon points="16,16,26,6,166,6,166,98,156,108,16,108,16,16"
 *            fill="none" style="stroke:#181818;stroke-width:1;
 *            stroke-linejoin:miter;stroke-miterlimit:10;"/>
 *   <line x1="156" y1="16" x2="166" y2="6" .../>
 *   <line x1="16"  y1="16" x2="156" y2="16" .../>
 *   <line x1="156" y1="16" x2="156" y2="108" .../>
 *   <text x="77.288" y="29.889" fill="#000" font-size="14"
 *         textLength="19.425" font-weight="700">foo</text>
 * i.e. 5 children — `USymbolNode#drawNode` (`decoration/symbol/
 * USymbolNode.java:71-92`) plus `asBig`'s own centred title at `:177-179`.
 *
 * `dopuzi-50-muxo994` — `package foo [[http://www.google.com]] {`:
 *   <g class="cluster" ...><a target="_top" href="http://www.google.com"
 *      ...><path…/><line…/><text…>foo</text></a></g>
 * i.e. exactly ONE cluster child (`svek/Cluster.java:337-341,379-382`).
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';
import { renderNamespaceUSymbol } from '../../../src/diagrams/class/class-namespace-usymbol-shape.js';
import {
  getWTitle,
  getHTitle,
  getTitleBaselineOffset,
  namespaceFill,
  PACKAGE_ROUND_CORNER,
} from '../../../src/diagrams/class/class-namespace-shape.js';
import { wrapCluster } from '../../../src/diagrams/class/renderer-group.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const measurer = new WidthTableMeasurer();
const scaledDefaultTheme = scaleClassTheme(defaultTheme, 1);

const NODE_PAINT = {
  backColor: 'none',
  borderColor: defaultTheme.colors.border,
  roundCorner: PACKAGE_ROUND_CORNER,
  fontColor: '#000000',
} as const;

/** `dativu-93-pona469`'s first cluster, verbatim from the cached oracle. */
function dativuGeo(overrides?: Partial<NamespaceGeo>): NamespaceGeo {
  return {
    id: 'foo',
    x: 16,
    y: 6,
    width: 150,
    height: 102,
    label: 'foo',
    usymbol: 'node',
    wtitle: getWTitle(measurer, defaultTheme, 'foo', 0),
    htitle: getHTitle(measurer, defaultTheme, 'foo'),
    baselineOffset: getTitleBaselineOffset(measurer, defaultTheme, 'foo'),
    ...overrides,
  };
}

describe('renderNamespaceUSymbol — <<Node>> container (dativu-93-pona469)', () => {
  it('draws USymbolNode#asBig byte-exactly: polygon + 3 lines + centred bold title', () => {
    expect(renderNamespaceUSymbol(dativuGeo(), scaledDefaultTheme, measurer, NODE_PAINT)).toBe(
      '<polygon points="16,16,26,6,166,6,166,98,156,108,16,108,16,16" fill="none"' +
        ' style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>' +
        '<line x1="156" y1="16" x2="166" y2="6" style="stroke:#181818;stroke-width:1;"/>' +
        '<line x1="16" y1="16" x2="156" y2="16" style="stroke:#181818;stroke-width:1;"/>' +
        '<line x1="156" y1="16" x2="156" y2="108" style="stroke:#181818;stroke-width:1;"/>' +
        '<text x="77.288" y="29.889" fill="#000" font-size="14" textLength="19.425"' +
        ' font-weight="700">foo</text>',
    );
  });

  it("emits the jar's 5 cluster children (was 3: the plain folder path/line/text)", () => {
    const svg = renderNamespaceUSymbol(dativuGeo(), scaledDefaultTheme, measurer, NODE_PAINT) ?? '';
    expect(svg.match(/<(polygon|line|text)\b/g)).toHaveLength(5);
  });

  it('declines (undefined) for a namespace with no USymbol keyword — folder path still owns it', () => {
    // `exactOptionalPropertyTypes`: an absent key, not an `undefined` value.
    const { usymbol: _omitted, ...noSymbol } = dativuGeo();
    expect(renderNamespaceUSymbol(noSymbol, scaledDefaultTheme, measurer, NODE_PAINT)).toBe(undefined);
  });

  it('declines for the folder family: USymbols.PACKAGE/FOLDER are both USymbolFolder', () => {
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'package' }), scaledDefaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'folder' }), scaledDefaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
  });

  it('declines for a keyword that resolves to no USymbol at all', () => {
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'not-a-symbol' }), scaledDefaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
  });

  it('paints the resolved back colour into the shape (inline `package X <<Node>> #DDDDDD`)', () => {
    const geo = dativuGeo({ color: '#DDDDDD' });
    const svg =
      renderNamespaceUSymbol(geo, scaledDefaultTheme, measurer, {
        ...NODE_PAINT,
        backColor: namespaceFill(geo, defaultTheme),
      }) ?? '';
    expect(svg).toContain('<polygon points="16,16,26,6,166,6,166,98,156,108,16,108,16,16" fill="#DDD"');
  });
});

describe('wrapCluster — package [[url]] (dopuzi-50-muxo994, A2b E4)', () => {
  const inner = '<path d="M0,0"/><line x1="0" y1="0" x2="1" y2="0"/><text x="0" y="0">foo</text>';

  it('wraps the whole cluster body in ONE <a>, so the cluster has a single child', () => {
    // `Url.java`'s ctor: tooltip defaults to the url, label to '' (class-url.ts).
    const url = 'http://www.google.com';
    const out = wrapCluster('foo', 'ent0001', 'foo', inner, { url, tooltip: url, label: '' });
    expect(out).toBe(
      '<!--cluster foo--><g class="cluster" data-qualified-name="foo" id="ent0001">' +
        // Attribute ORDER is `core/svg.ts#linkWrap`'s own established
        // emitter order (the classifier `[[url]]` path already emits it);
        // `tests/oracle/svg-conformance/normalize.ts` sorts attributes
        // before comparing, so it is not a fidelity claim -- the CHILD
        // COUNT (one `<a>`) is.
        '<a target="_top" href="http://www.google.com" xlink:href="http://www.google.com"' +
        ' xlink:type="simple" xlink:actuate="onRequest" xlink:show="new"' +
        // `title`/`xlink:title` come from `UrlInfo.tooltip`, which
        // `Url.java`'s ctor defaults to the url itself -- dopuzi's jar `<a>`
        // carries both.
        ' title="http://www.google.com" xlink:title="http://www.google.com">' +
        inner +
        '</a></g>',
    );
  });

  it('leaves the three children bare when the package has no url (unchanged pre-T12 shape)', () => {
    const out = wrapCluster('foo', 'ent0001', 'foo', inner);
    expect(out).toBe('<!--cluster foo--><g class="cluster" data-qualified-name="foo" id="ent0001">' + inner + '</g>');
  });
});

describe('namespaceTitleTableDims — ClusterHeader per-USymbol supplement (A2b E3)', () => {
  // `ClusterHeader.java:87-94` adds `uSymbol.suppWidthBecauseOfShape()` /
  // `suppHeightBecauseOfShape()`. Verified against the cached oracle DOT
  // `test-results/dot-cache/class/dativu-93-pona469/svek-1.dot`:
  //   cluster6  label=<TABLE ... WIDTH="79"  HEIGHT="14">   ("foo",  <<Node>>)
  //   cluster12 label=<TABLE ... WIDTH="87"  HEIGHT="14">   ("foo1", <<Node>>)
  it('adds USymbolNode’s width+60 / height+5 (dativu-93-pona469 svek-1.dot)', () => {
    const plain = namespaceTitleTableDims('foo', defaultTheme, measurer);
    const node = namespaceTitleTableDims('foo', defaultTheme, measurer, 'node');
    expect(Math.floor(plain.width)).toBe(19);
    expect(plain.height).toBe(9);
    expect(Math.floor(node.width)).toBe(79);
    expect(node.height).toBe(14);
    expect(Math.floor(namespaceTitleTableDims('foo1', defaultTheme, measurer, 'node').width)).toBe(87);
  });

  it('adds USymbolDatabase’s height+15 with no width term (USymbolDatabase.java:172-175)', () => {
    const db = namespaceTitleTableDims('foo', defaultTheme, measurer, 'database');
    expect(Math.floor(db.width)).toBe(19);
    expect(db.height).toBe(24);
  });

  it('adds nothing for the base USymbol default or an unresolvable keyword', () => {
    expect(namespaceTitleTableDims('foo', defaultTheme, measurer, 'package')).toEqual(
      namespaceTitleTableDims('foo', defaultTheme, measurer),
    );
    expect(namespaceTitleTableDims('foo', defaultTheme, measurer, 'not-a-symbol')).toEqual(
      namespaceTitleTableDims('foo', defaultTheme, measurer),
    );
  });
});

/**
 * cdd-B7FU-R3 (`daxeno-00-kasu166`, `package "styled2\nshould be styled"
 * <<Database>> { class foo }`): `Cluster.java:358-364`'s `getStyle()`
 * appends the USymbol's own SName to the style signature, so a `skinparam
 * database { BackgroundColor yellow; border { color grey }; Font { Color
 * LightGrey } }` element-bucket override outranks the generic
 * `plantuml.skin:102-104` `group { BackGroundColor transparent;
 * LineThickness 1.0 }` default (`resolveClusterUSymbolPaint`, inlined in
 * `renderNamespaceUSymbol`) — but an inline `#COLOR` override
 * (`NamespaceGeo.color`) still wins the background role, matching
 * `Cluster#drawU`'s own `group.getColors()`-first cascade. Separately,
 * `ClusterHeader.java:125`'s title alignment (`style
 * .getHorizontalAlignment()`) resolves to CENTER for a composite/package
 * title (`plantuml.skin:94-98`), so a multi-line title's shorter line sits
 * to the right of the longer line's `@x`, not flush with it.
 */
describe('renderNamespaceUSymbol — <<Database>> per-symbol paint + multi-line title (daxeno-00-kasu166, cdd-B7FU-R3)', () => {
  function themeWithDatabaseBucket() {
    const theme = deepMergeTheme(defaultTheme, {});
    theme.colors.elements = {
      database: { background: '#FF0', border: '#808080', font: '#D3D3D3' },
    };
    return scaleClassTheme(theme, 1);
  }

  function daxenoGeo(overrides?: Partial<NamespaceGeo>): NamespaceGeo {
    return {
      id: 'ent0002',
      x: 0,
      y: 0,
      width: 150,
      height: 102,
      label: 'styled2\nshould be styled',
      usymbol: 'database',
      wtitle: 0,
      htitle: 0,
      baselineOffset: 0,
      ...overrides,
    };
  }

  it('an element-bucket override wins over the generic group default (background/border/font)', () => {
    const theme = themeWithDatabaseBucket();
    const svg = renderNamespaceUSymbol(daxenoGeo(), theme, measurer, NODE_PAINT) ?? '';
    // NODE_PAINT's own fallback ('none' fill, defaultTheme.colors.border
    // stroke, '#000000' font) must NOT survive.
    expect(svg).toContain('fill="#FF0"');
    expect(svg).toContain('stroke:#808080');
    expect(svg).toContain('fill="#D3D3D3"');
  });

  it('an unstyled USymbol (no matching bucket) keeps the generic fallback — regression guard, dativu-93-pona469', () => {
    const svg = renderNamespaceUSymbol(dativuGeo(), scaledDefaultTheme, measurer, NODE_PAINT) ?? '';
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(`stroke:${defaultTheme.colors.border}`);
  });

  it('an inline `package "X" #COLOR <<Database>>` override still wins over the element bucket for background', () => {
    const theme = themeWithDatabaseBucket();
    const geo = daxenoGeo({ color: '#123456' });
    const svg =
      renderNamespaceUSymbol(geo, theme, measurer, { ...NODE_PAINT, backColor: namespaceFill(geo, theme) }) ?? '';
    expect(svg).toContain('fill="#123456"');
    expect(svg).not.toContain('fill="#FF0"');
  });

  it('each title line is centred within the merged block, not left-flush (ClusterHeader.java:125, plantuml.skin:94-98)', () => {
    const theme = themeWithDatabaseBucket();
    const svg = renderNamespaceUSymbol(daxenoGeo(), theme, measurer, NODE_PAINT) ?? '';
    const xs = [...svg.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(xs).toHaveLength(2);
    // "styled2" (18px) is narrower than "should be styled" (14px) despite
    // the LARGER font — centred, its own `@x` sits to the RIGHT of the
    // wider line's `@x`, never equal to it (which LEFT alignment would
    // produce for two differently-sized lines).
    expect(xs[0]).toBeGreaterThan(xs[1]!);
  });
});
