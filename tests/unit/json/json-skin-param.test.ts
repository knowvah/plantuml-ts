/**
 * The json family's `SkinParam` slice (`json-skin-param.ts`): the style engine `TextBlockJson` reads, built in the
 * parse from the preprocessed style sources with the jar's `StyleExtractor` cut. Expected values cite the Java.
 */
import { describe, expect, it, vi } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type * as StyleLoaderModule from '../../../src/core/style/StyleLoader.js';
import { StyleParsingException } from '../../../src/core/style/parser/StyleParser.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import {
  createJsonSkinParam,
  jsonFamilyJarStyleSource,
  type JsonFamilyType,
  type JsonSkinParam,
} from '../../../src/diagrams/json/json-skin-param.js';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';

/** Sentinel skin names the mocked loader fails on: a sheet that parses to no style, and an unexpected fault. */
const EMPTY_SHEET = 'emptysheet';
const FAULTY = 'faulty';

vi.mock('../../../src/core/style/StyleLoader.js', async (importOriginal) => {
  const original = await importOriginal<typeof StyleLoaderModule>();
  const { StyleParsingException: Parsing } = await import('../../../src/core/style/parser/StyleParser.js');
  return {
    ...original,
    loadSkin: (filename: string) => {
      if (filename === 'emptysheet.skin') throw new Parsing('No style found in emptysheet.skin');
      if (filename === 'faulty.skin') throw new TypeError('loader fault');
      return original.loadSkin(filename);
    },
  };
});

const RED = 'red';
const BODY: Record<JsonFamilyType, string> = { json: '{"a":1}', yaml: 'a: 1', hcl: 'a = 1' };
const NODE_RED = (name: string): string => `<style>\n${name} { node { BackGroundColor ${RED} } }\n</style>`;

/** The source `index.ts#umlSourceOfBlock` hands the parse. */
function sourceOf(type: JsonFamilyType, directives: string): UmlSource {
  const block = buildBlockUmls(`@start${type}\n${directives}\n${BODY[type]}\n@end${type}`)[0];
  if (block === undefined || !block.ok) throw new Error('no block');
  return {
    ...block.source,
    rawStyles: block.preprocessed.styles,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
    seedSourceLines: block.seedSource,
  };
}

function nodeFill(skin: JsonSkinParam, name: JsonSkinParam['styleName']): string | null {
  const style = StyleSignatureBasic.of('root', 'element', name, 'node').getMergedStyle(skin.getCurrentStyleBuilder());
  return style!.value('BackGroundColor').asString();
}

function rootFill(skin: JsonSkinParam): string | null {
  const style = StyleSignatureBasic.of('root').getMergedStyle(skin.getCurrentStyleBuilder());
  return style!.value('BackGroundColor').asString();
}

describe('createJsonSkinParam', () => {
  it('applies a <style> block: the merged jsonDiagram node answers red (StyleExtractor.java:132-136)', () => {
    const skin = createJsonSkinParam(sourceOf('json', NODE_RED('jsonDiagram')), 'json');
    expect(nodeFill(skin, 'jsonDiagram')).toBe(RED);
    expect(skin.styleError).toBeUndefined();
  });

  it('answers the default skin when the source declares nothing', () => {
    const skin = createJsonSkinParam(sourceOf('json', ''), 'json');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
  });

  it('answers the default skin for a hand-built source with no style sources', () => {
    const skin = createJsonSkinParam({ type: 'json', lines: ['{}'] }, 'json');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
    expect(skin.styleError).toBeUndefined();
  });

  it('names jsonDiagram for json, yamlDiagram for yaml AND hcl (TextBlockJson.java:113)', () => {
    expect(createJsonSkinParam(sourceOf('json', ''), 'json').styleName).toBe('jsonDiagram');
    expect(createJsonSkinParam(sourceOf('yaml', ''), 'yaml').styleName).toBe('yamlDiagram');
    expect(createJsonSkinParam(sourceOf('hcl', ''), 'hcl').styleName).toBe('yamlDiagram');
  });

  it('a yamlDiagram style reaches yaml and a jsonDiagram one does not', () => {
    const yaml = createJsonSkinParam(sourceOf('yaml', NODE_RED('yamlDiagram')), 'yaml');
    expect(nodeFill(yaml, 'yamlDiagram')).toBe(RED);
    const other = createJsonSkinParam(sourceOf('yaml', NODE_RED('jsonDiagram')), 'yaml');
    expect(nodeFill(other, 'yamlDiagram')).toBe('#f1f1f1');
  });

  it('drops hcl <style> blocks: the merged node equals the default skin (HclDiagramFactory.java:86-92)', () => {
    const hcl = createJsonSkinParam(sourceOf('hcl', NODE_RED('yamlDiagram')), 'hcl');
    expect(nodeFill(hcl, 'yamlDiagram')).toBe('#f1f1f1');
    expect(hcl.styleError).toBeUndefined();
  });

  it('drops the hcl skin line too, so a missing skin raises nothing (HclDiagramFactory.java:86-92)', () => {
    const hcl = createJsonSkinParam(sourceOf('hcl', 'skin nonexistent'), 'hcl');
    expect(hcl.styleError).toBeUndefined();
  });

  it('keeps no skinparam: backgroundColor never reaches the builder (StyleExtractor.java:88-96)', () => {
    const skin = createJsonSkinParam(
      sourceOf('json', 'skinparam backgroundColor red\nskinparam handwritten true'),
      'json',
    );
    expect(rootFill(skin)).toBe('#f1f1f1');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
  });

  it('applies a named skin before the <style> blocks (StyleExtractor.java:115-135)', () => {
    const skin = createJsonSkinParam(sourceOf('json', `skin rose\n${NODE_RED('yamlDiagram')}`), 'json');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('white');
  });

  it('a skin that does not load ends applyStyles: "Cannot find style", no <style> block applied', () => {
    const skin = createJsonSkinParam(sourceOf('json', `skin nonexistent\n${NODE_RED('jsonDiagram')}`), 'json');
    expect(skin.styleError).toBeInstanceOf(StyleParsingException);
    expect(skin.styleError?.message).toBe('Cannot find style nonexistent');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
  });

  it('a strictuml fragment is no skin: "Incomplete style", the default skin stays (StyleExtractor.java:126-128)', () => {
    const skin = createJsonSkinParam(sourceOf('json', `skin strictuml\n${NODE_RED('jsonDiagram')}`), 'json');
    expect(skin.styleError?.message).toBe(
      'Incomplete style strictuml: root does not define [FontName, FontSize, FontStyle, FontColor, LineColor, LineThickness, BackGroundColor, HorizontalAlignment]',
    );
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
  });

  it('a skin sheet that fails to parse is kept as the StyleParsingException it raised (StyleLoader.java:99-104)', () => {
    const skin = createJsonSkinParam(sourceOf('json', `skin ${EMPTY_SHEET}`), 'json');
    expect(skin.styleError?.message).toBe('No style found in emptysheet.skin');
  });

  it('a fault that is no style error propagates', () => {
    expect(() => createJsonSkinParam(sourceOf('json', `skin ${FAULTY}`), 'json')).toThrow('loader fault');
  });

  it('a rejected <style> block is kept on styleError and NO block applies (StyleExtractor.java:132-135)', () => {
    // One StyleParser#parse over every <style> line: it throws before muteStyle. Jar oracle (2026-10-29,
    // scripts/oracle-render.sh): `jsonDiagram { node { BackGroundColor red } }` + `<style>{ }</style>`
    // draws the node #F1F1F1.
    const skin = createJsonSkinParam(sourceOf('json', `${NODE_RED('jsonDiagram')}\n<style>\n{ }\n</style>`), 'json');
    expect(skin.styleError).toBeInstanceOf(StyleParsingException);
    expect(skin.styleError?.message).toBe('Invalid open bracket');
    expect(nodeFill(skin, 'jsonDiagram')).toBe('#f1f1f1');
  });

  it('answers the shared HColorSet (SkinParam.java:1052-1054)', () => {
    expect(createJsonSkinParam(sourceOf('json', ''), 'json').getIHtmlColorSet()).toBe(HColorSet.instance());
  });

  it('answers the same builder on every call, as the mutated SkinParam does (SkinParam.java:156-162)', () => {
    const skin = createJsonSkinParam(sourceOf('json', ''), 'json');
    expect(skin.getCurrentStyleBuilder()).toBe(skin.getCurrentStyleBuilder());
  });
});

describe('jsonFamilyJarStyleSource', () => {
  it('keeps only handwritten among the skinparams, with its declaration order', () => {
    const source = sourceOf('json', 'skinparam backgroundColor red\nskinparam handwritten true');
    const cut = jsonFamilyJarStyleSource(source, 'json');
    expect([...cut.skinparam]).toEqual([['handwritten', 'true']]);
    expect([...(cut.declarationOrder?.skinparam.keys() ?? [])]).toEqual(['handwritten']);
  });

  it('keeps no skinparam when handwritten is absent or not true', () => {
    const source = sourceOf('yaml', 'skinparam backgroundColor red\nskinparam handwritten false');
    expect(jsonFamilyJarStyleSource(source, 'yaml').skinparam.size).toBe(0);
  });

  it('keeps the skin and the <style> blocks for json and yaml', () => {
    const source = sourceOf('json', `skin rose\n${NODE_RED('jsonDiagram')}`);
    const cut = jsonFamilyJarStyleSource(source, 'json');
    expect(cut.skin).toBe('rose');
    expect(cut.styles).toHaveLength(1);
  });

  it('drops the skin and every <style> block for hcl, order included', () => {
    const source = sourceOf('hcl', `skin rose\n${NODE_RED('yamlDiagram')}`);
    const cut = jsonFamilyJarStyleSource(source, 'hcl');
    expect(cut.skin).toBeUndefined();
    expect(cut.styles).toEqual([]);
    expect(cut.declarationOrder?.styles).toEqual([]);
  });
});

describe('the parsers carry the slice on JsonDiagramAST.skinParam', () => {
  it('parseJson builds a jsonDiagram slice that sees the <style> block', () => {
    const skin = parseJson(sourceOf('json', NODE_RED('jsonDiagram'))).skinParam!;
    expect(skin.styleName).toBe('jsonDiagram');
    expect(nodeFill(skin, 'jsonDiagram')).toBe(RED);
  });

  it('parseYaml builds a yamlDiagram slice that sees the <style> block', () => {
    const skin = parseYaml(sourceOf('yaml', NODE_RED('yamlDiagram'))).skinParam!;
    expect(skin.styleName).toBe('yamlDiagram');
    expect(nodeFill(skin, 'yamlDiagram')).toBe(RED);
  });

  it('parseHcl builds a yamlDiagram slice that ignores the <style> block', () => {
    const skin = parseHcl(sourceOf('hcl', NODE_RED('yamlDiagram'))).skinParam!;
    expect(skin.styleName).toBe('yamlDiagram');
    expect(nodeFill(skin, 'yamlDiagram')).toBe('#f1f1f1');
  });
});
