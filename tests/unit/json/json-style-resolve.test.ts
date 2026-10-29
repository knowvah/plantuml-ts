/**
 * resolveJsonStyles at the jar signatures (`TextBlockJson.java:138-152`,
 * `:269-299`, `SmetanaForJson.java:119-126`), over the embedded
 * `plantuml.skin` `yamlDiagram,jsonDiagram` block (:456-476) and `<style>`s.
 * Jar oracles: tests/fixtures/json/diagram-fontcolor-no-node.svg (all text
 * #F00) and root-fontcolor.svg (also all #F00; the 4 #000 are lines).
 */
import { describe, expect, it } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { buildMindmapStyleBuilder } from '../../../src/core/style/mindmap-style-builder.js';
import { resolveJsonStyles, styleToUse, type JsonStyleInput } from '../../../src/diagrams/json/json-style-resolve.js';

const SET = HColorSet.instance();

function skinOf(styles: string, styleName: JsonStyleInput['styleName'] = 'jsonDiagram'): JsonStyleInput {
  const source = styles === '' ? '@startjson\n{}\n@endjson' : `@startjson\n<style>\n${styles}\n</style>\n{}\n@endjson`;
  const builder = buildMindmapStyleBuilder(preprocess(source));
  return { getCurrentStyleBuilder: () => builder, styleName };
}

const colour = (
  s: { value(n: 'FontColor' | 'BackGroundColor'): { asString(): string | null } },
  n: 'FontColor' | 'BackGroundColor',
) => s.value(n).asString();

describe('resolveJsonStyles: the default skin (plantuml.skin:456-476)', () => {
  const s = resolveJsonStyles(skinOf(''));

  it('node: RoundCorner 10, LineThickness 1.5, FontColor black', () => {
    expect(s.node.value('RoundCorner').asDouble()).toBe(10);
    expect(s.node.value('LineThickness').asDouble()).toBe(1.5);
    expect(colour(s.node, 'FontColor')).toBe('black');
  });

  it('separator: LineThickness 1 (node signature + separator)', () => {
    expect(s.separator.value('LineThickness').asDouble()).toBe(1);
  });

  it('nodeHeader: FontStyle bold; node is not', () => {
    expect(s.nodeHeader.value('FontStyle').asString()).toBe('bold');
    expect(s.node.value('FontStyle').asString()).not.toBe('bold');
  });

  it('highlight: BackGroundColor #ccff02, header or not', () => {
    expect(colour(s.highlight('', false), 'BackGroundColor')).toBe('#ccff02');
    expect(colour(s.highlight('', true), 'BackGroundColor')).toBe('#ccff02');
  });

  it('arrow: LineStyle 3-3, LineThickness 1', () => {
    expect(s.arrow.value('LineStyle').asString()).toBe('3-3');
    expect(s.arrow.value('LineThickness').asDouble()).toBe(1);
  });

  it('highlight with a class no style declares equals the plain highlight', () => {
    expect(colour(s.highlight('nope', false), 'BackGroundColor')).toBe('#ccff02');
  });
});

describe('resolveJsonStyles: <style> input', () => {
  it('`.warn { BackGroundColor orange }` fills highlight(warn) orange, not highlight()', () => {
    const s = resolveJsonStyles(skinOf('.warn {\n  BackGroundColor orange\n}'));
    expect(colour(s.highlight('warn', false), 'BackGroundColor')).toBe('orange');
    expect(s.highlight('warn', false).value('BackGroundColor').asColor(SET)).toEqual(SET.getColor('orange'));
    expect(colour(s.highlight('', false), 'BackGroundColor')).toBe('#ccff02');
  });

  it('`jsonDiagram { FontColor red }` (no node block) makes the node font red (oracle diagram-fontcolor-no-node.svg)', () => {
    const s = resolveJsonStyles(skinOf('jsonDiagram {\n  FontColor red\n}'));
    expect(colour(s.node, 'FontColor')).toBe('red');
    expect(colour(s.nodeHeader, 'FontColor')).toBe('red');
  });

  it('`root { FontColor red }` also paints the node font red (oracle root-fontcolor.svg: all 8 text runs #F00)', () => {
    const s = resolveJsonStyles(skinOf('root {\n  FontColor red\n}'));
    expect(colour(s.node, 'FontColor')).toBe('red');
  });

  it('styleName yamlDiagram ignores a jsonDiagram-only block: yaml defaults', () => {
    const s = resolveJsonStyles(
      skinOf('jsonDiagram {\n  FontColor red\n  node {\n    RoundCorner 3\n  }\n}', 'yamlDiagram'),
    );
    expect(colour(s.node, 'FontColor')).toBe('black');
    expect(s.node.value('RoundCorner').asDouble()).toBe(10);
  });

  it('styleName jsonDiagram honours the same block (control)', () => {
    const s = resolveJsonStyles(skinOf('jsonDiagram {\n  node {\n    RoundCorner 3\n  }\n}'));
    expect(s.node.value('RoundCorner').asDouble()).toBe(3);
  });
});

describe('resolveJsonStyles: a builder that matches nothing', () => {
  it('throws naming the signature (a builder always matches `root`)', () => {
    const empty = { getMergedStyle: () => undefined } as unknown as ReturnType<
      JsonStyleInput['getCurrentStyleBuilder']
    >;
    expect(() => resolveJsonStyles({ getCurrentStyleBuilder: () => empty, styleName: 'jsonDiagram' })).toThrow(
      /no declaration matches .*node/,
    );
  });
});

describe('styleToUse: TextBlockJson#getStyleToUse (TextBlockJson.java:138-152)', () => {
  const s = resolveJsonStyles(skinOf('.warn {\n  BackGroundColor orange\n}'));

  it('not highlighted: header cell is the bold +header style, value cell the node style', () => {
    expect(styleToUse(s, true, false)).toBe(s.nodeHeader);
    expect(styleToUse(s, false, false)).toBe(s.node);
    expect(styleToUse(s, true, false).value('FontStyle').asString()).toBe('bold');
  });

  it('highlighted: +highlight with the row stereotype, header or not', () => {
    expect(colour(styleToUse(s, false, 'warn'), 'BackGroundColor')).toBe('orange');
    expect(colour(styleToUse(s, true, ''), 'BackGroundColor')).toBe('#ccff02');
    expect(styleToUse(s, true, '').value('FontStyle').asString()).toBe('bold');
  });
});
