/**
 * buildMindmapStyleBuilder — `SkinParam.java:155-265` (+ `TitledDiagram
 * .loadSkin`, `CommandStyleMultilinesCSS.executeNow`) over a preprocessed
 * source.
 *
 * Jar oracle (1.2026.8beta1): every case of `fixtures/style-parser-storage
 * .json` (DumpProbe storage dumps; see `helpers/storage-dump.ts`) — 44 corpus
 * mindmaps with `<style>` blocks, plus authored cases for `skin`, `skinparam
 * style strictuml` and a skinparam before/after a `<style>` block.
 *
 * T3b's `convertSkinparam` is not merged yet; the authored skinparam cases
 * use a test double that implements the one `FromSkinparamToStyle` row they
 * reach: `addConvert("hyperlinkColor", PName.HyperLinkColor, SName.root)`
 * (FromSkinparamToStyle.java:135), converted by `convertNow` as
 * `ValueImpl.regular(value, counter)` on `StyleSignatureBasic.of(root)`
 * (FromSkinparamToStyle.java:355-356, 398-408). Every other key converts to
 * nothing, as `convertNow` does for a key with no row (java:328-335).
 */
import { describe, expect, it } from 'vitest';
import { preprocess, type PreprocessorResult } from '../../../../src/core/preprocessor.js';
import {
  buildMindmapStyleBuilder,
  cleanForKeySlow,
  DEFAULT_SKIN,
  type ConvertSkinparam,
} from '../../../../src/core/style/mindmap-style-builder.js';
import type { PName } from '../../../../src/core/style/PName.js';
import { Style } from '../../../../src/core/style/Style.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import type { Value } from '../../../../src/core/style/Value.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import { skinStorageDump } from './helpers/style-fixture.js';
import { dumpStorage, jarStorageCases } from './helpers/storage-dump.js';

/** The `hyperlinkColor` row of FromSkinparamToStyle (java:135, 355-356). */
const hyperlinkColorOnly: ConvertSkinparam = (key: string, value: string, builder: StyleBuilder): Style[] => {
  if (key !== 'hyperlinkcolor') return [];
  const map = new Map<PName, Value>([['HyperLinkColor', ValueImpl.regular(value, builder)]]);
  return [new Style(StyleSignatureBasic.of('root'), map)];
};

function recordingConverter(calls: string[]): ConvertSkinparam {
  return (key, value) => {
    calls.push(`${key}=${value}`);
    return [];
  };
}

function handBuilt(
  over: Partial<PreprocessorResult>,
): Pick<PreprocessorResult, 'skin' | 'skinparam' | 'styles' | 'declarationOrder'> {
  return { skin: undefined, skinparam: new Map(), styles: [], ...over };
}

describe('buildMindmapStyleBuilder: the jar storage of every dumped case', () => {
  it.each(jarStorageCases().map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const builder = buildMindmapStyleBuilder(preprocess(c.source), hyperlinkColorOnly);
    expect(dumpStorage(builder)).toEqual(c.storage);
  });

  it('covers 44 corpus sources and 7 authored ones', () => {
    const names = jarStorageCases().map((c) => c.name);
    expect(names.filter((n) => n.startsWith('corpus-'))).toHaveLength(44);
    expect(names.filter((n) => n.startsWith('authored-'))).toHaveLength(7);
  });
});

describe('buildMindmapStyleBuilder: sources and order (SkinParam.java:155-265)', () => {
  it('no declaration: plantuml.skin alone (SkinParam.java:121, 157-161)', () => {
    expect(DEFAULT_SKIN).toBe('plantuml.skin');
    expect(dumpStorage(buildMindmapStyleBuilder(handBuilt({})))).toEqual(skinStorageDump());
  });

  it('skinparams and `<style>` blocks reach the converter/parser in declaration order', () => {
    const calls: string[] = [];
    const pre = handBuilt({
      skinparam: new Map([
        ['b', '2'],
        ['a', '1'],
      ]),
      styles: ['root {\n  FontSize 9\n}'],
      declarationOrder: {
        skinparam: new Map([
          ['b', 2],
          ['a', 0],
        ]),
        styles: [1],
      },
    });
    const builder = buildMindmapStyleBuilder(pre, recordingConverter(calls));
    expect(calls).toEqual(['a=1', 'b=2']);
    // the style block took the first user priority: nothing was converted before it
    expect(dumpStorage(builder)[0]?.values.FontSize).toEqual(['9', null, 326]);
  });

  it('a hand-built result with no order: every skinparam, then every block', () => {
    const pre = handBuilt({ skinparam: new Map([['hyperlinkcolor', 'red']]), styles: ['root {\n  FontSize 9\n}'] });
    const root = dumpStorage(buildMindmapStyleBuilder(pre, hyperlinkColorOnly))[0];
    expect([root?.values.HyperLinkColor, root?.values.FontSize]).toEqual([
      ['red', null, 326],
      ['9', null, 327],
    ]);
  });

  it("a `'` line of a `<style>` block is dropped (MultilinesStrategy.java:52-63)", () => {
    const pre = handBuilt({ styles: ["root {\n  ' FontSize 3\n  FontSize 9\n}"] });
    expect(dumpStorage(buildMindmapStyleBuilder(pre))[0]?.values.FontSize).toEqual(['9', null, 326]);
  });

  it('every cleaned key of a stereotyped skinparam is converted (SkinParam.java:227-234)', () => {
    const calls: string[] = [];
    buildMindmapStyleBuilder(handBuilt({ skinparam: new Map([['foo<<a>><<b>>', 'x']]) }), recordingConverter(calls));
    expect(calls).toEqual(['foo<<a>>=x', 'foo<<b>>=x']);
  });

  it('`style strictuml` matches ignoring case; any other `style` value mutes nothing (SkinParam.java:235)', () => {
    const upper = dumpStorage(buildMindmapStyleBuilder(handBuilt({ skinparam: new Map([['style', 'StrictUML']]) })));
    expect(upper[0]?.values.Shadowing).toEqual(['0.0', null, 326]);
    const other = dumpStorage(buildMindmapStyleBuilder(handBuilt({ skinparam: new Map([['style', 'other']]) })));
    expect(other).toEqual(skinStorageDump());
  });

  it('`skin strictuml` is an incomplete sheet: TitledDiagram.loadSkin keeps plantuml.skin (java:176-178)', () => {
    expect(dumpStorage(buildMindmapStyleBuilder(handBuilt({ skin: 'strictuml' })))).toEqual(skinStorageDump());
  });

  it('`skin <unknown>`: NoStyleAvailableException, plantuml.skin kept (TitledDiagram.java:168-169)', () => {
    expect(dumpStorage(buildMindmapStyleBuilder(handBuilt({ skin: 'reddress' })))).toEqual(skinStorageDump());
  });

  it('a `<style>` parse error propagates (CommandStyleMultilinesCSS.java:92-93)', () => {
    expect(() => buildMindmapStyleBuilder(handBuilt({ styles: ['{'] }))).toThrow('Invalid open bracket');
  });
});

describe('cleanForKeySlow (SkinParam.java:285-301)', () => {
  it.each([
    ['Sequence_Participant.BorderColor', ['participantbordercolor']],
    ['sequenceActorFontSize', ['actorfontsize']],
    ['classArrowColor', ['arrowcolor']],
    ['usecaseArrowFontColor', ['arrowfontcolor']],
    ['defaultTextAlign', ['defaulttextalignment']],
    ['  Shadowing ', ['shadowing']],
    ['node<<A>>BackgroundColor<<b>>', ['nodebackgroundcolor<<a>>', 'nodebackgroundcolor<<b>>']],
  ])('%s', (key, expected) => {
    expect(cleanForKeySlow(key)).toEqual(expected);
  });
});
