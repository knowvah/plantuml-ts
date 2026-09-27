/**
 * Renders one OpenIconic `<&glyph>` `MemberRenderAtom` (G2 N41) -- split out
 * of `renderer-classifier-box.ts#renderRowAtoms` purely to keep that
 * function's own NLOC under this project's complexity cap and to avoid
 * growing `renderer-classifier-box.ts` (already at this repo's 500-line
 * file cap) any further than necessary; mirrors the existing `renderer-
 * note.ts`/`renderer-arrowhead.ts` split-out-of-renderer.ts precedent.
 */
import type { Theme } from '../../core/theme.js';
import { buildOpenIconicPathD, openIconicOriginY } from '../../core/openiconic-glyphs.js';
import { path } from '../../core/svg.js';
import type { MemberRenderAtom } from './class-member-creole.js';

/**
 * `x`/`y` are the atom's own render position, as already tracked by
 * `renderRowAtoms`'s x-advance loop (`x`) and the row's own text BASELINE
 * (`y`) -- `openIconicOriginY` derives the glyph's real top-left from those,
 * `x + 1` for the atom's own flat left margin (`openiconic-glyphs.ts
 * #openIconicDims`'s doc comment). Returns `''` for an atom whose glyph name
 * somehow isn't in the captured table (should not occur -- `class-member-
 * creole.ts#resolveOpenIconicAtom` already filters this before a `'vector'`
 * atom is ever built; defensive only, matches this file's sibling renderers'
 * own "never throw mid-render" convention).
 */
export function renderOpenIconicAtom(
  atom: Extract<MemberRenderAtom, { kind: 'vector' }>,
  x: number,
  y: number,
  theme: Theme,
): string {
  const originY = openIconicOriginY(y, theme.fontSize, atom.factor);
  const d = buildOpenIconicPathD(atom.name, atom.factor, x + 1, originY);
  // T7b: routed through `path()` (was a raw template literal) -- `d` is
  // already formatted at its source (`openiconic-glyphs.ts#buildOpenIconicPathD`
  // has its own `fmt()`, out of this task's write-set and already correct);
  // this call only needed to stop bypassing the shared emitter for `fill`.
  return d === undefined ? '' : path(d, { fill: atom.fill });
}

/**
 * cdd3-T22 (E1-3/E2-3): draws the glyph with its box corner at `top` -- the
 * atom's own `Sea` position, which `SheetBlock1#drawU` translates the
 * `UGraphic` to (`SheetBlock1.java:212-217`) before `AtomOpenIconic#drawU`
 * paints `TextBlockUtils.withMargin(glyph, 1, 0)` from it
 * (`AtomOpenIconic.java:63-65,76-83`): `x + 1` for the flat left margin, no
 * vertical margin.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomOpenIconic.java:63-83
 */
export function renderOpenIconicAtomAtTop(
  atom: Extract<MemberRenderAtom, { kind: 'vector' }>,
  x: number,
  top: number,
): string {
  const d = buildOpenIconicPathD(atom.name, atom.factor, x + 1, top);
  return d === undefined ? '' : path(d, { fill: atom.fill });
}

/**
 * cdd3-T22: a member-row glyph -- at its own `Sea` top when
 * `resolveMemberAtoms` set `atom.dy` (the row baseline `y` plus that
 * offset, {@link renderOpenIconicAtomAtTop}), else the legacy
 * baseline-keyed {@link renderOpenIconicAtom}. Kept separate from
 * `renderOpenIconicAtom` because the note renderer passes atoms that carry
 * `dy` against a DIFFERENT baseline reference.
 */
export function renderRowOpenIconicAtom(
  atom: Extract<MemberRenderAtom, { kind: 'vector' }>,
  x: number,
  y: number,
  theme: Theme,
): string {
  return atom.dy !== undefined
    ? renderOpenIconicAtomAtTop(atom, x, y + atom.dy)
    : renderOpenIconicAtom(atom, x, y, theme);
}
