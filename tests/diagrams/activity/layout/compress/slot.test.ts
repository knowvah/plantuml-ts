import { describe, expect, it } from 'vitest';

import { compareSlotByStart, Slot, SlotSet } from '../../../../../src/diagrams/activity/layout/compress/slot.js';

describe('Slot', () => {
  it('throws when start >= end, matching Slot.java:44-50 message text', () => {
    expect(() => new Slot(10, 10)).toThrow('IllegalArgumentException: start=10 end=10');
    expect(() => new Slot(10, 5)).toThrow('IllegalArgumentException: start=10 end=5');
  });

  it('exposes start/end and their Java-name aliases', () => {
    const slot = new Slot(3, 8);
    expect(slot.start).toBe(3);
    expect(slot.end).toBe(8);
    expect(slot.getStart()).toBe(3);
    expect(slot.getEnd()).toBe(8);
  });

  it('computes size as end - start', () => {
    expect(new Slot(3, 8).size()).toBe(5);
  });

  it('contains is inclusive at both ends', () => {
    const slot = new Slot(0, 10);
    expect(slot.contains(0)).toBe(true);
    expect(slot.contains(10)).toBe(true);
    expect(slot.contains(5)).toBe(true);
    expect(slot.contains(-0.001)).toBe(false);
    expect(slot.contains(10.001)).toBe(false);
  });

  it('intersects(Slot) is true when either endpoint falls inside the other', () => {
    const a = new Slot(0, 10);
    expect(a.intersects(new Slot(5, 20))).toBe(true);
    expect(a.intersects(new Slot(-5, 5))).toBe(true);
    expect(a.intersects(new Slot(2, 8))).toBe(true);
    expect(a.intersects(new Slot(-5, 20))).toBe(true);
    expect(a.intersects(new Slot(20, 30))).toBe(false);
  });

  it('intersect(Slot) overload matches intersects(Slot)', () => {
    const a = new Slot(0, 10);
    const b = new Slot(5, 20);
    expect(a.intersect(b)).toBe(true);
    expect(a.intersect(new Slot(20, 30))).toBe(false);
  });

  it('merge takes the min start and max end', () => {
    const merged = new Slot(0, 10).merge(new Slot(5, 20));
    expect(merged.start).toBe(0);
    expect(merged.end).toBe(20);
  });

  it('intersect(start, end) clips to the overlap', () => {
    const slot = new Slot(0, 10);
    const clipped = slot.intersect(5, 20);
    expect(clipped).toBeInstanceOf(Slot);
    expect(clipped?.start).toBe(5);
    expect(clipped?.end).toBe(10);
  });

  it('intersect(start, end) returns undefined when disjoint', () => {
    const slot = new Slot(0, 10);
    expect(slot.intersect(10, 20)).toBeUndefined();
    expect(slot.intersect(-20, 0)).toBeUndefined();
  });

  it('compareSlotByStart orders ascending by start, ties resolve to 0', () => {
    expect(compareSlotByStart(new Slot(0, 5), new Slot(10, 20))).toBe(-1);
    expect(compareSlotByStart(new Slot(10, 20), new Slot(0, 5))).toBe(1);
    expect(compareSlotByStart(new Slot(0, 5), new Slot(0, 20))).toBe(0);
  });
});

describe('SlotSet', () => {
  it('addSlot merges an overlapping slot into a single slot', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    set.addSlot(5, 20);
    const slots = set.slots();
    expect(slots).toHaveLength(1);
    expect(slots[0]?.start).toBe(0);
    expect(slots[0]?.end).toBe(20);
  });

  it('addSlot keeps disjoint slots separate', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    set.addSlot(30, 40);
    expect(set.slots()).toHaveLength(2);
  });

  it('getSlots is a Java-name alias for slots', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    expect(set.getSlots()).toEqual(set.slots());
  });

  it('reverse of sorted (0,10),(30,40) yields the (10,30) gap', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    set.addSlot(30, 40);
    const gaps = set.reverse().slots();
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.start).toBe(10);
    expect(gaps[0]?.end).toBe(30);
  });

  it('reverse sorts unordered input before taking gaps', () => {
    const set = new SlotSet();
    set.addSlot(30, 40);
    set.addSlot(0, 10);
    const gaps = set.reverse().slots();
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.start).toBe(10);
    expect(gaps[0]?.end).toBe(30);
  });

  it('reverse on an empty set yields no gaps', () => {
    expect(new SlotSet().reverse().slots()).toHaveLength(0);
  });

  it('smaller(5) shrinks a 28-wide slot to 18-wide', () => {
    const set = new SlotSet();
    set.addSlot(0, 28);
    const smaller = set.smaller(5).slots();
    expect(smaller).toHaveLength(1);
    expect(smaller[0]?.size()).toBe(18);
    expect(smaller[0]?.start).toBe(5);
    expect(smaller[0]?.end).toBe(23);
  });

  it('smaller(5) drops a 10-wide slot (size <= 2*margin)', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    expect(set.smaller(5).slots()).toHaveLength(0);
  });

  it('smaller(5) shrinks an 11-wide slot to 1-wide', () => {
    const set = new SlotSet();
    set.addSlot(0, 11);
    const smaller = set.smaller(5).slots();
    expect(smaller).toHaveLength(1);
    expect(smaller[0]?.size()).toBe(1);
  });

  it('smaller on an empty set yields an empty set', () => {
    expect(new SlotSet().smaller(5).slots()).toHaveLength(0);
  });

  it('filter clips every slot to the given range, dropping disjoint ones', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    set.addSlot(30, 40);
    const filtered = set.filter(5, 35).slots();
    expect(filtered).toHaveLength(2);
    expect(filtered[0]?.start).toBe(5);
    expect(filtered[0]?.end).toBe(10);
    expect(filtered[1]?.start).toBe(30);
    expect(filtered[1]?.end).toBe(35);
  });

  it('addAll merges another set\'s slots in without collision handling', () => {
    const a = new SlotSet();
    a.addSlot(0, 10);
    const b = new SlotSet();
    b.addSlot(5, 20);
    a.addAll(b);
    expect(a.slots()).toHaveLength(2);
  });

  it('is iterable, matching Java\'s Iterable<Slot>', () => {
    const set = new SlotSet();
    set.addSlot(0, 10);
    set.addSlot(30, 40);
    const collected = [...set];
    expect(collected).toHaveLength(2);
  });
});
