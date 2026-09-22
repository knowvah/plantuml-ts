import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  namespaceTitleRuns,
  namespaceTitleWidth,
  renderNamespaceTitleRuns,
  type NamespaceTitleRun,
} from '../../../src/diagrams/class/class-namespace-title-runs.js';
import {
  getWTitle,
  getHTitle,
  renderNamespaceFolder,
  renderNamespaceRect,
  renderEmptyPackageIcon,
} from '../../../src/diagrams/class/class-namespace-shape.js';
import {
  namespaceTitleLines,
  namespaceTitleHeight,
  namespaceTitleLineBaselines,
} from '../../../src/diagrams/class/class-namespace-title-runs.js';
import { namespaceTitleTableDims } from '../../../src/diagrams/class/class-namespace-title-table.js';
import { computeTitleTableHeight } from '../../../src/core/cluster-title-table.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';
import type { SpriteDimsLookup } from '../../../src/core/creole-atoms.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';

const measurer = new WidthTableMeasurer();

/** Narrows a `NamespaceTitleRun` to its `'text'` variant, failing the test
 *  loudly (not silently `undefined`-propagating) if a run turns out to be
 *  an `'image'` one where a test expects text. */
function asText(run: NamespaceTitleRun | undefined): Extract<NamespaceTitleRun, { kind: 'text' }> {
  if (run?.kind !== 'text') throw new Error(`expected a 'text' run, got ${JSON.stringify(run)}`);
  return run;
}

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
    expect(asText(runs[0]).text).toBe('foo');
    expect(asText(runs[0]).font.family).toBe(defaultTheme.fontFamily);
  });

  it('splits an unresolvable <img:> file reference into a bold text run plus a monospace fallback run', () => {
    const runs = namespaceTitleRuns(IMG_LABEL, defaultTheme);
    expect(runs).toHaveLength(2);
    expect(asText(runs[0]).text).toBe('MyNamespaceName ');
    expect(asText(runs[1]).text).toBe('(Cannot decode)');
  });

  it('draws the fallback run at the jar-hardcoded monospace-14, non-bold, black font', () => {
    const runs = namespaceTitleRuns(IMG_LABEL, defaultTheme);
    const fallback = asText(runs[1]);
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

// ---------------------------------------------------------------------------
// cdd-T26 residual round: daxeno-00-kasu166 -- `\n` (Display escape) title
// split, mixed per-line font sizes (`<size:18>`). See fixtures/tools/
// render-diff.mts daxeno-00-kasu166 for the full before/after; the
// `<<Database>>` cluster's OWN colour/shape selection is row 118's
// territory (`.agent-notes/cdd-T26.md`) and is NOT asserted here.
// ---------------------------------------------------------------------------
const DAXENO_LABEL = '<size:18>styled2</size>\\nshould be styled';

describe('namespaceTitleLines — cdd-T26 residual round (daxeno-00-kasu166)', () => {
  it('splits a Display \\n escape into two physical lines, each its own run/font-size', () => {
    const lines = namespaceTitleLines(measurer, defaultTheme, DAXENO_LABEL);
    expect(lines).toHaveLength(2);
    expect(asText(lines[0]?.runs[0]).text).toBe('styled2');
    expect(lines[0]?.fontSize).toBe(18);
    expect(asText(lines[1]?.runs[0]).text).toBe('should be styled');
    expect(lines[1]?.fontSize).toBe(14);
  });

  it('sums per-line widths to the jar-verified block width (93.45, DOT WIDTH="93")', () => {
    expect(namespaceTitleWidth(measurer, defaultTheme, DAXENO_LABEL)).toBeCloseTo(93.45, 2);
  });

  it('sums per-line heights to the jar-verified block height (18+14=32)', () => {
    expect(namespaceTitleHeight(measurer, defaultTheme, DAXENO_LABEL)).toBe(32);
  });

  it('stacks per-line baselines at the jar-verified 14.889px gap (56.889-42 in daxeno)', () => {
    const lines = namespaceTitleLines(measurer, defaultTheme, DAXENO_LABEL);
    const baselines = namespaceTitleLineBaselines(measurer, defaultTheme, lines);
    expect(baselines).toHaveLength(2);
    expect(baselines[1]! - baselines[0]!).toBeCloseTo(14.889, 2);
  });

  it('reduces to one line for a markup-free, escape-free label', () => {
    expect(namespaceTitleLines(measurer, defaultTheme, 'foo')).toHaveLength(1);
  });
});

describe('computeTitleTableHeight — cdd-T26 array (per-line font size) form', () => {
  it('matches the pre-existing count*fontSize form for a plain number', () => {
    expect(computeTitleTableHeight(1, 0, 0, 14)).toBe(9);
    expect(computeTitleTableHeight([14], 0, 0, 14)).toBe(9);
  });

  it('sums mixed per-line heights (daxeno: [18,14] -> 27, matching svek-1.dot HEIGHT=42 with +15 supp)', () => {
    expect(computeTitleTableHeight([18, 14], 0, 0, 0)).toBe(27);
  });
});

describe('renderNamespaceRect/renderEmptyPackageIcon — cdd-T26 multi-line wiring', () => {
  function daxenoRectGeo(): NamespaceGeo {
    return {
      id: 'p',
      x: 6,
      y: 6,
      width: 118,
      height: 130,
      label: DAXENO_LABEL,
      wtitle: getWTitle(measurer, defaultTheme, DAXENO_LABEL, 0),
      htitle: getHTitle(measurer, defaultTheme, DAXENO_LABEL),
      baselineOffset: 12.889,
    };
  }

  it('renderNamespaceRect draws two lines, each centred against geo.width independently', () => {
    const svg = renderNamespaceRect(daxenoRectGeo(), defaultTheme, measurer);
    expect(svg).toContain('>styled2</text>');
    expect(svg).toMatch(/>should.be.styled<\/text>/u);
    expect(svg).not.toContain('\\nshould');
  });

  it('renderNamespaceRect is byte-identical with/without a measurer for a markup-free label', () => {
    const geo: NamespaceGeo = { ...daxenoRectGeo(), label: 'foo', wtitle: getWTitle(measurer, defaultTheme, 'foo', 0) };
    expect(renderNamespaceRect(geo, defaultTheme, measurer)).toBe(renderNamespaceRect(geo, defaultTheme));
  });

  it('renderEmptyPackageIcon draws two lines at the fixed geo.x+4 left margin', () => {
    const svg = renderEmptyPackageIcon(daxenoRectGeo(), defaultTheme, measurer);
    expect(svg).toContain('>styled2</text>');
    expect(svg).toMatch(/>should.be.styled<\/text>/u);
    expect(svg).not.toContain('\\nshould');
  });

  it('renderEmptyPackageIcon is byte-identical with/without a measurer for a markup-free label', () => {
    const geo: NamespaceGeo = { ...daxenoRectGeo(), label: 'foo', wtitle: getWTitle(measurer, defaultTheme, 'foo', 0) };
    expect(renderEmptyPackageIcon(geo, defaultTheme, measurer)).toBe(renderEmptyPackageIcon(geo, defaultTheme));
  });
});

// ---------------------------------------------------------------------------
// cdd-T26 "Extra": `<$sprite>`/successfully-decoded `<img:data:...>` in a
// namespace title -- no corpus fixture exercises either shape (cdd-T26
// diagnosis), so there is NO jar oracle for a full-SVG comparison. Fixtures
// authored at tests/fixtures/class/namespace-title-sprite.puml and
// namespace-title-img-data.puml document the .puml shape these tests
// exercise at the ATOM level (namespaceTitleRuns' own returned data),
// per the mission's "author a fixture rather than leave it unhandled" ask.
// ---------------------------------------------------------------------------
describe('namespaceTitleRuns — sprite/img-data in a namespace title (no oracle -- atom-level only)', () => {
  function boxSpriteRegistry(): ReturnType<typeof createSpriteRegistry> {
    const registry = createSpriteRegistry();
    const sprite = new SpriteMonochrome(16, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) sprite.setGray(x, y, (x + y) % 16);
    addSprite(registry, 'box', sprite);
    return registry;
  }
  const boxDims: SpriteDimsLookup = { get: (name) => (name === 'box' ? { width: 16, height: 16 } : undefined) };

  it('resolves a <$sprite> reference to an image run (tests/fixtures/class/namespace-title-sprite.puml)', () => {
    const runs = namespaceTitleRuns('Data <$box>', defaultTheme, boxSpriteRegistry(), boxDims);
    expect(runs).toHaveLength(2);
    expect(asText(runs[0]).text).toBe('Data ');
    const sprite = runs[1]!;
    expect(sprite.kind).toBe('image');
    if (sprite.kind === 'image') {
      expect(sprite.href.startsWith('data:image/png;base64,')).toBe(true);
      expect(sprite.width).toBeGreaterThan(0);
      expect(sprite.height).toBeGreaterThan(0);
    }
  });

  it('skips an unknown sprite name (StripeSimple.addSprite\'s "unknown name -> nothing" rule)', () => {
    const runs = namespaceTitleRuns('Data <$unknownSprite>', defaultTheme, boxSpriteRegistry(), boxDims);
    expect(runs.every((r) => r.kind === 'text')).toBe(true);
  });

  // 2x2 all-opaque-white PNG, same data URI this codebase's own point-icon
  // atom already uses elsewhere (verified valid: `parsePngIhdrFromDataUri`
  // decodes a 2x2 IHDR) -- tests/fixtures/class/namespace-title-img-data.puml.
  const TINY_PNG_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEElEQVR4XmNgYGD4D8UQBgAd9AP95BvM/wAAAABJRU5ErkJggg==';

  it('resolves a successfully-decoded <img:data:...> reference to an image run, href passed through verbatim', () => {
    const runs = namespaceTitleRuns(`Data <img:${TINY_PNG_DATA_URI}>`, defaultTheme);
    expect(runs).toHaveLength(2);
    expect(asText(runs[0]).text).toBe('Data ');
    const img = runs[1]!;
    expect(img.kind).toBe('image');
    if (img.kind === 'image') {
      expect(img.href).toBe(TINY_PNG_DATA_URI);
      expect(img.width).toBe(2);
      expect(img.height).toBe(2);
    }
  });

  it('renderNamespaceTitleRuns bottom-aligns an image run to the text baseline', () => {
    const runs = namespaceTitleRuns(`Data <img:${TINY_PNG_DATA_URI}>`, defaultTheme);
    const svg = renderNamespaceTitleRuns(10, 20, runs, measurer);
    expect(svg).toContain('<image');
    expect(svg).toContain('width="2"');
    expect(svg).toContain('height="2"');
    expect(svg).toContain('y="18"'); // baseline(20) - height(2)
    expect(svg).toContain(`xlink:href="${TINY_PNG_DATA_URI}"`);
  });
});
