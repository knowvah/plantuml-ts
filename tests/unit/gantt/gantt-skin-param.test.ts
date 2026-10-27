/**
 * The gantt engine's `SkinParam` slice (skin/SkinParam.java), mirroring `src/diagrams/wbs/wbs-skin-param.ts`.
 * Behaviour is the wbs slice's (same upstream lines); the gantt-specific facts are that the style builder it hands
 * `GanttTaskTable`'s `currentStyleBuilder` is a real `StyleBuilder` and that the unreached members name the gantt
 * engine.
 */
import { describe, expect, it, vi } from 'vitest';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { bridgeFontConfiguration } from '../../../src/core/klimt/font/FontConfigurationBridge.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { Atom } from '../../../src/core/klimt/creole/SheetBlock1.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../src/core/style/mindmap-style-builder.js';
import { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { GUILLEMET_DEFAULT } from '../../../src/core/text/Guillemet.js';
import { currentStyleBuilder } from '../../../src/diagrams/gantt/GanttTaskTable.js';
import { SkinParam } from '../../../src/diagrams/gantt/gantt-skin-param.js';

function skinParam(skinparam: ReadonlyMap<string, string> = new Map()): SkinParam {
  return new SkinParam({
    style: createMindmapSkinParam({}),
    skinparam,
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
}

describe('gantt SkinParam', () => {
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

  it('answers a real StyleBuilder that GanttTaskTable.currentStyleBuilder accepts (journal row 52)', () => {
    const skin = skinParam();
    expect(skin.getCurrentStyleBuilder()).toBeInstanceOf(StyleBuilder);
    expect(currentStyleBuilder(skin)).toBe(skin.getCurrentStyleBuilder());
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
  ])('%s is not reached by the gantt engine and throws', (name, call) => {
    expect(() => call(skinParam())).toThrow(`unported: SkinParam#${name} is not reached by the gantt engine`);
  });

  it.each([
    ['spacingAndGlyphs', 'spacingAndGlyphs'],
    ['SPACING', 'spacing'],
    ['None', 'none'],
  ] as const)('getlengthAdjust reads %s case-insensitively (SkinParam.java:1258-1267)', (written, expected) => {
    expect(skinParam(new Map([['lengthAdjust', written]])).getlengthAdjust()).toBe(expected);
  });

  it('getlengthAdjust is the default (undefined = SPACING) when absent or unrecognised (SkinParam.java:1268)', () => {
    expect(skinParam().getlengthAdjust()).toBeUndefined();
    expect(skinParam(new Map([['lengthAdjust', 'stretch']])).getlengthAdjust()).toBeUndefined();
  });

  describe('shared AtomOps (port-only, ADR-9: the lazy wrapper delegates to chromeAtomOps)', () => {
    const bounder = new MeasurerStringBounder(new DeterministicMeasurer());
    const drawn: UGraphic[] = [];
    // A non-data atom (no `kind`): chromeAtomOps hands every call to the atom itself (blocks-creole.ts:172,178,185-186).
    const atom: Atom = {
      calculateDimension: () => new XDimension2D(31, 17),
      getStartingAltitude: () => 7,
      drawU: (ug: UGraphic) => {
        drawn.push(ug);
      },
    } as unknown as Atom;

    it('calculateDimension, getStartingAltitude and drawU reach the atom', () => {
      const skin = skinParam();
      const dim = skin.atomOps.calculateDimension(atom as never, bounder);
      expect([dim.getWidth(), dim.getHeight()]).toEqual([31, 17]);
      expect(skin.atomOps.getStartingAltitude(atom as never, bounder)).toBe(7);
      const ug = {} as UGraphic;
      skin.atomOps.drawU(atom as never, ug);
      expect(drawn).toEqual([ug]);
    });

    it('the base font is resolved on first use: a builder without a root style fails then, not at construction', () => {
      const style = createMindmapSkinParam({});
      vi.spyOn(style, 'getCurrentStyleBuilder').mockReturnValue(new StyleBuilder());
      const skin = new SkinParam({
        style,
        skinparam: new Map(),
        sprites: createSpriteRegistry(),
        pragma: Pragma.createEmpty(),
      });
      expect(() => skin.atomOps.getStartingAltitude(atom as never, bounder)).toThrow(
        'gantt: the style builder has no root style',
      );
    });
  });

  it('an embedded {{ }} block with no nested-diagram renderer registered degrades to the 42x42 fallback (EmbeddedDiagram.java:148-152)', () => {
    const skin = skinParam();
    const root = StyleSignatureBasic.of('root').getMergedStyle(skin.getCurrentStyleBuilder())!;
    const font = bridgeFontConfiguration(root.getFontConfiguration(skin.getIHtmlColorSet()));
    const sheet = skin.sheet(font, HorizontalAlignment.LEFT, CreoleMode.FULL) as CreoleParser;
    const stripe = [...sheet.createSheet(Display.create('{{', '}}'))][0]!;
    const embedded = stripe.getAtoms()[0] as unknown as { calculateDimension: (sb: unknown) => XDimension2D };
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dim = embedded.calculateDimension(new MeasurerStringBounder(new DeterministicMeasurer()));
    expect([dim.getWidth(), dim.getHeight()]).toEqual([42, 42]);
    expect(quiet).toHaveBeenCalledTimes(1);
    quiet.mockRestore();
  });
});
