/**
 * `SvgSaxParser#handleText` measures an anchored `<text>` through
 * `ug.getStringBounder()` (`SvgSaxParser.java:666-675`); the sprite draw
 * reaches it through the caller's bounder, handed over by every
 * `AtomImageResolver` call site.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  SpritePrimitiveCollector,
  makeAtomImageResolverFor,
  resolveSvgSpriteAtom,
} from '../../../src/core/creole-atoms-image-resolver.js';
import type { AtomImageResolver, InlineAtomToken, StringBounderSupplier } from '../../../src/core/creole-atoms.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../../src/core/sprite-commands.js';
import { spriteDimsLookupFor } from '../../../src/core/sprite-registry.js';
import { SvgParserSelector } from '../../../src/core/klimt/sprite/sax/svg-sprite-parser-factory.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { UText } from '../../../src/core/klimt/shape/UText.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { atomDim, drawAtom } from '../../../src/core/annotations/blocks-creole-atoms.js';
import { FakeUGraphic } from './klimt/sprite/sax/fake-ugraphic.js';

const TEXT_WIDTH = 40;
const BOUNDER: StringBounder = {
  calculateDimension: () => new XDimension2D(TEXT_WIDTH, 10),
};
const SUPPLIER: StringBounderSupplier = () => BOUNDER;
const FONT = { family: 'sans-serif', size: 13, color: null, styles: new Set<never>() } as never;
const ATOM = { kind: 'sprite', name: 'a', scale: 1 } as unknown as Extract<InlineAtomToken, { kind: 'sprite' }>;

function svgWithAnchor(anchor: string): string {
  return `<svg width="100" height="30"><text x="50" y="20" text-anchor="${anchor}" font-size="14">Mid</text></svg>`;
}

function textOffsetX(anchor: string): number {
  const svg = svgWithAnchor(anchor);
  const registry = createSpriteRegistry();
  matchSpriteCommand([`sprite $a ${svg}`], 0, registry);
  const resolved = resolveSvgSpriteAtom(
    ATOM,
    svg,
    spriteDimsLookupFor(registry),
    FONT,
    undefined,
    SvgParserSelector.SAX,
    SUPPLIER,
  );
  const text = resolved.primitives.find((p) => p.shape instanceof UText);
  return text!.translate.getDx();
}

describe('SpritePrimitiveCollector.getStringBounder', () => {
  it('throws without a supplier (SvgNanoParser never asks)', () => {
    expect(() => SpritePrimitiveCollector.create().getStringBounder()).toThrow('not supported');
  });

  it('answers the caller bounder, lazily, and keeps it through apply()', () => {
    const supplier = vi.fn(SUPPLIER);
    const collector = SpritePrimitiveCollector.create(undefined, supplier);
    expect(supplier).not.toHaveBeenCalled();
    expect(collector.apply(collector.getTranslate()).getStringBounder()).toBe(BOUNDER);
    expect(supplier).toHaveBeenCalledTimes(1);
  });
});

describe('SvgSaxParser text-anchor through resolveSvgSpriteAtom (SvgSaxParser.java:666-675)', () => {
  it('shifts middle by -width/2 and end by -width, start by 0', () => {
    const start = textOffsetX('start');
    expect(textOffsetX('middle')).toBe(start - TEXT_WIDTH / 2);
    expect(textOffsetX('end')).toBe(start - TEXT_WIDTH);
  });
});

describe('AtomImageResolver call sites hand over their bounder', () => {
  const inline = { kind: 'inline', atom: ATOM } as never;

  it('atomDim passes the measuring bounder', () => {
    const resolver = vi.fn<AtomImageResolver>(() => undefined);
    atomDim(inline, BOUNDER, resolver);
    expect(resolver.mock.calls[0]![1]!()).toBe(BOUNDER);
  });

  it('drawAtom passes ug.getStringBounder()', () => {
    const ug = new FakeUGraphic();
    const spy = vi.spyOn(ug, 'getStringBounder').mockReturnValue(BOUNDER);
    const resolver = vi.fn<AtomImageResolver>(() => undefined);
    drawAtom(inline, ug, resolver);
    expect(spy).not.toHaveBeenCalled();
    expect(resolver.mock.calls[0]![1]!()).toBe(BOUNDER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('makeAtomImageResolverFor forwards it to the sprite draw', () => {
    const registry = createSpriteRegistry();
    matchSpriteCommand(['!pragma svgparser sax', `sprite $a ${svgWithAnchor('middle')}`], 1, registry);
    const resolved = makeAtomImageResolverFor(registry)(FONT)(ATOM, SUPPLIER);
    expect(resolved?.kind).toBe('drawable');
  });
});
