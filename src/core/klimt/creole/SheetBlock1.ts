import { TextBlockMemoized } from '../shape/TextBlockMemoized.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { Stencil } from './Stencil.js';
import type { Sheet } from './Sheet.js';
import type { Stripe } from './Stripe.js';
import type { CreoleAtom } from './atom/Atom.js';
import { getSplitted } from './Fission.js';
import { Sea, type AtomOps } from './Sea.js';
import type { Position } from './Position.js';
import type { LineBreakStrategy } from '../LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../geom/ClockwiseTopRightBottomLeft.js';
import { MinMax } from '../geom/MinMax.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { XRectangle2D } from '../geom/XRectangle2D.js';
import { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import type { UGraphic } from '../UGraphic.js';
import { UTranslate } from '../UTranslate.js';
import type { StringBounder } from '../font/StringBounder.js';

/**
 * Atom — upstream: klimt/creole/atom/Atom.java (`interface Atom extends
 * TextBlock`, plus `getStartingAltitude`/`getNeutrons`). Named identically
 * to upstream (distinct from `./atom/Atom.ts`'s `CreoleAtom`, which ports
 * the SAME upstream Java interface as a plain data union — see `Sea.ts`'s
 * doc comment for why `Sea`/`SheetBlock1` operate on `CreoleAtom` +
 * `AtomOps` rather than this interface's virtual dispatch). `SheetBlock1`/
 * `SheetBlock2` (`SheetBlock2.ts`) both implement it, matching
 * `SheetBlock1.java implements ... Atom` / `SheetBlock2.java implements
 * TextBlock, Atom, WithPorts` — either is itself usable as a nested atom
 * by a larger creole assembly (not yet built in this port).
 */
export interface Atom extends TextBlock {
  getStartingAltitude(stringBounder: StringBounder): number;
  /** Always throws in every implementor this port has (matches
   *  `SheetBlock1`/`SheetBlock2.java`'s own `throw new
   *  UnsupportedOperationException()` body) — typed `never` rather than
   *  inventing an unused `Neutron` return type. */
  getNeutrons(): never;
}

/** Upstream field name preserved: one word-wrapped physical sub-line,
 *  paired with the ORIGINAL `Stripe` it was split from — needed so
 *  `getCoef` can duck-type an original stripe's optional
 *  `getCellAlignment()` (see that method's own doc comment). */
interface SplitLine {
  readonly stripe: Stripe;
  readonly atoms: readonly CreoleAtom[];
}

/**
 * SheetBlock1 — the real Creole "Sheet → TextBlock" assembly: word-wraps
 * each `Stripe` in a `Sheet` against a `LineBreakStrategy`, lays each
 * resulting line's atoms out via `Sea`'s altitude model, stacks the lines
 * top-to-bottom, then normalizes each line's horizontal offset against the
 * widest line (LEFT/CENTER/RIGHT coefficient split).
 *
 * Upstream: klimt/creole/SheetBlock1.java. Ported: `toString`,
 * `getCellAlignment`, `getHorizontalAlignment`, `initMap` (word-wrap via
 * `Fission`, per-line `Sea` layout, y-stacking, the post-pass width
 * normalization/`getCoef` split), `getCoef` (both arities),
 * `calculateDimensionSlow`, `getInnerPosition` (upstream: `return null;`
 * unconditionally — T7's own finding, `.agent-notes/
 * T7-creole-foundations.md`), `drawU`, `getStartingAltitude`,
 * `getStartingX`/`getEndingX` (the `Stencil` contract), `getMinimumWidth`,
 * `getNeutrons` (always throws). 3 of 4 Java constructor overloads are
 * ported (see below); `heights` is populated but never READ anywhere in
 * upstream either (a write-only field in the Java itself) — preserved
 * faithfully, not dropped, per this project's "don't refactor while
 * porting" rule.
 *
 * NOT ported: the `SheetBlock1(Sheet, LineBreakStrategy, Style)` overload
 * — it needs `style.getPadding()`/`style.value(PName.MinimumWidth)`, and
 * this port has no `Style`/`PName` style-resolution cascade anywhere yet
 * (`ClockwiseTopRightBottomLeft.ts`'s own precedent: its `marginForDocument
 * (StyleBuilder)` was dropped for the identical reason). Every call site
 * this mission's roadmap reaches (`Display.java:699`, T9's own target —
 * confirmed via `grep -rn "new SheetBlock1("`) uses the 5-arg
 * `(sheet, maxWidth, padding, marginX1, marginX2)` overload, which IS
 * ported; the other real upstream callers of the `Style` overload
 * (`FtileBoxOld.java`, activity-diagram `vcompact`/`gtile` machinery) are
 * diagram types/subsystems this port has not reached yet — when one of
 * them is ported, the `Style`-overload gap re-opens as ITS prerequisite,
 * not this task's.
 *
 * Architecture note on the CONSTRUCTOR'S EXTRA `atomOps` PARAMETER: see
 * `Sea.ts`'s `AtomOps` doc comment. This is the one place this port's
 * `SheetBlock1` signature diverges from upstream's — appended LAST (after
 * every upstream positional parameter), mirroring
 * `Fission.ts#getSplitted`'s own `measureAtomWidth` callback placement.
 */
export class SheetBlock1 extends TextBlockMemoized implements Atom, Stencil {
  private readonly sheet: Sheet;
  private readonly maxWidth: LineBreakStrategy;
  private readonly padding: ClockwiseTopRightBottomLeft;
  private readonly marginX1: number;
  private readonly marginX2: number;
  private readonly atomOps: AtomOps;
  private readonly minimumWidth: number = 0;

  private stripes: readonly SplitLine[] | undefined;
  private heights: Map<Stripe, number> | undefined;
  private widths: Map<SplitLine, number> | undefined;
  private positions: Map<CreoleAtom, Position> | undefined;
  private minMax: MinMax | undefined;
  private lastWrapCaller: unknown;

  constructor(
    sheet: Sheet,
    maxWidth: LineBreakStrategy,
    atomOps: AtomOps,
    padding: ClockwiseTopRightBottomLeft | number = ClockwiseTopRightBottomLeft.none(),
    marginX1 = 0,
    marginX2 = 0,
  ) {
    super();
    this.sheet = sheet;
    this.maxWidth = maxWidth;
    this.atomOps = atomOps;
    this.padding = typeof padding === 'number' ? ClockwiseTopRightBottomLeft.same(padding) : padding;
    this.marginX1 = marginX1;
    this.marginX2 = marginX2;
  }

  toString(): string {
    return this.sheet.toString();
  }

  /** Upstream reads the `stripes` FIELD directly, without calling
   *  `initMap` first — a real quirk (relies on a prior `calculateDimension`/
   *  `drawU` having already populated it), preserved faithfully rather than
   *  defensively guarded. */
  getCellAlignment(): HorizontalAlignment {
    const stripes = this.stripes as readonly SplitLine[];
    if (stripes.length !== 1) return HorizontalAlignment.LEFT;
    const simple = (stripes[0] as SplitLine).stripe;
    return duckCellAlignment(simple) ?? HorizontalAlignment.LEFT;
  }

  getHorizontalAlignment(): HorizontalAlignment {
    return this.sheet.getHorizontalAlignment();
  }

  private initMap(stringBounder: StringBounder): void {
    const currentCaller: unknown = (stringBounder as { constructor: unknown }).constructor;
    if (this.lastWrapCaller === currentCaller) return;
    this.lastWrapCaller = currentCaller;

    const stripes: SplitLine[] = [];
    for (const stripe of this.sheet) {
      const atoms = stripe.getAtoms();
      const split = getSplitted(atoms, this.maxWidth.getMaxWidth(), (atom) =>
        this.atomOps.calculateDimension(atom, stringBounder).getWidth(),
      );
      if (split.length === 1 && split[0] === atoms) {
        // No wrapping occurred (Fission.java's own `valueMaxWidth == 0`
        // branch returns `Arrays.asList(stripe)` UNCHANGED) -- keep the
        // ORIGINAL stripe reference so `getCoef`'s duck-typed
        // `getCellAlignment` check still sees it.
        stripes.push({ stripe, atoms });
      } else {
        for (const subAtoms of split) stripes.push({ stripe, atoms: subAtoms });
      }
    }
    this.stripes = stripes;

    const positions = new Map<CreoleAtom, Position>();
    const widths = new Map<SplitLine, number>();
    const heights = new Map<Stripe, number>();
    let minMax = MinMax.getEmpty(true);
    let y = 0;
    for (const line of stripes) {
      if (line.atoms.length === 0) continue;
      const sea = new Sea(stringBounder, this.atomOps);
      for (const atom of line.atoms) sea.add(atom);
      sea.doAlign();
      sea.translateMinYto(y);
      const width = sea.getWidth();
      widths.set(line, width);
      minMax = sea.update(minMax);
      const height = sea.getHeight();
      heights.set(line.stripe, height);
      y += height;
      sea.exportAllPositions(positions);
    }

    let maxLineWidth = 0;
    for (const v of widths.values()) if (v > maxLineWidth) maxLineWidth = v;

    for (const [line, value] of widths) {
      const diff = maxLineWidth - value;
      if (diff > 0) {
        const coef = this.getCoef(line.stripe);
        if (coef > 0) {
          for (const atom of line.atoms) {
            // Invariant: every atom in `line.atoms` was added to `positions`
            // in the loop above (via `sea.exportAllPositions`) -- matches
            // upstream trusting the same invariant with no null check.
            const pos = positions.get(atom) as Position;
            positions.set(atom, pos.translateX(diff / coef));
          }
        }
      }
    }

    this.positions = positions;
    this.widths = widths;
    this.heights = heights;
    this.minMax = minMax;
  }

  private getCoef(key: Stripe): number {
    const cellAlignment = duckCellAlignment(key) ?? this.sheet.getHorizontalAlignment();
    return getCoefForAlignment(cellAlignment);
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    this.initMap(stringBounder);
    return (this.minMax as MinMax).getDimension().delta(this.padding.getBottom() + this.padding.getTop());
  }

  getInnerPosition(_member: string, _stringBounder: StringBounder): XRectangle2D | undefined {
    return undefined;
  }

  drawU(ug: UGraphic): void {
    this.initMap(ug.getStringBounder());
    let target = ug;
    if (this.padding.getLeft() > 0 || this.padding.getTop() > 0) {
      target = target.apply(new UTranslate(this.padding.getLeft(), this.padding.getTop()));
    }
    const stripes = this.stripes as readonly SplitLine[];
    const positions = this.positions as Map<CreoleAtom, Position>;
    for (const line of stripes) {
      for (const atom of line.atoms) {
        // Invariant: same as initMap's own comment above.
        const position = positions.get(atom) as Position;
        this.atomOps.drawU(atom, position.translate(target));
      }
    }
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  getStartingX(_stringBounder: StringBounder, _y: number): number {
    return -this.marginX1;
  }

  getEndingX(stringBounder: StringBounder, _y: number): number {
    return this.calculateDimension(stringBounder).getWidth() + this.marginX2;
  }

  getMinimumWidth(): number {
    return this.minimumWidth;
  }

  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}

/** Upstream: `SheetBlock1#getCoef(HorizontalAlignment)`. Java's own
 *  `alignment == null -> 0` guard is NOT ported: this port's
 *  `HorizontalAlignment` (`geom/HorizontalAlignment.ts`) is a non-optional
 *  string union, and both real callers (`getCoef`, above) already resolve
 *  to a defined value (a stripe's duck-typed `getCellAlignment()`, falling
 *  back to the SHEET's own alignment, which is a required constructor
 *  param) before reaching here -- an unreachable branch given this port's
 *  actual type invariants, not a dropped upstream behavior. */
function getCoefForAlignment(alignment: HorizontalAlignment): number {
  if (alignment === HorizontalAlignment.CENTER) return 2;
  if (alignment === HorizontalAlignment.RIGHT) return 1;
  return 0;
}

/** Upstream: `key instanceof StripeSimple` -> `((StripeSimple)
 *  key).getCellAlignment()`. This port's `Stripe` interface (`Stripe.ts`)
 *  has no `StripeSimple`-flavored runtime tag to `instanceof` against (its
 *  `legacy/StripeSimple.ts` module exports build FUNCTIONS, not a class —
 *  see that file's own doc comment on why `<left>/<center>/<right>`
 *  cell-alignment markup is out of THIS `StripeSimple`'s scope, a
 *  creole-table-cell-only feature). Duck-typing an OPTIONAL
 *  `getCellAlignment()` capability preserves the member (not a reflexive
 *  drop) and is forward-compatible with any future `Stripe` producer that
 *  adds one, matching this port's established `TextBlock#getMagneticBorder`
 *  optional-member idiom. */
function duckCellAlignment(stripe: Stripe): HorizontalAlignment | undefined {
  const candidate = stripe as Partial<{ getCellAlignment(): HorizontalAlignment }>;
  return typeof candidate.getCellAlignment === 'function' ? candidate.getCellAlignment() : undefined;
}
