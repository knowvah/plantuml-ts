/**
 * StyleParser / Context / CssVariables — `style/parser/*.java`.
 *
 * Jar oracle (1.2026.8beta1): the `authored-nesting`, `authored-stereo-space`
 * and `corpus-cejije-94-xibi793` cases of `fixtures/style-parser-storage.json`
 * (DumpProbe storage dumps; see `helpers/storage-dump.ts`). Each case's single
 * `<style>` block is parsed over `loadSkin('plantuml.skin')` and muted, as
 * `CommandStyleMultilinesCSS.executeNow` (java:85-90) does. The remaining
 * cases pin single Java branches; each cites the line it pins.
 */
import { describe, expect, it } from 'vitest';
import { AutomaticCounterBasic } from '../../../../src/core/style/AutomaticCounterBasic.js';
import { loadSkin } from '../../../../src/core/style/StyleLoader.js';
import { CssVariables } from '../../../../src/core/style/parser/CssVariables.js';
import { Context } from '../../../../src/core/style/parser/Context.js';
import { StyleScheme } from '../../../../src/core/style/parser/StyleScheme.js';
import { parseStyles, StyleParser, StyleParsingException } from '../../../../src/core/style/parser/StyleParser.js';
import type { Style } from '../../../../src/core/style/Style.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import { dumpStyle } from './helpers/style-fixture.js';
import { dumpStorage, jarStorageCases } from './helpers/storage-dump.js';

const RE_STYLE_BODY = /<style>\n([\s\S]*?)\n<\/style>/;

function styleBody(caseName: string): { readonly body: string; readonly storage: unknown } {
  const found = jarStorageCases().find((c) => c.name === caseName);
  if (found === undefined) throw new Error(`no case ${caseName}`);
  const m = RE_STYLE_BODY.exec(found.source);
  if (m === null) throw new Error(`case ${caseName} has no <style> block`);
  return { body: m[1]!, storage: found.storage };
}

/** Parse over a fresh default skin and mute, as CommandStyleMultilinesCSS.java:87-88. */
function muted(body: string): StyleBuilder {
  const builder = loadSkin('plantuml.skin');
  return builder.muteStyle(parseStyles(body, builder));
}

function parseAlone(text: string): readonly Style[] {
  return new StyleParser(new AutomaticCounterBasic()).parse(text.split('\n'));
}

describe('StyleParser over the default skin: the jar storage', () => {
  it.each(['authored-nesting', 'authored-stereo-space', 'corpus-cejije-94-xibi793'])('%s', (name) => {
    const { body, storage } = styleBody(name);
    expect(dumpStorage(muted(body))).toEqual(storage);
  });

  it('authored-nesting: :depth(1) nested three deep is mindmapDiagram+node+leafNode at level 1', () => {
    const styles = parseStyles(styleBody('authored-nesting').body, loadSkin('plantuml.skin')).map(dumpStyle);
    expect(styles[0]).toEqual({
      snames: ['leafNode', 'mindmapDiagram', 'node'],
      level: 1,
      star: false,
      stereotypes: [],
      values: { FontColor: ['red', null, 328], LineColor: ['#123456', null, 329] },
    });
    // var(--accent) resolved (CssVariables.java:58-69), `--accent` itself consumed no priority
    expect(styles[1]?.values).toEqual({ BackGroundColor: ['#ABCDEF', null, 327] });
  });
});

describe('StyleParser branches', () => {
  it('an empty BlocLines parses to nothing (StyleParser.java:79-80)', () => {
    expect(new StyleParser(new AutomaticCounterBasic()).parse([])).toEqual([]);
    expect(parseStyles('', new StyleBuilder())).toEqual([]);
  });

  it('an unknown key consumes no priority (StyleParser.java:131-134)', () => {
    const [style] = parseAlone('root {\n  NotAProperty 3\n  FontColor red\n}').map(dumpStyle);
    expect(style).toEqual({
      snames: ['root'],
      level: -1,
      star: false,
      stereotypes: [],
      values: { FontColor: ['red', null, 1] },
    });
  });

  it('a stereotype selector lifts every value by 1000 (Context.java:128-129)', () => {
    const [style] = parseAlone('.Foo {\n  FontColor red\n}').map(dumpStyle);
    expect(style?.stereotypes).toEqual(['foo']);
    expect(style?.values).toEqual({ FontColor: ['red', null, 1001] });
  });

  it('`@media` switches to DARK for the rest of the text (StyleParser.java:150-152)', () => {
    const styles = parseAlone('@media dark {\nroot {\n  FontColor red\n}\n}\nnode {\n  LineColor blue\n}').map(
      dumpStyle,
    );
    expect(styles.map((s) => s.values)).toEqual([{ FontColor: [null, 'red', 1] }, { LineColor: [null, 'blue', 2] }]);
  });

  it('quoted strings, `:` after the key, `;` separators and both comment forms', () => {
    const text = '/\' block\ncomment \'/\nroot { // trailing\n  FontName: "Times New Roman"; FontSize 9\n}';
    const [style] = parseAlone(text).map(dumpStyle);
    expect(style?.values).toEqual({ FontName: ['Times New Roman', null, 1], FontSize: ['9', null, 2] });
  });

  it('a value joins STRINGs with one space, `,` and `:x` bare (StyleParser.java:207-225)', () => {
    const [style] = parseAlone('root {\n  FontName a  b,c :d\n}').map(dumpStyle);
    expect(style?.values).toEqual({ FontName: ['a b, c:d', null, 1] });
  });

  it('`<style>` / `</style>` tokens are skipped (StyleParser.java:96-99)', () => {
    const styles = parseAlone('<style>\nroot {\n  FontSize 3\n}\n</style>').map(dumpStyle);
    expect(styles).toHaveLength(1);
    expect(styles[0]?.values).toEqual({ FontSize: ['3', null, 1] });
  });

  it('comma selector: one style per selector, sharing the priorities (java:101-109)', () => {
    const styles = parseAlone('node, arrow\n{\n  FontSize 3\n}').map(dumpStyle);
    expect(styles.map((s) => [s.snames, s.values])).toEqual([
      [['node'], { FontSize: ['3', null, 1] }],
      [['arrow'], { FontSize: ['3', null, 1] }],
    ]);
  });

  it('`:depth(n)` without a star (StyleParser.java:153-160)', () => {
    const [style] = parseAlone(':depth(3) {\n  FontSize 3\n}').map(dumpStyle);
    expect([style?.level, style?.star]).toEqual([3, false]);
  });

  it('`name *` stars the selector (StyleParser.java:114-117)', () => {
    const [style] = parseAlone('node * {\n  FontSize 3\n}').map(dumpStyle);
    expect([style?.snames, style?.star]).toEqual([['node'], true]);
  });

  it('a lone `{` is "Invalid open bracket" (StyleParser.java:170-171)', () => {
    expect(() => parseAlone('{')).toThrow(new StyleParsingException('Invalid open bracket'));
  });

  it('a key with no value is "parsing" (StyleParser.java:139-140)', () => {
    expect(() => parseAlone('root {\n  FontColor\n}')).toThrow(new StyleParsingException('parsing'));
  });

  it('a comma selector not followed by `{` is IllegalStateException (StyleParser.java:108)', () => {
    expect(() => parseAlone('a, b *\n{')).toThrow('IllegalStateException');
  });

  it('`:` then a non-string in a value is "bad definition" (StyleParser.java:219-220)', () => {
    expect(() => parseAlone('root {\n  FontName a : {\n}')).toThrow(new StyleParsingException('bad definition'));
  });

  it('parseSingleLine: the context values on an empty signature (StyleParser.java:69-73)', () => {
    const style = new StyleParser(new AutomaticCounterBasic()).parseSingleLine('FontColor red; FontSize 4');
    expect(dumpStyle(style)).toEqual({
      snames: [],
      level: -1,
      star: false,
      stereotypes: [],
      values: { FontColor: ['red', null, 1], FontSize: ['4', null, 2] },
    });
  });
});

describe('Context', () => {
  it('push strips `:` and a trailing `*`, and splits on `,` (Context.java:66-98)', () => {
    const ctx = Context.empty().push(':depth(2),node *');
    expect([...ctx.toSignatures()].map((s) => s.toString())).toEqual([
      StyleSignatureBasic.empty().addLevel(2).addStar().toString(),
      StyleSignatureBasic.of('node').addStar().toString(),
    ]);
  });

  it('an unknown name is a stereotype (Context.java:84-86)', () => {
    const [sig] = Context.empty().push('notAnSName').toSignatures();
    expect([...sig!.getStereotypes()]).toEqual(['notansname']);
  });

  it('pop on the empty context is IllegalStateException (Context.java:101-105)', () => {
    expect(() => Context.empty().pop()).toThrow('IllegalStateException');
    const child = Context.empty().push('node');
    expect(child.pop().isEmpty()).toBe(true);
  });

  it('putInContext on a present key replaces it in place (Context.java:119-121)', () => {
    const ctx = Context.empty().push('node');
    ctx.putInContext('FontColor', ValueImpl.regular('red', 1));
    ctx.putInContext('FontColor', ValueImpl.regular('blue', 2));
    expect([...ctx.getInternalMap().values()].map((v) => v.getPriority())).toEqual([2]);
  });

  it('toStyles skips an empty map; values stay in PName order (Context.java:121-133)', () => {
    const ctx = Context.empty().push('node');
    expect(ctx.toStyles()).toEqual([]);
    ctx.putInContext('LineColor', ValueImpl.regular('blue', 2));
    ctx.putInContext('FontColor', ValueImpl.regular('red', 1));
    expect([...ctx.getInternalMap().keys()]).toEqual(['FontColor', 'LineColor']);
    expect(ctx.toString()).toBe(`[${StyleSignatureBasic.of('node').toString()}]`);
  });
});

describe('CssVariables', () => {
  it('learn(var, value) strips `--`; value() resolves `var(--x)` (CssVariables.java:52-69)', () => {
    const vars = new CssVariables();
    vars.learn('--main-color', '#123');
    expect(vars.value('var(--main-color)')).toBe('#123');
    expect(vars.value('var(--unknown)')).toBe('var(--unknown)');
    expect(vars.value('red')).toBe('red');
  });

  it('a name without `--` is kept as is; a malformed `var(` is the value itself (java:58-60, 66-67)', () => {
    const vars = new CssVariables();
    vars.learn('plain', 'x');
    expect(vars.value('var(plain)')).toBe('x');
    expect(vars.value('var(plain')).toBe('var(plain');
  });

  it('learn(line) reads `--name: value;` (CssVariables.java:45-50)', () => {
    const vars = new CssVariables();
    vars.learn('--ab: 12px;');
    vars.learn('not a declaration');
    expect(vars.value('var(ab)')).toBe('12px');
  });
});

describe('StyleScheme', () => {
  it('REGULAR and DARK (StyleScheme.java:38-40)', () => {
    expect(Object.values(StyleScheme)).toEqual(['REGULAR', 'DARK']);
  });
});
