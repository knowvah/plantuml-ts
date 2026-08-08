/**
 * F4-b — the emoji atom's line-height contract, split by line CONTEXT.
 *
 * `39*factor` is EMERGENT from `Sea#doAlign` + `Sea#getHeight`
 * (`Sea.java:73-88`), not a property of `AtomEmoji`: an emoji placed at
 * `y = -height + startingAltitude` spans `[-39f, -3f]`, and a zero-altitude
 * sibling (text/img/sprite) spans `[-S, 0]`. The stripe is `maxY - minY`, so
 * a SHARED line is `39*factor` tall and an emoji-ONLY line is `36*factor`.
 * Applying `39` unconditionally made `rectangle "<:rocket:>"` 1.75px too
 * tall at font 14 (`oracle/goldens/description/emoji-only-line-height-0`,
 * jar-generated: `41 x 41px`, not `41 x 42.75px`).
 *
 * Every expectation below is derived from the upstream expression, not from
 * the observed output.
 */
import { describe, expect, test } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { buildTextBlock } from '../../../src/core/svek/image/EntityImageDescriptionSupport.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import type { CreoleAtom } from '../../../src/core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { Sea, type AtomOps } from '../../../src/core/klimt/creole/Sea.js';
import {
  EMOJI_ALTITUDE_FACTOR,
  EMOJI_BOX_FACTOR,
  EMOJI_LINE_HEIGHT_FACTOR,
  emojiBoxDim,
  emojiFactor,
  emojiLineHeightFactor,
  emojiSquareDim,
  emojiStartingAltitude,
} from '../../../src/core/klimt/creole/atom/AtomEmoji.js';

/** `scale * size2D / MAGIC` at scale 1, font 14 — the fixture's own factor. */
const FACTOR = emojiFactor(1, 14);
const TEXT_HEIGHT = 14;

const BOUNDER = {
  calculateDimension: () => new XDimension2D(0, TEXT_HEIGHT),
} as unknown as StringBounder;

function emojiAtom(unicode: string): CreoleAtom {
  return { kind: 'emoji', unicode, factor: FACTOR, color: null } as CreoleAtom;
}

function textAtom(text: string): CreoleAtom {
  return {
    kind: 'text',
    text,
    font: { family: 'sans-serif', size: TEXT_HEIGHT, color: null, styles: new Set() },
  };
}

/** The SAME operations `EntityImageDescriptionDelegates.ts#descAtomOps`
 *  reports to `Sea` — emoji gets its own square dim + negative altitude,
 *  every other kind gets height-only + altitude 0. */
const OPS: AtomOps = {
  calculateDimension(atom) {
    if (atom.kind === 'emoji') {
      const d = emojiSquareDim(atom.factor);
      return new XDimension2D(d.width, d.height);
    }
    return new XDimension2D(10, TEXT_HEIGHT);
  },
  getStartingAltitude(atom) {
    return atom.kind === 'emoji' ? emojiStartingAltitude(atom.factor) : 0;
  },
  drawU() {
    /* not exercised — this suite measures only */
  },
};

function seaHeight(atoms: readonly CreoleAtom[]): number {
  const sea = new Sea(BOUNDER, OPS);
  for (const atom of atoms) sea.add(atom);
  sea.doAlign();
  return sea.getHeight();
}

describe('AtomEmoji constants track the upstream expressions', () => {
  test('the square box is 36*factor on both axes (calculateDimensionSlow)', () => {
    expect(emojiSquareDim(FACTOR)).toEqual({
      width: EMOJI_BOX_FACTOR * FACTOR,
      height: EMOJI_BOX_FACTOR * FACTOR,
    });
    // font 14 => factor 14/24 => 36 * 14/24 = 21px exactly.
    expect(emojiSquareDim(FACTOR).height).toBe(21);
  });

  test('the starting altitude is -3*factor (getStartingAltitude)', () => {
    expect(emojiStartingAltitude(FACTOR)).toBe(EMOJI_ALTITUDE_FACTOR * FACTOR);
    expect(emojiStartingAltitude(FACTOR)).toBeCloseTo(-1.75, 10);
  });

  test('emojiBoxDim keeps its pre-F4-b contract (36f wide, 39f tall)', () => {
    expect(emojiBoxDim(FACTOR)).toEqual({
      width: EMOJI_BOX_FACTOR * FACTOR,
      height: EMOJI_LINE_HEIGHT_FACTOR * FACTOR,
    });
    expect(emojiBoxDim(FACTOR).height).toBeCloseTo(22.75, 10);
  });
});

describe('emojiLineHeightFactor selects by line context', () => {
  test('a zero-altitude sibling on the line gives 39', () => {
    expect(emojiLineHeightFactor(true)).toBe(EMOJI_LINE_HEIGHT_FACTOR);
    expect(emojiLineHeightFactor(true) * FACTOR).toBeCloseTo(22.75, 10);
  });

  test('an emoji alone on its line gives 36', () => {
    expect(emojiLineHeightFactor(false)).toBe(EMOJI_BOX_FACTOR);
    expect(emojiLineHeightFactor(false) * FACTOR).toBe(21);
  });
});

describe('Sea derives both line heights from dim + altitude alone', () => {
  test('an emoji-only line is 36*factor = 21px', () => {
    expect(seaHeight([emojiAtom('1f680')])).toBe(EMOJI_BOX_FACTOR * FACTOR);
    expect(seaHeight([emojiAtom('1f680')])).toBe(21);
  });

  test('two emoji alone on a line stay 36*factor (not additive)', () => {
    expect(seaHeight([emojiAtom('1f680'), emojiAtom('1f680')])).toBe(21);
  });

  test('an emoji sharing a line with text is 39*factor = 22.75px', () => {
    const height = seaHeight([emojiAtom('1f680'), textAtom('qq')]);
    expect(height).toBe(EMOJI_LINE_HEIGHT_FACTOR * FACTOR);
    expect(height).toBeCloseTo(22.75, 10);
  });

  test('atom order does not change the shared-line height', () => {
    expect(seaHeight([textAtom('qq'), emojiAtom('1f680')])).toBeCloseTo(22.75, 10);
  });

  test('a text-only line is unaffected by the emoji altitude rule', () => {
    expect(seaHeight([textAtom('qq'), textAtom('zz')])).toBe(TEXT_HEIGHT);
  });

  test('Sea agrees with emojiLineHeightFactor in both directions', () => {
    expect(seaHeight([emojiAtom('1f680')])).toBe(emojiLineHeightFactor(false) * FACTOR);
    expect(seaHeight([emojiAtom('1f680'), textAtom('q')])).toBe(emojiLineHeightFactor(true) * FACTOR);
  });
});

/** `buildTextBlock` is the NAIVE substitute path (stereotype labels, notes)
 *  — no `Sea`, no altitudes — so it applies the same rule through
 *  `emojiLineHeightFactor` + its own `hasZeroAltitudeAtom` predicate. Both
 *  paths must agree or a `«<:rocket:>»` stereotype would size differently
 *  from the identical text in an entity's `desc`. */
describe('buildTextBlock (naive substitute) matches the Sea heights', () => {
  const BLOCK_FONT: FontConfiguration = {
    family: 'sans-serif',
    size: TEXT_HEIGHT,
    color: null,
    styles: new Set(),
  };
  const bounder = new MeasurerStringBounder(new WidthTableMeasurer());

  function blockHeight(text: string): number {
    return buildTextBlock(text, BLOCK_FONT, HorizontalAlignment.CENTER).calculateDimension(bounder).getHeight();
  }

  test('an emoji-only line measures 36*factor = 21px', () => {
    expect(blockHeight('<:rocket:>')).toBe(EMOJI_BOX_FACTOR * FACTOR);
    expect(blockHeight('<:rocket:>')).toBe(21);
  });

  test('an emoji sharing a line with text measures 39*factor = 22.75px', () => {
    expect(blockHeight('<:rocket:> qq')).toBeCloseTo(EMOJI_LINE_HEIGHT_FACTOR * FACTOR, 10);
    expect(blockHeight('<:rocket:> qq')).toBeCloseTo(22.75, 10);
  });

  test('per-line context, not per-block: only the bare line shrinks', () => {
    // 21 (emoji alone) + 22.75 (emoji + text) — NOT 2 x 22.75.
    expect(blockHeight('<:rocket:>\n<:rocket:> qq')).toBeCloseTo(21 + 22.75, 10);
  });

  test('a text-only block is unchanged by the rule', () => {
    expect(blockHeight('qq')).toBe(TEXT_HEIGHT);
  });
});
