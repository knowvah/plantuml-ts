/**
 * creole-sea-line — the vertical half of one physical (post-word-wrap)
 * creole line: `Sea` placement, the line's own height, and the per-run
 * baseline offset a `<sup>`/`<sub>` run needs (SI30 `decisions.md#D2`).
 *
 * Upstream builds ONE `Sea` per stripe inside `SheetBlock1#initMap`
 * (`SheetBlock1.java:130-152`): every atom is `add`ed (x-cursor
 * accumulation), `doAlign()` drops each one to `y = -height +
 * getStartingAltitude` (`Sea.java:72-80`), `translateMinYto(y)` stacks the
 * stripe under the previous one, and the stripe's own height is
 * `sea.getHeight()` (`SheetBlock1.java:145-147`). The two engine-local
 * seams (`creole-text-lines.ts` for state, `leaf-sizing-text.ts` for the
 * class/description leaves) had no altitude engine at all before SI30 —
 * they summed widths and took the MAX height — so a raised `<sup>` neither
 * grew its line nor moved off the baseline. This module is the one place
 * both now go through the real `Sea`.
 *
 * ## What `dy` means (the contract T4/T5 render with)
 *
 * There is no "line baseline" upstream: `SheetBlock1#drawU` translates the
 * `UGraphic` to each atom's own `Position` and `AtomText#drawU` then draws
 * at `rect.getHeight() - descent` INSIDE that box (`AtomText.java:213-215`;
 * its own `final int ypos = fontConfiguration.getSpace();` line is
 * COMMENTED OUT at java:212 — the altitude reaches the page through `Sea`
 * alone and must not be applied twice, `decisions.md#D2`). This port's
 * renderers instead reconstruct a baseline per LINE, as
 * `lineTop + lineHeight - size/4.5` (e.g. `class/renderer-note.ts:263`).
 * `dy` is exactly the correction that turns that reconstruction back into
 * upstream's absolute placement:
 *
 *     drawnBaseline = lineTop + lineHeight - unmutedSize/4.5 + dy
 *
 * Consequences worth naming, all of them `Sea`'s arithmetic rather than a
 * formula of ours:
 * - Every run of a line whose runs are ALL `FontPosition.NORMAL` gets
 *   `dy === 0`, at any mix of `<size:N>` sizes, because that run's own
 *   descent appears on both sides of the subtraction. This is the
 *   identity property the SI30 README's stop 9 pins.
 * - A NORMAL run sharing a line with an INDICE (`<sub>`, altitude +3) gets
 *   `dy === -3`: the `<sub>` grew the line's BOTTOM (`maxY` moves from 0 to
 *   +3), and the normal text must not sink with it. Same mechanism raises
 *   nothing when the `<sup>` grows the line's top, since the renderer's
 *   reconstruction is bottom-anchored.
 * - A run whose measured height is under `AtomText#calculateDimensionSlow`'s
 *   own 10px floor (`AtomText.java:178-179`) — e.g. `<size:8>`, or a
 *   `<sup>` muted below 10 — draws at its REAL height inside that floored
 *   box (java:213 reads the unfloored `rect`), so its `dy` carries the
 *   difference. Upstream's own asymmetry, not a divergence.
 */
import { Sea, type AtomOps } from '../../klimt/creole/Sea.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import { atomTextStartingAltitude } from '../../klimt/creole/legacy/AtomText.js';
import { emojiStartingAltitude } from '../../klimt/creole/atom/AtomEmoji.js';
import { getFont } from '../../klimt/shape/UText.js';
import type { FontSpec, StringMeasurer } from '../../measurer.js';

/** `AtomText#calculateDimensionSlow`'s own height floor
 *  (`AtomText.java:178-179`: `if (h < 10) h = 10`) — applied to every TEXT
 *  atom's measured box by every seam that lays atoms out here. Note
 *  `#drawU` reads the UNFLOORED `rect.getHeight()` (java:213), which is
 *  what {@link SeaLineOps.drawHeight} reports. */
export const ATOM_TEXT_MIN_HEIGHT = 10;

/** The per-atom operations {@link layoutLineThroughSea} needs. Split from
 *  `Sea`'s own `AtomOps` because `Sea` only ever asks for a dimension and an
 *  altitude, while a baseline also needs the DRAW-time height/descent pair
 *  (`AtomText.java:213-215`) — and because each seam owns its own dimension
 *  model (tab stops, sprite lookup) that this module has no business
 *  knowing. */
export interface SeaLineOps {
  /** `Atom#calculateDimension` — the box `Sea` lays out and stacks. */
  dim(atom: CreoleAtom): { readonly width: number; readonly height: number };
  /** `AtomText#drawU`'s own `rect.getHeight()` (`AtomText.java:213`) — the
   *  UNFLOORED measured height, which is what the draw baseline is taken
   *  from. 0 for a non-text atom (no baseline of its own). */
  drawHeight(atom: CreoleAtom): number;
  /** `AtomText#drawU`'s `descent` (`AtomText.java:214`), measured at the
   *  run's EFFECTIVE (muted) font. 0 for a non-text atom. */
  descent(atom: CreoleAtom): number;
  /** The same descent at the run's UNMUTED size — the descent this port's
   *  renderers already use for their per-line baseline (`atom.font.size /
   *  4.5`, `class/renderer-note.ts:263`), and therefore the reference `dy`
   *  is measured against. 0 for a non-text atom. */
  normalDescent(atom: CreoleAtom): number;
}

/** One line's resolved geometry: `Sea`'s own width/height plus a `dy` per
 *  atom, parallel to the `atoms` array handed in. */
export interface SeaLineLayout {
  readonly width: number;
  readonly height: number;
  readonly dy: readonly number[];
}

/** `Sea` passes its `StringBounder` straight through to `AtomOps`, and this
 *  module's ops close over their seam's own measurer instead of reading it —
 *  so nothing ever calls this. Same never-consulted-probe precedent as
 *  `class-body-enhanced-geometry.ts#PROBE_STRING_BOUNDER`. */
const UNUSED_STRING_BOUNDER: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/**
 * `Atom#getStartingAltitude` for this port's DATA-union atoms — the one
 * dispatch table both seams share, mirroring
 * `EntityImageDescriptionDelegates.ts#descAtomOps`'s own (the description
 * engine's real-`Sea` bundle) so the three paths cannot drift:
 *
 * - `'text'`: `AtomText.java:321-323` (`fontConfiguration.getSpace()`).
 * - `'emoji'`: `AtomEmoji.java:62-64` (`-3 * factor`).
 * - `'inline'`: `AtomImg.java:242-244` / `AtomSprite.java:69-71` both
 *   return 0. `AtomOpenIconic.java:72-74`'s own `-3 * factor` is NOT
 *   applied here: this port folds an OpenIconic glyph's raise into its
 *   draw origin instead (`openiconic-glyphs.ts#openIconicOriginY`, whose
 *   `-3*factor` term IS that altitude), and `descAtomOps` reports 0 for the
 *   same reason. Moving it here would double-count it.
 * - `'latex'`: `AtomMath.java:73-75` returns 0.
 */
export function creoleAtomStartingAltitude(atom: CreoleAtom): number {
  if (atom.kind === 'text') return atomTextStartingAltitude(atom.font);
  if (atom.kind === 'emoji') return emojiStartingAltitude(atom.factor);
  return 0;
}

/** The `AtomOps` shim `Sea` itself consumes — dimension + altitude only
 *  (`Sea.java:60-80`); `drawU` belongs to `SheetBlock1#drawU`, which no
 *  measurement seam reaches. */
function seaOpsFor(ops: SeaLineOps): AtomOps {
  return {
    calculateDimension(atom: CreoleAtom): XDimension2D {
      const { width, height } = ops.dim(atom);
      return new XDimension2D(width, height);
    },
    getStartingAltitude(atom: CreoleAtom): number {
      return creoleAtomStartingAltitude(atom);
    },
    drawU(): void {
      throw new Error('creole-sea-line: Sea never draws — SheetBlock1#drawU owns that half');
    },
  };
}

/**
 * Lays one line's atoms through `Sea` and reports the line's width/height
 * plus each atom's baseline offset — the measurement half of
 * `SheetBlock1.java:130-152` with the stripe's stacking `y` fixed at 0, so
 * every reported `dy` is relative to the line's OWN top (each seam stacks
 * its lines itself).
 *
 * An atom-free line reports zeros rather than reaching `Sea#getHeight`,
 * whose upstream body throws on an empty sea (`Sea.java:120-126`); upstream
 * never gets there either (`SheetBlock1.java:136-137` skips an empty
 * stripe).
 */
export function layoutLineThroughSea(atoms: readonly CreoleAtom[], ops: SeaLineOps): SeaLineLayout {
  if (atoms.length === 0) return { width: 0, height: 0, dy: [] };

  const sea = new Sea(UNUSED_STRING_BOUNDER, seaOpsFor(ops));
  for (const atom of atoms) sea.add(atom);
  sea.doAlign();
  sea.translateMinYto(0);

  const height = sea.getHeight();
  const dy = atoms.map((atom) => {
    if (atom.kind !== 'text') return 0;
    const top = sea.getPosition(atom)?.getMinY() ?? 0;
    const baseline = top + ops.drawHeight(atom) - ops.descent(atom);
    return baseline - (height - ops.normalDescent(atom));
  });
  return { width: sea.getWidth(), height, dy };
}

/**
 * The `SeaLineOps` a measurer-driven seam builds: `dim` stays the caller's
 * (tab stops, sprite lookup, its own height floor), while the three
 * baseline terms come from the injected `StringMeasurer` at the run's own
 * font.
 *
 * `base` supplies family/weight/style; only the SIZE varies per run, muted
 * through `getFont` (`FontConfiguration.java:98-104`, `decisions.md#D1`)
 * for what is measured and drawn, unmuted for the reference descent. This
 * mirrors `creole-text-lines.ts#textAtomMeasured`'s own long-standing
 * `{ ...font, size }` precedent rather than re-deriving a `FontSpec` from
 * the atom's `FontConfiguration`.
 */
export function measurerSeaLineOps(
  base: FontSpec,
  measurer: StringMeasurer,
  dim: (atom: CreoleAtom) => { readonly width: number; readonly height: number },
): SeaLineOps {
  const isText = (atom: CreoleAtom): atom is Extract<CreoleAtom, { kind: 'text' }> => atom.kind === 'text';
  return {
    dim,
    drawHeight(atom: CreoleAtom): number {
      return isText(atom) ? measurer.measure(atom.text, { ...base, size: getFont(atom.font).size }).height : 0;
    },
    descent(atom: CreoleAtom): number {
      return isText(atom) ? measurer.getDescent({ ...base, size: getFont(atom.font).size }, atom.text) : 0;
    },
    normalDescent(atom: CreoleAtom): number {
      return isText(atom) ? measurer.getDescent({ ...base, size: atom.font.size }, atom.text) : 0;
    },
  };
}
