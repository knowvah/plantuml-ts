/**
 * sdd2 T5f (R1): the `ref` box width is the creole text block's width
 * (`ComponentRoseReference.java:156-158` -> `AbstractTextualComponent.java:
 * 100-108` `getPureTextWidth = textBlock.calculateDimension(...).getWidth()`),
 * so a `[[url{tooltip}]]` counts its rendered label, not its markup.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { refComponentWidth } from '../../../src/diagrams/sequence/ref-body-geo.js';
import { DEFAULT_REF_PAINTS } from './frame-paint-fixtures.js';

const measurer = new DeterministicMeasurer();
const PAINTS = { paint: DEFAULT_REF_PAINTS.paint, headerPaint: DEFAULT_REF_PAINTS.headerPaint };

describe('refComponentWidth', () => {
  it('measures a url with a tooltip as its rendered label', () => {
    const markup = refComponentWidth(['[[http://example.com/a/very/long/path{tip text} label]]'], PAINTS, measurer);
    const plain = refComponentWidth(['label'], PAINTS, measurer);
    expect(markup).toBe(plain);
  });

  it('keeps plain text unchanged and widens with it', () => {
    const narrow = refComponentWidth(['a'], PAINTS, measurer);
    const wide = refComponentWidth(['a much wider body line of plain text here'], PAINTS, measurer);
    expect(wide).toBeGreaterThan(narrow);
  });
});
