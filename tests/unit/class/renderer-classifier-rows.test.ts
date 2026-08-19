/**
 * renderer-classifier-rows.test.ts — SI30 T4: paired measure+render test for
 * a member row's `<sup>`/`<sub>` runs. `renderRowAtoms` draws the EXACT
 * `MemberRenderAtom[]` `resolveMemberAtoms` (`class-member-creole.ts`)
 * produces -- these tests feed it that SAME array (never a hand-built
 * literal), so a drift between the sizer's numbers and the renderer's own
 * would show up here, not just in `class-member-creole.test.ts`'s
 * measure-only assertions.
 */
import { describe, expect, test } from 'vitest';
import { buildMemberAtoms, resolveMemberAtoms } from '../../../src/diagrams/class/class-member-creole.js';
import { renderRowAtoms } from '../../../src/diagrams/class/renderer-classifier-rows.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';

const measurer = new FormulaMeasurer();
const FONT12: FontConfiguration = { family: 'sans-serif', size: 12, color: null, styles: new Set() };
const ROW_Y = 100;

describe('renderRowAtoms — <sup>/<sub> draws the sizer\'s own muted size + dy (SI30 T4)', () => {
  test('x<sup>2</sup>: the drawn sup run has font-size 9 and y = rowY + the sizer\'s own dy', () => {
    const atoms = buildMemberAtoms('x<sup>2</sup>', FONT12);
    const build = resolveMemberAtoms(atoms, FONT12, measurer);
    const svg = renderRowAtoms(build.atoms, 0, ROW_Y, defaultTheme);
    const texts = [...svg.matchAll(/<text x="[^"]*" y="([^"]*)" font-size="([^"]*)"/g)];
    expect(texts).toHaveLength(2);
    const [xRun, supRun] = texts as [RegExpMatchArray, RegExpMatchArray];
    // "x": NORMAL, font-size stays the declared 12 -- y is ROW_Y + the
    // sizer's OWN dy for this atom (a member row's `<sup>` can shift even
    // its NORMAL siblings, `class-member-creole-sea.ts#textAtomDy`'s own
    // doc comment -- self-consistency is the assertion, not a hardcoded 0).
    const x = build.atoms[0] as Extract<(typeof build.atoms)[number], { kind: 'text' }>;
    expect(xRun[2]).toBe('12');
    expect(x.dy).toBeCloseTo(4, 6); // jar-verified against exposant-01-class
    expect(Number(xRun[1])).toBeCloseTo(ROW_Y + x.dy!, 2);
    // "2": EXPOSANT, drawn at the MUTED size 9 -- the SAME number the
    // sizer measured with (`build.atoms[1].width` used `getFont(...).size`).
    const sup = build.atoms[1] as Extract<(typeof build.atoms)[number], { kind: 'text' }>;
    expect(supRun[2]).toBe('9');
    expect(Number(supRun[1])).toBeCloseTo(ROW_Y + sup.dy!, 2);
    expect(sup.dy).not.toBe(x.dy);
  });

  test('H<sub>2</sub>O: every drawn run\'s y matches ROW_Y + its own dy from the sizer', () => {
    const atoms = buildMemberAtoms('H<sub>2</sub>O', FONT12);
    const build = resolveMemberAtoms(atoms, FONT12, measurer);
    const svg = renderRowAtoms(build.atoms, 0, ROW_Y, defaultTheme);
    const ys = [...svg.matchAll(/<text x="[^"]*" y="([^"]*)"/g)].map((m) => Number(m[1]));
    expect(ys).toHaveLength(3);
    const textAtoms = build.atoms as Extract<(typeof build.atoms)[number], { kind: 'text' }>[];
    for (let i = 0; i < ys.length; i++) {
      expect(ys[i]).toBeCloseTo(ROW_Y + textAtoms[i]!.dy!, 2);
    }
  });
});
