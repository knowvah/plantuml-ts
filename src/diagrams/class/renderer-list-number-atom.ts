/**
 * `renderListNumberAtom` -- the creole numbered-list header glyph (C-2,
 * `klimt/creole/legacy/AtomTextUtils.java:145-159`'s `createListNumber`/
 * `ListNumberAtom`), split into its own file mirroring `renderer-bullet-
 * atom.ts`'s identical "own file, self-contained" precedent (that file's
 * own module doc comment).
 */
import { text } from '../../core/svg.js';
import { getFont } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-render-atom.js';

/** `AtomText#drawU` (java:207-230) minus tab-tokenizing/decoration handling
 *  -- a list number is a synthesized `"N."` run, never user creole markup,
 *  so it never carries `**bold**`/`<sup>`/`<color>` decoration (mirrors
 *  `renderBulletAtom`'s own "no decoration" scope). Baseline: the SAME
 *  unmuted `lineTop + lineHeight - font.size / 4.5` reference every OTHER
 *  non-`'text'` note atom uses (`renderer-note.ts#noteLineAtomDy`'s `dy`
 *  is 0 for every kind but `'text'`, so this kind's own placement rule is
 *  independent, exactly like `'bullet'`/`'vector'`/`'image'`).
 *
 * `blank` (C-1's `Fission.blank(header)`, mirrors `renderBulletAtom`'s own
 * continuation-row convention on the `'bullet'` kind): the reserved `width`
 * still applies via the caller's `x += atom.width`, but nothing draws.
 */
export function renderListNumberAtom(
  atom: Extract<MemberRenderAtom, { kind: 'listNumber' }>,
  x: number,
  lineTop: number,
  lineHeight: number,
): string {
  if (atom.blank === true) return '';
  const size = getFont(atom.font).size;
  const y = lineTop + lineHeight - size / 4.5;
  return text(x + atom.dx, y, atom.text, {
    fontFamily: atom.font.family,
    fontSize: size,
    fill: atom.font.color ?? '#000000',
    lengthAdjust: 'spacing',
    textLength: atom.textWidth,
  });
}
