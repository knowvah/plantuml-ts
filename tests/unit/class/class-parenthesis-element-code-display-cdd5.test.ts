/**
 * cdd5-T4b (parenthesis-element-code-as-display): `() X as "Y"` reads CODE
 * then DISPLAY -- the third `RegexOr` alternative of
 * `CommandCreateElementParenthesis` ("CODE3" CODE, `as`, "DISPLAY3"
 * DISPLAY). The first two alternatives cannot match it (CODE1 leaves
 * ` as "Y"` unconsumed before the end anchor; DISPLAY2 needs a quoted/
 * decorated display first), so `() theta as "<latex>…</latex>"` is code
 * `theta`, display `<latex>\theta</latex>` (`sapofa-97-gizu737`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandCreateElementParenthesis.java:76-114
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';

function classifiers(...lines: string[]) {
  return parseClass({ lines, type: 'class' }).classifiers.map((c) => ({ id: c.id, display: c.display, kind: c.kind }));
}

describe('`()` element: CODE as DISPLAY (third alternative)', () => {
  it('`() theta as "<latex>…"` is code theta, quoted display', () => {
    expect(classifiers('() theta as "<latex>\\theta</latex>"')).toEqual([
      { id: 'theta', display: '<latex>\\theta</latex>', kind: 'circle' },
    ]);
  });

  it('allows a display with spaces and no space after `as`', () => {
    expect(classifiers('() a1 as"my display"')).toEqual([{ id: 'a1', display: 'my display', kind: 'circle' }]);
  });

  it('keeps DISPLAY as CODE for `() "Y" as X` and `() Y as X`', () => {
    expect(classifiers('() "Shown" as x1', '() Name as x2')).toEqual([
      { id: 'x1', display: 'Shown', kind: 'circle' },
      { id: 'x2', display: 'Name', kind: 'circle' },
    ]);
  });
});
