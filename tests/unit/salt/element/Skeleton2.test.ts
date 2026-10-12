/**
 * `salt/element/Skeleton2.java` — the `|_` creole tree guides. Its only
 * upstream caller is `klimt/creole/atom/AtomTree.java:63,80`; the salt path
 * re-exports the existing klimt port. Expected events are read off the
 * jar oracle `test-results/dot-cache/class/foxiki-17-kosa114/in.svg`.
 *
 * Inputs: the six `|_` rows' levels, at a 14 px row pitch (the oracle's
 * bullets are 14 px apart), each `y` the cell mid-point; the drawing
 * `UGraphic` carries the (7, 63) offset at which that class body places
 * the tree (bullet `x = 8 * level + 8 - 1 + 7 = 22` for level 1).
 */
import { describe, expect, it } from 'vitest';
import { Skeleton2 } from '../../../../src/diagrams/salt/element/Skeleton2.js';
import { Skeleton2 as KlimtSkeleton2 } from '../../../../src/core/klimt/creole/atom/Skeleton2.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { RecordingUGraphic, line, rect } from './recording-ugraphic.js';

describe('Skeleton2 (salt path)', () => {
  it('is the klimt port, not a second copy', () => {
    expect(Skeleton2).toBe(KlimtSkeleton2);
  });

  it('getXEndForLevel is level * sizeX + sizeX, sizeX = 8 (java:49, 98-104)', () => {
    expect(new Skeleton2().getXEndForLevel(0)).toBe(8);
    expect(new Skeleton2().getXEndForLevel(2)).toBe(24);
  });

  it('draws the jar guides for foxiki-17-kosa114', () => {
    const skeleton = new Skeleton2();
    // prop, Bom(Model), prop2, prop3, prop3.1, prop4
    [1, 1, 2, 2, 3, 1].forEach((level, row) => skeleton.add(level, 7 + row * 14));
    const ug = new RecordingUGraphic();
    skeleton.draw(ug.apply(new UTranslate(7, 63)));
    expect(ug.events).toEqual([
      rect(22, 69, 2, 2),
      line(15, 70, 23, 70),
      line(15, 63, 15, 70),
      rect(22, 83, 2, 2),
      line(15, 84, 23, 84),
      line(15, 70, 15, 84),
      rect(30, 97, 2, 2),
      line(23, 98, 31, 98),
      line(23, 84, 23, 98),
      rect(30, 111, 2, 2),
      line(23, 112, 31, 112),
      line(23, 98, 23, 112),
      rect(38, 125, 2, 2),
      line(31, 126, 39, 126),
      line(31, 112, 31, 126),
      rect(22, 139, 2, 2),
      line(15, 140, 23, 140),
      line(15, 84, 15, 140),
    ]);
  });
});
