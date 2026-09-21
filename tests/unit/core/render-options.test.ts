/**
 * `getDefaultMeasurer` / `resolveMeasurer` — code-review item 4: the default
 * measurer must be a lazily-created, module-level singleton so its
 * `CanvasMeasurer` cache (8192 entries, keyed by `${font}|${text}`) survives
 * across renders instead of starting empty on every call.
 */
import { describe, it, expect } from 'vitest';
import { getDefaultMeasurer, resolveMeasurer } from '../../../src/core/render-options.js';
import { jarMeasurer } from '../../../src/core/measurer-jar.js';
import { CanvasMeasurer, FixedMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';

/** Minimal `measureText` stub with real (non-zero) widths -- jsdom's own
 *  canvas returns 0, which routes `CanvasMeasurer` to its fallback path and
 *  would make a cache-hit assertion pass or fail for the wrong reason. */
function fakeCanvasContext(): CanvasRenderingContext2D {
  return {
    font: '',
    measureText: (text: string) => ({ width: text.length * 6 }) as TextMetrics,
  } as unknown as CanvasRenderingContext2D;
}

describe('getDefaultMeasurer', () => {
  it('returns the same instance on every call', () => {
    const first = getDefaultMeasurer();
    const second = getDefaultMeasurer();
    const third = getDefaultMeasurer();
    expect(second).toBe(first);
    expect(third).toBe(first);
  });
});

describe("CanvasMeasurer's cache (what sharing the singleton preserves)", () => {
  it('returns the identical cached record for a repeated text+font pair', () => {
    const measurer = new CanvasMeasurer(fakeCanvasContext);
    const font: FontSpec = { family: 'sans-serif', size: 14 };
    const first = measurer.measure('cr-core item 4 probe', font);
    const second = measurer.measure('cr-core item 4 probe', font);
    expect(first).toEqual({ width: 120, height: 14 });
    // Object identity, not just equal values: a cache hit returns the SAME
    // stored record rather than recomputing it -- this is the property that
    // a fresh CanvasMeasurer per render (the pre-fix behavior) destroyed.
    expect(second).toBe(first);
  });
});

describe('resolveMeasurer', () => {
  it('an explicit options.measurer always wins, even for description', () => {
    const custom: StringMeasurer = new FixedMeasurer(7, 9);
    expect(resolveMeasurer('description', { measurer: custom })).toBe(custom);
    expect(resolveMeasurer('sequence', { measurer: custom })).toBe(custom);
  });

  it('description falls back to the jar-faithful measurer, not the default', () => {
    expect(resolveMeasurer('description')).toBe(jarMeasurer);
  });

  it('every other diagram type falls back to the shared default measurer', () => {
    expect(resolveMeasurer('sequence')).toBe(getDefaultMeasurer());
    expect(resolveMeasurer('class')).toBe(getDefaultMeasurer());
  });
});
