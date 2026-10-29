/**
 * `parseFiles` -- the `FilesDiagram` constructor loop and the `FEntry` /
 * `FilesListing` tree it builds. Expected shapes are cited to the Java:
 * `filesdiagram/FEntry.java`, `FilesListing.java`, `FilesDiagram.java`.
 */
import { describe, it, expect } from 'vitest';
import { parseFiles } from '../../../src/diagrams/files/parser.js';
import { FEntry, FilesType } from '../../../src/diagrams/files/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { bridgeFontConfiguration } from '../../../src/core/klimt/font/FontConfigurationBridge.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';

function makeSource(lines: string[], styleSource?: UmlSource['styleSource']): UmlSource {
  return { lines, type: 'files', ...(styleSource === undefined ? {} : { styleSource }) };
}

/** An entry as `name:TYPE` plus its children, recursively. */
interface Shape {
  readonly entry: string;
  readonly children: readonly Shape[];
}

function shapeOf(entry: FEntry): Shape {
  return { entry: `${entry.name}:${entry.type}`, children: entry.children.map(shapeOf) };
}

function treeOf(lines: string[]): readonly Shape[] {
  return shapeOf(parseFiles(makeSource(['@startfiles', ...lines, '@endfiles'])).root).children;
}

const leaf = (entry: string): Shape => ({ entry, children: [] });

describe('parseFiles -- paths (FEntry.java:82-94)', () => {
  it('a path with folders makes a folder chain ending in a DATA entry', () => {
    expect(treeOf(['/a/b/c.txt'])).toEqual([
      { entry: 'a:FOLDER', children: [{ entry: 'b:FOLDER', children: [leaf('c.txt:DATA')] }] },
    ]);
  });

  it('a path without a slash is a DATA entry directly below the root (:84-88)', () => {
    expect(treeOf(['/README.md'])).toEqual([leaf('README.md:DATA')]);
  });

  it('a repeated folder is found, not created again (getOrCreateFolder, :101-109)', () => {
    expect(treeOf(['/src/a.ts', '/src/b.ts'])).toEqual([
      { entry: 'src:FOLDER', children: [leaf('a.ts:DATA'), leaf('b.ts:DATA')] },
    ]);
  });

  it('a trailing slash declares a folder with no entry below it (:91-93)', () => {
    expect(treeOf(['/src/'])).toEqual([leaf('src:FOLDER')]);
  });

  it('a DATA entry of the same name does not satisfy a later folder (:103 matches FOLDER only)', () => {
    expect(treeOf(['/a', '/a/b'])).toEqual([leaf('a:DATA'), { entry: 'a:FOLDER', children: [leaf('b:DATA')] }]);
  });

  it('keeps insertion order and does not trim the path (FilesDiagram.java:84-85)', () => {
    expect(treeOf(['/b ', '/a'])).toEqual([leaf('b :DATA'), leaf('a:DATA')]);
  });

  it('addRawEntry answers the DATA entry created, null for a trailing slash (:82-94)', () => {
    const root = FEntry.createRoot();
    expect(root.addRawEntry('x/y')?.name).toBe('y');
    expect(root.addRawEntry('x/')).toBeNull();
  });

  it('getParent answers the containing entry; the root has none (:116-118)', () => {
    const root = FEntry.createRoot();
    const created = root.addRawEntry('a/b.txt');
    expect(created?.getParent()?.name).toBe('a');
    expect(created?.getParent()?.getParent()).toBe(root);
    expect(root.getParent()).toBeNull();
  });

  it('getEmoticon is the open folder for a FOLDER, the page for everything else (:124-129)', () => {
    const root = FEntry.createRoot();
    expect(root.getEmoticon()).toBe('<:1f4c2:>');
    expect(root.addRawEntry('f.txt')?.getEmoticon()).toBe('<:1f4c4:>');
  });
});

describe('parseFiles -- notes (FilesDiagram.java:86-99, FilesListing.java:81-86)', () => {
  it('a note after a file goes to the file`s folder', () => {
    const [a] = treeOf(['/a/b.txt', '<note>', 'hi', '</note>']);
    expect(a!.children.map((c) => c.entry)).toEqual(['b.txt:DATA', 'NONE:NOTE']);
  });

  it('a note after a trailing-slash folder goes to the root (lastCreated is null)', () => {
    expect(treeOf(['/a/', '<note>', 'hi', '</note>']).map((c) => c.entry)).toEqual(['a:FOLDER', 'NONE:NOTE']);
  });

  it('a note after a file and then a trailing-slash folder goes to the root', () => {
    const tree = treeOf(['/a/b.txt', '/c/', '<note>', 'hi', '</note>']);
    expect(tree.map((c) => c.entry)).toEqual(['a:FOLDER', 'c:FOLDER', 'NONE:NOTE']);
  });

  it('a note before any entry goes to the root', () => {
    expect(treeOf(['<note>', 'hi', '</note>', '/a.txt']).map((c) => c.entry)).toEqual(['NONE:NOTE', 'a.txt:DATA']);
  });

  it('a note does not change which file the next note follows', () => {
    const tree = treeOf(['/a/b.txt', '<note>', '1', '</note>', '<note>', '2', '</note>']);
    expect(tree[0]!.children.map((c) => c.entry)).toEqual(['b.txt:DATA', 'NONE:NOTE', 'NONE:NOTE']);
  });

  it('keeps the note lines as written, untrimmed', () => {
    const note = parseFiles(makeSource(['<note>', '  indented ', 'second', '</note>'])).root.children[0]!.note;
    expect(note).toEqual(['  indented ', 'second']);
  });

  it('a note never closed takes every remaining line (getNote, :92-101)', () => {
    const root = parseFiles(makeSource(['<note>', 'a', '/b.txt'])).root;
    expect(root.children.map((c) => c.type)).toEqual([FilesType.NOTE]);
    expect(root.children[0]!.note).toEqual(['a', '/b.txt']);
  });

  it('`</note>` closes by prefix, and a `/` line inside a note is note text (:96)', () => {
    const root = parseFiles(makeSource(['<note>', '/not-a-path', '</note> trailing', '/b.txt'])).root;
    expect(root.children[0]!.note).toEqual(['/not-a-path']);
    expect(root.children[1]!.name).toBe('b.txt');
  });
});

describe('parseFiles -- lines the jar skips (FilesDiagram.java:80-88)', () => {
  it('ignores unknown, blank, indented and directive lines', () => {
    expect(treeOf(['', 'foo', '  /indented.txt', '!theme x', "' comment", '/a.txt'])).toEqual([leaf('a.txt:DATA')]);
  });

  it('matches `<note>` case-sensitively', () => {
    expect(treeOf(['<NOTE>', 'x', '</NOTE>'])).toEqual([]);
  });

  it('an annotation block is consumed whole, so its inner lines are not paths', () => {
    const ast = parseFiles(makeSource(['legend', '/inside', 'end legend', '/a.txt']));
    expect(ast.root.children.map((c) => c.name)).toEqual(['a.txt']);
    expect(ast.annotations?.legend.display).toEqual(['/inside']);
  });

  it('a `sprite` definition is consumed by the sprite matcher, not read as a path', () => {
    const ast = parseFiles(makeSource(['sprite $s [2x2/1] {', '00', '00', '}', '/a.txt']));
    expect(ast.root.children.map((c) => c.name)).toEqual(['a.txt']);
  });
});

describe('parseFiles -- style and sprites', () => {
  it('executes no skinparam (StyleExtractor.java:88-97 drops them, FilesDiagram.java:62-80 never reads them)', () => {
    const styleSource = { skinparam: new Map([['shadowing', 'true']]), styles: [] };
    const diagram = parseFiles(makeSource(['/a'], styleSource)).diagram;
    expect(diagram.getSkinParam().getValue('shadowing')).toBeNull();
  });

  it('applies a <style> block before the font is read (FilesDiagram.java:67-76)', () => {
    const styleSource = { skinparam: new Map<string, string>(), styles: ['root {\n FontColor red\n}'] };
    const diagram = parseFiles(makeSource(['/a'], styleSource)).diagram;
    expect(diagram.styleError).toBeUndefined();
    expect(bridgeFontConfiguration(diagram.fontConfiguration).color).toBe('#FF0000');
  });

  it('keeps a style error and carries on without the style (e.printStackTrace, FilesDiagram.java:68-70)', () => {
    const styleSource = { skinparam: new Map<string, string>(), styles: ['{{{'] };
    const ast = parseFiles(makeSource(['/a'], styleSource));
    expect(ast.diagram.styleError?.message).toBe('Invalid open bracket');
    expect(ast.root.children.map((c) => c.name)).toEqual(['a']);
  });

  it('takes the Twemoji artwork from options.assetStore (the json parser`s channel)', () => {
    const withStore = parseFiles(makeSource(['/a']), { assetStore: buildEmojiAssetsStore() });
    expect(withStore.sprites?.emoji?.get('1f4c2')).toContain('<path');
    expect(parseFiles(makeSource(['/a'])).sprites?.emoji).toBeUndefined();
  });

  it('describes itself as upstream does (FilesDiagram.java:103-105)', () => {
    expect(parseFiles(makeSource([])).diagram.getDescription()).toBe('(Files)');
  });
});
