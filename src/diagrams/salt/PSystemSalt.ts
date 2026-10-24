import type { HColor as AbelHColor } from '../../core/abel/Colors.js';
import type { FontParam, ISkinParam, UFont } from '../../core/abel/ISkinParam.js';
import { createAnnotations, type DiagramAnnotations } from '../../core/annotations/index.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { Fore } from '../../core/klimt/Fore.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Sprite } from '../../core/klimt/sprite/Sprite.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UStroke } from '../../core/klimt/UStroke.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import { Pragma } from '../../core/skin/Pragma.js';
import type { RootLengthAdjust } from '../../core/svg.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { cleanForKeySlow } from '../../core/style/mindmap-style-builder.js';
import { trin } from '../../core/style/parser/StyleParser.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { TitledDiagram, type UmlSource } from '../../core/TitledDiagram.js';
import { DataSourceImpl } from './DataSourceImpl.js';
import type { DataSource } from './DataSource.js';
import type { Element } from './element/Element.js';
import type { AbstractElementFactoryComplex } from './factory/AbstractElementFactoryComplex.js';
import { ElementFactoryBorder } from './factory/ElementFactoryBorder.js';
import { ElementFactoryButton } from './factory/ElementFactoryButton.js';
import { ElementFactoryCheckboxOff } from './factory/ElementFactoryCheckboxOff.js';
import { ElementFactoryCheckboxOn } from './factory/ElementFactoryCheckboxOn.js';
import { ElementFactoryDroplist } from './factory/ElementFactoryDroplist.js';
import { ElementFactoryImage } from './factory/ElementFactoryImage.js';
import { ElementFactoryLine } from './factory/ElementFactoryLine.js';
import { ElementFactoryMenu } from './factory/ElementFactoryMenu.js';
import { ElementFactoryPyramid } from './factory/ElementFactoryPyramid.js';
import { ElementFactoryRadioOff } from './factory/ElementFactoryRadioOff.js';
import { ElementFactoryRadioOn } from './factory/ElementFactoryRadioOn.js';
import { ElementFactoryRetrieveFromDictonnary } from './factory/ElementFactoryRetrieveFromDictonnary.js';
import { ElementFactoryScroll } from './factory/ElementFactoryScroll.js';
import { ElementFactoryTab } from './factory/ElementFactoryTab.js';
import { ElementFactoryText } from './factory/ElementFactoryText.js';
import { ElementFactoryTextField } from './factory/ElementFactoryTextField.js';
import { ElementFactoryTree } from './factory/ElementFactoryTree.js';
import { SaltDictionary } from './SaltDictionary.js';

/** `Jaws.BLOCK_E1_NEWLINE`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:47 */
const BLOCK_E1_NEWLINE = '';
/** @see PSystemSalt.java:149 */
const HIDE_STEREOTYPE = 'hide stereotype';
/** @see PSystemSalt.java:151 */
const SKINPARAM_PREFIX = 'skinparam ';
/** @see PSystemSalt.java:153-154 */
const SCALE_PREFIX = 'scale ';
/** @see PSystemSalt.java:157 */
const SPRITE_PREFIX = 'sprite $';
/** @see PSystemSalt.java:162 */
const SPRITE_BLOCK_END = '}';
/** `ClockwiseTopRightBottomLeft.same(5)`. @see PSystemSalt.java:237-240 */
const SALT_MARGIN = 5;
/** `getDpi`'s default. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:651 */
const DEFAULT_DPI = 96;
/** `SkinParam.isDigits`. @see SkinParam.java:131 */
const DIGITS = /^\d+$/;
/** `DiagramType.SALT.getStyleName()` = `SName.saltDiagram`. @see core/DiagramType.java:262-263 */
const SALT_STYLE_NAME = 'saltDiagram';

/**
 * `StringLocated.expandsNewline(s)` = `Arrays.asList(s.split("" +
 * Jaws.BLOCK_E1_NEWLINE))`: Java's `split` drops trailing empty strings,
 * and returns the input alone when the separator never occurs.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/text/StringLocated.java:141-143
 */
function expandsNewline(s: string): string[] {
  const parts = s.split(BLOCK_E1_NEWLINE);
  if (parts.length === 1) return parts;
  while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  return parts;
}

/** `Double.parseDouble`'s decimal grammar (`FloatingDecimal.readJavaFormatString`):
 *  surrounding `<= ' '` chars trimmed, optional sign, `NaN`, `Infinity`, or
 *  digits with an optional fraction/exponent and `f`/`d` suffix. The
 *  hexadecimal form is not ported. */
const JAVA_DOUBLE = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?)$/;

function parseDouble(text: string): number {
  const s = trin(text);
  if (!JAVA_DOUBLE.test(s)) throw new Error(`NumberFormatException: For input string: "${text}"`);
  return Number.parseFloat(s.replace(/[fFdD]$/, ''));
}

/** What the salt `SkinParam` is built from: the style builder after every
 *  `skinparam`/`<style>` (`buildMindmapStyleBuilder`) and the raw
 *  skinparam map. */
export interface SaltSkinSource {
  readonly styleBuilder: StyleBuilder;
  readonly skinparam: ReadonlyMap<string, string>;
}

function unported(member: string): never {
  throw new Error(`unported: SkinParam#${member} is not reached by the salt engine`);
}

/**
 * PORT-ONLY: the slice of upstream's `SkinParam` a `PSystemSalt` reaches
 * through `TitledDiagram#getSkinParam()` — the pragma (warnings), the flat
 * `params` map (`getValue`, read for `handwritten`/`mode`/`monochrome`)
 * and the style builder `calculateBackColor` reads. Salt elements read no
 * style (decisions.md D3); every other member throws.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:205-340
 */
export class SaltSkinParam implements ISkinParam {
  private readonly params = new Map<string, string>();
  private readonly pragma = Pragma.createEmpty();

  constructor(private readonly source: SaltSkinSource) {
    for (const [key, value] of source.skinparam)
      for (const key2 of cleanForKeySlow(key)) this.params.set(key2, trin(value));
  }

  /** @see SkinParam.java:326-340 */
  getValue(key: string): string | null {
    for (const key2 of cleanForKeySlow(key)) {
      const result = this.params.get(key2);
      if (result !== undefined) return result;
    }
    return null;
  }

  /**
   * `skinparam lengthAdjust`: `spacingAndGlyphs` / `spacing` / `none`, each
   * `equalsIgnoreCase`; anything else is `LengthAdjust.defaultValue()` =
   * SPACING, returned here as `undefined` (unset, D4).
   * @see SkinParam.java:1258-1269
   */
  getlengthAdjust(): RootLengthAdjust | undefined {
    const value = this.getValue('lengthAdjust')?.toLowerCase();
    if (value === 'spacingandglyphs') return 'spacingAndGlyphs';
    if (value === 'spacing') return 'spacing';
    if (value === 'none') return 'none';
    return undefined;
  }

  /** @see SkinParam.java:650-656,1166-1172 */
  getDpi(): number {
    const value = this.getValue('dpi');
    const dpi = value !== null && DIGITS.test(value) ? Number.parseInt(value, 10) : DEFAULT_DPI;
    return dpi <= 0 ? DEFAULT_DPI : dpi;
  }

  getPragma(): Pragma {
    return this.pragma;
  }

  getCurrentStyleBuilder(): StyleBuilder {
    return this.source.styleBuilder;
  }

  getFontHtmlColor(_stereotype: Stereotype | undefined, ..._param: FontParam[]): AbelHColor {
    return unported('getFontHtmlColor');
  }
  getFont(_stereotype: Stereotype | undefined, _inGroup: boolean, ..._fontParam: FontParam[]): UFont {
    return unported('getFont');
  }
  getHyperlinkColor(): AbelHColor {
    return unported('getHyperlinkColor');
  }
  useUnderlineForHyperlink(): UStroke {
    return unported('useUnderlineForHyperlink');
  }
  getTabSize(): number {
    return unported('getTabSize');
  }
  getDefaultTextAlignment(_defaultValue: HorizontalAlignment): HorizontalAlignment {
    return unported('getDefaultTextAlignment');
  }
  strictUmlStyle(): boolean {
    return unported('strictUmlStyle');
  }
}

/**
 * PSystemSalt — one `@startsalt` diagram: the raw data lines
 * `CommandAnything` collects, turned into one element tree at export time
 * (`getTextBlock`) by the first root factory that is `ready()`.
 *
 * Port seams:
 * - `getTextBlock(num, fileFormatOption)` takes the export's
 *   `StringBounder` (upstream reads `fileFormatOption.getDefaultStringBounder`).
 * - The text block's `getBackcolor()` (java:128-130) is not ported: the
 *   port's `TextBlock` has no such member and the export reads
 *   `calculateBackColor()` instead.
 * - `annotations`/`scale` are `TitledDiagram`'s title-command and
 *   `setScale` state, read by `src/index.ts`'s chrome step.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/PSystemSalt.java:87-246
 */
export class PSystemSalt extends TitledDiagram {
  /** @see PSystemSalt.java:89 */
  private readonly data: string[] = [];
  /** @see PSystemSalt.java:90 */
  private readonly dictionary = new SaltDictionary();
  private readonly skinParam: SaltSkinParam;
  /** `CommonCommands.addTitleCommands`' target. */
  readonly annotations: DiagramAnnotations = createAnnotations();
  /** `UmlDiagram#setScale`'s target (`CommandScale*`, `manageSprite`). */
  scale: ScaleSpec | undefined = undefined;

  /** @see PSystemSalt.java:92-101 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact, skin: SaltSkinSource) {
    super(source, 'SALT', undefined, preprocessing);
    this.skinParam = new SaltSkinParam(skin);
  }

  getSkinParam(): SaltSkinParam {
    return this.skinParam;
  }

  /** @see PSystemSalt.java:103-105 */
  add(s: string): void {
    this.data.push(...expandsNewline(s));
  }

  /** @see PSystemSalt.java:107-109 */
  size(): number {
    return this.data.length;
  }

  /** @see PSystemSalt.java:111-132 */
  getTextBlock(stringBounder: StringBounder): TextBlock {
    const salt = this.createElement(this.manageSprite());
    const size = salt.getPreferredDimension(stringBounder, 0, 0);
    return {
      drawU(ug: UGraphic): void {
        ug = ug.apply(new Fore(HColors.BLACK));
        salt.drawU(ug, 0, new XDimension2D(size.getWidth(), size.getHeight()));
        salt.drawU(ug, 1, new XDimension2D(size.getWidth(), size.getHeight()));
      },
      calculateDimension(): XDimension2D {
        return size;
      },
    };
  }

  /** @see PSystemSalt.java:134-136 */
  getDescription(): string {
    return '(Salt)';
  }

  /** @see PSystemSalt.java:138-140 */
  addSprite(name: string, sprite: Sprite): void {
    this.dictionary.addSprite(name, sprite);
  }

  /** PORT-ONLY: the dictionary's sprite registry, which the sprite command
   *  port (`matchSpriteCommand`) registers into — `addSprite`'s target. */
  getSpriteRegistry(): SpriteRegistry {
    return this.dictionary.getSprites();
  }

  /** @see PSystemSalt.java:142-172 */
  private manageSprite(): string[] {
    const result: string[] = [];
    for (let i = 0; i < this.data.length; i++) {
      const s = this.data[i]!;
      if (s === HIDE_STEREOTYPE || s.startsWith(SKINPARAM_PREFIX)) continue;
      if (s.startsWith(SCALE_PREFIX))
        this.scale = { kind: 'simple', factor: parseDouble(s.substring(SCALE_PREFIX.length)) };
      else if (s.startsWith(SPRITE_PREFIX)) i = this.executeSpriteBlock(i);
      else result.push(s);
    }
    return result;
  }

  /**
   * The `sprite $` branch: `do { s = it.next(); … } while (!s.equals("}"))`
   * (an exhausted iterator is `NoSuchElementException`), then
   * `CommandFactorySprite.ME.createMultiLine(false).execute(this, block,
   * ONE)` with its result ignored. A first line the multiline regex
   * rejects reaches `executeInternal` with a null `line0` — a
   * `NullPointerException` — unless no data line is left between the first
   * and the last ("No sprite defined.", ignored). Returns the index of the
   * closing line.
   * @see PSystemSalt.java:157-166
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandFactorySprite.java:115-127,173-176
   */
  private executeSpriteBlock(start: number): number {
    const block = [this.data[start]!];
    let i = start;
    do {
      i++;
      if (i >= this.data.length) throw new Error('NoSuchElementException');
      block.push(this.data[i]!);
    } while (this.data[i] !== SPRITE_BLOCK_END);
    const matched = matchSpriteCommand(block, 0, this.getSpriteRegistry());
    const dataLines = block.slice(1, -1).filter((line) => trin(line) !== '');
    if (matched === null && dataLines.length > 0) throw new Error('NullPointerException: sprite line0 is null');
    return i;
  }

  /** @see PSystemSalt.java:174-217 */
  private createElement(data: readonly string[]): Element {
    const source = new DataSourceImpl(data);
    const treeFactory = new ElementFactoryTree(source, this.dictionary);
    const cpx: AbstractElementFactoryComplex[] = [
      new ElementFactoryPyramid(source, this.dictionary),
      new ElementFactoryScroll(source, this.dictionary),
      new ElementFactoryBorder(source, this.dictionary),
      treeFactory,
    ];

    for (const f of cpx) addSimpleFactory(f, source, this.dictionary, treeFactory);

    for (const f1 of cpx) for (const f2 of cpx) f1.addFactory(f2);

    for (const f of cpx) if (f.ready()) return f.create().getElement();

    throw new Error('IllegalArgumentException');
  }

  /** @see PSystemSalt.java:237-240 */
  override getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.same(SALT_MARGIN);
  }

  /**
   * `TitledDiagram#calculateBackColor`: `root, document, saltDiagram`'s
   * `BackGroundColor` (the null fallback below is not ported). Kept an `HColor`
   * (not a `Paint`) so a `@media dark` partner survives to the mapper.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:279-289
   */
  calculateBackColor(): HColorSimple | HColorGradient {
    // `getMergedStyle` answers undefined only for an undefined builder; salt's always exists.
    const style = StyleSignatureBasic.of('root', 'document', SALT_STYLE_NAME).getMergedStyle(
      this.skinParam.getCurrentStyleBuilder(),
    )!;
    // java:284-285's `== null` fallback to `HColors.transparent()` is not
    // ported: the port's `asColor` is typed non-null (ValueImpl.java:92-108
    // throws or answers a colour; ValueNull answers BLACK).
    const color = style.value('BackGroundColor').asColor(HColorSet.instance());
    if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
    throw new Error('ClassCastException: a document BackGroundColor is a simple or gradient colour');
  }
}

/** @see PSystemSalt.java:219-235 */
function addSimpleFactory(
  cpxFactory: AbstractElementFactoryComplex,
  source: DataSource,
  dictionary: SaltDictionary,
  treeFactory: ElementFactoryTree,
): void {
  cpxFactory.addFactory(new ElementFactoryMenu(source, dictionary));
  cpxFactory.addFactory(treeFactory);
  cpxFactory.addFactory(new ElementFactoryTab(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryLine(source));
  cpxFactory.addFactory(new ElementFactoryTextField(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryCheckboxOn(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryCheckboxOff(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryButton(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryDroplist(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryRadioOn(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryRadioOff(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryImage(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryRetrieveFromDictonnary(source, dictionary));
  cpxFactory.addFactory(new ElementFactoryText(source, dictionary));
}
