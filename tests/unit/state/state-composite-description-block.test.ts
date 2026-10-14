/**
 * dsw-T1d: `ClusterHeader.java:78` attribute width via the real creole sheet
 * (`Display#create0`): Bullet header (`Bullet.java:72-76`, 12 for order 0).
 */
import { describe, it, expect } from 'vitest';
import {
  nestedRenderer,
  stateDescriptionBlockWidth,
  stateSkinSimple,
  stringBounderFor,
} from '../../../src/diagrams/state/state-composite-description-block.js';
import { CreoleParser } from '../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import { GUILLEMET_DEFAULT } from '../../../src/core/text/Guillemet.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';

const FONT = { family: 'sans-serif', size: 14 } as const;
const BULLET_ORDER0_WIDTH = 12;
const measurer = new DeterministicMeasurer();
const widthOf = (lines: string[]): number => stateDescriptionBlockWidth(lines, FONT, measurer, defaultTheme);
const rawWidth = (s: string): number => measurer.measure(s, FONT).width;

describe('stateDescriptionBlockWidth', () => {
  it('is 0 for no lines (Entity.java:616-617 TextBlockEmpty)', () => {
    expect(widthOf([])).toBe(0);
  });

  it('plain text equals its measured width', () => {
    expect(widthOf(['entry / go'])).toBeCloseTo(rawWidth('entry / go'), 3);
  });

  it('a "* item" line adds the 12-wide Bullet header to the item text', () => {
    expect(widthOf(['* a list'])).toBeCloseTo(BULLET_ORDER0_WIDTH + rawWidth('a list'), 3);
  });

  it('is the max across lines', () => {
    expect(widthOf(['x', '* a list'])).toBeCloseTo(BULLET_ORDER0_WIDTH + rawWidth('a list'), 3);
  });
});

const FC: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
/** `SkinParam.java:1073` / dpi default. */
const SKIN_TAB_SIZE = 8;
const SKIN_DPI = 96;

describe('stateSkinSimple (SkinParam defaults the creole pipeline reads)', () => {
  const skin = stateSkinSimple(FC, defaultTheme);

  it('carries the jar defaults', () => {
    expect(skin.getTabSize()).toBe(SKIN_TAB_SIZE);
    expect(skin.getDpi()).toBe(SKIN_DPI);
    expect(skin.getMonospacedFamily()).toBe(MONOSPACED);
    expect(skin.guillemet()).toEqual(GUILLEMET_DEFAULT);
    expect(skin.getPadding()).toBe(ClockwiseTopRightBottomLeft.none());
    expect(skin.transformStringForSizeHack('a b')).toBe('a b');
    expect(skin.getFromMd5('x')).toBeNull();
    expect(skin.getValue('k')).toBeNull();
    expect(skin.values().size).toBe(0);
    expect(skin.copyAllFrom(new Map([['k', 'v']]))).toBeUndefined();
    expect(skin.getPragma()).toBeInstanceOf(Pragma);
  });

  it('resolves no sprite without a registry, and an absent one with a registry', () => {
    expect(skin.getSprite('missing')).toBeNull();
    const withRegistry = stateSkinSimple(FC, { ...defaultTheme, sprites: createSpriteRegistry() });
    expect(withRegistry.getSprite('missing')).toBeNull();
  });

  it('builds a CreoleParser sheet builder with and without a stereotype font', () => {
    expect(skin.sheet(FC, HorizontalAlignment.LEFT, CreoleMode.FULL)).toBeInstanceOf(CreoleParser);
    expect(skin.sheet(FC, HorizontalAlignment.LEFT, CreoleMode.FULL, FC)).toBeInstanceOf(CreoleParser);
  });
});

describe('stringBounderFor / nestedRenderer', () => {
  const bounder = stringBounderFor(measurer, FONT);

  it('measures at the font configuration size', () => {
    const dim = bounder.calculateDimension({ ...FC, size: 20 }, 'abc');
    expect(dim.getWidth()).toBe(measurer.measure('abc', { ...FONT, size: 20 }).width);
    expect(dim.getHeight()).toBe(measurer.measure('abc', { ...FONT, size: 20 }).height);
  });

  it('answers the measurer descent at that size', () => {
    expect(bounder.getDescent?.(FC, 'abc')).toBe(measurer.getDescent(FONT, 'abc'));
  });

  it('throws a named error when no nested renderer is registered', () => {
    expect(() => nestedRenderer().render({} as never, {} as never)).toThrow(
      'state: no nested-diagram renderer is registered',
    );
  });
});
