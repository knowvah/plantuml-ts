/**
 * sdd2-T7a: the right-hand self loop's circles and dressing1
 * (`ComponentRoseSelfArrow#drawRightSide`).
 *
 * Expected values cite the Java; the `o` case also matches the
 * `caluni-22-noci624` golden's `feature_3 ->o feature_3: commit` (origin
 * 296.781: circle cx 296.281 cy 284.25, strokes 272 / 285, returning stroke
 * from 303.281, polygon tip 313.281).
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseSelfArrow.java:91-174
 */

import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

const MEASURER = new DeterministicMeasurer();
const THIN_CIRCLE = 1.5;
const DIAM_CIRCLE = 8;
const LOOP_HEIGHT = 13;

interface Shape {
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string>>;
}

function loopOf(arrow: string): Shape[] {
  const svg = renderFixtureSequence(`@startuml\nparticipant A\nA ${arrow} A : x\n@enduml`, MEASURER, {
    includeStore: fixtureIncludeStore(),
  });
  const shapes: Shape[] = [];
  for (const m of svg.matchAll(/<(line|polygon|ellipse)\b([^>]*)>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!;
    shapes.push({ tag: m[1]!, attrs });
  }
  // Lifelines carry a dasharray in `style`; the message is drawn after them.
  return shapes.filter((s) => !(s.attrs['style'] ?? '').includes('stroke-dasharray'));
}

const n = (s: Shape | undefined, key: string): number => Number(s!.attrs[key]);
const ofTag = (shapes: Shape[], tag: string): Shape[] => shapes.filter((s) => s.tag === tag);
const tipOf = (s: Shape | undefined): number => Number(s!.attrs['points']!.split(',')[2]);

describe('right-hand self loop, `A ->o A`', () => {
  const shapes = loopOf('->o');
  const circle = ofTag(shapes, 'ellipse').at(-1);
  const lines = ofTag(shapes, 'line').slice(-3);
  const head = ofTag(shapes, 'polygon').at(-1);
  const origin = n(lines[0], 'x1');
  const yBottom = n(lines[0], 'y1') + LOOP_HEIGHT;

  it('draws the circle at x2 - thinCircle, textHeight + arrowHeight - thinCircle/2 (:106-112)', () => {
    expect(n(circle, 'cx')).toBeCloseTo(origin + 1 - THIN_CIRCLE, 3);
    expect(n(circle, 'cy')).toBeCloseTo(yBottom - THIN_CIRCLE / 2, 3);
    expect(n(circle, 'rx')).toBe(DIAM_CIRCLE / 2);
  });

  it('pushes the returning stroke and its head right by diamCircle / 2 + thinCircle (:106-108)', () => {
    const push = DIAM_CIRCLE / 2 + THIN_CIRCLE;
    expect(n(lines[2], 'x1')).toBeCloseTo(origin + 1 + push, 3);
    expect(tipOf(head)).toBeCloseTo(origin + 1 + push, 3);
  });
});

describe('right-hand self loop, `A o->o A`', () => {
  const shapes = loopOf('o->o');
  const circles = ofTag(shapes, 'ellipse').slice(-2);
  const lines = ofTag(shapes, 'line').slice(-3);

  it('draws both circles, the first at x1 + 1 - thinCircle (:94-99)', () => {
    expect(circles).toHaveLength(2);
    // x1 += diamCircle / 2 + thinCircle + 1, minus thinCircle + 1 for a NONE head (:99-100)
    expect(n(lines[0], 'x1')).toBeCloseTo(
      n(circles[0], 'cx') + THIN_CIRCLE - 1 + DIAM_CIRCLE / 2 + THIN_CIRCLE + 1 - (THIN_CIRCLE + 1),
      3,
    );
  });
});

describe('right-hand self loop, `A x->x A`', () => {
  it('draws the saltires square to the component origin, not to x1 (:114-120,131-135,152-157)', () => {
    const lines = ofTag(loopOf('x->x'), 'line').slice(-7);
    const [top, vline, bottom, cross1a, , cross2a] = lines;
    const origin = n(vline, 'x1') - 42;
    expect(n(top, 'x1')).toBeCloseTo(origin + 12, 3);
    expect(n(bottom, 'x1')).toBeCloseTo(origin + 1 + 12, 3);
    expect(n(cross1a, 'x1')).toBeCloseTo(origin + 6, 3);
    expect(n(cross2a, 'x1')).toBeCloseTo(origin + 6, 3);
  });
});
