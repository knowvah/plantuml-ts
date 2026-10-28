import type { FontConfiguration } from '../../core/abel/FontConfiguration.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { TextBlockMemoized } from '../../core/klimt/shape/TextBlockMemoized.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { FEntry } from './ast.js';
import type { SkinParam } from './files-skin-param.js';
import { calculateDimension, CHILD_INDENT, getTextBlock, ROW_GAP } from './layout.js';

/**
 * Draws an entry at the current translate shifted right by `deltax`, then
 * moves down by its block's height plus {@link ROW_GAP} and draws the children
 * from there, {@link CHILD_INDENT} further right. Answers the graphic moved
 * past the whole subtree.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FEntry.java:131-138
 */
export function drawAndMove(
  entry: FEntry,
  ug: UGraphic,
  context: { readonly fontConfiguration: FontConfiguration; readonly skinParam: SkinParam },
  deltax: number,
): UGraphic {
  const result = getTextBlock(entry, context.fontConfiguration, context.skinParam);
  result.drawU(ug.apply(UTranslate.dx(deltax)));
  let moved = ug.apply(UTranslate.dy(result.calculateDimension(ug.getStringBounder()).getHeight() + ROW_GAP));
  for (const child of entry) moved = drawAndMove(child, moved, context, deltax + CHILD_INDENT);
  return moved;
}

/**
 * `FilesListing` -- the text block of one `@startfiles` diagram: the entry
 * tree below an unnamed root, and the last data file added (the note after it
 * goes to that file's folder).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesListing.java:46-88
 */
export class FilesListing extends TextBlockMemoized {
  /** @see FilesListing.java:48 */
  private readonly skinParam: SkinParam;
  /** @see FilesListing.java:49 */
  private readonly fontConfiguration: FontConfiguration;
  /** @see FilesListing.java:50 */
  private readonly root: FEntry;
  /** @see FilesListing.java:51 */
  private lastCreated: FEntry | null = null;

  /** @see FilesListing.java:53-57 */
  constructor(skinParam: SkinParam, fontConfiguration: FontConfiguration) {
    super();
    this.skinParam = skinParam;
    this.fontConfiguration = fontConfiguration;
    this.root = FEntry.createRoot();
  }

  /** The unnamed root folder (`FilesListing#root`, private upstream; the AST hands it to the tests and T2c). */
  getRoot(): FEntry {
    return this.root;
  }

  /** The widest entry right edge by the sum of the top-level entries' heights. @see FilesListing.java:59-69 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    const context = { fontConfiguration: this.fontConfiguration, skinParam: this.skinParam };
    let width = 0;
    let height = 0;
    for (const entry of this.root) {
      const dim = calculateDimension(entry, stringBounder, context, 0);
      width = Math.max(width, dim.getWidth());
      height += dim.getHeight();
    }
    return new XDimension2D(width, height);
  }

  /** @see FilesListing.java:71-75 */
  drawU(ug: UGraphic): void {
    const context = { fontConfiguration: this.fontConfiguration, skinParam: this.skinParam };
    let moved = ug;
    for (const entry of this.root) moved = drawAndMove(entry, moved, context, 0);
  }

  /** @see FilesListing.java:77-79 */
  addRawEntry(raw: string): void {
    this.lastCreated = this.root.addRawEntry(raw);
  }

  /** The note goes to the root, or to the folder of the last data file added. @see FilesListing.java:81-86 */
  addNote(note: readonly string[]): void {
    // A data file always has a parent (`FEntry.addRawEntry` creates it with `this`, FEntry.java:85).
    if (this.lastCreated === null) this.root.addNote(note);
    else (this.lastCreated.getParent() as FEntry).addNote(note);
  }
}
