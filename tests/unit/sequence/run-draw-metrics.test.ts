/**
 * `DriverTextSvg#draw` trims then measures (`DriverTextSvg.java:113-126`):
 * `textLength` is the TRIMMED text's width, each leading space moves `x`, and
 * the layout advance stays the untrimmed width. Pinned two ways: the helper
 * on its own, and the whole render against a jar render of the same source
 * (`tests/fixtures/isw-T2-seq/message-label-creole.svg`, produced by
 * `scripts/oracle-render.sh`, oracle seam #4: one space = 3.575@13).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { drawnLeftX, drawnWidth, runDrawMetrics } from '../../../src/diagrams/sequence/run-draw-metrics.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2-seq/message-label-creole');
const SPEC = { family: 'sans-serif', size: 13 };
const SPACE = 3.575;
const measurer = new DeterministicMeasurer();
const widthOf = (t: string): number => measurer.measure(t, SPEC).width;

describe('runDrawMetrics', () => {
  it('is empty when the draw would not change the text', () => {
    expect(runDrawMetrics('label', SPEC, measurer)).toEqual({});
  });

  it('measures a trailing-space run trimmed, with no x shift', () => {
    expect(runDrawMetrics('a ', SPEC, measurer)).toEqual({ drawWidth: widthOf('a'), drawDx: 0 });
  });

  it('moves x one space per leading space and measures the rest', () => {
    const m = runDrawMetrics('  ab', SPEC, measurer);
    expect(m.drawDx).toBeCloseTo(2 * SPACE, 3);
    expect(m.drawWidth).toBe(widthOf('ab'));
  });

  it('measures a whitespace-only run as NBSP, as DriverTextSvg does', () => {
    expect(runDrawMetrics('  ', SPEC, measurer)).toEqual({ drawWidth: widthOf('  '), drawDx: 0 });
  });

  it('falls back to the layout values when a run carries no draw metrics', () => {
    expect(drawnLeftX({ x: 5 })).toBe(5);
    expect(drawnWidth({ textWidth: 9 })).toBe(9);
    expect(drawnLeftX({ x: 5, drawDx: 2 })).toBe(7);
    expect(drawnWidth({ textWidth: 9, drawWidth: 4 })).toBe(4);
  });
});

describe('message label runs against the jar', () => {
  const texts = (svg: string): string[] =>
    [...svg.matchAll(/<text x="([\d.]+)"[^>]*?(?: textLength="([\d.]+)")?[^>]*>([^<]*)<\/text>/g)]
      .filter((m) => m[1] !== '17')
      .map((m) => `${m[3]}@${m[1]}`);

  it('places every label run where the jar does', () => {
    const ours = renderFixtureSequence(readFileSync(`${FIXTURE}.puml`, 'utf8'), measurer);
    const jar = readFileSync(`${FIXTURE}.svg`, 'utf8');
    expect(texts(jar).length).toBeGreaterThan(8);
    expect(texts(ours).slice(-9)).toEqual(texts(jar).slice(-9));
  });
});
