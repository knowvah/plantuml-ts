/**
 * EntityImageDescriptionDelegates.test.ts — SI30/T2: `descAtomOps`'s
 * text-atom altitude (`getStartingAltitude = getSpace(atom.font)`) and
 * muted-font measurement/draw, wired through `buildDesc`'s real
 * Sea/SheetBlock1 pipeline (decisions.md#D1/D2).
 *
 * `x<sup>2</sup>` is the first creole line of `exposant-02-usecase`'s note
 * (`test-results/dot-cache/usecase/exposant-02-usecase/in.puml`,
 * `oracle/goldens/description/exposant-02-usecase/`) — the same markup, not
 * a synthesized lookalike. `WidthTableMeasurer` matches the deterministic
 * mode that fixture's own `svek-1.dot` golden was captured under
 * (`scripts/oracle-render.sh`).
 *
 * PAIRED assertion (per the task's TDD note): the SAME two numbers this
 * test checks — the muted-run's measured line-height contribution
 * (`calculateDimension`, `Sea#doAlign`'s `-height + startingAltitude`) and
 * its DRAWN `font-size`/`y` (via `drawU` -> `DriverTextSvg`) — must agree,
 * because both read through the identical `descAtomOps` `AtomOps` bundle.
 */
import { describe, expect, test } from 'vitest';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import { buildDesc } from '../../../../../src/core/svek/image/EntityImageDescriptionDelegates.js';
import type {
  EntityImageDescriptionLabels,
  EntityImageDescriptionPaint,
} from '../../../../../src/core/svek/image/EntityImageDescription.js';
import type { USymbol } from '../../../../../src/core/decoration/symbol/USymbol.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import { registerNestedDiagramRenderer } from '../../../../../src/core/nested-diagram-registry.js';
import type { NestedDiagramRenderer } from '../../../../../src/core/EmbeddedDiagram.js';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UImage } from '../../../../../src/core/klimt/shape/UImage.js';

const measurer = new WidthTableMeasurer();
const driverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return measurer.measure(text, font);
  },
};

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

/** `buildDesc` only reads `symbol.getSNames()[0]` (the `package_` empty-desc
 *  check) — the `exposant-02-usecase` note is not a package leaf. */
const noteSymbol = { getSNames: () => ['note_'] } as unknown as USymbol;

function paint(overrides: Partial<EntityImageDescriptionPaint> = {}): EntityImageDescriptionPaint {
  return {
    forecolor: '#000000',
    backcolor: '#FFFFFF',
    roundCorner: 0,
    diagonalCorner: 0,
    deltaShadow: 0,
    stroke: UStroke.withThickness(1),
    fontTitle: FONT,
    fontStereo: FONT,
    titleAlignment: HorizontalAlignment.LEFT,
    stereotypeAlignment: HorizontalAlignment.LEFT,
    ...overrides,
  };
}

function labels(displayText: string): EntityImageDescriptionLabels {
  return { codeName: displayText, displayText, stereotypeLabels: [] };
}

describe('descAtomOps (SI30/T2) — text-atom altitude + muted font via buildDesc', () => {
  test('NORMAL-only text: unaffected (getStartingAltitude 0, no line-height growth)', () => {
    const block = buildDesc(noteSymbol, labels('x2'), paint());
    const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
    expect(dim.getHeight()).toBeCloseTo(14, 6);
  });

  test('x<sup>2</sup>: the EXPOSANT run grows the line height by Sea placement', () => {
    // Sea#doAlign: 'x' (NORMAL, height 14, altitude 0) spans [-14, 0];
    // '2' (EXPOSANT, muted height 11, altitude -6) spans [-17, -6].
    // getHeight = maxY - minY = 0 - (-17) = 17, not 14 (decisions.md#D2).
    const block = buildDesc(noteSymbol, labels('x<sup>2</sup>'), paint());
    const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
    expect(dim.getHeight()).toBeCloseTo(17, 6);
  });

  test('x<sub>2</sub>: the INDICE run also grows the line height (lowered, not raised)', () => {
    // 'x' spans [-14, 0]; '2' (INDICE, muted height 11, altitude +3) spans
    // [-11 + 3, 3] = [-8, 3]. getHeight = 3 - (-14) = 17.
    const block = buildDesc(noteSymbol, labels('x<sub>2</sub>'), paint());
    const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
    expect(dim.getHeight()).toBeCloseTo(17, 6);
  });

  test('paired: the measured line-height growth matches the DRAWN font-size (muted, not eagerly)', () => {
    const block = buildDesc(noteSymbol, labels('x<sup>2</sup>'), paint());
    const bounder = new MeasurerStringBounder(measurer);
    const measuredHeight = block.calculateDimension(bounder).getHeight();

    const ug = newGraphic();
    block.drawU(ug);
    const svg = ug.getSvgString();
    const texts = [...svg.matchAll(/<text[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];
    const normalRun = texts.find((m) => m[2] === 'x');
    const exposantRun = texts.find((m) => m[2] === '2');
    expect(normalRun?.[1]).toBe('14');
    // Muted at DRAW time (D1): 14 - 3 = 11, never the unmuted 14.
    expect(exposantRun?.[1]).toBe('11');
    // Same Sea placement the measured dimension used above.
    expect(measuredHeight).toBeCloseTo(17, 6);
  });

  test('the second usecase-note line (<size:20>) is unaffected — NORMAL at a different size', () => {
    const block = buildDesc(noteSymbol, labels('<size:20>Big</size:20>'), paint());
    const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
    expect(dim.getHeight()).toBeCloseTo(20, 6);
  });
});

// ---------------------------------------------------------------------------
// cdd5-T4d: `{{ }}` inside a description label (kelefe-72-cefi192 et al.).
// The jar SIZES the embed through `EmbeddedDiagram#calculateDimensionSlow`'s
// non-SVG arm -- the oracle's `StringBounderFromWidthTable` never
// `matchesProperty("SVG")` (`StringBounder.java:43-45` default false), so
// `getImage` runs and the catch returns `new XDimension2D(42, 42)`
// (`EmbeddedDiagram.java:126-152`) -- but DRAWS the real SVG image, since
// `UGraphicSvg#matchesProperty("SVG")` is true (`EmbeddedDiagram.java:
// 169-174`, `UGraphicSvg.java:175-179`).
// ---------------------------------------------------------------------------

/** A nested render whose own dims are the jar's drawn `file f1` image
 *  (`test-results/dot-cache/unknown/kelefe-72-cefi192/in.svg`: 51x54). */
function fakeNestedRenderer(sources: string[][]): NestedDiagramRenderer {
  return {
    render(source: readonly string[]): TextBlock {
      sources.push([...source]);
      return {
        calculateDimension: () => new XDimension2D(51, 54),
        drawU: (ug) => ug.draw(UImage.build(51, 54, 'data:image/svg+xml;base64,AA==')),
      };
    },
  };
}

describe('buildDesc — {{ }} embed in a description label (cdd5-T4d)', () => {
  test('sizes at the 42x42 catch fallback but draws the nested image at its own size', () => {
    const sources: string[][] = [];
    registerNestedDiagramRenderer(fakeNestedRenderer(sources));
    const block = buildDesc(noteSymbol, labels('{{\nfile f1\n}}'), paint());
    const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
    expect(dim.getWidth()).toBe(42);
    expect(dim.getHeight()).toBe(42);

    const ug = newGraphic();
    block.drawU(ug);
    const svg = ug.getSvgString();
    expect(/<image[^>]*>/.exec(svg)?.[0]).toMatch(/width="51" height="54" x="0" y="0"/);
    expect(sources[0]).toEqual(['@startuml', 'file f1', '@enduml']);
  });
});

// ---------------------------------------------------------------------------
// cdd5-T4d: `AtomText#drawU`'s tab tokenizer (`AtomText.java:210-231`) --
// rizisu-50-liza998's `\ttext` / `\t\ttext` lines draw each token at the
// advanced x: tab stop = `getSize2D() * 4` = 56 (java:270-275, the space
// glyph measures 0 under the width table), so x = 56 and 112.
// ---------------------------------------------------------------------------

describe('descAtomOps — tab-indented text draws at tab stops (cdd5-T4d)', () => {
  test('each non-tab token is drawn at the advanced x, tabs are not emitted', () => {
    const block = buildDesc(noteSymbol, labels('text\n\ttext\n\t\ttext'), paint());
    const ug = newGraphic();
    block.drawU(ug);
    const xs = [...ug.getSvgString().matchAll(/<text[^>]*x="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => [m[1], m[2]]);
    expect(xs).toEqual([
      ['0', 'text'],
      ['56', 'text'],
      ['112', 'text'],
    ]);
  });
});
