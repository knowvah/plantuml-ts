/**
 * `sequence-y-gauge.ts`: the numeric `teoz/YGauge.java`. Every expected value
 * is the solved `Real` of the factory it tests -- `addAtLeast` settles at its
 * lower bound, `ensureBiggerThan` raises to the larger of the two.
 */
import { describe, it, expect } from 'vitest';

import {
  createGauge,
  createParallel,
  createPropagating,
  createWithContact,
  messageTileGauge,
  wrapGauge,
  type MessageTileGauge,
} from '../../../src/diagrams/sequence/sequence-y-gauge.js';
import type { AbstractMessageEvent } from '../../../src/diagrams/sequence/ast.js';

/** `PlayingSpace.java:89`: the chain starts at `YGauge.create(origin, 0)`. */
const START = createGauge(47, 0);

describe('YGauge.create (YGauge.java:69-74)', () => {
  it('spans height below min and carries no contact line', () => {
    expect(createGauge(10, 21)).toEqual({ min: 10, max: 31, contact: undefined, origin: undefined });
  });

  it('refuses a negative height (IllegalArgumentException, :70-71)', () => {
    expect(() => createGauge(0, -1)).toThrow(RangeError);
  });
});

describe('YGauge.createWithContact (YGauge.java:103-116)', () => {
  it('chains on the previous max: contact = origin + cr, min = origin, max = origin + height', () => {
    expect(createWithContact(START, { contactRelative: 21, height: 27 })).toEqual({
      min: 47,
      max: 74,
      contact: 68,
      origin: 47,
    });
  });

  it("is lowered by a later & member's ensureBiggerThan (createParallel:131)", () => {
    // A head with cr 21 shares its line with a member whose cr is 36: the line
    // settles at origin + 36 and the head's min floats 15 below the origin.
    const head = createWithContact(START, { contactRelative: 21, height: 27 }, [36, 10]);
    expect(head).toEqual({ min: 62, max: 89, contact: 83, origin: 47 });
  });

  it('refuses a negative extent (:104-105)', () => {
    expect(() => createWithContact(START, { contactRelative: -1, height: 27 })).toThrow(RangeError);
  });
});

describe('YGauge.createParallel (YGauge.java:124-145)', () => {
  const head = createWithContact(START, { contactRelative: 21, height: 27 }, [21]);

  it('aligns its contact point on the shared line and keeps the max of both', () => {
    // A shorter member: max = contact + (12 - 21) is above the head's, so the
    // head's max stands (`max.ensureBiggerThan(currentY.getMax())`, :143).
    expect(createParallel(head, { contactRelative: 21, height: 12 })).toEqual({
      min: 47,
      max: 74,
      contact: 68,
      origin: 47,
    });
    // A taller one pushes the group's max down.
    expect(createParallel(head, { contactRelative: 21, height: 40 })).toEqual({
      min: 47,
      max: 87,
      contact: 68,
      origin: 47,
    });
  });

  it('falls back to top alignment on a tile with no contact line (:127-129)', () => {
    const divider = createGauge(74, 30);
    expect(createParallel(divider, { contactRelative: 21, height: 27 })).toEqual(createGauge(74, 27));
  });

  it('refuses a member the head was not raised for', () => {
    const unraised = createWithContact(START, { contactRelative: 21, height: 27 });
    expect(() => createParallel(unraised, { contactRelative: 36, height: 40 })).toThrow(/not raised/);
  });
});

describe('YGauge.createPropagating (YGauge.java:151-157)', () => {
  it('chains below the max and hands the contact line and origin on', () => {
    const head = createWithContact(START, { contactRelative: 21, height: 27 });
    expect(createPropagating(head, 18)).toEqual({ min: 74, max: 92, contact: 68, origin: 47 });
  });

  it('refuses a negative height (:152-153)', () => {
    expect(() => createPropagating(START, -2)).toThrow(RangeError);
  });
});

describe('the note-on-message wrapper gauge (CommunicationTileNoteRight.java:96-98)', () => {
  it("keeps the wrapped tile's top and line, with its own preferred height", () => {
    const head = createWithContact(START, { contactRelative: 21, height: 27 });
    expect(wrapGauge(head, 33)).toEqual({ min: 47, max: 80, contact: 68, origin: 47 });
  });
});

describe('messageTileGauge', () => {
  const event = { label: 'm' } as AbstractMessageEvent;
  const gauge: MessageTileGauge = { top: 47, height: 27, contactY: 68 };

  it('reads the gauge the layout published for an event', () => {
    expect(messageTileGauge({ messageTileGauges: new Map([[event, gauge]]) }, event)).toEqual(gauge);
  });

  it('is undefined before any walk published one', () => {
    expect(messageTileGauge({}, event)).toBeUndefined();
  });
});
