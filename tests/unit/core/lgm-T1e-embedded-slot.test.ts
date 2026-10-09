/**
 * lgm-T1e: a `{{ }}` embed reserves the nested document's own size.
 * `EmbeddedDiagram#calculateDimensionSlow` takes its SVG arm
 * (`EmbeddedDiagram.java:129-133`: `UImageSvg` width/height) because the
 * oracle bounder reports `matchesProperty("SVG")` (oracle seam #3), so the
 * slot is what `drawU` draws (java:169-174), not the (42, 42) catch
 * (java:148-152). Each fixture sits beside its jar render
 * (`scripts/oracle-render.sh`, one JVM per `{{ }}` fixture).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/lgm-T1e');
const NAMES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length));

const IMAGE_TAG = /<image[^>]*>/g;
const HREF = /\s*xlink:href="[^"]*"/;
const CANVAS = /width="(\d+)px" height="(\d+)px"/;

const images = (svg: string): string[] => (svg.match(IMAGE_TAG) ?? []).map((tag) => tag.replace(HREF, ''));
const canvas = (svg: string): string => (CANVAS.exec(svg) ?? []).slice(1, 3).join('x');

describe('lgm-T1e -- embedded {{ }} slot equals the jar', () => {
  it('covers every engine path', () => {
    expect(NAMES).toEqual([
      'activity-action',
      'class-body-one',
      'class-body-two',
      'class-note',
      'desc-frame-degenerate',
      'desc-rectangle-link',
    ]);
  });

  it.each(NAMES)('%s: canvas and every <image> box equal the jar, no stack traces', (name) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ours = renderSync(readFileSync(join(DIR, `${name}.puml`), 'utf8'), { measurer: new DeterministicMeasurer() });
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const logged = errors.mock.calls.length;
    errors.mockRestore();
    expect(images(jar).length).toBeGreaterThan(0);
    expect(images(ours)).toEqual(images(jar));
    expect(canvas(ours)).toBe(canvas(jar));
    expect(logged).toBe(0);
  });
});
