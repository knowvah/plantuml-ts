/**
 * T2d (mission cdd6): edge labels are creole (`SvekEdge.java:298-299`'s
 * `create0(..., CreoleMode.SIMPLE_LINE, ...)`), not plain text --
 * `kexaba-26-kobu577` (a lone `<$sprite>` token) and `rimeca-17-gice904`
 * (`<U>agregation</U>`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import {
  computeMeasuredLabelAttrs,
  resolveLoneSpriteLabel,
  stripCreoleShorthand,
} from '../../../src/diagrams/class/class-edge-label-measure.js';
import { multiLineLabelAnchor } from '../../../src/diagrams/class/class-edge-label-anchor.js';
import { attachEdgeLabel, type EdgeGeoTextContext } from '../../../src/diagrams/class/class-edge-label-attach.js';
import { renderEdgeMainLabel, arrowLabelTextAttrs } from '../../../src/diagrams/class/renderer-edge-label.js';
import type { Relationship } from '../../../src/diagrams/class/ast.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { resolveArrowLabelFont } from '../../../src/core/arrow-label-font.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';

const measurer = new DeterministicMeasurer();
const labelFont = resolveArrowLabelFont(defaultTheme);

/** A 17x12 monochrome sprite -- the same declared dims as kexaba's own
 *  `sprite $pk [17x12/16z] ...`. */
function registryWith17x12(name: string): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = new SpriteMonochrome(17, 12, 16);
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 17; x++) sprite.setGray(x, y, (x + y) % 16);
  }
  addSprite(registry, name, sprite);
  return registry;
}

const edgeResult: DotLayoutResult['edges'][number] = {
  labelX: 100,
  labelY: 50,
} as DotLayoutResult['edges'][number];
const straightPoints = [
  { x: 90, y: 30 },
  { x: 110, y: 70 },
];

function baseEdge(overrides: Partial<EdgeGeo> = {}): EdgeGeo {
  return {
    id: 'e1',
    points: straightPoints,
    sourceDecor: 'none',
    targetDecor: 'none',
    dashed: false,
    from: 'A',
    to: 'B',
    ...overrides,
  };
}

describe('T2d — resolveLoneSpriteLabel', () => {
  it('resolves a label that is ENTIRELY one <$sprite> token to its declared box', () => {
    const sprites = registryWith17x12('pk');
    const resolved = resolveLoneSpriteLabel('<$pk>', labelFont, sprites);
    expect(resolved).toMatchObject({ width: 17, height: 12 });
    expect(resolved?.href).toMatch(/^data:image\/png;base64,/);
  });

  it('is undefined for a label carrying text alongside the atom', () => {
    expect(resolveLoneSpriteLabel('foo <$pk>', labelFont, registryWith17x12('pk'))).toBeUndefined();
  });

  it('is undefined without a registry', () => {
    expect(resolveLoneSpriteLabel('<$pk>', labelFont, undefined)).toBeUndefined();
  });

  it('is undefined for an unknown sprite name', () => {
    expect(resolveLoneSpriteLabel('<$nope>', labelFont, registryWith17x12('pk'))).toBeUndefined();
  });
});

describe('T2d — computeMeasuredLabelAttrs sizes a lone-sprite label to its sprite box', () => {
  it('kexaba-26-kobu577: 17x12, not the literal "<$pk>" glyphs', () => {
    const attrs = computeMeasuredLabelAttrs('<$pk>', labelFont, measurer, { sprites: registryWith17x12('pk') });
    expect(attrs.labelWidth).toBe(17);
    expect(attrs.labelHeight).toBe(12);
  });

  it('falls back to measuring literal text without a registry', () => {
    const attrs = computeMeasuredLabelAttrs('<$pk>', labelFont, measurer, {});
    const literal = measurer.measure('<$pk>', labelFont);
    expect(attrs.labelWidth).toBeCloseTo(literal.width, 6);
  });
});

describe('T2d — computeMeasuredLabelAttrs strips <u> before measuring (rimeca-17-gice904)', () => {
  it('measures "agregation", not the literal "<U>agregation</U>" tags', () => {
    const attrs = computeMeasuredLabelAttrs('<U>agregation</U>', labelFont, measurer);
    const stripped = measurer.measure('agregation', labelFont);
    expect(attrs.labelWidth).toBeCloseTo(stripped.width, 6);
  });
});

describe('T2d — attachEdgeLabel draws a lone-sprite label as an image, not text', () => {
  it('kexaba-26-kobu577: EdgeGeo.labelImage carries the resolved box, EdgeGeo.label stays unset', () => {
    const sprites = registryWith17x12('pk');
    const text: EdgeGeoTextContext = {
      measurer,
      labelFont,
      fontFamily: defaultTheme.fontFamily,
      noteCtx: { theme: defaultTheme, sprites },
    };
    const rel: Relationship = { from: 'A', to: 'B', type: 'association', label: '<$pk>' };
    const edgeGeo: EdgeGeo = baseEdge();
    attachEdgeLabel(edgeGeo, rel, edgeResult, text, straightPoints);
    expect(edgeGeo.label).toBeUndefined();
    expect(edgeGeo.labelImage).toBeDefined();
    expect(edgeGeo.labelImage?.width).toBe(17);
    expect(edgeGeo.labelImage?.height).toBe(12);
    // T1b (D5): this is the RAW pre-shift anchor -- box-origin
    // (`center - reservedDim/2`, reservedDim = sprite + 2*marginLabel,
    // marginLabel=1 for a non-self-loop) + marginLabel -- algebraically
    // `center - Math.trunc(width)/2`. `class-layout-shift.ts#shiftEdgeGeo`
    // applies the later (dx,dy) ink-shift that reaches the jar's final
    // document-frame position (`class-layout-shift.test.ts`).
    expect(edgeGeo.labelImage?.x).toBe(edgeResult.labelX! - Math.trunc(17) / 2);
    expect(edgeGeo.labelImage?.y).toBe(edgeResult.labelY! - Math.trunc(12) / 2);
  });

  it('without a sprite registry the label draws as literal text (unchanged)', () => {
    const text: EdgeGeoTextContext = { measurer, labelFont, fontFamily: defaultTheme.fontFamily };
    const rel: Relationship = { from: 'A', to: 'B', type: 'association', label: '<$pk>' };
    const edgeGeo: EdgeGeo = baseEdge();
    attachEdgeLabel(edgeGeo, rel, edgeResult, text, straightPoints);
    expect(edgeGeo.labelImage).toBeUndefined();
    expect(edgeGeo.label?.text).toBe('<$pk>');
  });
});

describe('T2d — attachEdgeLabel marks an underlined label (rimeca-17-gice904)', () => {
  it('EdgeGeo.label.text drops the <U>/</U> tags and sets underline:true', () => {
    const text: EdgeGeoTextContext = { measurer, labelFont, fontFamily: defaultTheme.fontFamily };
    const rel: Relationship = { from: 'A', to: 'B', type: 'aggregation', label: '<U>agregation</U>' };
    const edgeGeo: EdgeGeo = baseEdge();
    attachEdgeLabel(edgeGeo, rel, edgeResult, text, straightPoints);
    expect(edgeGeo.label?.text).toBe('agregation');
    expect(edgeGeo.label?.underline).toBe(true);
  });

  it('a plain label leaves underline unset', () => {
    const text: EdgeGeoTextContext = { measurer, labelFont, fontFamily: defaultTheme.fontFamily };
    const rel: Relationship = { from: 'A', to: 'B', type: 'association', label: 'plain' };
    const edgeGeo: EdgeGeo = baseEdge();
    attachEdgeLabel(edgeGeo, rel, edgeResult, text, straightPoints);
    expect(edgeGeo.label?.text).toBe('plain');
    expect(edgeGeo.label?.underline).toBeUndefined();
  });
});

describe('T2d — renderEdgeMainLabel renders the two new EdgeGeo shapes', () => {
  const fontAttrs = arrowLabelTextAttrs({ ...defaultTheme, scaleK: 1 });

  it('draws text-decoration="underline" for an underlined label', () => {
    const geo: EdgeGeo = baseEdge({
      label: { text: 'agregation', x: 10, y: 20, width: 61.425, underline: true },
    });
    const [svg] = renderEdgeMainLabel(geo, fontAttrs, '#000000');
    expect(svg).toContain('text-decoration="underline"');
    expect(svg).toContain('>agregation<');
  });

  it('draws an <image> for a labelImage, and no <text>', () => {
    const geo: EdgeGeo = baseEdge({
      labelImage: { href: 'data:image/png;base64,AAA', x: 66.5, y: 114, width: 17, height: 12 },
    });
    const [svg] = renderEdgeMainLabel(geo, fontAttrs, '#000000');
    expect(svg).toBe('<image width="17" height="12" x="66.5" y="114" xlink:href="data:image/png;base64,AAA"/>');
  });
});

describe('T1b (xuloxo-85-vibu502) — stripCreoleShorthand strips **bold**/[Ii]talic', () => {
  it('strips a **bold** wrap and reports bold:true', () => {
    expect(stripCreoleShorthand('**Label**')).toEqual({ text: 'Label', bold: true, italic: false });
  });

  it('strips a //italic// wrap and reports italic:true', () => {
    expect(stripCreoleShorthand('//[Optional Technology]//')).toEqual({
      text: '[Optional Technology]',
      bold: false,
      italic: true,
    });
  });

  it('leaves plain text untouched', () => {
    expect(stripCreoleShorthand('plain')).toEqual({ text: 'plain', bold: false, italic: false });
  });
});

describe('T1b — multiLineLabelAnchor strips **/// per line and flags bold/italic', () => {
  it('xuloxo-85-vibu502: "**Label**" bold, "//[Optional Technology]//" italic', () => {
    const [line1, line2] = multiLineLabelAnchor(
      ['**Label**', '//[Optional Technology]//'],
      'center',
      { x: 100, y: 100 },
      measurer,
      labelFont,
    );
    expect(line1?.text).toBe('Label');
    expect(line1?.bold).toBe(true);
    expect(line1?.italic).toBeUndefined();
    expect(line2?.text).toBe('[Optional Technology]');
    expect(line2?.italic).toBe(true);
    expect(line2?.bold).toBeUndefined();
  });
});

describe('T1b — computeMeasuredLabelAttrs measures the stripped multi-line width', () => {
  it('measures "Label"/"[Optional Technology]", not the literal **/// markers', () => {
    // `\\n` (the literal 2-char escape PlantUML source carries), not a raw
    // LF -- `DisplayNewlines.ts#parseWithNewlines` splits on the escape
    // sequence, matching `Display.getWithNewlines`'s own scan.
    const attrs = computeMeasuredLabelAttrs('**Label**\\n//[Optional Technology]//', labelFont, measurer);
    const strippedWidths = [
      measurer.measure('Label', labelFont).width,
      measurer.measure('[Optional Technology]', labelFont).width,
    ];
    expect(attrs.labelWidth).toBeCloseTo(Math.max(...strippedWidths), 6);
    expect(attrs.labelHeight).toBeCloseTo(measurer.measure('Label', labelFont).height * 2, 6);
  });
});

describe('T1b — renderEdgeMainLabel draws font-weight/font-style for bold/italic lines', () => {
  const fontAttrs = arrowLabelTextAttrs({ ...defaultTheme, scaleK: 1 });

  it('draws font-style="italic" for an italic line', () => {
    const geo: EdgeGeo = baseEdge({
      labelLines: [{ text: '[Optional Technology]', x: 10, y: 20, width: 113.4, italic: true }],
    });
    const [svg] = renderEdgeMainLabel(geo, fontAttrs, '#000000');
    expect(svg).toContain('font-style="italic"');
    expect(svg).toContain('>[Optional Technology]<');
  });
});

describe('T1b (D5) — self-loop lone-sprite label end-to-end (marginLabel=6)', () => {
  it('person --> person : <$pk> draws the sprite at the oracle-verified (122.79,25) (scripts/oracle-render.sh probe, this session)', () => {
    const markup = [
      '@startuml',
      'sprite $pk [17x12/16z] bSY53GC13CNGS7waxhzkZvcVqAOp4R5j8evrSoS6RISRZ2VP3VoWQf6eVa0SBY9cAG5gGRe425sEnq1hLKKVD',
      'class person',
      'person --> person : <$pk>',
      '@enduml',
    ].join('\n');
    const svg = renderSync(markup, { measurer });
    expect(svg).toContain('<image width="17" height="12" x="122.79" y="25"');
  });
});
