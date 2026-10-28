/**
 * `src/diagrams/wbs/index.ts` — the wbs plugin's export helpers, against
 * the Java they port:
 *
 * - `TextBlockExporter.Builder#calculateMargin` (core/TextBlockExporter.java:510-516):
 *   the merged `{root, document}` style's `Margin`, else `getDefaultMargins()`
 *   = `same(10)` (TitledDiagram.java:274-277);
 * - `TitledDiagram#calculateBackColor` (TitledDiagram.java:279-289):
 *   `root, document, wbsDiagram`'s `BackGroundColor` (DiagramType.java:256-257);
 * - `TitledDiagram#muteColorMapper` (TitledDiagram.java:291-313);
 * - `TitledDiagram#isHandwritten` (TitledDiagram.java:113-118);
 * - the fragment `renderWbs` hands to `src/index.ts`: canvas = the diagram's
 *   `calculateDimension` (fork + 20, WBSDiagram.java:104-107) plus the margins
 *   (TextBlockExporter.java:198-202); with chrome, the raw block around
 *   `BODY_ANCHOR` carrying `exportMargin` (UgDiagram.java:123-131).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { ColorMapper } from '../../../src/core/klimt/color/ColorMapper.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { BODY_ANCHOR } from '../../../src/core/TextBlockExporter.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import {
  calculateBackColor,
  calculateMargin,
  isHandwritten,
  muteColorMapper,
  renderWbs,
  wbsPlugin,
} from '../../../src/diagrams/wbs/index.js';
import { parseWbs } from '../../../src/diagrams/wbs/WBSDiagramFactory.js';
import type { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';

const measurer = new DeterministicMeasurer();

function parsed(body: string): WBSDiagram {
  const block = buildBlockUmls(`@startwbs\n${body}\n@endwbs`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  const result = parseWbs(
    {
      ...block.source,
      rawStyles: block.preprocessed.styles,
      stylePositions: block.preprocessed.stylePositions,
      styleSource: block.preprocessed,
    },
    new PreprocessingArtifact(),
  );
  if ('refused' in result) throw new Error(`refused: ${result.message}`);
  return result;
}

function sides(d: WBSDiagram): number[] {
  const m = calculateMargin(d);
  return [m.getTop(), m.getRight(), m.getBottom(), m.getLeft()];
}

describe('calculateMargin (TextBlockExporter.java:510-516)', () => {
  it('no style Margin: getDefaultMargins() = same(10)', () => {
    expect(sides(parsed('* r'))).toEqual([10, 10, 10, 10]);
  });

  it('a `root { Margin 30 }` style outranks same(10)', () => {
    expect(sides(parsed('<style>\nroot {\n  Margin 30\n}\n</style>\n* r'))).toEqual([30, 30, 30, 30]);
  });
});

describe('calculateBackColor (TitledDiagram.java:279-289)', () => {
  it('the default document background is white', () => {
    expect(calculateBackColor(parsed('* r')).asPaint()).toBe('#FFFFFF');
  });

  it('`wbsDiagram { BackgroundColor pink }` is the merged root/document/wbsDiagram value', () => {
    expect(
      calculateBackColor(parsed('<style>\nwbsDiagram {\n  BackgroundColor pink\n}\n</style>\n* r')).asPaint(),
    ).toBe('#FFC0CB');
  });
});

describe('muteColorMapper (TitledDiagram.java:291-313)', () => {
  it.each([
    ['* r', ColorMapper.IDENTITY],
    ['skinparam monochrome true\n* r', ColorMapper.MONOCHROME],
    ['skinparam monochrome reverse\n* r', ColorMapper.MONOCHROME_REVERSE],
    ['skinparam reversecolor dark\n* r', ColorMapper.LIGTHNESS_INVERSE],
    ['skinparam reversecolor nonsense\n* r', ColorMapper.IDENTITY],
    ['skinparam mode dark\n* r', ColorMapper.DARK_MODE],
  ])('%j', (body, expected) => {
    expect(muteColorMapper(parsed(body))).toBe(expected);
  });

  it('a ColorOrder name is `ColorMapper.reverse(order)`: not the identity', () => {
    const mapper = muteColorMapper(parsed('skinparam reversecolor RBG\n* r'));
    expect(mapper).not.toBe(ColorMapper.IDENTITY);
    expect(mapper).not.toBe(ColorMapper.LIGTHNESS_INVERSE);
  });
});

describe('isHandwritten (TitledDiagram.java:113-118)', () => {
  it('reads `skinparam handwritten true`, any case', () => {
    expect(isHandwritten(parsed('* r'))).toBe(false);
    expect(isHandwritten(parsed('skinparam handwritten TRUE\n* r'))).toBe(true);
  });
});

describe('renderWbs', () => {
  it('no chrome: the fork + 20 plus same(10) each side, WBS-typed, drawn in place', () => {
    // `* r`: one root box; calculateDimension = fork + 20, + 2*10 margin.
    const d = parsed('* r');
    const fragment = renderWbs(d, measurer);
    expect(fragment.diagramType).toBe('WBS');
    // Jar probe tests/fixtures/wbs/single-root.svg: viewBox 0 0 64 113.
    expect([fragment.width, fragment.height]).toEqual([64, 113]);
    expect(fragment.body).toContain('<rect');
    expect(fragment.exportMargin).toBeUndefined();
    expect(fragment.background).toBe('#FFFFFF');
  });

  it('a gradient background is carried as `backgroundGradient`, with its <defs>', () => {
    const fragment = renderWbs(parsed('<style>\nwbsDiagram {\n  BackgroundColor red/blue\n}\n</style>\n* r'), measurer);
    expect(fragment.background).toBeUndefined();
    expect(fragment.backgroundGradient).toEqual({ color1: '#FF0000', color2: '#0000FF', policy: '/' });
    expect(fragment.extraDefs).toContain('<linearGradient');
  });

  it('with a title: the raw block around BODY_ANCHOR, carrying the margin and a drawBodyAt', () => {
    const d = parsed('title T\n* r');
    const fragment = renderWbs(d, measurer);
    expect(fragment.body).toBe(BODY_ANCHOR);
    expect(fragment.exportMargin?.getTop()).toBe(10);
    expect(fragment.drawBodyAt?.(1, 0, 0).body).toContain('<rect');
    expect(fragment.frameInk).toBeUndefined();
    expect(fragment.scaleSpec).toBeUndefined();
  });

  it('a mainframe carries the LimitFinder ink and `scale` carries the scale spec', () => {
    const fragment = renderWbs(parsed('mainframe M\nscale 2\n* r'), measurer);
    expect(fragment.frameInk).toBeDefined();
    expect(fragment.scaleSpec).toBeDefined();
  });

  it('a handwritten diagram draws through UGraphicHandwritten (paths, not a rect)', () => {
    const fragment = renderWbs(parsed('skinparam handwritten true\n* r'), measurer);
    expect(fragment.body).not.toContain('<rect');
    expect(fragment.body).toContain('<path');
  });
});

describe('wbsPlugin', () => {
  it('is the `wbs` type and refuses a line no command accepts', () => {
    expect(wbsPlugin.type).toBe('wbs');
    const block = buildBlockUmls('@startwbs\n* r\nnot a wbs line\n@endwbs')[0]!;
    if (!block.ok) throw new Error('preprocessor failure');
    const result = wbsPlugin.parse(block.source);
    expect('refused' in result && result.message).toBe('Syntax Error?');
  });
});
