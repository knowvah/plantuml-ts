/**
 * FtileBoxOld — box size and drawn SVG against the 1.2026.8beta1 jar.
 *
 * Styles: `DumpProbe walk <puml>` (plans/mindmap-engine-port/tools/probe/)
 * printed each root `Idea.getStyle()`; the root style of bepinu, zenigi and
 * rinamu is the same dump (`ROOT_STYLE`). Box dims: `LayoutProbe <puml>`
 * `phalanxElongation` (box width) and `phalanxThickness - 2 * Margin`
 * (box height). SVG: the cached goldens
 * `test-results/dot-cache/mindmap/<slug>/in.svg`, translated so the box
 * sits at the origin (the golden's root box is drawn at (10, 20)).
 * Alignment arms: authored `fixtures/root-align-*-min-width.puml`, rendered
 * with `scripts/oracle-render.sh` and dumped with `DumpProbe walk`.
 *
 * isw-T2-act: every expectation re-read from the seam-#4 jar -- the
 * re-captured `test-results/dot-cache/mindmap/<slug>/in.svg` and one-JVM
 * `scripts/oracle-render.sh` renders of `fixtures/*.puml`. Spaces now
 * measure, and each width is float-rounded (`Rectangle2D.Float`,
 * mirrored by `DeterministicMeasurer`), so a box width is `2 * Padding +
 * Math.fround(text)` and the jar prints it to three decimals.
 */
import { describe, expect, it } from 'vitest';
import { FtileBoxOld } from '../../../../src/diagrams/activity/ftile/vertical/FtileBoxOld.js';
import { SkinParamColors } from '../../../../src/core/skin/SkinParamColors.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType } from '../../../../src/core/abel/ColorType.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { bridgeFontConfiguration } from '../../../../src/core/klimt/font/FontConfigurationBridge.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../../../src/core/klimt/shape/TextBlock.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import type { Style } from '../../../../src/core/style/Style.js';
import { styleFromDump, type DumpedStyle } from '../../core/style/helpers/style-fixture.js';
import { testAtomOps, testSkinParam } from './helpers/skin-param.js';

const ROOT_SNAMES = ['element', 'mindmapDiagram', 'node', 'root'] as const;

/** `DumpProbe walk` root style of bepinu-34-tiji715 / zenigi-93-gofu307 / rinamu-56-tabi421. */
const ROOT_VALUES: DumpedStyle['values'] = {
  Shadowing: ['0.0', null, 53],
  FontName: ['SansSerif', null, 1],
  FontColor: ['black', 'white', 4],
  FontSize: ['14', null, 5],
  FontStyle: ['plain', null, 6],
  BackGroundColor: ['#f1f1f1', '#313139', 12],
  RoundCorner: ['25', null, 155],
  LineThickness: ['1.5', null, 156],
  DiagonalCorner: ['0', null, 9],
  HyperLinkColor: ['blue', 'blue', 2],
  HyperlinkUnderlineThickness: ['1', null, 3],
  LineColor: ['#181818', '#e7e7e7', 11],
  Padding: ['10', null, 153],
  Margin: ['10', null, 154],
  HorizontalAlignment: ['left', null, 7],
};

function rootStyle(extra: DumpedStyle['values'] = {}, snames: readonly string[] = ROOT_SNAMES): Style {
  return styleFromDump({
    snames: snames as DumpedStyle['snames'],
    level: -1,
    star: false,
    stereotypes: [],
    values: { ...ROOT_VALUES, ...extra },
  });
}

const measurer = new DeterministicMeasurer();

/** `2 * Padding(10) + ` the float-rounded text width. */
const boxWidth = (text: number): number => 20 + Math.fround(text);

function stringBounder(): StringBounder {
  const driver = {
    calculateDimension: (font: { family: string; size: number }, text: string) => measurer.measure(text, font),
  };
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driver, measurer).getStringBounder();
}

function atomOpsFor(style: Style): ReturnType<typeof testAtomOps> {
  return testAtomOps(bridgeFontConfiguration(style.getFontConfiguration(HColorSet.instance())));
}

function mindMapBox(style: Style, label: Display, colors?: Colors): TextBlock {
  const atomOps = atomOpsFor(style);
  const base = testSkinParam(atomOps);
  const skinParam = colors === undefined ? base : new SkinParamColors(base, colors);
  return FtileBoxOld.createMindMap(style, skinParam, label, atomOps);
}

function svgOf(box: TextBlock): string {
  return renderDrawableToFragment(box, { uid: 'box', width: 0, height: 0, measurer }).body;
}

function elements(svg: string, tag: 'rect' | 'text'): string[] {
  const pattern = tag === 'rect' ? /<rect[^>]*\/>/g : /<text[^>]*>[^<]*<\/text>/g;
  return svg.match(pattern) ?? [];
}

const STROKE = 'style="stroke:#181818;stroke-width:1.5;" rx="12.5" ry="12.5"/>';

describe('FtileBoxOld.createMindMap — plain root (bepinu-34-tiji715 "first node")', () => {
  const box = mindMapBox(rootStyle(), Display.create('first node'));

  it('sizes the box as the jar: 77.487 x 34 (LayoutProbe phalanxElongation; thickness 54 - 2*10)', () => {
    const dim = box.calculateDimension(stringBounder());
    expect(dim.getWidth()).toBe(boxWidth(57.4875));
    expect(dim.getHeight()).toBe(34);
  });

  it('draws the rect and text of in.svg (box at (10,20) there)', () => {
    const svg = svgOf(box);
    expect(elements(svg, 'rect')).toEqual([`<rect x="0" y="0" width="77.487" height="34" fill="#F1F1F1" ${STROKE}`]);
    expect(elements(svg, 'text')).toEqual([
      '<text x="10" y="20.889" fill="#000" font-size="14" textLength="57.487">first node</text>',
    ]);
  });
});

describe('FtileBoxOld.createMindMap — [#color] root (zenigi-93-gofu307 "*[#dd01a4] one")', () => {
  // FingerImpl.java:226-227: new SkinParamColors(skinParam, Colors.empty().add(ColorType.BACK, idea.getBackColor()))
  const back = HColorSet.instance().getColor('#dd01a4');
  const box = mindMapBox(rootStyle(), Display.create('one'), Colors.empty().add(ColorType.BACK, back));

  it('sizes the box as the jar: 43.362 x 34', () => {
    const dim = box.calculateDimension(stringBounder());
    expect(dim.getWidth()).toBe(boxWidth(23.3625));
    expect(dim.getHeight()).toBe(34);
  });

  it('fills with the SkinParamColors BACK colour (style.eventuallyOverride(specBack))', () => {
    const svg = svgOf(box);
    expect(elements(svg, 'rect')).toEqual([`<rect x="0" y="0" width="43.362" height="34" fill="#DD01A4" ${STROKE}`]);
    expect(elements(svg, 'text')).toEqual([
      '<text x="10" y="20.889" fill="#000" font-size="14" textLength="23.362">one</text>',
    ]);
  });
});

describe('FtileBoxOld.createMindMap — multi-line node (rinamu-56-tabi421 "Linux Mint / Open Source")', () => {
  const box = mindMapBox(rootStyle(), Display.create('Linux Mint', 'Open Source'));

  it('sizes the box as the jar: 102.425 x 48 (phalanxThickness 68 - 2*10)', () => {
    const dim = box.calculateDimension(stringBounder());
    expect(dim.getWidth()).toBe(boxWidth(82.425));
    expect(dim.getHeight()).toBe(48);
  });

  it('draws the rect and both lines of in.svg (box at (262.267,20) there)', () => {
    const svg = svgOf(box);
    expect(elements(svg, 'rect')).toEqual([`<rect x="0" y="0" width="102.425" height="48" fill="#F1F1F1" ${STROKE}`]);
    expect(elements(svg, 'text')).toEqual([
      '<text x="10" y="20.889" fill="#000" font-size="14" textLength="63.787">Linux Mint</text>',
      '<text x="10" y="34.889" fill="#000" font-size="14" textLength="82.425">Open Source</text>',
    ]);
  });
});

describe('FtileBoxOld — horizontal alignment arms with MinimumWidth 200 (authored fixtures)', () => {
  const snames = [...ROOT_SNAMES, 'rootNode'];
  const extra = (align: string): DumpedStyle['values'] => ({
    MinimumWidth: ['200', null, 327],
    HorizontalAlignment: [align, null, 326],
  });

  it('RIGHT: 200 wide box, text shifted by SheetBlock2 to x=132.513 (jar 142.513 at box x=10)', () => {
    const box = mindMapBox(rootStyle(extra('right'), snames), Display.create('first node'));
    expect(box.calculateDimension(stringBounder()).getWidth()).toBe(200);
    const svg = svgOf(box);
    expect(elements(svg, 'rect')).toEqual([`<rect x="0" y="0" width="200" height="34" fill="#F1F1F1" ${STROKE}`]);
    expect(elements(svg, 'text')).toEqual([
      '<text x="132.513" y="20.889" fill="#000" font-size="14" textLength="57.487">first node</text>',
    ]);
  });

  it('CENTER: 200 wide box, text at x=71.256 (jar 81.256 at box x=10)', () => {
    const box = mindMapBox(rootStyle(extra('center'), snames), Display.create('first node'));
    const svg = svgOf(box);
    expect(elements(svg, 'text')).toEqual([
      '<text x="71.256" y="20.889" fill="#000" font-size="14" textLength="57.487">first node</text>',
    ]);
  });
});

describe('FtileBoxOld.createWbs', () => {
  it('builds the same PLAIN box (FtileBoxOld.java:139-142, styleArrow = style)', () => {
    const style = rootStyle();
    const atomOps = atomOpsFor(style);
    const box = FtileBoxOld.createWbs(style, testSkinParam(atomOps), Display.create('first node'), atomOps);
    expect(box).toBeInstanceOf(FtileBoxOld);
    expect(box.calculateDimension(stringBounder()).getWidth()).toBe(boxWidth(57.4875));
    expect(box.toString()).toBe(Display.create('first node').toString());
  });

  it('setMinimumWidth keeps the max and invalidates the cached geometry (FtileBoxOld.java:84-87)', () => {
    const style = rootStyle();
    const atomOps = atomOpsFor(style);
    const box = FtileBoxOld.createWbs(style, testSkinParam(atomOps), Display.create('first node'), atomOps);
    const sb = stringBounder();
    expect(box.calculateDimension(sb).getWidth()).toBe(boxWidth(57.4875));
    box.setMinimumWidth(120);
    box.setMinimumWidth(90);
    expect(box.calculateDimension(sb).getWidth()).toBe(120);
  });
});

describe('FtileBoxOld — AbstractFtile slice (AbstractFtile.java:64-82)', () => {
  it('skinParam() and getIHtmlColorSet() answer the wrapped skin param; no children (java:239-241)', () => {
    const style = rootStyle();
    const atomOps = atomOpsFor(style);
    const skinParam = testSkinParam(atomOps);
    const box = FtileBoxOld.createWbs(style, skinParam, Display.create('first node'), atomOps);
    expect(box.skinParam()).toBe(skinParam);
    expect(box.getIHtmlColorSet()).toBe(HColorSet.instance());
    expect(box.getMyChildren()).toEqual([]);
  });
});

describe('FtileBoxOld — MyStencil and a null alignment (authored fixtures)', () => {
  it('a creole "----" rule spans the box via MyStencil 0 .. box width (fixtures/root-horizontal-line.puml)', () => {
    // jar: rect 100.15 x 58 at (10,20); <line x1="10" y1="49" x2="110.15" y2="49" style="stroke:#181818;stroke-width:1;"/>
    const box = mindMapBox(rootStyle(), Display.create('first', '----', 'second node'));
    const dim = box.calculateDimension(stringBounder());
    expect([dim.getWidth(), dim.getHeight()]).toEqual([boxWidth(80.15), 58]);
    const svg = svgOf(box);
    expect(svg.match(/<line[^>]*\/>/g)).toEqual([
      '<line x1="0" y1="29" x2="100.15" y2="29" style="stroke:#181818;stroke-width:1;"/>',
    ]);
    expect(elements(svg, 'text')).toEqual([
      '<text x="10" y="20.889" fill="#000" font-size="14" textLength="22.487">first</text>',
      '<text x="10" y="44.889" fill="#000" font-size="14" textLength="80.15">second node</text>',
    ]);
  });

  it('HorizontalAlignment foo: no drawU arm matches, so only the box is drawn (fixtures/root-align-invalid.puml)', () => {
    const style = rootStyle({ HorizontalAlignment: ['foo', null, 326] }, [...ROOT_SNAMES, 'rootNode']);
    const svg = svgOf(mindMapBox(style, Display.create('first node')));
    expect(elements(svg, 'rect')).toEqual([`<rect x="0" y="0" width="77.487" height="34" fill="#F1F1F1" ${STROKE}`]);
    expect(elements(svg, 'text')).toEqual([]);
  });
});
