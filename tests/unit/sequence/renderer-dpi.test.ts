/**
 * `skinparam dpi 300` acceptance pin for the sequence engine (cdd-T30) —
 * proves the SAME `dpi/96` post-clamp multiplier `scale-command.ts
 * #resolveScaleFactor` applies to class also applies, identically, to
 * sequence — the same widened function, the same `theme.dpi` read, at
 * `sequence/renderer.ts#renderPaginated`'s EXISTING `resolveScaleFactor`
 * call site (no second scale-resolution path).
 *
 * Unit-level (no jar oracle): a fixture authored for this task
 * (`tests/fixtures/sequence/dpi.puml`, no oracle capture exists for it —
 * authoring a NEW oracle-backed corpus fixture would require rebuilding
 * the oracle cache, D12, out of bounds for this task) rendered twice
 * through the SAME production `renderSync` pipeline: once as-is (`dpi
 * 300`) and once with the `skinparam dpi 300` line stripped (the unscaled
 * baseline, `dpi` defaults to 96). Every numeric this task's mechanism
 * touches must be EXACTLY 300/96 = 3.125x the unscaled baseline's.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderFixture } from '../../helpers/render.js';

const FIXTURE_PATH = join(import.meta.dirname, '../../fixtures/sequence/dpi.puml');
const DPI_FACTOR = 300 / 96;

function readFixtureSource(): string {
  return readFileSync(FIXTURE_PATH, 'utf8');
}

function withoutDpiLine(source: string): string {
  const stripped = source.replace(/^skinparam dpi 300\n/m, '');
  expect(stripped).not.toContain('skinparam dpi');
  return stripped;
}

function firstNumericAttr(svg: string, attr: string): number {
  const match = new RegExp(`\\s${attr}="(-?[0-9.]+)`).exec(svg);
  expect(match, `no ${attr} attribute found in rendered svg`).not.toBeNull();
  return Number(match![1]);
}

describe('sequence renderer — skinparam dpi 300 (cdd-T30, tests/fixtures/sequence/dpi.puml)', () => {
  const source = readFixtureSource();
  const scaled = renderFixture(source);
  const unscaled = renderFixture(withoutDpiLine(source));

  it('the fixture really does declare `skinparam dpi 300` and nothing else scale-related', () => {
    expect(source).toContain('skinparam dpi 300');
    expect(source).not.toMatch(/^scale\s/m);
  });

  it('root document width/height are exactly 3.125x the unscaled render (Math.trunc — TextBlockExporter#calculateFinalDimension)', () => {
    const scaledWidth = firstNumericAttr(scaled, 'width');
    const scaledHeight = firstNumericAttr(scaled, 'height');
    const unscaledWidth = firstNumericAttr(unscaled, 'width');
    const unscaledHeight = firstNumericAttr(unscaled, 'height');
    // `Math.trunc`'d at emission (SvgGraphicsCore#finalizeRootAttributes),
    // so the ratio is close to, not exactly, 3.125 — within one truncated
    // pixel at this scale.
    expect(scaledWidth / unscaledWidth).toBeCloseTo(DPI_FACTOR, 1);
    expect(scaledHeight / unscaledHeight).toBeCloseTo(DPI_FACTOR, 1);
  });

  it('the first participant box font-size is exactly 3.125x the unscaled render', () => {
    const scaledFontSize = firstNumericAttr(scaled, 'font-size');
    const unscaledFontSize = firstNumericAttr(unscaled, 'font-size');
    expect(scaledFontSize).toBeCloseTo(unscaledFontSize * DPI_FACTOR, 3);
  });

  it('the first lifeline x-coordinate is exactly 3.125x the unscaled render', () => {
    const scaledX1 = firstNumericAttr(scaled, 'x1');
    const unscaledX1 = firstNumericAttr(unscaled, 'x1');
    expect(scaledX1).toBeCloseTo(unscaledX1 * DPI_FACTOR, 1);
  });
});
