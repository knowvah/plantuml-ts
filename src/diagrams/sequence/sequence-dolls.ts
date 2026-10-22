/**
 * The teoz englober layout: `Doll` (one `box`) and `Dolls` (all of them),
 * ported with upstream's names.
 *
 * A box is not drawn after the fact around its participants. It takes part in
 * the participant row's constraint solve, in this order
 * (`SequenceDiagramFileMakerTeoz.java:102-116`):
 *
 *   1. `dolls.addConstraints` -- every doll's title-width margins, then the
 *      "frame clears its neighbour" checks before and after it
 *      (`Dolls.java:102-112`);
 *   2. `new PlayingSpace(...)`, which captures `dolls.getMaxX()` with the
 *      margins of step 1 baked in (`PlayingSpace.java:81-84`);
 *   3. `livingSpaces.addConstraints`, the `nextA >= prevE + 10` neighbour rule,
 *      whose `getPosA`/`getPosE` bake the same margins (`LivingSpaces.java:61-71`).
 *
 * The margins live on the participant (`LivingSpace#ensureMarginBefore/After`,
 * `LivingSpace.java:278-299`), shared by every doll that starts or ends on it:
 * {@link LivingSpaceMargins}. A margin a TILE adds later (a note or self loop
 * that grows its own box, `NoteTile#ensureOwnBoxClearsNote`) is seen only by
 * the doll's live checks (`getPosALive`/`getPosELive`, `:341-347`) and its drawn
 * rectangle, never by the baked readers -- {@link LivingSpaceMargins.snapshot}
 * is the bake.
 *
 * Positions are this port's participant-row coordinates: `posB` is a head's
 * left edge `xs[i]`, `posD` its right edge `xs[i] + widths[i]`, `xorigin` is
 * `originX`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Doll.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/Dolls.java
 */
import type { BoxGroup, Participant } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { boxPaint, engloberDimension, type EngloberDimension } from './sequence-layout-box.js';

/** `SkinParam.INT_OR_DECIMAL` (`SkinParam.java:133`). */
const INT_OR_DECIMAL = /^\d+(\.\d+)?$/;

/**
 * `getPaddingTOBEREMOVED(PaddingParam.BOX)` (`Doll.java:271-273`), i.e.
 * `SkinParam#getAsDouble("boxpadding")` (`SkinParam.java:1153-1164`):
 * `same(value)` when the raw value is an unsigned int or decimal, else
 * `same(0)`.
 */
export function boxPaddingOf(raw: string | null | undefined): ClockwiseTopRightBottomLeft {
  return ClockwiseTopRightBottomLeft.same(raw != null && INT_OR_DECIMAL.test(raw) ? Number(raw) : 0);
}

/** `addNeighborConstraintBefore`'s clearance, `10 + padding.getLeft()` (`Doll.java:252`). */
const CLEARANCE_BEFORE = 10;
/** `addConstraintAfter`'s clearance, `20 + left + right` (`Doll.java:268`). */
const CLEARANCE_AFTER = 20;
/** `getMaxX = getPosE().addFixed(10)` (`Doll.java:279-281`). */
const MAX_X_MARGIN = 10;
/** `drawMe`: `x1 = posA - 4`, `x2 = posE + 4` (`Doll.java:205-206`). */
const DRAW_DX = 4;
/** `drawMe`: `ug.apply(new UTranslate(x1, 1))` (`Doll.java:215`). */
const DRAW_DY = 1;
/** `addInternalConstraints`: `marginX = (titleWidth + 10 - actualWidth) / 2` (`Doll.java:230`). */
const TITLE_MARGIN = 10;

/** The margins as `getPosA`/`getPosE` bake them at call time (`LivingSpace.java:293-299`). */
export interface BakedMargins {
  readonly before: readonly number[];
  readonly after: readonly number[];
}

/** Every participant's `marginBefore`/`marginAfter` (`LivingSpace.java:278-291`),
 *  by row index. Mutated only through the two `ensure` methods, which only grow. */
export class LivingSpaceMargins {
  private readonly before: number[];
  private readonly after: number[];

  constructor(size: number) {
    this.before = new Array<number>(size).fill(0);
    this.after = new Array<number>(size).fill(0);
  }

  ensureMarginBefore(index: number, margin: number): void {
    if (margin < 0) throw new Error(`marginBefore ${margin} for participant ${index} must not be negative`);
    this.before[index] = Math.max(this.before[index]!, margin);
  }

  ensureMarginAfter(index: number, margin: number): void {
    if (margin < 0) throw new Error(`marginAfter ${margin} for participant ${index} must not be negative`);
    this.after[index] = Math.max(this.after[index]!, margin);
  }

  marginBefore(index: number): number {
    return this.before[index]!;
  }

  marginAfter(index: number): number {
    return this.after[index]!;
  }

  /** The values a `getPosA()`/`getPosE()` call would bake right now. */
  snapshot(): BakedMargins {
    return { before: [...this.before], after: [...this.after] };
  }
}

/** The solved participant row: `posB = xs[i]`, `posD = xs[i] + widths[i]`. */
export interface ParticipantRow {
  readonly xs: readonly number[];
  readonly widths: readonly number[];
}

/** One drawn englober, `Doll#drawMe`'s rectangle (`Doll.java:203-216`). */
export interface DollFrame {
  readonly englober: BoxGroup;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A registered "frame clears its neighbour" check, `posALive(to) >= base +
 *  fixed`, evaluated live (`Doll.java:250-269`). The base is the previous
 *  participant's `posD` -- `getPosAA`, or `xorigin` when there is none
 *  (`:170-176`) -- plus, when `fromPosE`, its live `marginAfter`. */
interface NeighbourCheck {
  readonly to: number;
  readonly fixed: number;
  readonly fromPosE: boolean;
}

/** What a `Doll` reads from its `TileArguments`. */
interface DollArguments {
  readonly margins: LivingSpaceMargins;
  readonly size: number;
}

/** One `box`: `Doll.java`, teoz half. `participants` are row indices in
 *  living-space order (`Dolls.java:58-65`). */
export class Doll {
  private readonly participants: number[] = [];

  constructor(
    private readonly englober: BoxGroup,
    private readonly title: EngloberDimension,
    private readonly alls: ReadonlyMap<string, Doll>,
    private readonly args: DollArguments,
  ) {}

  addParticipant(index: number): void {
    this.participants.push(index);
  }

  getTitlePreferredHeight(): number {
    return this.title.height;
  }

  /** `Doll#getParent` (`:218-223`). */
  getParent(): Doll | undefined {
    const parent = this.englober.parentId;
    return parent === undefined ? undefined : this.alls.get(parent);
  }

  private first(): number {
    return this.participants[0]!;
  }

  private last(): number {
    return this.participants[this.participants.length - 1]!;
  }

  /**
   * `addInternalConstraints` (`:225-235`). `x1`/`x2` are read with
   * `getCurrentValue()` BEFORE `xorigin.compileNow()`, when every `posB` is
   * still its creation value: `addAtLeast(0)` on the previous `posD`
   * (`SequenceDiagramFileMakerTeoz.java:90-97`, `RealImpl.java:56-62`). So
   * `actualWidth` is the sum of the head widths from first to last, no gaps.
   */
  addInternalConstraints(widths: readonly number[]): void {
    let actualWidth = 0;
    for (let i = this.first(); i <= this.last(); i++) actualWidth += widths[i]!;
    const marginX = (this.title.width + TITLE_MARGIN - actualWidth) / 2;
    if (marginX > 0) {
      this.args.margins.ensureMarginBefore(this.first(), marginX);
      this.args.margins.ensureMarginAfter(this.last(), marginX);
    }
  }

  /** `addNeighborConstraintBefore` (`:250-253`): `posALive(first) >= posAA + 10 + left`. */
  addNeighborConstraintBefore(checks: NeighbourCheck[]): void {
    checks.push({ to: this.first(), fixed: CLEARANCE_BEFORE + this.padding().getLeft(), fromPosE: false });
  }

  /** `addConstraintAfter` (`:261-269`): `next.posALive >= posELive(last) + 20 + left + right`,
   *  none when `last` is the row's last participant. */
  addConstraintAfter(checks: NeighbourCheck[]): void {
    const next = this.last() + 1;
    if (next >= this.args.size) return;
    const padding = this.padding();
    const fixed = CLEARANCE_AFTER + padding.getLeft() + padding.getRight();
    checks.push({ to: next, fixed, fromPosE: true });
  }

  /** `padding()` (`:271-273`). */
  private padding(): ClockwiseTopRightBottomLeft {
    return boxPaddingOf(this.englober.boxPadding);
  }

  /** `getMaxX` (`:279-281`), `posE(last) + 10` with the margin as baked. */
  getMaxX(row: ParticipantRow, baked: BakedMargins): number {
    const last = this.last();
    return row.xs[last]! + row.widths[last]! + baked.after[last]! + MAX_X_MARGIN;
  }

  /**
   * `drawMe` (`:203-216`), called with `group = getParent()`
   * (`Dolls.java:114-118`): `x1 = posA - 4`, `x2 = posE + 4` with the FINAL
   * margins; every ancestor's title height moves the frame down and shortens
   * it; the component is drawn at `UTranslate(x1, 1)` from `top`.
   */
  drawMe(row: ParticipantRow, height: number, top: number): DollFrame {
    const [first, last] = [this.first(), this.last()];
    const x1 = row.xs[first]! - this.args.margins.marginBefore(first) - DRAW_DX;
    const x2 = row.xs[last]! + row.widths[last]! + this.args.margins.marginAfter(last) + DRAW_DX;
    let dy = 0;
    for (let current = this.getParent(); current !== undefined; current = current.getParent())
      dy += current.getTitlePreferredHeight();
    return { englober: this.englober, x: x1, y: top + dy + DRAW_DY, width: x2 - x1, height: height - dy };
  }
}

/** What `Dolls` needs beyond the row: the measurer for the titles and the
 *  row's margins. */
export interface DollsEnv {
  readonly measurer: StringMeasurer;
  readonly margins: LivingSpaceMargins;
}

/** `Dolls.java`: every `Doll`, in `LinkedHashMap` insertion order. */
export class Dolls {
  private readonly alls = new Map<string, Doll>();
  private readonly checks: NeighbourCheck[] = [];
  private readonly margins: LivingSpaceMargins;

  /**
   * `Dolls(TileArguments)` (`:56-65`): each participant, in living-space order,
   * joins every englober of its genealogy, root first
   * (`ParticipantEnglober#getGenealogy`, `ParticipantEnglober.java:89-97`).
   */
  constructor(participants: readonly Participant[], boxes: readonly BoxGroup[], env: DollsEnv) {
    this.margins = env.margins;
    const byId = new Map(boxes.map((b) => [b.id, b] as const));
    const args: DollArguments = { margins: env.margins, size: participants.length };
    participants.forEach((p, index) => {
      for (const englober of genealogyOf(p.boxId, byId)) {
        let already = this.alls.get(englober.id);
        if (already === undefined) {
          const title = engloberDimension(englober.label, boxPaint(englober), env.measurer);
          already = new Doll(englober, title, this.alls, args);
          this.alls.set(englober.id, already);
        }
        already.addParticipant(index);
      }
    });
  }

  size(): number {
    return this.alls.size;
  }

  /** `getOffsetForEnglobers` (`:80-92`): the tallest title chain, a doll's
   *  own title plus every ancestor's. `heightEnglober1` of the file maker. */
  getOffsetForEnglobers(): number {
    let result = 0;
    for (const doll of this.alls.values()) {
      let height = 0;
      for (let current: Doll | undefined = doll; current !== undefined; current = current.getParent())
        height += current.getTitlePreferredHeight();
      result = Math.max(result, height);
    }
    return result;
  }

  /** `addConstraints` (`:102-112`): every doll's internal margins first, then
   *  the before checks, then the after checks. */
  addConstraints(widths: readonly number[]): void {
    for (const doll of this.alls.values()) doll.addInternalConstraints(widths);
    for (const doll of this.alls.values()) doll.addNeighborConstraintBefore(this.checks);
    for (const doll of this.alls.values()) doll.addConstraintAfter(this.checks);
  }

  /**
   * The least `posB(index)` the registered checks allow, given the solved
   * `posD` of the participant before it (`undefined` for the first) -- the
   * checks read the margins live (`LivingSpace#getPosALive`/`getPosELive`,
   * `:341-347`). `-Infinity` when no check targets `index`.
   */
  minPosB(index: number, previousPosD: number | undefined, originX: number): number {
    const margins = this.margins;
    let result = Number.NEGATIVE_INFINITY;
    for (const check of this.checks) {
      if (check.to !== index) continue;
      const after = check.fromPosE ? margins.marginAfter(index - 1) : 0;
      result = Math.max(result, (previousPosD ?? originX) + after + check.fixed + margins.marginBefore(index));
    }
    return result;
  }

  /** `getMaxX` (`:131-140`); `undefined` for no dolls, where `PlayingSpace`
   *  skips the term (`PlayingSpace.java:81-84`). */
  getMaxX(row: ParticipantRow, baked: BakedMargins): number | undefined {
    if (this.size() === 0) return undefined;
    return Math.max(...[...this.alls.values()].map((doll) => doll.getMaxX(row, baked)));
  }

  /** `drawEnglobers` (`:114-118`), in insertion order: parents before children. */
  drawEnglobers(row: ParticipantRow, height: number, top: number): DollFrame[] {
    return [...this.alls.values()].map((doll) => doll.drawMe(row, height, top));
  }
}

/** `ParticipantEnglober#getGenealogy` (`:89-97`): root first, the englober itself last. */
function genealogyOf(boxId: string | undefined, byId: ReadonlyMap<string, BoxGroup>): BoxGroup[] {
  const result: BoxGroup[] = [];
  for (let current = boxId === undefined ? undefined : byId.get(boxId); current !== undefined;) {
    result.unshift(current);
    current = current.parentId === undefined ? undefined : byId.get(current.parentId);
  }
  return result;
}

/**
 * The englobers as the file maker holds them
 * (`SequenceDiagramFileMakerTeoz.java:72-73,84-85,102-113`).
 */
export interface EngloberLayout {
  readonly dolls: Dolls;
  /** The margins as `PlayingSpace` captured `dolls.getMaxX()`, right after
   *  `dolls.addConstraints` (`:112-113`). */
  readonly baked: BakedMargins;
  /** The live margins: tiles grow them after the bake (`addTileMargins`). */
  readonly margins: LivingSpaceMargins;
  /** `heightEnglober1 = dolls.getOffsetForEnglobers()` (`:84`): the body is
   *  drawn this far down (`:148`). */
  readonly heightEnglober1: number;
  /** `heightEnglober2 = heightEnglober1 == 0 ? 0 : 10` (`:85`), added below
   *  the body (`:151,161-162`). */
  readonly heightEnglober2: number;
}

/** `heightEnglober2`'s 10 (`SequenceDiagramFileMakerTeoz.java:85`). */
const HEIGHT_ENGLOBER_2 = 10;

/**
 * `new Dolls(tileArguments)` then `dolls.addConstraints(stringBounder)`
 * (`SequenceDiagramFileMakerTeoz.java:102-112`), over the row's head
 * `widths`, and the two englober heights (`:84-85`). The margins are baked
 * here, where `PlayingSpace` and `LivingSpaces#addConstraints` read them
 * (`:113-114`); a later tile margin is not in `baked`.
 */
export function createEngloberLayout(
  participants: readonly Participant[],
  boxes: readonly BoxGroup[],
  widths: readonly number[],
  measurer: StringMeasurer,
): EngloberLayout {
  const margins = new LivingSpaceMargins(participants.length);
  const dolls = new Dolls(participants, boxes, { measurer, margins });
  dolls.addConstraints(widths);
  const heightEnglober1 = dolls.getOffsetForEnglobers();
  return {
    dolls,
    baked: margins.snapshot(),
    margins,
    heightEnglober1,
    heightEnglober2: heightEnglober1 === 0 ? 0 : HEIGHT_ENGLOBER_2,
  };
}
