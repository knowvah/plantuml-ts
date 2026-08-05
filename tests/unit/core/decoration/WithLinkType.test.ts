import { describe, it, expect } from 'vitest';
import { WithLinkType } from '../../../../src/core/decoration/WithLinkType.js';
import { LinkType } from '../../../../src/core/decoration/LinkType.js';
import { LinkDecor } from '../../../../src/core/decoration/LinkDecor.js';
import { LinkMiddleDecor } from '../../../../src/core/decoration/LinkMiddleDecor.js';
import { LinkStyle } from '../../../../src/core/decoration/LinkStyle.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType } from '../../../../src/core/abel/ColorType.js';
import { parseSimpleColor } from '../../../../src/core/klimt/color/HColorSet.js';

/** Concrete subclass standing in for `abel/Link` (goNorank recorded). */
class TestWithLinkType extends WithLinkType {
  norankCalls = 0;
  constructor() {
    super();
    this.type = new LinkType(LinkDecor.NONE, LinkDecor.NONE);
  }
  goNorank(): void {
    this.norankCalls++;
  }
  isHiddenForTest(): boolean {
    return this.hidden;
  }
}

function styled(style: LinkStyle): string {
  return new LinkType(LinkDecor.NONE, LinkDecor.NONE, LinkMiddleDecor.NONE, style).toString();
}

describe('WithLinkType', () => {
  it('starts with no flags, empty colors, no supplementary', () => {
    const w = new TestWithLinkType();
    expect(w.isSingle()).toBe(false);
    expect(w.useNodeStyle()).toBe(false);
    expect(w.isHiddenForTest()).toBe(false);
    expect(w.getColors().isEmpty()).toBe(true);
    expect(w.getSupplementaryColors()).toEqual([]);
    expect(w.getSpecificColor()).toBeUndefined();
  });

  it('goSingle sets the -[single]-> dedup flag read by CucaDiagram.containsSimilarLink', () => {
    const w = new TestWithLinkType();
    w.goSingle();
    expect(w.isSingle()).toBe(true);
  });

  it('goNodeStyle / useNodeStyle', () => {
    const w = new TestWithLinkType();
    w.goNodeStyle();
    expect(w.useNodeStyle()).toBe(true);
  });

  it('goDashed / goDotted / goBold / goThickness rewrite the LinkType style', () => {
    const w = new TestWithLinkType();
    w.goDashed();
    expect(w.getType().toString()).toBe(styled(LinkStyle.DASHED()));
    w.goDotted();
    expect(w.getType().toString()).toBe(styled(LinkStyle.DOTTED()));
    w.goBold();
    expect(w.getType().toString()).toBe(styled(LinkStyle.BOLD()));
    w.goThickness(2.5);
    expect(w.getType().toString()).toBe(styled(LinkStyle.BOLD().goThickness(2.5)));
  });

  it('goHidden sets hidden', () => {
    const w = new TestWithLinkType();
    w.goHidden();
    expect(w.isHiddenForTest()).toBe(true);
  });

  it('setSpecificColor(i=0) lands in colors; i>0 lands in supplementary', () => {
    const w = new TestWithLinkType();
    const red = parseSimpleColor('red')!;
    const blue = parseSimpleColor('blue')!;
    w.setSpecificColor(red);
    expect(w.getSpecificColor()).toBe(red);
    w.setSpecificColor(blue, 1);
    expect(w.getSpecificColor()).toBe(red);
    expect(w.getSupplementaryColors()).toHaveLength(1);
    expect(w.getSupplementaryColors()[0]!.getColor(ColorType.LINE)).toBe(blue);
  });

  it('setColors / getColors replace the whole map', () => {
    const w = new TestWithLinkType();
    const c = Colors.empty().add(ColorType.LINE, parseSimpleColor('green'));
    w.setColors(c);
    expect(w.getColors()).toBe(c);
  });

  it('applyStyle(null-ish) is a no-op', () => {
    const w = new TestWithLinkType();
    const before = w.getType();
    w.applyStyle(undefined);
    expect(w.getType()).toBe(before);
  });

  it('applyStyle applies each keyword, case-insensitively', () => {
    const w = new TestWithLinkType();
    w.applyStyle('DASHED');
    expect(w.getType().toString()).toBe(styled(LinkStyle.DASHED()));
    w.applyStyle('single');
    expect(w.isSingle()).toBe(true);
    w.applyStyle('hidden');
    expect(w.isHiddenForTest()).toBe(true);
    w.applyStyle('node');
    expect(w.useNodeStyle()).toBe(true);
    w.applyStyle('norank');
    expect(w.norankCalls).toBe(1);
  });

  it('applyStyle "plain" changes nothing', () => {
    const w = new TestWithLinkType();
    const before = w.getType();
    w.applyStyle('plain');
    expect(w.getType()).toBe(before);
    expect(w.getSpecificColor()).toBeUndefined();
  });

  it('applyStyle thickness= parses the double', () => {
    const w = new TestWithLinkType();
    w.applyStyle('thickness=2.5');
    expect(w.getType().toString()).toBe(styled(LinkStyle.NORMAL().goThickness(2.5)));
  });

  it('applyStyle comma tokens within one semicolon segment share the index', () => {
    const w = new TestWithLinkType();
    w.applyStyle('single,bold');
    expect(w.isSingle()).toBe(true);
    expect(w.getType().toString()).toBe(styled(LinkStyle.BOLD()));
  });

  it('applyStyle color tokens: segment 0 is the line color, later segments are supplementary', () => {
    const w = new TestWithLinkType();
    w.applyStyle('red;blue');
    expect(w.getSpecificColor()).toEqual(parseSimpleColor('red'));
    expect(w.getSupplementaryColors()).toHaveLength(1);
    expect(w.getSupplementaryColors()[0]!.getColor(ColorType.LINE)).toEqual(parseSimpleColor('blue'));
  });

  it('applyStyle skips empty tokenizer segments (StringTokenizer semantics)', () => {
    const w = new TestWithLinkType();
    w.applyStyle('red;;blue');
    expect(w.getSpecificColor()).toEqual(parseSimpleColor('red'));
    expect(w.getSupplementaryColors()).toHaveLength(1);
  });

  it('unknown color falls back to white (getColorOrWhite)', () => {
    const w = new TestWithLinkType();
    w.applyStyle('notarealcolorxyz');
    expect(w.getSpecificColor()).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  });

  it('mixed style + color segment sequence (dashed;bold applies both)', () => {
    const w = new TestWithLinkType();
    w.applyStyle('dashed;bold');
    expect(w.getType().toString()).toBe(styled(LinkStyle.BOLD()));
  });

  it('getUStroke throws UnsupportedOperationException', () => {
    const w = new TestWithLinkType();
    expect(() => w.getUStroke()).toThrow('UnsupportedOperationException');
  });
});
