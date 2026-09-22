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
import { defaultTheme } from '../../../src/core/theme.js';
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

const measurer = new WidthTableMeasurer();

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
    expect(renderNamespaceUSymbol(dativuGeo(), defaultTheme, measurer, NODE_PAINT)).toBe(
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
    const svg = renderNamespaceUSymbol(dativuGeo(), defaultTheme, measurer, NODE_PAINT) ?? '';
    expect(svg.match(/<(polygon|line|text)\b/g)).toHaveLength(5);
  });

  it('declines (undefined) for a namespace with no USymbol keyword — folder path still owns it', () => {
    // `exactOptionalPropertyTypes`: an absent key, not an `undefined` value.
    const { usymbol: _omitted, ...noSymbol } = dativuGeo();
    expect(renderNamespaceUSymbol(noSymbol, defaultTheme, measurer, NODE_PAINT)).toBe(undefined);
  });

  it('declines for the folder family: USymbols.PACKAGE/FOLDER are both USymbolFolder', () => {
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'package' }), defaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'folder' }), defaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
  });

  it('declines for a keyword that resolves to no USymbol at all', () => {
    expect(renderNamespaceUSymbol(dativuGeo({ usymbol: 'not-a-symbol' }), defaultTheme, measurer, NODE_PAINT)).toBe(
      undefined,
    );
  });

  it('paints the resolved back colour into the shape (inline `package X <<Node>> #DDDDDD`)', () => {
    const geo = dativuGeo({ color: '#DDDDDD' });
    const svg =
      renderNamespaceUSymbol(geo, defaultTheme, measurer, {
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
