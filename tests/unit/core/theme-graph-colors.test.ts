/**
 * `ElementColors.roundCorner` — the per-element corner radius field added by
 * the `activity-style-defaults` mission (T1, D4).
 *
 * `theme-graph-colors.ts` is a TYPE-ONLY declaration file, so what is
 * testable at runtime is the CONTRACT the field carries rather than any
 * behavior of its own: the value stored is the RAW, UNHALVED style number,
 * and every consumer halves it onto BOTH `rx` and `ry`. That convention is
 * the whole content of D4, it is the one thing a future reader can get
 * wrong, and T5 is the task that will depend on it — so it is pinned here
 * rather than left to a doc comment alone.
 */
import { describe, it, expect } from 'vitest';

import type { ElementColors } from '../../../src/core/theme-graph-colors.js';

describe('ElementColors.roundCorner (T1, D4)', () => {
  it('stores the RAW unhalved style value; rx = ry = value / 2', () => {
    // `activityDiagram { activity { RoundCorner 25 } }`, plantuml.skin:361.
    const bucket: ElementColors = { roundCorner: 25 };
    expect(bucket.roundCorner).toBe(25);
    // The jar emits rx="12.5" ry="12.5" on an action rect for exactly this
    // declaration -- BOTH axes, which is what D4 fixes (the port's prior
    // rx="8" was unsourced and carried no ry at all).
    expect((bucket.roundCorner ?? 0) / 2).toBe(12.5);
  });

  it('is optional — absent means "no override, caller applies its own default"', () => {
    const bucket: ElementColors = {};
    expect(bucket.roundCorner).toBeUndefined();
  });

  it('sits beside the other numeric per-element overrides without disturbing them', () => {
    const bucket: ElementColors = { fontSize: 12, lineThickness: 1, minimumWidth: 300, roundCorner: 25 };
    expect(bucket).toEqual({ fontSize: 12, lineThickness: 1, minimumWidth: 300, roundCorner: 25 });
  });
});
