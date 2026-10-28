/**
 * `FEntry#calculateDimension` and `FilesListing#calculateDimensionSlow`
 * (`FEntry.java:140-153`, `FilesListing.java:59-69`): `height + 2` below every
 * entry's own block, children `21` further right, `max` of widths, `sum` of
 * heights. Numbers in the last block are the jar's own: the pdiff oracle
 * `dobido-76-nugu008` (185x367 canvas = listing + the 10px margin both sides).
 */
import { describe, it, expect } from 'vitest';
import { FilesType } from '../../../src/diagrams/files/ast.js';
import { parseFiles } from '../../../src/diagrams/files/parser.js';
import { SkinParam } from '../../../src/diagrams/files/files-skin-param.js';
import { calculateDimension, CHILD_INDENT, getTextBlock, ROW_GAP } from '../../../src/diagrams/files/layout.js';
import { Opale } from '../../../src/core/svek/image/Opale.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const BOUNDER = new MeasurerStringBounder(new DeterministicMeasurer());
const EMOJI = { assetStore: buildEmojiAssetsStore() };

function diagramOf(lines: string[]): ReturnType<typeof parseFiles>['diagram'] {
  const source: UmlSource = { lines, type: 'files' };
  return parseFiles(source, EMOJI).diagram;
}

function contextOf(diagram: ReturnType<typeof diagramOf>) {
  return { fontConfiguration: diagram.fontConfiguration, skinParam: diagram.skinParam };
}

describe('constants (FEntry.java:134,136)', () => {
  it('the row gap is 2 and the child indent 21', () => {
    expect(ROW_GAP).toBe(2);
    expect(CHILD_INDENT).toBe(21);
  });
});

describe('calculateDimension (FEntry.java:140-153)', () => {
  it('a lone file is its block`s width, and its height plus 2', () => {
    const diagram = diagramOf(['/README.md']);
    const [file] = diagram.list.getRoot().children;
    const block = getTextBlock(file!, diagram.fontConfiguration, diagram.skinParam).calculateDimension(BOUNDER);
    const dim = calculateDimension(file!, BOUNDER, contextOf(diagram), 0);
    expect(dim.getWidth()).toBe(block.getWidth());
    expect(dim.getHeight()).toBe(block.getHeight() + 2);
  });

  it('deltax shifts the width only', () => {
    const diagram = diagramOf(['/README.md']);
    const [file] = diagram.list.getRoot().children;
    const at0 = calculateDimension(file!, BOUNDER, contextOf(diagram), 0);
    const at21 = calculateDimension(file!, BOUNDER, contextOf(diagram), 21);
    expect(at21.getWidth()).toBe(at0.getWidth() + 21);
    expect(at21.getHeight()).toBe(at0.getHeight());
  });

  it('a folder adds its children at deltax + 21 and sums their heights', () => {
    const diagram = diagramOf(['/dir/a.txt', '/dir/b.txt']);
    const [dir] = diagram.list.getRoot().children;
    const [a, b] = dir!.children;
    const ctx = contextOf(diagram);
    const own = getTextBlock(dir!, diagram.fontConfiguration, diagram.skinParam).calculateDimension(BOUNDER);
    const da = calculateDimension(a!, BOUNDER, ctx, 21);
    const db = calculateDimension(b!, BOUNDER, ctx, 21);
    const dim = calculateDimension(dir!, BOUNDER, ctx, 0);
    expect(dim.getHeight()).toBe(own.getHeight() + 2 + da.getHeight() + db.getHeight());
    expect(dim.getWidth()).toBe(Math.max(own.getWidth(), da.getWidth(), db.getWidth()));
    expect(da.getWidth()).toBeGreaterThan(21);
  });
});

describe('FilesListing dimension (FilesListing.java:59-69)', () => {
  it('an empty listing is 0x0', () => {
    const dim = diagramOf([]).getTextBlock().calculateDimension(BOUNDER);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([0, 0]);
  });

  it('is the jar`s dobido-76-nugu008 listing: 14 rows of 22.75 + 2 high, widest right edge 164.85', () => {
    const diagram = diagramOf([
      '/.github/',
      '/src/example.py',
      '/src/iiimple1.py',
      '/tests/example_test.py',
      '/src/wwwmple2.py',
      '/tests/v1/example_test.py',
      '/README.md',
      '/doc/foo/dummy.doc',
      '/LICENSE',
    ]);
    const dim = diagram.getTextBlock().calculateDimension(BOUNDER);
    expect(dim.getHeight()).toBe(14 * (22.75 + 2));
    // tests / v1 / example_test.py: deltax 2 * 21, the 21 wide emoticon, textLength 101.85 (oracle `<text x="73" ...>`).
    expect(dim.getWidth()).toBeCloseTo(42 + 21 + 101.85, 2);
  });
});

describe('getTextBlock (FEntry.java:155-163)', () => {
  it('a NOTE entry is an Opale', () => {
    const diagram = diagramOf(['<note>', 'hello', '</note>']);
    const [note] = diagram.list.getRoot().children;
    expect(note!.type).toBe(FilesType.NOTE);
    expect(getTextBlock(note!, diagram.fontConfiguration, diagram.skinParam)).toBeInstanceOf(Opale);
  });

  it('a note is wider than its text by the Opale margins (Opale.java:92-94); oracle xeseve-00-tipa730 text 72.881', () => {
    const diagram = diagramOf(['<note>', 'this is a note', '</note>']);
    const [note] = diagram.list.getRoot().children;
    const opale = getTextBlock(note!, diagram.fontConfiguration, diagram.skinParam).calculateDimension(BOUNDER);
    expect(opale.getWidth()).toBeCloseTo(72.881 + Opale.marginX1 + Opale.marginX2, 3);
  });

  it('a folder row is the 21 wide emoticon plus the name (oracle dobido-76-nugu008: `.github` textLength 42)', () => {
    const diagram = diagramOf(['/.github/']);
    const [dir] = diagram.list.getRoot().children;
    const block = getTextBlock(dir!, diagram.fontConfiguration, diagram.skinParam).calculateDimension(BOUNDER);
    expect(block.getWidth()).toBeCloseTo(21 + 42, 3);
    expect(block.getHeight()).toBe(22.75);
  });
});

describe('SkinParam members FEntry#createOpale reads (FEntry.java:171-180)', () => {
  const skin = (skinparam: Record<string, string>): SkinParam =>
    new SkinParam({
      style: createMindmapSkinParam({}),
      skinparam: new Map(Object.entries(skinparam)),
      sprites: createSpriteRegistry(),
      pragma: Pragma.createEmpty(),
    });

  it('getDefaultTextAlignment answers the skinparam, else the default (SkinParam.java:731-738)', () => {
    expect(skin({}).getDefaultTextAlignment(HorizontalAlignment.LEFT)).toBe(HorizontalAlignment.LEFT);
    expect(skin({ defaultTextAlignment: 'center' }).getDefaultTextAlignment(HorizontalAlignment.LEFT)).toBe(
      HorizontalAlignment.CENTER,
    );
  });

  it('useUnderlineForHyperlink is the simple stroke (SkinParam.java:1057-1061)', () => {
    expect(skin({}).useUnderlineForHyperlink().getThickness()).toBe(1);
  });

  it('getPadding is the skinparam`s, else none (SkinParam.java:1147-1164)', () => {
    expect(skin({}).getPadding().getLeft()).toBe(0);
    expect(skin({ padding: '3' }).getPadding().getLeft()).toBe(3);
  });

  it('getDpi, getTabSize and getMonospacedFamily read their skinparams, else their defaults (SkinParam.java:650-656,1091-1098)', () => {
    expect([skin({}).getDpi(), skin({}).getTabSize(), skin({}).getMonospacedFamily()]).toEqual([96, 8, 'monospaced']);
    expect([skin({ dpi: '300' }).getDpi(), skin({ dpi: '0' }).getDpi()]).toEqual([300, 96]);
    expect(skin({ tabSize: '4' }).getTabSize()).toBe(4);
    expect(skin({ defaultMonospacedFontName: 'Courier' }).getMonospacedFamily()).toBe('Courier');
  });

  it('getlengthAdjust answers the skinparam, undefined when unset (SkinParam.java:1258-1269)', () => {
    expect(skin({}).getlengthAdjust()).toBeUndefined();
    expect(skin({ lengthAdjust: 'none' }).getlengthAdjust()).toBe('none');
  });

  it('values/copyAllFrom hold the cleaned keys; getValue reads them back (SkinParam.java:213-225,326-340)', () => {
    const param = skin({ Shadowing: ' true ' });
    expect(param.getValue('shadowing')).toBe('true');
    param.copyAllFrom(new Map([['other', 'x']]));
    expect(param.values().get('other')).toBe('x');
    expect(param.getValue('absent')).toBeNull();
  });

  it('no md5 map, no size hack, no sprites, and the default guillemets', () => {
    const param = skin({});
    expect(param.getFromMd5('abc')).toBeNull();
    expect(param.transformStringForSizeHack('s')).toBe('s');
    expect(param.getSprite('nope')).toBeNull();
    expect(param.guillemet()).toEqual({ start: '\u00AB', end: '\u00BB' });
  });

  it('answers `unported` for the members the files path never reaches', () => {
    const param = skin({});
    expect(() => param.getFontHtmlColor(undefined)).toThrow('unported: SkinParam#getFontHtmlColor');
    expect(() => param.getFont(undefined, false)).toThrow('unported: SkinParam#getFont');
    expect(() => param.getHyperlinkColor()).toThrow('unported: SkinParam#getHyperlinkColor');
    expect(() => param.strictUmlStyle()).toThrow('unported: SkinParam#strictUmlStyle');
  });
});
