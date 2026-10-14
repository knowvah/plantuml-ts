import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../../../src/core/BlockUmlBuilder.js';
import { HColorAutomagic } from '../../../../../src/core/klimt/color/HColorAutomagic.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { PSystemColors } from '../../../../../src/diagrams/eggs/PSystemColors.js';
import { colorsPlugin } from '../../../../../src/diagrams/eggs/PSystemColorsFactory.js';
import { compareSvg } from '../../../../oracle/svg-conformance/compare.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');
/** Jar probe (1.2026.8beta1, scripts/oracle-render.sh): `colors automatic`. */
const JAR_FULL_GRID = { width: 1401, height: 589, rects: 154 };

const set = HColorSet.instance();

describe('HColorAutomagic (HColorAutomagic.java:38-41)', () => {
  it('getAppropriateColor(back) is back.opposite(): white on dark, black on light', () => {
    const automagic = new HColorAutomagic();
    expect(automagic.getAppropriateColor(HColors.BLACK).asString()).toBe('#FFFFFF');
    expect(automagic.getAppropriateColor(HColors.WHITE).asString()).toBe('#000000');
  });

  it('a non-simple back has no opposite: UnsupportedOperationException (HColor.java:129-131)', () => {
    const gradient = set.getColorOrWhite('red-blue');
    expect(() => new HColorAutomagic().getAppropriateColor(gradient)).toThrow('UnsupportedOperationException');
    expect(() => new HColorAutomagic().getAppropriateColor(new HColorAutomagic())).toThrow(
      'UnsupportedOperationException',
    );
  });

  it('inherits HColor#asString, withDark and opposite', () => {
    const automagic = new HColorAutomagic();
    expect(automagic.asString()).toBe('?HColorAutomagic');
    expect(() => automagic.withDark(HColors.BLACK)).toThrow('UnsupportedOperationException');
    expect(() => automagic.opposite()).toThrow('UnsupportedOperationException');
  });
});

describe('HColorSet "automatic" (HColorSet.java:85-86)', () => {
  it.each(['automatic', 'AUTOMATIC', '#Automatic'])('%s parses to an HColorAutomagic, not an HColorSimple', (token) => {
    for (const parsed of [set.getColorOrWhite(token), set.getColorOrNull(token), set.getColor(token)]) {
      expect(parsed).toBeInstanceOf(HColorAutomagic);
      expect(parsed).not.toBeInstanceOf(HColorSimple);
    }
  });

  it('every call returns a fresh instance, as `new HColorAutomagic()`', () => {
    expect(set.getColor('automatic')).not.toBe(set.getColor('automatic'));
  });
});

describe('colors automatic: the full grid (PSystemColors.java:99,122)', () => {
  const puml = readFileSync(join(FIXTURES, 'colors-automatic.puml'), 'utf8');
  const jar = readFileSync(join(FIXTURES, 'colors-automatic.jar.svg'), 'utf8');

  function render(): string {
    const block = buildBlockUmls(puml)[0];
    if (block?.ok !== true) throw new Error('no block');
    const parsed = colorsPlugin.parse({ ...block.source, seedSourceLines: block.seedSource });
    if (!(parsed instanceof PSystemColors)) throw new Error('refused');
    return parsed.exportDiagram(0, new DeterministicMeasurer());
  }

  it('has zero compareSvg diffs against the jar and is 1401x589 with 154 rects', () => {
    const svg = render();
    expect(compareSvg(svg, jar, 'deterministic').diffs).toEqual([]);
    expect(svg).toContain(`width="${String(JAR_FULL_GRID.width)}px" height="${String(JAR_FULL_GRID.height)}px"`);
    expect(svg.match(/<rect/g)?.length).toBe(JAR_FULL_GRID.rects);
  });

  it('renders identically three times', () => {
    const first = render();
    expect(render()).toBe(first);
    expect(render()).toBe(first);
  });
});
