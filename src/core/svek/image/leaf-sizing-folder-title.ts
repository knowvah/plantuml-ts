/**
 * The SHOWN folder-family title block (`package`) — the faithful
 * `BodyFactory.create2` → `BodyEnhanced1` route (SI1 T12, ADR-4).
 *
 * Upstream builds the title (`name`) TextBlock every `USymbol.asSmall`
 * receives via `BodyFactory.create2` (`EntityImageDescription.java:198-199`:
 * `name = BodyFactory.create2(getSkinParam().getDefaultTextAlignment(
 * HorizontalAlignment.CENTER), codeDisplay, getSkinParam(), stereotype,
 * entity, styleTitle)`), and `USymbolFolder.asSmall.calculateDimension`
 * measures exactly that block as `dimName` when `showTitle` is true
 * (USymbolFolder.java:177-183). The route matters dimensionally because
 * `BodyEnhanced1`'s separator-free `decorate` wraps its single
 * `MethodsOrFieldsArea` compartment in `withMargin(block, 6, 6, 0, 0)`
 * (`getMarginX()=6` both sides, BodyEnhancedAbstract.java:107-109) — the
 * mechanism behind the measured-but-untraced
 * `FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12` constant this module replaces
 * (T5/ADR-10's narrowing #1; that constant is now deleted).
 *
 * Jar-verified (deterministic oracle probes, SI1 T12): `package
 * "Elektronisk dokument"` 171.9375×37 = (129.9375 + 6 + 6) + 30 margin,
 * 14 + 23 margin; `package pp as "Display Here"` 106.3875×51 (label slot
 * wins the mergeTB max over the 15.575 + 12 title); `folder fb` 70×52
 * (fixed 40×15 tab — this module is NOT consulted when `showTitle` is
 * false, exactly as upstream's `getDimTitle` never measures `title`
 * there).
 *
 * ## Input construction — the ADR-9 seam surfaces
 *
 * `create2`'s upstream-shaped `(ISkinParam, Style)` params carry the
 * resolved seam values ON the objects (`BodyEnhanced1Config.ts`'s
 * contract; `tests/unit/core/cucadiagram/helpers.ts#makeBodyStyle`/
 * `#fakeSkin` are the reference shapes — `.agent-notes/
 * si1-t9-bodyenhanced1.md`). Every value below is real or upstream's own
 * traced default, mirroring `EntityImageDescriptionDelegates.ts`'s
 * `buildDesc`/`buildLocalSkinSimple` (the landed `create3` precedent,
 * module-private there — reconstructed here, sizing-flavored, rather
 * than exported from core, which is outside T12's write-set):
 *
 * - fonts: all three `BodyEnhanced1StyleValues` font slots are the ONE
 *   sizing font — upstream resolves all three off the SAME `styleTitle`
 *   object at this call site (java:198's single `styleTitle` argument).
 * - `lineThickness` 1.0: `plantuml.skin:15` `root { LineThickness 1.0 }`
 *   — no description-family selector overrides it (grep-verified, the
 *   same trace `buildDesc`'s `ROOT_LINE_THICKNESS` documents). Read only
 *   when the title text contains a `--`/`==`/`..`/`__` block separator.
 * - `minimumWidth` 0: `styleTitle`'s `MinimumWidth` — no `plantuml.skin`
 *   selector sets it for the folder family (the `buildDesc` trace again).
 *   `skinparam MinimumWidth` reaches the leaf through `measureFolderLeaf`'s
 *   OWN `mergeTB` content floor (upstream: the empty-`desc` block's width,
 *   `EntityImageDescription.java:184`), so 0 here also prevents applying
 *   the same floor twice.
 * - `entity`: `BodyEnhanced1` reads only `getLeafType()` (its `Display`
 *   ctor's `inEllipse` check — folder-family leaves are never
 *   `USECASE`/`USECASE_BUSINESS`) and, on the `getPorts` path sizing
 *   never takes, `getPortShortNames()`. Supplied as exactly that
 *   two-member shape (the `fakeLeaf` reference shape), cast through
 *   `unknown` because the real `abel/Entity` requires the full
 *   Quark/Bodier construction no description-engine sizer has (the same
 *   adaptation seam `EntityImageDescription.ts`'s params document).
 */
import type { StringMeasurer, FontSpec } from '../../measurer.js';
import { MeasurerStringBounder } from '../../measurer-bounder.js';
import type { SpriteDimsLookup, AtomImageResolver } from '../../creole-atoms.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import type { FontConfiguration, FontStyle } from '../../klimt/shape/UText.js';
import { getFont } from '../../klimt/shape/UText.js';
import { atomTextStartingAltitude } from '../../klimt/creole/legacy/AtomText.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../klimt/geom/ClockwiseTopRightBottomLeft.js';
import { LineBreakStrategy } from '../../klimt/LineBreakStrategy.js';
import { Display } from '../../klimt/creole/Display.js';
import { CreoleParser } from '../../klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../klimt/creole/Parser.js';
import type { AtomOps } from '../../klimt/creole/Sea.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import type { Atom } from '../../klimt/creole/SheetBlock1.js';
import { emojiBoxDim } from '../../klimt/creole/atom/AtomEmoji.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import { Pragma } from '../../skin/Pragma.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../text/Guillemet.js';
import { renderLatexAsImage } from '../../latex.js';
import { measureLine } from './EntityImageDescriptionSupport.js';
import { BodyFactory } from '../../cucadiagram/BodyFactory.js';
import type { BodyEnhanced1Style } from '../../cucadiagram/BodyEnhanced1Config.js';
import type { MethodsOrFieldsAreaSkinParam } from '../../cucadiagram/MethodsOrFieldsAreaConfig.js';
import type { Entity } from '../../abel/Entity.js';
import { LeafType } from '../../abel/LeafType.js';
import { sizingAtomImageResolverFor } from './leaf-sizing-entity.js';
import type { BoxSizingOpts } from './leaf-sizing-consts.js';

/** No style flags — the sizing font carries family/size only
 *  (`leaf-sizing-entity.ts#SIZING_FONT_STYLES`'s convention). */
const SIZING_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/** `plantuml.skin:15`, `root { LineThickness 1.0 }` — the same traced
 *  default `EntityImageDescriptionDelegates.ts#ROOT_LINE_THICKNESS`
 *  documents for `create3`; see the module doc comment. */
const ROOT_LINE_THICKNESS = 1.0;

/** A description title embedding a nested `{{ ... }}` diagram is a
 *  genuinely separate, unbuilt feature (`EntityImageDescriptionDelegates
 *  .ts#blockedEmbeddedRenderer`'s identical typed deferral). */
function blockedEmbeddedRenderer(): NestedDiagramRenderer {
  return {
    render(): never {
      throw new Error(
        'leaf-sizing-folder-title: embedded diagrams ({{ ... }}) inside a folder/package title ' +
          'are not supported — no nested-diagram renderer exists for description text ' +
          '(EmbeddedDiagram.ts#NestedDiagramRenderer is the seam)',
      );
    },
  };
}

/** `'kind' in x` duck-typing of the plain-data `CreoleAtom` union vs a
 *  composite `Atom` instance — `EntityImageDescriptionDelegates.ts
 *  #isCreoleAtomData`'s documented convention (the runtime `Sheet` mixes
 *  both; composite atoms delegate to their own ported methods). */
function isCreoleAtomData(x: CreoleAtom | Atom): x is CreoleAtom {
  return 'kind' in x;
}

/** MEASUREMENT-only muted font — `EntityImageDescriptionDelegates.ts
 *  #measuringFont`'s identical convention (`AtomText.java`'s own
 *  `fontConfiguration.getFont()` reads, D1); this ops bundle's `drawU`
 *  throws unconditionally, so there is no unmuted-vs-muted draw split to
 *  mirror here — every text read on this path is a measurement. */
function measuringFont(fc: FontConfiguration): FontConfiguration {
  return { ...fc, size: getFont(fc).size };
}

/**
 * Sizing-only `AtomOps` for the title's creole pipeline — the dimension
 * half of `EntityImageDescriptionDelegates.ts#descAtomOps` (text →
 * `measureLine`, latex → real KaTeX box, emoji → `AtomEmoji`'s exact
 * contract, sprite/img → the sizing resolver's declared box). `getStartingAltitude`
 * reports `AtomText.java:321-323`'s `getSpace()` via `atomTextStartingAltitude`
 * for text atoms (0 NORMAL, -6/+3 EXPOSANT/INDICE, SI30 D1/D2), 0 otherwise
 * as before. `drawU` throws: `calculateDimension` never draws for a
 * folder-family title (`inEllipse` is false, so no eager `Footprint` fit
 * exists on this path), and a reach would mean this sizing-only ops object
 * leaked into a render path — fail loudly, per the typed-deferral idiom.
 */
function titleAtomOps(resolveAtomImage: AtomImageResolver | undefined): AtomOps {
  function dimensionOf(atom: CreoleAtom, stringBounder: StringBounder): { width: number; height: number } {
    if (atom.kind === 'text') return measureLine(stringBounder, atom.text, measuringFont(atom.font));
    if (atom.kind === 'latex') return renderLatexAsImage(atom.expr, atom.color ?? '#000000');
    if (atom.kind === 'emoji') return emojiBoxDim(atom.factor);
    const resolved = resolveAtomImage?.(atom.atom);
    return resolved === undefined ? { width: 0, height: 0 } : resolved;
  }
  return {
    calculateDimension(creoleAtom: CreoleAtom, stringBounder: StringBounder): XDimension2D {
      const atom = creoleAtom as CreoleAtom | Atom;
      if (!isCreoleAtomData(atom)) return atom.calculateDimension(stringBounder);
      const { width, height } = dimensionOf(atom, stringBounder);
      return new XDimension2D(width, height);
    },
    getStartingAltitude(creoleAtom: CreoleAtom, stringBounder: StringBounder): number {
      const atom = creoleAtom as CreoleAtom | Atom;
      if (!isCreoleAtomData(atom)) return atom.getStartingAltitude(stringBounder);
      if (atom.kind === 'text') return atomTextStartingAltitude(atom.font); // SI30/D2
      return 0;
    },
    drawU(): void {
      throw new Error(
        'leaf-sizing-folder-title: sizing-only AtomOps asked to draw — the folder/package title ' +
          'dimension path never draws (see titleAtomOps doc comment)',
      );
    },
  };
}

/**
 * The `MethodsOrFieldsAreaSkinParam` surface `create2` requires
 * (`requireBodyEnhanced1SkinParam`): the `ISkinSimple` half mirrors
 * `EntityImageDescriptionDelegates.ts#buildLocalSkinSimple` member for
 * member (each value upstream's own traced `SkinParam.java` default);
 * the `abel/ISkinParam` half supplies the opaque stubs nothing on the
 * title's dimension path calls (the `fakeSkin` reference shape); the two
 * T8 additions carry upstream's own defaults (`SkinParam.java:554-555`'s
 * `classAttributeIconSize` 10 — inert here, a `Display`-built area has
 * no `Member` rows for `hasSmallIcon` to find; `getCircledCharacterRadius`
 * 11, same trace as `class-member-rows.ts`'s documented derivation).
 */
function buildTitleSkinParam(guillemet: GuillemetPair | undefined, atomOps: AtomOps): MethodsOrFieldsAreaSkinParam {
  const renderer = blockedEmbeddedRenderer();
  const skin: MethodsOrFieldsAreaSkinParam = {
    // --- abel/ISkinParam.ts consumed slice (opaque, unreached at sizing) ---
    getFontHtmlColor: () => ({}),
    getFont: () => ({}),
    getHyperlinkColor: () => ({}),
    useUnderlineForHyperlink: () => {
      throw new Error('leaf-sizing-folder-title: useUnderlineForHyperlink is not reached by the title dimension path');
    },
    getCurrentStyleBuilder: () => ({}),
    getDefaultTextAlignment: (defaultValue) => defaultValue,
    strictUmlStyle: () => false,
    // --- style/ISkinSimple.ts (buildLocalSkinSimple's traced defaults) ---
    getSprite: () => null,
    guillemet: () => guillemet ?? GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: (fontConfiguration, horizontalAlignment, creoleMode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fontConfiguration,
        horizontalAlignment,
        skin,
        { creoleMode, stereotype: stereo ?? fontConfiguration },
        { atomOps, renderer },
      ),
    // --- MethodsOrFieldsAreaSkinParam additions (SkinParam.java defaults) ---
    classAttributeIconSize: () => 10,
    getCircledCharacterRadius: () => 11,
  };
  return skin;
}

/** The two `Entity` members `create2`'s closure reads — see the module
 *  doc comment for why this is a shape, not a real `abel/Entity`. */
function titleEntity(): Entity {
  const shape = {
    getLeafType: () => LeafType.DESCRIPTION,
    getPortShortNames: () => new Set<string>(),
  };
  return shape as unknown as Entity;
}

/** The resolved `styleTitle` reads `create2` consumes
 *  (`requireBodyEnhanced1Style`) — every value's provenance is in the
 *  module doc comment ("Input construction"). */
function titleStyle(font: FontConfiguration, atomOps: AtomOps): BodyEnhanced1Style {
  return {
    getHorizontalAlignment: () => HorizontalAlignment.CENTER,
    lineThickness: ROOT_LINE_THICKNESS,
    minimumWidth: 0,
    titleConfig: font,
    treeTableFontConfig: font,
    memberFontConfig: font,
    wrapWidth: LineBreakStrategy.NONE,
    atomOps,
  };
}

/**
 * Measures the shown folder-family title (`package`'s `dimName`) through
 * the faithful `BodyFactory.create2` → `BodyEnhanced1` route — upstream
 * `EntityImageDescription.java:198-199`'s exact construction, dimensioned
 * with the SAME `MeasurerStringBounder` every other sizing route uses.
 * Returns `[width, height]` for `measureFolderLeaf`'s `mergeTB` stack.
 */
export function measureShownFolderTitle(
  code: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): readonly [number, number] {
  const font: FontConfiguration = { family: fontSpec.family, size: fontSpec.size, color: null, styles: SIZING_FONT_STYLES };
  const atomOps = titleAtomOps(sizingAtomImageResolverFor(sprites)(font));
  const skinParam = buildTitleSkinParam(opts?.guillemet, atomOps);
  // `codeDisplay = Display.getWithNewlines(getSkinParam().getPragma(),
  // entity.getName())` (java:180) — the literal-`\n`-escape scanner IS the
  // right parser here (a quoted element name carries the two-char escape).
  const display = Display.getWithNewlines(Pragma.createEmpty(), code);
  const block = BodyFactory.create2(
    skinParam.getDefaultTextAlignment(HorizontalAlignment.CENTER),
    display,
    skinParam,
    undefined,
    titleEntity(),
    titleStyle(font, atomOps),
  );
  const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
  return [dim.getWidth(), dim.getHeight()];
}
