/**
 * `PSystemListEmoji` — the `emoji <block>` page: a header naming the Unicode
 * block, then every {@link getAll} entry whose key starts with the block, as
 * `<:code:>` artwork, `<#0:code:>` monochrome and the shortcut, in three
 * columns (dx 0 / 500 / 1000) on a 1500-wide canvas.
 *
 * Port-only: the emoji artwork upstream reads from the classpath reaches
 * `GraphicStrings` as `{ emoji }` (ADR-2's asset channel,
 * `GraphicStringsClasspath`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { getAll } from '../../core/klimt/creole/Emoji.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { GraphicStrings } from '../../core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { InternalEmojiStore } from '../../core/internal-emoji-store.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:76-77 */
const HEADER_TITLE = '<b><size:16>Emoji available on Unicode Block ';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:77 */
const HEADER_BLOCKS = '(Blocks available: 26, 27, 1F3, 1F4, 1F5, 1F6, 1F9)';

/** `<U+003C>` / `<U+003E>`: the creole spelling of `<` and `>`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:90,96 */
const LT = '<U+003C>';
const GT = '<U+003E>';

/** The second and third column offsets.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:116,118 */
const COLUMN_2_DX = 500;
const COLUMN_3_DX = 1000;

/** `new XDimension2D(1500, ...)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:140 */
const PAGE_WIDTH = 1500;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:55 */
export class PSystemListEmoji extends UgSimpleDiagram {
  /** `emoji` is the port-only classpath stand-in (ADR-2). */
  constructor(
    source: UmlSource,
    private readonly text: string,
    preprocessing: PreprocessingArtifact,
    private readonly emoji?: InternalEmojiStore,
  ) {
    super(source, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:65-67 */
  override calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.buildTextBlock().calculateDimension(stringBounder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:70-72 */
  override drawU(ug: UGraphic): void {
    this.buildTextBlock().drawU(ug);
  }

  /** `createBlackOnWhite(list)` with the classpath stand-in. */
  private block(lines: readonly string[]): TextBlock {
    return GraphicStrings.createBlackOnWhite(lines, { emoji: this.emoji });
  }

  /** One item line (java:88-98): code, artwork, monochrome, shortcut. */
  private itemLine(code: string, shortcut: string | undefined): string {
    let sb = '<size:13>';
    sb += `""${LT}:${code}:${GT} ""`;
    sb += `<:${code}:>`;
    sb += ' ';
    sb += `<#0:${code}:>`;
    if (shortcut !== undefined) sb += ` ""${LT}:${shortcut}:${GT} ""`;
    return sb;
  }

  /** Upstream private `getTextBlock()`; renamed because the base class declares a public `getTextBlock(num, stringBounder)`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:74-143 */
  private buildTextBlock(): TextBlock {
    const header = this.block([HEADER_TITLE + this.text, HEADER_BLOCKS]);
    const items: TextBlock[] = [];
    for (const [code, emoji] of getAll())
      if (code.startsWith(this.text)) items.push(this.block([this.itemLine(code, emoji.shortcut)]));
    return new EmojiColumns(header, items);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:145-147 */
  getDescription(): string {
    return '(List Emoji)';
  }
}

/** The anonymous `TextBlock` of java:103-142.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:103 */
class EmojiColumns implements TextBlock {
  private readonly third: number;

  constructor(
    private readonly header: TextBlock,
    private readonly items: readonly TextBlock[],
  ) {
    this.third = Math.trunc((items.length + 2) / 3);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:105-120 */
  drawU(ug: UGraphic): void {
    this.header.drawU(ug);
    const stringBounder = ug.getStringBounder();
    ug = ug.apply(UTranslate.dy(this.header.calculateDimension(stringBounder).getHeight()));
    const top = ug;
    let i = 0;
    for (const item of this.items) {
      item.drawU(ug);
      ug = ug.apply(UTranslate.dy(item.calculateDimension(stringBounder).getHeight()));
      i++;
      if (i === this.third) ug = top.apply(UTranslate.dx(COLUMN_2_DX));
      if (i === 2 * this.third) ug = top.apply(UTranslate.dx(COLUMN_3_DX));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmoji.java:123-141 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const headerHeight = this.header.calculateDimension(stringBounder).getHeight();
    const heights = [0, 0, 0];
    let i = 0;
    for (const item of this.items) {
      const h = item.calculateDimension(stringBounder).getHeight();
      const col = i < this.third ? 0 : i < 2 * this.third ? 1 : 2;
      heights[col]! += h;
      i++;
    }
    return new XDimension2D(PAGE_WIDTH, headerHeight + Math.max(...heights));
  }
}
