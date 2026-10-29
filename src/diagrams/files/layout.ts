import type { FontConfiguration as StyleFontConfiguration } from '../../core/abel/FontConfiguration.js';
import { FontConfiguration } from '../../core/abel/FontConfiguration.js';
import type { HColor } from '../../core/abel/Colors.js';
import type { HColorOrPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { Display } from '../../core/klimt/creole/Display.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { Sheet } from '../../core/klimt/creole/Sheet.js';
import { SheetBlock1 } from '../../core/klimt/creole/SheetBlock1.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Style } from '../../core/style/Style.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { Opale } from '../../core/svek/image/Opale.js';
import { FilesType, type FEntry } from './ast.js';
import type { SkinParam } from './files-skin-param.js';

/** The row advance added below every entry's own block. @see FEntry.java:134,145 */
export const ROW_GAP = 2;
/** How far right a child is drawn than its parent. @see FEntry.java:136,148 */
export const CHILD_INDENT = 21;

/** `ug.apply(HColor)` / `new Opale(.., HColor, ..)`: the style layer's `HColor` is an `HColorSimple` or a gradient. */
function paintOf(color: HColor): HColorOrPaint {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: colour is not an HColorSimple');
}

/** `StyleSignatureBasic#getMergedStyle` answers `null` upstream only for a missing builder, which a files diagram always has. */
function mergedStyleOf(signature: StyleSignatureBasic, skinParam: SkinParam): Style {
  const style = signature.getMergedStyle(skinParam.getCurrentStyleBuilder());
  if (style === undefined) throw new Error('NullPointerException: no style for ' + String(signature));
  return style;
}

/**
 * The block an entry draws: the note's `Opale`, else the emoticon plus the
 * name as one `NO_CREOLE` line of creole text.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FEntry.java:155-163
 */
export function getTextBlock(
  entry: FEntry,
  fontConfiguration: StyleFontConfiguration,
  skinParam: SkinParam,
): TextBlock {
  if (entry.type === FilesType.NOTE) return createOpale(entry, skinParam);

  const display = Display.getWithNewlines(skinParam.getPragma(), entry.getEmoticon() + entry.getName());
  const ctx = {
    fontConfiguration: bridgeFontConfiguration(fontConfiguration),
    spriteContainer: skinParam,
    atomOps: skinParam.atomOps,
  };
  return display.create7(ctx, HorizontalAlignment.LEFT, CreoleMode.NO_CREOLE);
}

/**
 * The note: a creole sheet of its lines in the `root.element.filesDiagram.note`
 * style's font, inside an `Opale` of that style's colours, shadow and stroke.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FEntry.java:165-183
 */
function createOpale(entry: FEntry, skinParam: SkinParam): Opale {
  const style = mergedStyleOf(StyleSignatureBasic.of('root', 'element', 'filesDiagram', 'note'), skinParam);

  const colorSet = skinParam.getIHtmlColorSet();
  const fc = FontConfiguration.create(
    style.getUFont(),
    style.value('FontColor').asColor(colorSet),
    style.value('HyperLinkColor').asColor(colorSet),
    skinParam.useUnderlineForHyperlink(),
    skinParam.getTabSize(),
  );
  const shadowing = style.getShadowing();
  const borderColor = style.value('LineColor').asColor(colorSet);
  const noteBackgroundColor = style.value('BackGroundColor').asColor(colorSet);
  const stroke = style.getStroke();

  // `entry.note` is non-null for a NOTE (`addNote`, FEntry.java:96-99), the only type that reaches here.
  const lines = entry.note as readonly string[];
  // `SheetBuilder#createSheet` widens to `Sheet<StripeAtom>`; `SheetBlock1` takes the narrow `Sheet`
  // (the same cast as `gantt/draw/AbstractTaskDraw.ts#getOpaleNote`, a pre-existing seam between those two files).
  const sheet = skinParam
    .sheet(bridgeFontConfiguration(fc), skinParam.getDefaultTextAlignment(HorizontalAlignment.LEFT), CreoleMode.FULL)
    .createSheet(Display.create(lines)) as unknown as Sheet<CreoleAtom>;
  const sheet1 = new SheetBlock1(sheet, LineBreakStrategy.NONE, skinParam.atomOps, skinParam.getPadding());
  return new Opale(shadowing, paintOf(borderColor), paintOf(noteBackgroundColor), sheet1, false, stroke);
}

/**
 * An entry's own block, then its children indented by {@link CHILD_INDENT}:
 * the widest right edge, the heights summed with {@link ROW_GAP} below each
 * entry's own block.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FEntry.java:140-153
 */
export function calculateDimension(
  entry: FEntry,
  stringBounder: StringBounder,
  context: { readonly fontConfiguration: StyleFontConfiguration; readonly skinParam: SkinParam },
  deltax: number,
): XDimension2D {
  const result = getTextBlock(entry, context.fontConfiguration, context.skinParam);
  const dim = result.calculateDimension(stringBounder);
  let width = deltax + dim.getWidth();
  let height = dim.getHeight() + ROW_GAP;
  for (const child of entry) {
    const childDim = calculateDimension(child, stringBounder, context, deltax + CHILD_INDENT);
    width = Math.max(width, childDim.getWidth());
    height += childDim.getHeight();
  }
  return new XDimension2D(width, height);
}
