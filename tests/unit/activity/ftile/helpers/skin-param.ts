/**
 * Test-only `ISkinParamWithSimple`: the default `SkinParam` answers for
 * every member `FtileBoxOld` reaches (`getIHtmlColorSet`, `sheet`), the
 * same traced defaults `annotations/blocks-creole.ts#chromeSkinSimple`
 * documents (empty md5 map, identity size hack, padding `none`, tab size
 * 8, dpi 96), with `sheet` building the port's `CreoleParser` over one
 * shared `AtomOps` — the SAME bundle the caller passes to
 * `FtileBoxOld.createMindMap` (ADR-9's injected parameter). Members no
 * test reaches throw, so an unexpected read fails loudly.
 */
import { chromeAtomOps } from '../../../../../src/core/annotations/blocks-creole.js';
import type { ISkinParamWithSimple } from '../../../../../src/core/abel/ISkinParam.js';
import type { NestedDiagramRenderer } from '../../../../../src/core/EmbeddedDiagram.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import type { AtomOps } from '../../../../../src/core/klimt/creole/Sea.js';
import { CreoleParser } from '../../../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';
import { GUILLEMET_DEFAULT } from '../../../../../src/core/text/Guillemet.js';

/** `SkinParam#getTabSize` default (SkinParam.java:1074). */
const TAB_SIZE = 8;
/** `SkinParam#getDpi` default (SkinParam.java:641). */
const DPI = 96;

function unreached(name: string): never {
  throw new Error(`test skin param: ${name} is not reached by FtileBoxOld`);
}

const NO_EMBEDDED: NestedDiagramRenderer = {
  render: () => unreached('embedded diagram'),
};

/** One `AtomOps` over the default font; sprites are not declared in these fixtures. */
export function testAtomOps(baseFont: FontConfiguration): AtomOps {
  return chromeAtomOps(undefined, baseFont);
}

export function testSkinParam(atomOps: AtomOps): ISkinParamWithSimple {
  const pragma = Pragma.createEmpty();
  const skin: ISkinParamWithSimple = {
    getIHtmlColorSet: () => HColorSet.instance(),
    sheet: (fontConfiguration, horizontalAlignment, creoleMode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fontConfiguration,
        horizontalAlignment,
        skin,
        { creoleMode, stereotype: stereo ?? fontConfiguration },
        { atomOps, renderer: NO_EMBEDDED },
      ),
    getSprite: () => null,
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => 'monospace',
    getTabSize: () => TAB_SIZE,
    getDpi: () => DPI,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    getFontHtmlColor: () => unreached('getFontHtmlColor'),
    getFont: () => unreached('getFont'),
    getHyperlinkColor: () => unreached('getHyperlinkColor'),
    useUnderlineForHyperlink: () => unreached('useUnderlineForHyperlink'),
    getCurrentStyleBuilder: () => unreached('getCurrentStyleBuilder'),
    getDefaultTextAlignment: () => unreached('getDefaultTextAlignment'),
    strictUmlStyle: () => unreached('strictUmlStyle'),
  };
  return skin;
}
