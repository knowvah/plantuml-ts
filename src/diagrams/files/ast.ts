import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { FilesDiagram } from './parser.js';

/**
 * `FilesType` -- the three kinds of `FEntry`. As-const object plus a union
 * type, not a TS `enum` (safer across declaration boundaries).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesType.java:37-39
 */
export const FilesType = {
  FOLDER: 'FOLDER',
  DATA: 'DATA',
  NOTE: 'NOTE',
} as const;
export type FilesType = (typeof FilesType)[keyof typeof FilesType];

/** The `/` that separates the path segments of one `/...` line. @see FEntry.java:83 */
const PATH_SEPARATOR = '/';
/** The name `addNote` gives a note entry. @see FEntry.java:97 */
const NOTE_NAME = 'NONE';
/** `getEmoticon` for a folder. @see FEntry.java:126 */
const FOLDER_EMOTICON = '<:1f4c2:>';
/** `getEmoticon` for anything else (a data file or, never drawn, a note). @see FEntry.java:128 */
const DATA_EMOTICON = '<:1f4c4:>';

/**
 * `FEntry` -- one node of the files tree: the root (an unnamed folder), a
 * folder, a data file or a note. Drawing and measuring it are
 * `layout.ts`/`renderer.ts` (`FEntry#calculateDimension` and
 * `#drawAndMove`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FEntry.java:63-185
 */
export class FEntry implements Iterable<FEntry> {
  /** @see FEntry.java:65 */
  private readonly parent: FEntry | null;
  /** The note's lines; `null` for a folder and a data file. @see FEntry.java:66 */
  readonly note: readonly string[] | null;
  /** @see FEntry.java:67 */
  readonly name: string;
  /** @see FEntry.java:68 */
  readonly type: FilesType;
  /** @see FEntry.java:69 */
  private readonly entries: FEntry[] = [];

  /** @see FEntry.java:71-73 */
  static createRoot(): FEntry {
    return new FEntry(null, FilesType.FOLDER, '', null);
  }

  /** @see FEntry.java:75-80 */
  private constructor(parent: FEntry | null, type: FilesType, name: string, note: readonly string[] | null) {
    this.parent = parent;
    this.note = note;
    this.name = name;
    this.type = type;
  }

  /**
   * The path `raw` (without its leading `/`) below this entry: the segment
   * before the first `/` is a folder (found or created), the rest goes into
   * it; no `/` left makes a data file. Answers the data file created, or
   * `null` when `raw` ends with a `/` (a folder with nothing below it).
   * @see FEntry.java:82-94
   */
  addRawEntry(raw: string): FEntry | null {
    const x = raw.indexOf(PATH_SEPARATOR);
    if (x === -1) {
      const result = new FEntry(this, FilesType.DATA, raw, null);
      this.entries.push(result);
      return result;
    }
    const folder = this.getOrCreateFolder(raw.substring(0, x));
    const remain = raw.substring(x + 1);
    if (remain.length !== 0) return folder.addRawEntry(remain);
    return null;
  }

  /** @see FEntry.java:96-99 */
  addNote(note: readonly string[]): void {
    this.entries.push(new FEntry(this, FilesType.NOTE, NOTE_NAME, note));
  }

  /** @see FEntry.java:101-109 */
  private getOrCreateFolder(folderName: string): FEntry {
    for (const child of this.entries) {
      if (child.type === FilesType.FOLDER && child.getName() === folderName) return child;
    }
    const result = new FEntry(this, FilesType.FOLDER, folderName, null);
    this.entries.push(result);
    return result;
  }

  /** The children in insertion order (`iterator()`, FEntry.java:111-114). */
  get children(): readonly FEntry[] {
    return this.entries;
  }

  [Symbol.iterator](): Iterator<FEntry> {
    return this.entries[Symbol.iterator]();
  }

  /** @see FEntry.java:116-118 */
  getParent(): FEntry | null {
    return this.parent;
  }

  /** @see FEntry.java:120-122 */
  getName(): string {
    return this.name;
  }

  /** @see FEntry.java:124-129 */
  getEmoticon(): string {
    return this.type === FilesType.FOLDER ? FOLDER_EMOTICON : DATA_EMOTICON;
  }
}

/**
 * What `parseFiles` hands the plugin: the tree, the `title`/`legend`/...
 * chrome and `sprite` definitions the common commands filled (read off the
 * AST by `src/index.ts`), and the `FilesDiagram` that draws it.
 */
export interface FilesDiagramAST {
  /** The unnamed root folder; its children are the top-level entries. */
  readonly root: FEntry;
  /** title/caption/legend/header/footer/mainframe chrome (mission G0b). */
  readonly annotations?: DiagramAnnotations;
  /** `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4). */
  readonly sprites?: SpriteRegistry;
  readonly diagram: FilesDiagram;
}
