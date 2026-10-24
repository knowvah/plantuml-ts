/**
 * `CommandSpriteSvg.java:81-82` applies to every diagram: a sprite defined
 * after `!pragma svgparser sax` draws through SvgSaxParser wherever it is
 * drawn. These cover the paths that read `SpriteDims`/`SpriteSvg` rather than
 * the chrome resolver: description/state stereotype sprite, leaf sizing, and
 * class member rows.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSpriteRegistry, matchSpriteCommand } from '../../../src/core/sprite-commands.js';
import { spriteDimsLookupFor } from '../../../src/core/sprite-registry.js';
import { SvgParserSelector } from '../../../src/core/klimt/sprite/sax/svg-sprite-parser-factory.js';
import { SvgNanoParser } from '../../../src/core/klimt/sprite/SvgNanoParser.js';
import { SvgSaxParser } from '../../../src/core/klimt/sprite/sax/SvgSaxParser.js';
import { buildStereo, resolveStereotypeSprite } from '../../../src/core/svek/image/EntityImageDescriptionDelegates.js';
import { sizingAtomImageResolverFor } from '../../../src/core/svek/image/leaf-sizing-entity.js';
import { resolveInlineAtom } from '../../../src/diagrams/class/class-member-atom-resolve.js';
import type { InlineAtomToken } from '../../../src/core/creole-atoms.js';
import { FakeUGraphic } from './klimt/sprite/sax/fake-ugraphic.js';

const SVG = '<svg width="8" height="8"><path d="M0 0L8 8"/></svg>';
const FONT = { family: 'sans-serif', size: 13, color: null, styles: new Set<never>() } as never;
const ATOM = { kind: 'sprite', name: 'a', scale: 1 } as unknown as Extract<InlineAtomToken, { kind: 'sprite' }>;

function registryWith(pragma: string | undefined) {
  const registry = createSpriteRegistry();
  const lines = pragma === undefined ? [`sprite $a ${SVG}`] : [pragma, `sprite $a ${SVG}`];
  matchSpriteCommand(lines, lines.length - 1, registry);
  return registry;
}

const SAX_PRAGMA = '!pragma svgparser sax';

function spies() {
  return {
    sax: vi.spyOn(SvgSaxParser.prototype, 'drawU').mockClear(),
    nano: vi.spyOn(SvgNanoParser.prototype, 'drawU').mockClear(),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('spriteDimsLookupFor carries the parser of an SVG sprite', () => {
  it('sax after the pragma, nano before it, none for a non-SVG sprite', () => {
    expect(spriteDimsLookupFor(registryWith(SAX_PRAGMA)).get('a')?.parser).toBe(SvgParserSelector.SAX);
    expect(spriteDimsLookupFor(registryWith(undefined)).get('a')?.parser).toBe(SvgParserSelector.NANO);
    const mono = createSpriteRegistry();
    matchSpriteCommand(['sprite $m [2x2/16] {', 'FF', 'FF', '}'], 0, mono);
    expect(spriteDimsLookupFor(mono).get('m')?.parser).toBeUndefined();
  });
});

describe('description/state stereotype sprite (EntityImageDescriptionDelegates)', () => {
  function drawStereo(pragma: string | undefined) {
    const dims = spriteDimsLookupFor(registryWith(pragma));
    const sprite = resolveStereotypeSprite({ name: 'a', scale: 1 }, dims);
    const s = spies();
    buildStereo([], FONT, undefined, sprite).drawU(new FakeUGraphic());
    return [s.sax.mock.calls.length, s.nano.mock.calls.length];
  }

  it('draws through SvgSaxParser when defined after the pragma', () => {
    expect(drawStereo(SAX_PRAGMA)).toEqual([1, 0]);
  });

  it('draws through SvgNanoParser by default', () => {
    expect(drawStereo(undefined)).toEqual([0, 1]);
  });
});

describe('leaf sizing (sizingAtomImageResolverFor)', () => {
  function size(pragma: string | undefined) {
    const dims = spriteDimsLookupFor(registryWith(pragma));
    const s = spies();
    sizingAtomImageResolverFor(dims)(FONT)(ATOM);
    return [s.sax.mock.calls.length, s.nano.mock.calls.length];
  }

  it('decomposes through the sprite parser', () => {
    expect(size(SAX_PRAGMA)).toEqual([1, 0]);
    expect(size(undefined)).toEqual([0, 1]);
  });
});

describe('class member rows (resolveInlineAtom)', () => {
  function row(pragma: string | undefined) {
    const registry = registryWith(pragma);
    const s = spies();
    const resolved = resolveInlineAtom(ATOM, FONT, registry, spriteDimsLookupFor(registry));
    return [resolved?.kind, s.sax.mock.calls.length, s.nano.mock.calls.length];
  }

  it('draws through the sprite parser', () => {
    expect(row(SAX_PRAGMA)).toEqual(['drawable', 1, 0]);
    expect(row(undefined)).toEqual(['drawable', 0, 1]);
  });
});
