/**
 * unwind2-S8: the error pages' raster decorations, against the jar.
 *
 * Every `tests/fixtures/unwind2-S8/{error,welcome}-*.puml` has its jar render
 * beside it (`scripts/oracle-render.sh`, deterministic text). Upstream:
 *  - the Welcome block carries the PlantUML logo (`GraphicStrings#drawU`), on
 *    top of an error page from a source under 5 lines
 *    (`PSystemError.java:218-219`) and alone for a two-line `@startuml`
 *    (`PSystemWelcomeFactory.java:52-53`);
 *  - a source naming "arecibo" gets the Arecibo image beside the page
 *    (`PSystemError.java:230-231`, `:303-307`).
 *
 * Pins are the `compareSvg` diff counts. Every error page carries the 5
 * diffs the user's ruling keeps (DIVERGENCES.md "Error pages print this
 * port's version, and the source name is `string`": banner text and length,
 * `[From …]` text and length, the band behind it). Beyond that:
 *  - `+2` on `error-short`/`error-long`/`error-arecibo*`: the "Syntax Error?"
 *    page names `class` where the jar names `sequence` -- refusal routing,
 *    not this task's;
 *  - `+2` more on `error-long` and `+3` on `error-arecibo`: the page's width
 *    (and the Arecibo image's x) follow the shorter version banner.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S8');

const PINS: Readonly<Record<string, number>> = {
  'error-arecibo-short': 7,
  'error-arecibo': 10,
  'error-long': 9,
  'error-preprocessor-short': 5,
  'error-short': 7,
  'welcome-empty-uml': 0,
};

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml') && !f.startsWith('skin-'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

function jarOf(name: string): string {
  return readFileSync(join(DIR, `${name}.svg`), 'utf8');
}

function oursOf(name: string): string {
  return renderSync(readFileSync(join(DIR, `${name}.puml`), 'utf8'), { measurer: new DeterministicMeasurer() });
}

const RE_IMAGE = /<image [^>]*\/>/gu;

describe('unwind2-S8 — error-page decorations match the jar', () => {
  it('has a pin per fixture', () => {
    expect(CASES).toEqual(Object.keys(PINS).sort());
  });

  it.each(CASES)('%s', (name) => {
    expect(compareSvg(oursOf(name), jarOf(name), 'deterministic').diffs.length).toBe(PINS[name]);
  });

  it.each(['error-short', 'error-preprocessor-short', 'welcome-empty-uml'])(
    '%s: the logo is the jar image, at the jar position, byte for byte',
    (name) => {
      expect(oursOf(name).match(RE_IMAGE)).toEqual(jarOf(name).match(RE_IMAGE));
    },
  );

  it('error-arecibo: the Arecibo image is the jar bytes, beside the page', () => {
    const [ours] = oursOf('error-arecibo').match(RE_IMAGE)!;
    const [jar] = jarOf('error-arecibo').match(RE_IMAGE)!;
    const href = /xlink:href="([^"]*)"/u;
    expect(href.exec(ours)![1]).toBe(href.exec(jar)![1]);
    expect(ours).toContain('width="69" height="219"');
  });
});
