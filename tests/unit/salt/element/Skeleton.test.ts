/**
 * `salt/element/Skeleton.java` — the `{T` tree-guide lines `ElementTree#drawU`
 * draws (java:64-94). Expected events are read off jar oracles in
 * `test-results/dot-cache/salt/<slug>/in.svg` (1.2026.8beta1).
 *
 * Inputs are what `ElementTree.java:143` feeds `Skeleton#add`:
 * `x = entry.getXDelta() - 7` with `getXDelta() = level * 10`
 * (`ElementTreeEntry.java:86-88`) and `y = yvar + h / 2 - 1` with a 12 px
 * row height (the oracles' `<text>` rows are 12 px apart). The drawing
 * `UGraphic` carries the (6, 6) offset at which the jar places the tree
 * (the first cell's `<text x="16">` = 6 + `getXDelta()` for level 1).
 */
import { describe, expect, it } from 'vitest';
import { Skeleton } from '../../../../src/diagrams/salt/element/Skeleton.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { RecordingUGraphic, line, rect } from './recording-ugraphic.js';

const ROW_H = 12;
const TREE_ORIGIN = new UTranslate(6, 6);

function skeletonOf(levels: readonly number[]): Skeleton {
  const skeleton = new Skeleton();
  levels.forEach((level, row) => skeleton.add(level * 10 - 7, row * ROW_H + ROW_H / 2 - 1));
  return skeleton;
}

function drawn(skeleton: Skeleton): RecordingUGraphic {
  const ug = new RecordingUGraphic();
  skeleton.draw(ug.apply(TREE_ORIGIN), 0, 0);
  return ug;
}

describe('Skeleton.draw — gubexu-82-name357 ({T, 12 rows, 4 levels)', () => {
  it('draws every bullet and guide line the jar draws, in the jar order', () => {
    // World, America, Canada, USA, New York, Boston, Mexico, Europe, Italy, Germany, Berlin, Africa
    const ug = drawn(skeletonOf([1, 2, 3, 3, 4, 4, 3, 2, 3, 3, 4, 2]));
    expect(ug.events).toEqual([
      rect(9, 11, 2, 2),
      rect(19, 23, 2, 2),
      line(10, 14, 10, 24),
      line(10, 24, 18, 24),
      line(20, 26, 20, 36),
      line(20, 36, 28, 36),
      rect(29, 47, 2, 2),
      line(20, 26, 20, 48),
      line(20, 48, 28, 48),
      line(30, 50, 30, 60),
      line(30, 60, 38, 60),
      line(30, 50, 30, 72),
      line(30, 72, 38, 72),
      line(20, 26, 20, 84),
      line(20, 84, 28, 84),
      rect(19, 95, 2, 2),
      line(10, 14, 10, 96),
      line(10, 96, 18, 96),
      line(20, 98, 20, 108),
      line(20, 108, 28, 108),
      rect(29, 119, 2, 2),
      line(20, 98, 20, 120),
      line(20, 120, 28, 120),
      line(30, 122, 30, 132),
      line(30, 132, 38, 132),
      line(10, 14, 10, 144),
      line(10, 144, 18, 144),
    ]);
  });
});

describe('Skeleton.draw — nakuvu-18-nive718 first table ({T!, 3 rows)', () => {
  it('a level-1 sibling draws no bullet; only the parent of a deeper row does', () => {
    // Region, World, America
    const ug = drawn(skeletonOf([1, 1, 2]));
    expect(ug.events).toEqual([rect(9, 23, 2, 2), line(10, 26, 10, 36), line(10, 36, 18, 36)]);
  });
});

describe('Skeleton.draw — edge cases', () => {
  it('draws nothing for no entries', () => {
    expect(drawn(new Skeleton()).events).toEqual([]);
  });

  it('ignores its x/y arguments (java:68 never reads them)', () => {
    const a = new RecordingUGraphic();
    const b = new RecordingUGraphic();
    skeletonOf([1, 2]).draw(a, 0, 0);
    skeletonOf([1, 2]).draw(b, 100, 200);
    expect(b.events).toEqual(a.events);
  });

  it('a later shallower entry is never a parent of an earlier one', () => {
    // Only entries BEFORE i are scanned (java:75): level 2 then level 1 draws nothing.
    expect(drawn(skeletonOf([2, 1])).events).toEqual([]);
  });
});
