/**
 * `ElementPyramidScrolled` (ElementPyramidScrolled.java:49-142) against the
 * 1.2026.8beta1 jar: `Message` over four `.` spacers in `{S` (both bars,
 * corpus `xaderu-42-jone467`), `{SI` (vertical only, `pusisi-42-reco966`)
 * and `{S-` (horizontal only, `cedeku-50-nopo940`), copied to
 * `fixtures/scrolled-*.jar.svg`. The bars draw at z-index 0 AND 1, so the
 * jar SVG holds each bar twice.
 */
import { describe, expect, it } from 'vitest';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { ElementPyramidScrolled } from '../../../../src/diagrams/salt/element/ElementPyramidScrolled.js';
import { ScrollStrategy } from '../../../../src/diagrams/salt/factory/ScrollStrategy.js';
import { stringBounder } from '../salt-test-support.js';
import {
  JAR_DIMENSIONS,
  dictionary,
  drawRoot,
  drawnElements,
  jarDrawnElements,
  positionner,
  textRows,
} from './container-test-support.js';
import { RecordingUGraphic, line, rect } from './recording-ugraphic.js';

const MESSAGE = [['Message'], ['.'], ['.'], ['.'], ['.']];

function scrolled(strategy: ScrollStrategy): ElementPyramidScrolled {
  return new ElementPyramidScrolled(positionner(textRows(MESSAGE)), dictionary, strategy);
}

const FIXTURES: [string, ScrollStrategy][] = [
  ['scrolled-both', ScrollStrategy.BOTH],
  ['scrolled-vertical', ScrollStrategy.VERTICAL_ONLY],
  ['scrolled-horizontal', ScrollStrategy.HORIZONTAL_ONLY],
];

describe('ElementPyramidScrolled#getPreferredDimension — jar probe (java:61-71)', () => {
  for (const [name, strategy] of FIXTURES) {
    it(`${name}: the pyramid's 50.675 x 70 plus 30 per bar`, () => {
      const jar = JAR_DIMENSIONS[name];
      const dim = scrolled(strategy).getPreferredDimension(stringBounder, 0, 0);
      expect(jar?.root).toBe('ElementPyramidScrolled');
      expect(dim.getWidth()).toBe(jar?.width);
      expect(dim.getHeight()).toBe(jar?.height);
    });
  }
});

describe('ElementPyramidScrolled#drawU — every drawn element equals the jar`s', () => {
  for (const [name, strategy] of FIXTURES) {
    it(name, () => {
      expect(drawnElements(drawRoot(scrolled(strategy)))).toEqual(jarDrawnElements(name));
    });
  }
});

describe('ElementPyramidScrolled#drawU — bar geometry at z-index 1, arrows aside (java:126-140)', () => {
  it('the vertical bar is 15 wide and the pyramid tall, with 12 px end caps', () => {
    const ug = new RecordingUGraphic();
    scrolled(ScrollStrategy.VERTICAL_ONLY).drawU(withoutPaths(ug), 1, new XDimension2D(80.675, 70));
    expect(ug.events).toEqual([rect(54.675, 0, 15, 70), line(54.675, 12, 69.675, 12), line(54.675, 58, 69.675, 58)]);
  });

  it('the horizontal bar is the pyramid wide and 15 tall, with 12 px end caps', () => {
    const ug = new RecordingUGraphic();
    scrolled(ScrollStrategy.HORIZONTAL_ONLY).drawU(withoutPaths(ug), 1, new XDimension2D(50.675, 100));
    expect(ug.events).toEqual([rect(0, 74, 50.675, 15), line(12, 74, 12, 89), line(38.675, 74, 38.675, 89)]);
  });
});

/** `ug` with `UPath` draws dropped (RecordingUGraphic rejects shapes it does
 *  not record) and measuring with the deterministic bounder (its own answers
 *  0 x 0, which would size the pyramid from empty text). */
function withoutPaths(ug: RecordingUGraphic): RecordingUGraphic {
  return new Proxy(ug, {
    get(target, prop, receiver) {
      if (prop === 'draw')
        return (shape: object) => {
          if (shape.constructor.name !== 'UPath') target.draw(shape);
        };
      if (prop === 'apply') return (change: never) => withoutPaths(target.apply(change) as RecordingUGraphic);
      if (prop === 'getStringBounder') return () => stringBounder;
      return Reflect.get(target, prop, receiver) as unknown;
    },
  });
}
