import type { UmlSource as ExtractedSource } from '../../core/block-extractor.js';
import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { ParseOptions } from '../../core/dispatcher.js';
import { internalEmojiStoreFrom } from '../../core/internal-emoji-store.js';
import { internalSpriteStoreFrom } from '../../core/internal-sprite-store.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { createSpriteRegistry } from '../../core/sprite-registry.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import {
  createMindmapSkinParam,
  executeDeclaration,
  positionedDeclarationsOf,
} from '../../core/style/mindmap-style-builder.js';
import { StyleParsingException } from '../../core/style/parser/StyleParser.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { TitledDiagram } from '../../core/TitledDiagram.js';
import { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import type { FontConfiguration } from '../../core/abel/FontConfiguration.js';
import type { FilesDiagramAST } from './ast.js';
import { SkinParam } from './files-skin-param.js';
import { FilesListing } from './renderer.js';

/** A line starting with this adds a path. @see FilesDiagram.java:84 */
const PATH_PREFIX = '/';
/** A line starting with this opens a note. @see FilesDiagram.java:86 */
const NOTE_START = '<note>';
/** A line starting with this closes a note. @see FilesDiagram.java:96 */
const NOTE_END = '</note>';

/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: NonNullable<ExtractedSource['styleSource']> = {
  skinparam: new Map<string, string>(),
  styles: [],
};

/**
 * The style source `FilesDiagram` runs: the `skin` and the `<style>` blocks, no `skinparam`.
 * `StyleExtractor` consumes a `skinparam` line without executing it (only `handwritten` is kept,
 * StyleExtractor.java:88-96) and `FilesDiagram` never reads that (FilesDiagram.java:62-80), so no skinparam
 * reaches the diagram. The same cut as `files-style-input.ts`, which the jar-compatible render applies to the
 * theme; the parse sees the preprocessor's output before that cut, so it makes it itself. The extended-mode
 * skinparams a user may add (DIVERGENCES.md "Extensions") are honoured at render time, off the theme.
 */
function jarStyleSource(styleSource: NonNullable<ExtractedSource['styleSource']>): typeof styleSource {
  const order = styleSource.declarationOrder;
  return {
    ...styleSource,
    skinparam: new Map<string, string>(),
    ...(order === undefined ? {} : { declarationOrder: { ...order, skinparam: new Map<string, number>() } }),
  };
}

/**
 * The sprite registry of one render: the jar-resident sprite bundle and the
 * Twemoji artwork both come from `options.assetStore` (ADR-2), the way the
 * json parser threads them.
 */
function spriteRegistryFor(options: ParseOptions | undefined): SpriteRegistry {
  const store = options?.assetStore;
  if (store === undefined) return createSpriteRegistry();
  return createSpriteRegistry(internalSpriteStoreFrom(store), internalEmojiStoreFrom(store));
}

/**
 * The lines of a note below its `<note>` line, up to (not including) the
 * `</note>` line; a note never closed takes every remaining line. Answers the
 * lines and the index of the first line after the note.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesDiagram.java:92-101
 */
function getNote(lines: readonly string[], from: number): { note: readonly string[]; next: number } {
  const note: string[] = [];
  let i = from;
  while (i < lines.length) {
    const line = lines[i++]!;
    if (line.startsWith(NOTE_END)) return { note, next: i };
    note.push(line);
  }
  return { note, next: i };
}

/**
 * `FilesDiagram` -- one `@startfiles` block: the style applied up front, the
 * `root.element.filesDiagram` font, and the listing the `/path` and `<note>`
 * lines fill. Every other line is ignored, as upstream does -- except the
 * `title`/`legend`/... chrome and `sprite` definitions the common commands
 * take (mission G0b, SI5b), tried at the same "everything else" position.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesDiagram.java:58-112
 */
export class FilesDiagram extends TitledDiagram {
  /** @see FilesDiagram.java:60 */
  readonly list: FilesListing;
  readonly skinParam: SkinParam;
  /** `TitledDiagram`'s title/caption/legend/header/footer/mainframe. */
  readonly annotations: DiagramAnnotations = createAnnotations();
  /**
   * The error a `skin`/`<style>` block raised. Upstream prints it and carries
   * on without the style (`e.printStackTrace()`, FilesDiagram.java:68-70).
   */
  readonly styleError: StyleParsingException | undefined;
  /** The `root.element.filesDiagram` font every row is drawn in. @see FilesDiagram.java:71-76 */
  readonly fontConfiguration: FontConfiguration;

  /** @see FilesDiagram.java:62-90 */
  constructor(source: ExtractedSource, options?: ParseOptions) {
    super(source, 'FILES', undefined, new PreprocessingArtifact());
    const styleSource = jarStyleSource(source.styleSource ?? EMPTY_STYLE_SOURCE);
    const style = createMindmapSkinParam(styleSource);
    this.skinParam = new SkinParam({
      style,
      skinparam: styleSource.skinparam,
      sprites: spriteRegistryFor(options),
      pragma: Pragma.createEmpty(),
    });
    // `styleExtractor.applyStyles(skinParam)`: every `<style>` block before a single line is read (java:67).
    // Upstream parses them all in one go and mutes nothing when one fails; here an earlier one stays applied.
    this.styleError = applyDeclarations(style, source, styleSource);
    // `getMergedStyle` answers undefined only for an undefined builder; a files diagram always has one.
    const merged = StyleSignatureBasic.of('root', 'element', 'filesDiagram').getMergedStyle(
      this.skinParam.getCurrentStyleBuilder(),
    )!;
    this.fontConfiguration = merged.getFontConfiguration(this.skinParam.getIHtmlColorSet());
    this.list = new FilesListing(this.skinParam, this.fontConfiguration);
    this.readLines(source.lines);
  }

  /** @see FilesDiagram.java:80-88 */
  private readLines(lines: readonly string[]): void {
    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;
      i++;
      if (line.startsWith(PATH_PREFIX)) {
        this.list.addRawEntry(line.substring(PATH_PREFIX.length));
      } else if (line.startsWith(NOTE_START)) {
        const { note, next } = getNote(lines, i);
        this.list.addNote(note);
        i = next;
      } else {
        i += this.commonCommandLength(lines, i - 1) - 1;
      }
    }
  }

  /** The lines the chrome or `sprite` command at `index` takes; 1 for a line neither claims (ignored). */
  private commonCommandLength(lines: readonly string[], index: number): number {
    const annotation = matchAnnotationCommand(lines, index, this.annotations);
    if (annotation !== null) return annotation.consumed;
    const sprite = matchSpriteCommand(lines, index, this.skinParam.getSprites());
    return sprite === null ? 1 : sprite.consumed;
  }

  getSkinParam(): SkinParam {
    return this.skinParam;
  }

  /** @see FilesDiagram.java:103-105 */
  getDescription(): string {
    return '(Files)';
  }

  /** @see FilesDiagram.java:107-110 */
  getTextBlock(): FilesListing {
    return this.list;
  }
}

/** Executes every `skinparam`/`<style>` declaration in source order; answers the first style error. */
function applyDeclarations(
  style: ReturnType<typeof createMindmapSkinParam>,
  source: ExtractedSource,
  styleSource: NonNullable<ExtractedSource['styleSource']>,
): StyleParsingException | undefined {
  for (const declaration of positionedDeclarationsOf(styleSource, source.stylePositions ?? [])) {
    try {
      executeDeclaration(style, declaration, styleSource.skinparam);
    } catch (e) {
      if (!(e instanceof StyleParsingException)) throw e;
      return e;
    }
  }
  return undefined;
}

/**
 * Parses one `@startfiles` block, as `FilesDiagramFactory#createSystem` does:
 * a {@link FilesDiagram} over the source. The tree is `ast.root`, the
 * chrome `ast.annotations`, the `sprite` definitions `ast.sprites`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/filesdiagram/FilesDiagramFactory.java:46-52
 */
export function parseFiles(source: ExtractedSource, options?: ParseOptions): FilesDiagramAST {
  const diagram = new FilesDiagram(source, options);
  return {
    root: diagram.list.getRoot(),
    annotations: diagram.annotations,
    sprites: diagram.skinParam.getSprites(),
    diagram,
  };
}
