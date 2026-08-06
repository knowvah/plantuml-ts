import { describe, expect, it } from 'vitest';

import { CucaNote } from '../../../../src/core/abel/CucaNote.js';
import { Position } from '../../../../src/core/abel/Position.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { NoteLinkStrategy } from '../../../../src/core/abel/NoteLinkStrategy.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { DisplayPositioned } from '../../../../src/core/abel/DisplayPositioned.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../../../src/core/klimt/geom/VerticalAlignment.js';

/** Behavior tests from abel/CucaNote.java:43-78. */
describe('CucaNote', () => {
  const display = Display.create('a note');
  const colors = Colors.empty();

  it('build carries display/position/colors with NORMAL strategy', () => {
    const note = CucaNote.build(display, Position.TOP, colors);
    expect(note.getDisplay()).toBe(display);
    expect(note.getPosition()).toBe(Position.TOP);
    expect(note.getColors()).toBe(colors);
    expect(note.getStrategy()).toBe(NoteLinkStrategy.NORMAL);
  });

  it('withStrategy returns a copy with the new strategy, same rest', () => {
    const note = CucaNote.build(display, Position.BOTTOM, colors);
    const half = note.withStrategy(NoteLinkStrategy.HALF_NOT_PRINTED);
    expect(half).not.toBe(note);
    expect(half.getStrategy()).toBe(NoteLinkStrategy.HALF_NOT_PRINTED);
    expect(half.getDisplay()).toBe(display);
    expect(half.getPosition()).toBe(Position.BOTTOM);
    expect(note.getStrategy()).toBe(NoteLinkStrategy.NORMAL);
  });
});

/** Behavior tests from abel/DisplayPositioned.java:51-118. */
describe('DisplayPositioned', () => {
  const d = Display.create('title');

  it('single (3-arg) carries display and alignments, no location', () => {
    const dp = DisplayPositioned.single(d, HorizontalAlignment.CENTER, VerticalAlignment.TOP);
    expect(dp.getDisplay()).toBe(d);
    expect(dp.getHorizontalAlignment()).toBe(HorizontalAlignment.CENTER);
    expect(dp.getVerticalAlignment()).toBe(VerticalAlignment.TOP);
    expect(dp.getLineLocation()).toBeUndefined();
    expect(dp.isNull()).toBe(false);
  });

  it('single (4-arg) carries the location', () => {
    const location = { getPosition: () => 3, getDescription: () => 'string', getParent: () => undefined };
    const dp = DisplayPositioned.single(location, d, HorizontalAlignment.LEFT, VerticalAlignment.BOTTOM);
    expect(dp.getLineLocation()).toBe(location);
    expect(dp.getDisplay()).toBe(d);
  });

  it('none() is the NULL display and isNull', () => {
    const dp = DisplayPositioned.none(HorizontalAlignment.CENTER, VerticalAlignment.TOP);
    expect(dp.isNull()).toBe(true);
  });

  it('withDisplay / withHorizontalAlignment / withLocation copy-on-write', () => {
    const dp = DisplayPositioned.single(d, HorizontalAlignment.CENTER, VerticalAlignment.TOP);
    const d2 = Display.create('other');
    expect(dp.withDisplay(d2).getDisplay()).toBe(d2);
    expect(dp.withHorizontalAlignment(HorizontalAlignment.RIGHT).getHorizontalAlignment()).toBe(
      HorizontalAlignment.RIGHT,
    );
    const location = { getPosition: () => 1, getDescription: () => 'string', getParent: () => undefined };
    expect(dp.withLocation(location).getLineLocation()).toBe(location);
    // original untouched
    expect(dp.getDisplay()).toBe(d);
    expect(dp.getHorizontalAlignment()).toBe(HorizontalAlignment.CENTER);
  });

  it('createRibbon is deferred (throws)', () => {
    const dp = DisplayPositioned.single(d, HorizontalAlignment.CENTER, VerticalAlignment.TOP);
    expect(() => dp.createRibbon(undefined, undefined, undefined)).toThrow('deferred per SI1/ADR-2');
  });
});
