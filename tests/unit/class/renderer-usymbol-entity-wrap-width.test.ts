/**
 * renderer-usymbol-entity-wrap-width.test.ts — cdd7 T1c (xuloxo-85, leaf
 * half): the CLASS engine's USymbol leaf draw passes `style.wrapWidth()` to
 * the leaf's `desc` block (`EntityImageDescription.java:185-189`,
 * `BodyFactory.create3(..., style.wrapWidth(), ...)`; `skinparam wrapWidth`
 * registers `PName.MaximumWidth` on `SName.element`,
 * `FromSkinparamToStyle.java:250`). The sizer already wrapped
 * (`class-layout-generic-classifier.ts#buildDescriptionLeafOpts`), the draw
 * did not, so the drawn rect re-measured the unwrapped line.
 *
 * Expected values: oracle probe (`scripts/oracle-render.sh`, 1.2026.8beta1)
 * of the exact source below — rect 90.088 x 62, three left-aligned lines.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();

const SOURCE = [
  '@startuml',
  'allowmixing',
  'class A',
  'skinparam wrapWidth 80',
  'rectangle "Optional Description here" as R',
  '@enduml',
].join('\n');

function leafOf(svg: string): string {
  const start = svg.indexOf('<!--entity R-->');
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('USymbol leaf desc wraps at skinparam wrapWidth (EntityImageDescription.java:185-189)', () => {
  it('draws the jar rect and three wrapped lines', () => {
    const leaf = leafOf(renderSync(SOURCE, { measurer }));
    expect(leaf).toContain('<rect x="83.64" y="7" width="90.088" height="62"');
    const lines = [...leaf.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => [
      m[1],
      m[2],
      m[3],
    ]);
    expect(lines).toEqual([
      ['93.64', '27.889', 'Optional'],
      ['93.64', '41.889', 'Description'],
      ['93.64', '55.889', 'here'],
    ]);
  });
});
