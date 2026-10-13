/**
 * The wbs engine's `SkinParam` slice (skin/SkinParam.java), mirroring
 * `src/diagrams/mindmap/mindmap-skin-param.ts` without the rankdir (WBS
 * has no direction command, D12).
 *
 * Jar values: `test-results/dot-cache/wbs/xuzuda-76-bunu077/in.svg`, the
 * root `<&flag>Debian` is `<rect x="53.45" y="20" width="68.1"
 * height="32">` with its OpenIconic flag path starting `M64.45,31`, i.e.
 * (11, 11) inside the box.
 */
import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { CreoleParser } from '../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { bridgeFontConfiguration } from '../../../src/core/klimt/font/FontConfigurationBridge.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { GUILLEMET_DEFAULT } from '../../../src/core/text/Guillemet.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import { ITFLeaf } from '../../../src/diagrams/wbs/ITFLeaf.js';
import { SkinParam } from '../../../src/diagrams/wbs/wbs-skin-param.js';
import { WElement } from '../../../src/diagrams/wbs/WElement.js';
import { stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

function skinParam(skinparam: ReadonlyMap<string, string> = new Map()): SkinParam {
  return new SkinParam({
    style: createMindmapSkinParam({}),
    skinparam,
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
}

describe('wbs SkinParam', () => {
  it('fills params through cleanForKey with trimmed values (SkinParam.java:227-234, 326-340)', () => {
    const skin = skinParam(new Map([['TabSize', ' 4 ']]));
    expect(skin.getValue('tabsize')).toBe('4');
    expect(skin.getValue('TAB_SIZE')).toBe('4');
    expect(skin.getValue('dpi')).toBeNull();
    expect([...skin.values()]).toEqual([['tabsize', '4']]);
  });

  it('copyAllFrom puts every entry as given (SkinParam.java:213-215)', () => {
    const skin = skinParam();
    skin.copyAllFrom(new Map([['dpi', '120']]));
    expect(skin.getDpi()).toBe(120);
  });

  it('reads tabsize/dpi with their defaults (SkinParam.java:650-656, 1096-1098)', () => {
    expect(skinParam().getTabSize()).toBe(8);
    expect(skinParam(new Map([['tabsize', '3']])).getTabSize()).toBe(3);
    expect(skinParam(new Map([['tabsize', 'x']])).getTabSize()).toBe(8);
    expect(skinParam().getDpi()).toBe(96);
    expect(skinParam(new Map([['dpi', '0']])).getDpi()).toBe(96);
    expect(skinParam(new Map([['dpi', '200']])).getDpi()).toBe(200);
  });

  it('reads padding as an int-or-decimal, else 0 (SkinParam.java:1147-1164)', () => {
    expect(skinParam().getPadding().getTop()).toBe(0);
    expect(
      skinParam(new Map([['padding', '5.5']]))
        .getPadding()
        .getLeft(),
    ).toBe(5.5);
    expect(
      skinParam(new Map([['padding', 'wide']]))
        .getPadding()
        .getTop(),
    ).toBe(0);
  });

  it('answers the monospaced family, guillemet, md5 and size hack defaults', () => {
    expect(skinParam().getMonospacedFamily()).toBe('monospaced');
    expect(skinParam(new Map([['defaultMonospacedFontName', 'Courier']])).getMonospacedFamily()).toBe('Courier');
    expect(skinParam().guillemet()).toBe(GUILLEMET_DEFAULT);
    expect(skinParam().getFromMd5('abc')).toBeNull();
    expect(skinParam().transformStringForSizeHack('a b')).toBe('a b');
  });

  it('exposes the source sprites, pragma, colour set and current style builder', () => {
    const style = createMindmapSkinParam({});
    const sprites = createSpriteRegistry();
    const pragma = Pragma.createEmpty();
    const skin = new SkinParam({ style, skinparam: new Map(), sprites, pragma });
    expect(skin.getSprites()).toBe(sprites);
    expect(skin.getSprite('nothing')).toBeNull();
    expect(skin.getPragma()).toBe(pragma);
    expect(skin.getIHtmlColorSet()).toBe(HColorSet.instance());
    expect(skin.getCurrentStyleBuilder()).toBe(style.getCurrentStyleBuilder());
  });

  it('has no rankdir (WBS has no direction command, D12)', () => {
    expect('getRankdir' in skinParam()).toBe(false);
  });

  it('builds a CreoleParser sheet', () => {
    const skin = skinParam();
    const root = StyleSignatureBasic.of('root').getMergedStyle(skin.getCurrentStyleBuilder())!;
    const font = bridgeFontConfiguration(root.getFontConfiguration(skin.getIHtmlColorSet()));
    expect(skin.sheet(font, HorizontalAlignment.LEFT, CreoleMode.FULL)).toBeInstanceOf(CreoleParser);
  });

  it.each([
    ['getFontHtmlColor', (s: SkinParam) => s.getFontHtmlColor(undefined)],
    ['getFont', (s: SkinParam) => s.getFont(undefined, false)],
    ['getHyperlinkColor', (s: SkinParam) => s.getHyperlinkColor()],
    ['useUnderlineForHyperlink', (s: SkinParam) => s.useUnderlineForHyperlink()],
    ['getDefaultTextAlignment', (s: SkinParam) => s.getDefaultTextAlignment(HorizontalAlignment.LEFT)],
    ['strictUmlStyle', (s: SkinParam) => s.strictUmlStyle()],
  ])('%s is not reached by the wbs engine and throws', (name, call) => {
    expect(() => call(skinParam())).toThrow(`unported: SkinParam#${name} is not reached by the wbs engine`);
  });

  it('atomOps draws an OpenIconic atom where the jar does (xuzuda-76-bunu077 root)', () => {
    const skin = skinParam();
    const label = Display.getWithNewlines(Pragma.createEmpty(), '<&flag>Debian');
    const root = new WElement(undefined, label, undefined, skin.getCurrentStyleBuilder(), IdeaShape.BOX);
    const leaf = new ITFLeaf(root, skin, skin.atomOps);
    const dim = leaf.calculateDimension(stringBounder());
    expect([Number(dim.getWidth().toFixed(3)), dim.getHeight()]).toEqual([68.1, 32]);
    const ug = svgGraphic();
    leaf.drawU(ug);
    expect(ug.getSvgString()).toContain('<path d="M11,11 L11,19 L12,19 L12,11 L11,11 M13,11');
  });
});
