import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  namespaceTitleRuns,
  namespaceTitleWidth,
  renderNamespaceTitleRuns,
} from '../../../src/diagrams/class/class-namespace-title-runs.js';
import { getWTitle, renderNamespaceFolder } from '../../../src/diagrams/class/class-namespace-shape.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';

const measurer = new WidthTableMeasurer();

// cdd-T26: `jabama-09-kago823` (`namespace "MyNamespaceName
// <img:HelloWorld.png{scale=1.5}>" as net.f-oo`) — jar-verified
// (test-results/dot-cache/class/jabama-09-kago823/in.svg):
//   <text x="10" y="18.889" ... font-weight="700">MyNamespaceName</text>
//   <text x="140.725" y="18.889" ... font-family="monospace">(Cannot decode)</text>
// i.e. two runs: bold sans "MyNamespaceName " (130.725px) then monospace,
// non-bold "(Cannot decode)" (100.363px), same baseline y, sequential x.
const IMG_LABEL = 'MyNamespaceName <img:HelloWorld.png{scale=1.5}>';

describe('namespaceTitleRuns', () => {
  it('reduces a markup-free label to exactly one run at the base font', () => {
    const runs = namespaceTitleRuns('foo', defaultTheme);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.text).toBe('foo');
    expect(runs[0]?.font.family).toBe(defaultTheme.fontFamily);
  });

  it('splits an unresolvable <img:> file reference into a bold text run plus a monospace fallback run', () => {
    const runs = namespaceTitleRuns(IMG_LABEL, defaultTheme);
    expect(runs).toHaveLength(2);
    expect(runs[0]?.text).toBe('MyNamespaceName ');
    expect(runs[1]?.text).toBe('(Cannot decode)');
  });

  it('draws the fallback run at the jar-hardcoded monospace-14, non-bold, black font', () => {
    const runs = namespaceTitleRuns(IMG_LABEL, defaultTheme);
    const fallback = runs[1]!;
    // `MONOSPACED` is the internal logical name; `text()`'s own
    // `textFontFamily` renames it to the CSS `monospace` keyword at emit
    // time (`core/svg-text-font.ts#renameLogicalMonospace`) -- see the
    // `renderNamespaceTitleRuns` test below for the RENDERED value.
    expect(fallback.font.family).toBe('monospaced');
    expect(fallback.font.size).toBe(14);
    expect(fallback.font.color).toBe('#000000');
    expect(fallback.font.styles.size).toBe(0);
  });
});

describe('namespaceTitleWidth', () => {
  it('equals a single measure() call for a markup-free label', () => {
    expect(namespaceTitleWidth(measurer, defaultTheme, 'foo')).toBeCloseTo(19.425, 3);
  });

  it('sums the bold-name run and the monospace fallback run (jar: 130.725 + 100.363)', () => {
    expect(namespaceTitleWidth(measurer, defaultTheme, IMG_LABEL)).toBeCloseTo(130.725 + 100.363, 2);
  });
});

describe('renderNamespaceTitleRuns', () => {
  it('places each run sequentially from x0, at its own font, jar-exact widths', () => {
    const runs = namespaceTitleRuns(IMG_LABEL, defaultTheme);
    const svg = renderNamespaceTitleRuns(10, 18.889, runs, measurer);
    expect(svg).toContain('<text x="10" y="18.889"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('>MyNamespaceName</text>');
    expect(svg).toContain('<text x="140.725"');
    expect(svg).toContain('font-family="monospace"');
    // The fallback run's family is `monospace`/`courier` -- `emittedTextForm`
    // swaps its internal space for NBSP (U+00A0) at emit time
    // (`core/svg-text-font.ts`'s own `nbspIfMonospace` doc-comment citation),
    // so the rendered content is NOT byte-identical to the JS string
    // `'(Cannot decode)'` -- match loosely instead of asserting the NBSP.
    expect(svg).toMatch(/>\(Cannot.decode\)<\/text>/u);
    expect(svg).not.toMatch(/\(Cannot.decode\)<\/text>.*font-weight="700"/u);
  });
});

function jabamaGeo(): NamespaceGeo {
  const label = IMG_LABEL;
  return {
    id: 'net.f-oo',
    x: 6,
    y: 6,
    width: 355,
    height: 97,
    label,
    wtitle: getWTitle(measurer, defaultTheme, label, 0),
    htitle: 20,
    baselineOffset: 12.889,
  };
}

describe('renderNamespaceFolder — cdd-T26 multi-run title wiring (jabama-09-kago823)', () => {
  it('emits two <text> runs (not one literal-markup run) when a measurer is supplied', () => {
    const svg = renderNamespaceFolder(jabamaGeo(), defaultTheme, measurer);
    expect(svg).not.toContain('&lt;img:');
    expect(svg).toContain('>MyNamespaceName</text>');
    expect(svg).toMatch(/>\(Cannot.decode\)<\/text>/u);
  });

  it('falls back to the single-run literal-text path when no measurer is supplied (pre-T26 behavior)', () => {
    const svg = renderNamespaceFolder(jabamaGeo(), defaultTheme);
    expect(svg).toContain('>MyNamespaceName &lt;img:HelloWorld.png{scale=1.5}></text>');
  });

  it('is measurement-identical for a markup-free label whether or not a measurer is supplied', () => {
    const geo: NamespaceGeo = { ...jabamaGeo(), label: 'foo', wtitle: getWTitle(measurer, defaultTheme, 'foo', 0) };
    expect(renderNamespaceFolder(geo, defaultTheme, measurer)).toBe(renderNamespaceFolder(geo, defaultTheme));
  });
});

describe('namespaceTitleTableDims — cdd-T26 DOT-graph sizing', () => {
  it('sizes a markup-free title exactly as one raw measure() call (cidepu-54-bemo048)', () => {
    const dims = namespaceTitleTableDims('pack', defaultTheme, measurer);
    expect(dims.width).toBeCloseTo(29.575, 2);
    expect(dims.height).toBe(9);
  });

  it('sums the bold-name run and the monospace fallback run, not one raw bold measure', () => {
    const dims = namespaceTitleTableDims(IMG_LABEL, defaultTheme, measurer);
    expect(dims.width).toBeCloseTo(130.725 + 100.363, 2);
  });
});
