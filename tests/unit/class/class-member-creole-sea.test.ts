/**
 * `noteLineAtomDy` — lozego-15-coci435 (T13r residual, journal row 24):
 * a note line mixing a tall `'image'` (sprite) atom with `'text'` must put
 * the text atom's own Sea `top` against the LINE's real height (image
 * included), not a text-only recomputation that silently disagrees with
 * `note-layout-measure-rows.ts#noteLineHeight`'s own `lineHeight` value.
 * Golden: `oracle/goldens/class/lozego-15-coci435/` — the note body line
 * `<$test>Note on rel` (a 50x100 sprite + text), jar `text/@y` 349.801.
 */
import { describe, it, expect } from 'vitest';
import { noteLineAtomDy } from '../../../src/diagrams/class/class-member-creole-sea.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';
import { memberBaseFont } from '../../../src/diagrams/class/class-member-creole.js';

const FONT = memberBaseFont({ family: 'sans-serif', size: 13 }, {});

describe('noteLineAtomDy — text-only line (pre-existing behavior unchanged)', () => {
  it('is 0 for a single NORMAL text atom whose line height equals its own', () => {
    const atoms: MemberRenderAtom[] = [{ kind: 'text', text: 'x', font: FONT, width: 4 }];
    expect(noteLineAtomDy(atoms, 13)).toEqual([0]);
  });
});

describe('noteLineAtomDy — text sharing a line with a taller image atom (lozego-15 fix)', () => {
  // A 100px sprite (`<$test>`, sprite `[50x100/8z]`) followed by 13pt text
  // ("Note on rel") on the SAME note line. `note-layout-measure-rows.ts
  // #noteLineHeight` sizes this row at 100 (image included, altitude 0) --
  // `noteLineAtomDy`'s own reduction must agree, or the text atom's `dy`
  // silently assumes a 13px line instead of the real 100px one.
  const atoms: MemberRenderAtom[] = [
    { kind: 'image', href: 'data:image/svg+xml,sprite', width: 50, height: 100 },
    { kind: 'text', text: 'Note on rel', font: FONT, width: 60 },
  ];

  it('returns dy=0 for the text atom -- its bottom lands on the line bottom, like the image', () => {
    const dys = noteLineAtomDy(atoms, 100);
    expect(dys[0]).toBe(0); // 'image': always 0 (own independent placement rule)
    expect(dys[1]).toBeCloseTo(0, 10);
  });

  it('hand-derivation matches the golden: y = lineTop + lineHeight - size/4.5 (dy=0)', () => {
    // jar text/@y 349.801 at this row's lineTop=252.692 (measured off the
    // golden): 252.692 + 100 - 13/4.5 = 349.803 (float-rounding of 349.801).
    const lineTop = 252.692;
    const lineHeight = 100;
    const dy = noteLineAtomDy(atoms, lineHeight)[1]!;
    const y = lineTop + lineHeight - 13 / 4.5 + dy;
    expect(y).toBeCloseTo(349.801, 2);
  });
});
