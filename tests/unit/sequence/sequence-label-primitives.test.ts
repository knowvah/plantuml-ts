/**
 * `sequence-label-primitives.ts` — what the recording graphic turns each
 * shape a core `TextBlock` draws into — plus the emitter and scale halves of
 * the shape/image/text primitive kinds (`sequence-text.ts`, `scale-geo.ts`).
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { FontStyle, UText } from '../../../src/core/klimt/shape/UText.js';
import { UImage } from '../../../src/core/klimt/shape/UImage.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGroup } from '../../../src/core/klimt/shape/UGroup.js';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import {
  NO_TEXT_BOUNDER,
  primitiveKind,
  recordDrawing,
  sequenceStringBounder,
} from '../../../src/diagrams/sequence/sequence-label-primitives.js';
import { sequenceSkinSimple } from '../../../src/diagrams/sequence/sequence-creole-sheet.js';
import { primitiveFields, runFontWeight, sequenceText } from '../../../src/diagrams/sequence/sequence-text.js';
import { scaleRun } from '../../../src/diagrams/sequence/scale-geo.js';
import { refBodyLines } from '../../../src/diagrams/sequence/ref-body-geo.js';
import type { TextRun } from '../../../src/diagrams/sequence/ast.js';
import { labelBlockOf, labelFont } from '../../helpers/sequence-label.js';

const measurer = new DeterministicMeasurer();
const ENV = { measurer, bounder: sequenceStringBounder(measurer) };
const URL = { url: 'http://x', tooltip: 'tip' };

function state() {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', NO_TEXT_BOUNDER);
}

describe('recordDrawing', () => {
  it('records a UText at its baseline, a UImage at its top-left, any other shape with its ink', () => {
    const runs = recordDrawing(state(), ENV, (ug) => {
      ug.apply(new UTranslate(1, 12)).draw(UText.build('a', labelFont(13)));
      ug.apply(new UTranslate(5, 2)).draw(UImage.build(10.4, 5.6, 'data:x', { rasterWidth: 10, rasterHeight: 6 }));
      ug.apply(new UTranslate(0, 20)).draw(ULine.hline(30));
    });
    expect(runs.map(primitiveKind)).toEqual(['text', 'image', 'shape']);
    expect([runs[0]!.x, runs[0]!.y]).toEqual([1, 12]);
    // `DriverImageSvg` emits a raster-backed image at its rounded size; the
    // advance keeps the raw box.
    expect(runs[1]!.image).toEqual({ href: 'data:x', width: 10, height: 6, y: 2 });
    expect(runs[1]!.textWidth).toBe(10.4);
    expect(runs[2]!.shape!.scale).toBe(1);
  });

  it('tags every primitive drawn between startUrl and closeUrl, and only those', () => {
    const runs = recordDrawing(state(), ENV, (ug) => {
      const linkable = ug as unknown as { startUrl(u: typeof URL): void; closeUrl(): void };
      linkable.startUrl(URL);
      ug.draw(UImage.build(4, 4, 'data:y'));
      ug.draw(ULine.hline(4));
      linkable.closeUrl();
      ug.draw(ULine.hline(4));
    });
    expect(runs.map((r) => r.url)).toEqual([URL, URL, undefined]);
    // A declared-size image keeps its size (`DriverImageSvg`).
    expect(runs[0]!.image!.width).toBe(4);
  });

  it('opens no group of its own and reads the translate through to the state graphic', () => {
    const runs = recordDrawing(state(), ENV, (ug) => {
      const grouped = ug as unknown as { startGroup(g: UGroup): void; closeGroup(): void };
      grouped.startGroup(UGroup.singletonMap('TITLE', 'x'));
      expect(ug.apply(new UTranslate(3, 4)).getTranslate().getDx()).toBe(3);
      grouped.closeGroup();
    });
    expect(runs).toEqual([]);
  });

  it('writes a face weight DriverTextSvg would, beside the bold flag (`DriverTextSvg.java:97-103`)', () => {
    const face900 = { ...labelFont(13), fontFace: { cssWeight: 900, italic: true } };
    const [plain, bold] = recordDrawing(state(), ENV, (ug) => {
      ug.draw(UText.build('a', face900));
      ug.draw(UText.build('b', { ...face900, styles: new Set([FontStyle.BOLD]) }));
    });
    expect([plain!.fontWeight, plain!.bold, plain!.italic]).toEqual(['900', undefined, true]);
    expect([bold!.fontWeight, bold!.bold]).toEqual(['900', true]);
  });
});

describe('NO_TEXT_BOUNDER', () => {
  it('measures nothing: the graphics it backs draw no UText', () => {
    expect(NO_TEXT_BOUNDER.calculateDimension({ family: 'x', size: 1 }, 'abc')).toEqual({ width: 0 });
  });
});

describe('sequenceSkinSimple — the SkinParam defaults CreoleParser reads', () => {
  it('answers `SkinParam.java`’s own defaults over the diagram sprites', () => {
    const skin = sequenceSkinSimple(labelFont(13), undefined).spriteContainer!;
    expect(skin.getSprite('none')).toBeNull();
    expect(skin.getFromMd5('x')).toBeNull();
    expect(skin.transformStringForSizeHack('abc')).toBe('abc');
    expect(skin.getValue('k')).toBeNull();
    expect(skin.values().size).toBe(0);
    expect(skin.getMonospacedFamily()).toBe(MONOSPACED);
    expect(skin.getTabSize()).toBe(8);
    expect(skin.getDpi()).toBe(96);
    expect(skin.copyAllFrom(new Map())).toBeUndefined();
    expect(skin.guillemet()).toBe(sequenceSkinSimple(labelFont(13), undefined).spriteContainer!.guillemet());
  });
});

describe('the emitter and scale halves', () => {
  const RUN: TextRun = {
    text: 'x',
    x: 4,
    y: 8,
    textWidth: 10,
    textAscent: 6,
    textLineHeight: 8,
    url: URL,
    textBackColor: '#FF0000',
    extraLines: [{ color: '#00FF00', deltaY: 2 }],
  };

  it('copies every no-fallback field, and nothing absent', () => {
    expect(primitiveFields(RUN)).toEqual({ url: URL, textBackColor: '#FF0000', extraLines: RUN.extraLines });
    const { url: _url, textBackColor: _back, extraLines: _lines, ...plain } = RUN;
    expect(primitiveFields(plain)).toEqual({});
  });

  it('lets a face weight beat the bold fallback, and the run beat the block', () => {
    expect(runFontWeight({ ...RUN, fontWeight: '900' }, true)).toBe('900');
    expect(runFontWeight(RUN, true)).toBe('700');
    expect(runFontWeight(RUN)).toBeUndefined();
  });

  it('wraps a shape primitive in its url', () => {
    const recorded = recordDrawing(state(), ENV, (ug) => ug.draw(ULine.hline(5)))[0]!;
    const svg = sequenceText({
      leftX: 0,
      baselineY: 0,
      text: '',
      width: 0,
      fontFamily: 'sans-serif',
      fontSize: 13,
      fill: '#000',
      shape: recorded.shape!,
      url: URL,
    });
    expect(svg.startsWith('<a ')).toBe(true);
    expect(svg).toContain('<line');
  });

  it('scales an extra line offset and records the scale on a shape (`SvgGraphics.java:466-468`)', () => {
    const shape = recordDrawing(state(), ENV, (ug) => ug.draw(ULine.hline(5)))[0]!.shape!;
    const out = scaleRun({ ...RUN, shape }, 3);
    expect(out.extraLines).toEqual([{ color: '#00FF00', deltaY: 6 }]);
    expect(out.shape!.scale).toBe(3);
    expect(out.shape!.shape).toBe(shape.shape);
  });
});

describe('refBodyLines', () => {
  it('has a body only for a ref, and none for a blank one (`CommandReferenceOverSeveral.java:125,132`)', () => {
    expect(refBodyLines('group', 'x')).toEqual([]);
    expect(refBodyLines('ref', '   ')).toEqual([]);
    expect(refBodyLines('ref', 'a')).toEqual(['a']);
  });
});

describe('svg attributes reach the recorded run (DriverTextSvg.java:178-180)', () => {
  const SOURCE = '<text class=foo id=dummy>message</text>';

  it('a <text …> label is one run of its inner text carrying the sorted attributes', () => {
    const { primitives } = labelBlockOf([SOURCE], labelFont(13));
    expect(primitives.map((p) => p.text)).toEqual(['message']);
    expect([...(primitives[0]!.svgAttributes ?? [])]).toEqual([
      ['class', 'foo'],
      ['id', 'dummy'],
    ]);
  });

  it('records no field on a plain run, and the attributes key the label cache', () => {
    expect('svgAttributes' in labelBlockOf(['message'], labelFont(13)).primitives[0]!).toBe(false);
    const tagged = labelBlockOf(['<text class=a>message</text>'], labelFont(13)).primitives[0]!;
    const other = labelBlockOf(['<text class=b>message</text>'], labelFont(13)).primitives[0]!;
    expect([tagged.svgAttributes?.get('class'), other.svgAttributes?.get('class')]).toEqual(['a', 'b']);
  });
});
