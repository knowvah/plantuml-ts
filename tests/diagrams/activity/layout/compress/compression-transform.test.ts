import { describe, expect, it } from 'vitest';

import { CompressionTransform } from '../../../../../src/diagrams/activity/layout/compress/compression-transform.js';
import { SlotSet } from '../../../../../src/diagrams/activity/layout/compress/slot.js';

describe('CompressionTransform', () => {
  it('subtracts the full length of every removed slot entirely before v', () => {
    const slots = new SlotSet();
    slots.addSlot(0, 5);
    slots.addSlot(10, 15);
    const transform = new CompressionTransform(slots);
    // Both slots end at or before 20: delta = 5 + 5 = 10.
    expect(transform.transform(20)).toBe(10);
  });

  it('clamps the delta to (v - start) for the slot v falls inside', () => {
    const slots = new SlotSet();
    slots.addSlot(0, 5);
    slots.addSlot(10, 15);
    const transform = new CompressionTransform(slots);
    // (0,5) is fully behind 12: delta 5. (10,15) contains 12: delta 12-10=2.
    expect(transform.transform(12)).toBe(5);
  });

  it('is the identity when v is before every slot', () => {
    const slots = new SlotSet();
    slots.addSlot(10, 15);
    const transform = new CompressionTransform(slots);
    expect(transform.transform(5)).toBe(5);
  });

  it('is the identity on an empty slot set', () => {
    const transform = new CompressionTransform(new SlotSet());
    expect(transform.transform(42)).toBe(42);
  });

  it('implements PiecewiseAffineTransform', () => {
    const transform = new CompressionTransform(new SlotSet());
    expect(typeof transform.transform).toBe('function');
  });
});
