/**
 * `!pragma svgparser` is read AT SPRITE DEFINITION
 * (`CommandSpriteSvg.java:81-82`, `CommandSpriteSvgMultiline.java:103`), so
 * `matchSpriteCommand` stamps `SpriteSvg.parser` from the last such pragma
 * line before the definition.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSpriteRegistry,
  getSpriteSvg,
  matchSpriteCommand,
  type SpriteRegistry,
} from '../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../src/core/klimt/sprite/SpriteSvg.js';
import { SvgParserSelector } from '../../../src/core/klimt/sprite/sax/svg-sprite-parser-factory.js';
import { SvgNanoParser } from '../../../src/core/klimt/sprite/SvgNanoParser.js';
import { SvgSaxParser } from '../../../src/core/klimt/sprite/sax/SvgSaxParser.js';
import { resolveSvgSpriteAtom } from '../../../src/core/creole-atoms-image-resolver.js';
import { spriteDimsLookupFor } from '../../../src/core/sprite-registry.js';
import type { InlineAtomToken } from '../../../src/core/creole-atoms.js';

const SVG = '<svg width="8" height="8"><path d="M0 0L8 8"/></svg>';
const SPRITE_LINE = `sprite $a ${SVG}`;

function define(lines: readonly string[], at: number): SpriteRegistry {
  const registry = createSpriteRegistry();
  expect(matchSpriteCommand(lines, at, registry)).toEqual({ consumed: 1 });
  return registry;
}

function parserOf(registry: SpriteRegistry): SvgParserSelector | undefined {
  return getSpriteSvg(registry, 'a')?.parser;
}

describe('matchSpriteCommand stamps SpriteSvg.parser from the pragma in force', () => {
  it('selects sax for `!pragma svgparser SAX ` (value trimmed and lower-cased)', () => {
    const lines = ['!pragma svgparser SAX ', SPRITE_LINE];
    expect(parserOf(define(lines, 1))).toBe(SvgParserSelector.SAX);
  });

  it('matches the pragma line case-insensitively, as every upstream regex is (Pattern2.java:114)', () => {
    const lines = ['!PRAGMA SvgParser sax', SPRITE_LINE];
    expect(parserOf(define(lines, 1))).toBe(SvgParserSelector.SAX);
  });

  it('keeps a sprite defined BEFORE the pragma on nano', () => {
    const lines = [SPRITE_LINE, '!pragma svgparser sax'];
    expect(parserOf(define(lines, 0))).toBe(SvgParserSelector.NANO);
  });

  it('defaults to nano with no pragma at all', () => {
    expect(parserOf(define([SPRITE_LINE], 0))).toBe(SvgParserSelector.NANO);
  });

  it('keeps nano for a blank value', () => {
    const lines = ['!pragma svgparser', SPRITE_LINE];
    expect(parserOf(define(lines, 1))).toBe(SvgParserSelector.NANO);
  });

  it('keeps nano for any other value', () => {
    const lines = ['!pragma svgparser batik', SPRITE_LINE];
    expect(parserOf(define(lines, 1))).toBe(SvgParserSelector.NANO);
  });

  it('ignores pragmas for other keys', () => {
    const lines = ['!pragma teoz true', SPRITE_LINE];
    expect(parserOf(define(lines, 1))).toBe(SvgParserSelector.NANO);
  });

  it('the LAST pragma before the definition wins (Pragma#define overwrites)', () => {
    const lines = ['!pragma svgparser sax', '!pragma svgparser nano', SPRITE_LINE];
    expect(parserOf(define(lines, 2))).toBe(SvgParserSelector.NANO);
  });

  it('a later pragma does not reach back to an earlier sprite, only to later ones', () => {
    const registry = createSpriteRegistry();
    const lines = ['sprite $a ' + SVG, '!pragma svgparser sax', 'sprite $b ' + SVG];
    matchSpriteCommand(lines, 0, registry);
    matchSpriteCommand(lines, 2, registry);
    expect([getSpriteSvg(registry, 'a')?.parser, getSpriteSvg(registry, 'b')?.parser]).toEqual([
      SvgParserSelector.NANO,
      SvgParserSelector.SAX,
    ]);
  });

  it('selects sax for the multiline form (CommandSpriteSvgMultiline.java:103)', () => {
    const lines = ['!pragma svgparser sax', 'sprite $a <svg width="8" height="8">', '<path d="M0 0L8 8"/></svg>'];
    const registry = createSpriteRegistry();
    expect(matchSpriteCommand(lines, 1, registry)).toEqual({ consumed: 2 });
    expect(parserOf(registry)).toBe(SvgParserSelector.SAX);
  });
});

describe('an SVG sprite without dimensions', () => {
  it('is consumed but not registered, whatever the selector', () => {
    const registry = createSpriteRegistry();
    const lines = ['!pragma svgparser sax', 'sprite $a <svg><path d="M0 0L8 8"/></svg>'];
    expect(matchSpriteCommand(lines, 1, registry)).toEqual({ consumed: 1 });
    expect(getSpriteSvg(registry, 'a')).toBeUndefined();
    expect(registry.skippedColorSprites).toEqual(['a']);
  });
});

describe('SpriteSvg.parser', () => {
  it('defaults to nano and carries an explicit selector through from()', () => {
    expect(SpriteSvg.from(SVG)?.parser).toBe(SvgParserSelector.NANO);
    expect(SpriteSvg.from(SVG, SvgParserSelector.SAX)?.parser).toBe(SvgParserSelector.SAX);
  });
});

describe('resolveSvgSpriteAtom selects the draw parser by the sprite selector', () => {
  const atom = { kind: 'sprite', name: 'a', scale: 1 } as unknown as Extract<InlineAtomToken, { kind: 'sprite' }>;
  const font = { family: 'sans-serif', size: 13 } as never;

  afterEach(() => vi.restoreAllMocks());

  function resolveWith(parser?: SvgParserSelector): void {
    const registry = define(['sprite $a ' + SVG], 0);
    const args = [atom, SVG, spriteDimsLookupFor(registry), font, undefined] as const;
    if (parser === undefined) resolveSvgSpriteAtom(...args);
    else resolveSvgSpriteAtom(...args, parser);
  }

  it('draws through SvgSaxParser for sax', () => {
    const sax = vi.spyOn(SvgSaxParser.prototype, 'drawU');
    const nano = vi.spyOn(SvgNanoParser.prototype, 'drawU');
    resolveWith(SvgParserSelector.SAX);
    expect([sax.mock.calls.length, nano.mock.calls.length]).toEqual([1, 0]);
  });

  it('draws through SvgNanoParser for nano and when no selector is given', () => {
    const sax = vi.spyOn(SvgSaxParser.prototype, 'drawU');
    const nano = vi.spyOn(SvgNanoParser.prototype, 'drawU');
    resolveWith(SvgParserSelector.NANO);
    resolveWith();
    expect([sax.mock.calls.length, nano.mock.calls.length]).toEqual([0, 2]);
  });
});
