import { Position } from './Position.js';
import type { MinMax } from '../geom/MinMax.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { CreoleAtom } from './atom/Atom.js';

/**
 * AtomOps — the per-`CreoleAtom` measure/altitude/draw operations `Sea`
 * needs. Upstream's `Sea`/`Position`/`SheetBlock1` call these polymorphically
 * through the OOP `klimt.creole.atom.Atom` interface
 * (`calculateDimension`/`getStartingAltitude`/`drawU`, all dispatched by the
 * JVM to whichever concrete `AtomText`/`AtomImg`/`AtomSprite`/... instance is
 * in hand). This port's `CreoleAtom` (`atom/Atom.ts`) is a plain DATA union
 * instead — an E2r/L1 decision, made so `EntityImageDescriptionSupport.ts`'s
 * per-line measure/draw loop wouldn't need a parallel OOP `Atom` class
 * hierarchy. `Sea`/`SheetBlock1` (T8) inherit that same tradeoff: rather than
 * inventing a second, competing OOP `Atom` hierarchy (which upstream's own
 * `AtomText`/`AtomImg`/`AtomSprite`/`AtomMath`/... concrete classes are
 * genuinely out of this task's scope to build), the SAME operations are
 * threaded in as an explicit callback bundle — the identical adaptation
 * `Fission.ts#getSplitted`'s `measureAtomWidth` parameter already
 * established and this task reuses (see `SheetBlock1.ts`'s own doc comment
 * for the full architecture note and what a future task porting concrete
 * `Atom` implementations will need to supply here).
 */
export interface AtomOps {
  calculateDimension(atom: CreoleAtom, stringBounder: StringBounder): XDimension2D;
  getStartingAltitude(atom: CreoleAtom, stringBounder: StringBounder): number;
  drawU(atom: CreoleAtom, ug: UGraphic): void;
}

/**
 * Sea — the atom-altitude engine one physical (post-word-wrap) creole line
 * uses to lay its atoms left-to-right (x-cursor accumulation) and then
 * vertically align them by ascent/starting-altitude (TeX-box-style
 * baseline placement) before `SheetBlock1#initMap` stacks the line into the
 * overall Sheet.
 *
 * Upstream: klimt/creole/Sea.java. Ported: the constructor, `add` (x-cursor
 * accumulation, upstream's own always-`y=0` seed value), `getPosition`,
 * `doAlign` (upstream's real ascent placement: `-height +
 * getStartingAltitude`), `translateMinYto`, `exportAllPositions`, `getMinY`/
 * `getMaxY` (upstream's own `Double.MAX_VALUE`/`-Double.MAX_VALUE` sentinels
 * and `IllegalStateException` guard on an empty Sea), `getHeight`, `update`
 * (folds every position into a `MinMax`), `getWidth`.
 *
 * NOT ported: `findFirstAtomText`, `doAlignTikz`, `doAlignTikzBaseline` —
 * all three exist ONLY to serve `stringBounder.matchesProperty("TIKZ")`
 * branches (in this file and in `getMaxY`'s own upstream body). This port's
 * `StringBounder` interface has no `matchesProperty` member at all — an
 * earlier, deliberate T3 decision (`StringBounder.ts`'s own doc comment),
 * consistent with `CLAUDE.md`'s "Architecture Notes": this is a pure SVG
 * renderer / "parse → layout → render (SVG string)" pipeline with no other
 * output backend. Unlike the ADR-8-corollary WBS case (a diagram TYPE this
 * port's own roadmap lists), TIKZ is an OUTPUT FORMAT this port's
 * architecture forecloses outright — the SVG-only decision is foundational,
 * not a scheduling gap, so this omission is NOT "not yet reached". Also
 * requires the concrete `AtomText` class (`instanceof AtomText`), itself
 * out of scope for the same reason `AtomOps` (above) exists.
 */
export class Sea {
  private currentX = 0;
  private readonly positions = new Map<CreoleAtom, Position>();
  private readonly stringBounder: StringBounder;
  private readonly ops: AtomOps;

  constructor(stringBounder: StringBounder, ops: AtomOps) {
    this.stringBounder = stringBounder;
    this.ops = ops;
  }

  add(atom: CreoleAtom): void {
    const dim = this.ops.calculateDimension(atom, this.stringBounder);
    const y = 0;
    const position = new Position(this.currentX, y, dim);
    this.positions.set(atom, position);
    this.currentX += dim.getWidth();
  }

  getPosition(atom: CreoleAtom): Position | undefined {
    return this.positions.get(atom);
  }

  doAlign(): void {
    for (const [atom, pos] of new Map(this.positions)) {
      const height = this.ops.calculateDimension(atom, this.stringBounder).getHeight();
      const newPos = pos.translateY(-height + this.ops.getStartingAltitude(atom, this.stringBounder));
      this.positions.set(atom, newPos);
    }
  }

  translateMinYto(newValue: number): void {
    const delta = newValue - this.getMinY();
    for (const [atom, pos] of new Map(this.positions)) {
      this.positions.set(atom, pos.translateY(delta));
    }
  }

  exportAllPositions(destination: Map<CreoleAtom, Position>): void {
    for (const [atom, pos] of this.positions) destination.set(atom, pos);
  }

  getMinY(): number {
    if (this.positions.size === 0) throw new Error('IllegalStateException');
    let result = Number.MAX_VALUE;
    for (const pos of this.positions.values()) if (result > pos.getMinY()) result = pos.getMinY();
    return result;
  }

  getMaxY(): number {
    if (this.positions.size === 0) throw new Error('IllegalStateException');
    let result = -Number.MAX_VALUE;
    for (const pos of this.positions.values()) if (result < pos.getMaxY()) result = pos.getMaxY();
    return result;
  }

  getHeight(): number {
    return this.getMaxY() - this.getMinY();
  }

  update(minMax: MinMax): MinMax {
    let result = minMax;
    for (const pos of this.positions.values()) result = pos.update(result);
    return result;
  }

  getWidth(): number {
    return this.currentX;
  }
}
