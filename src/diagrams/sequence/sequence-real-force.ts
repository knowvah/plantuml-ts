/**
 * The participant row's `Real` graph and its forces, registered in the order
 * `SequenceDiagramFileMakerTeoz#createMainTile` registers them
 * (`teoz/SequenceDiagramFileMakerTeoz.java:88-123`), then settled by
 * {@link RealLine.compile} (`:116`).
 *
 * The order is the point. A {@link RealMax} caches its first read
 * (`real/RealMax.java:89-94`), and that read happens inside pass 1, with the
 * participants it aggregates still partly unmoved -- so which forces came
 * before it decides what it froze at. In this order:
 *
 *   1. the participant chain (`:90-97`): `xorigin.addAtLeast(0)`, then for each
 *      participant `posD.addAtLeast(0)`;
 *   2. `dolls.addConstraints` (`:112`): the englobers' neighbour checks;
 *   3. the tiles' construction (`:113`): a `ref` registers its force when
 *      `PlayingSpace` first reads its `getMinX` (`ReferenceTile.java:94-115,
 *      163-171`, `PlayingSpace.java:93-96`);
 *   4. `livingSpaces.addConstraints` (`:114`, `LivingSpaces.java:61-71`);
 *   5. `mainTile.addConstraints` (`:115`): each tile's forces in tile order,
 *      then `ensureDisjoint`'s (`PlayingSpace.java:163-167`).
 *
 * @see teoz/SequenceDiagramFileMakerTeoz.java
 * @see teoz/LivingSpace.java
 * @see teoz/LivingSpaces.java
 */
import type { BakedMargins, Dolls } from './sequence-dolls.js';
import type {
  Anchor,
  DisjointConstraint,
  RowConstraint,
  SpanConstraint,
} from './sequence-layout-participant-constraints.js';
import {
  AbstractReal,
  createOrigin,
  lineOf,
  max,
  PositiveForce,
  type Real,
  type RealMoveable,
  type RealOrigin,
} from './sequence-real-line.js';

/** What the row's solve reads. */
export interface RowForcesEnv {
  /** Every head's preferred width (`LivingSpace#getPreferredWidth`, `:224-226`). */
  readonly widths: readonly number[];
  /** Every force beyond the row's own, in the order the tiles registered them. */
  readonly constraints: readonly RowConstraint[];
  /** The drawing space's left edge: `xorigin` is 0 upstream, drawn translated. */
  readonly originX: number;
  /** `LivingSpaces#addConstraints`'s `10` (`:67`). */
  readonly participantGap: number;
  /** The margins as `getPosA`/`getPosE` bake them when `livingSpaces.addConstraints` runs. */
  readonly baked: BakedMargins;
  readonly dolls: Dolls;
}

/** One `LivingSpace`'s points (`LivingSpace.java:228-250,293-299`). */
class RowLivingSpace {
  private posC: Real | undefined;
  private posD: Real | undefined;

  constructor(
    readonly posB: Real,
    private readonly width: number,
  ) {}

  /** `getPosC` (`:228-233`): created once, `posB + width / 2`. */
  getPosC(): Real {
    this.posC ??= this.posB.addFixed(this.width / 2);
    return this.posC;
  }

  /** `getPosD` (`:240-246`): created once, `posB + width`. */
  getPosD(): Real {
    this.posD ??= this.posB.addFixed(this.width);
    return this.posD;
  }

  /** `getPosA` (`:293-295`): bakes `marginBefore` as it is NOW. */
  getPosA(marginBefore: number): Real {
    return this.posB.addFixed(-marginBefore);
  }

  /** `getPosE` (`:297-299`): bakes `marginAfter` as it is NOW. */
  getPosE(marginAfter: number): Real {
    return this.getPosD().addFixed(marginAfter);
  }
}

/** `createMainTile:90-97`: the chain of variables each participant's `posB` sits on. */
function createLivingSpaces(origin: RealOrigin, widths: readonly number[]): RowLivingSpace[] {
  let xcurrent: Real = origin.addAtLeast(0);
  return widths.map((width) => {
    const space = new RowLivingSpace(xcurrent, width);
    xcurrent = space.getPosD().addAtLeast(0);
    return space;
  });
}

/** The least `posB` a doll's live neighbour checks allow (`Dolls#minPosB`), read each pass. */
export class DollFloor extends AbstractReal {
  constructor(
    private readonly dolls: Dolls,
    private readonly index: number,
    private readonly previousPosD: Real | undefined,
    private readonly origin: Real,
  ) {
    super(lineOf(origin));
  }

  getCurrentValueInternal(): number {
    const previous = this.previousPosD?.getCurrentValue();
    return this.dolls.minPosB(this.index, previous, this.origin.getCurrentValue());
  }

  getName(): string {
    return `dollFloor ${this.index}`;
  }

  addFixed(): Real {
    throw new Error('DollFloor.addFixed is unsupported');
  }

  addAtLeast(): Real {
    throw new Error('DollFloor.addAtLeast is unsupported');
  }

  ensureBiggerThan(): void {
    throw new Error('DollFloor.ensureBiggerThan is unsupported');
  }
}

/**
 * `Doll#addNeighborConstraintBefore`/`#addConstraintAfter`
 * (`Doll.java:250-269`): `posALive(to) >= base + fixed`, the margin read live
 * (`LivingSpace.java:341-347`). `Dolls` keeps its checks private, so the ones
 * aimed at one participant are one force, at the least `posB` they allow
 * together (`Dolls#minPosB`) -- the same bound, registered once per target.
 */
function addDollsConstraints(spaces: readonly RowLivingSpace[], origin: Real, dolls: Dolls): void {
  spaces.forEach((space, index) => {
    if (dolls.minPosB(index, 0, 0) === Number.NEGATIVE_INFINITY) return;
    const previous = index === 0 ? undefined : spaces[index - 1]!.getPosD();
    const floor = new DollFloor(dolls, index, previous, origin);
    lineOf(origin).addForce(new PositiveForce(floor, space.posB as RealMoveable, 0));
  });
}

/** `LivingSpaces#addConstraints` (`:61-71`). */
function addLivingSpacesConstraints(spaces: readonly RowLivingSpace[], env: RowForcesEnv): void {
  for (let i = 1; i < spaces.length; i++) {
    const point1 = spaces[i - 1]!.getPosE(env.baked.after[i - 1]!);
    const point2 = spaces[i]!.getPosA(env.baked.before[i]!);
    point2.ensureBiggerThan(point1.addFixed(env.participantGap));
  }
}

/** One anchor as a `Real`: `posB`/`posC`/`posD` of its participant, plus its offset. */
function anchorReal(spaces: readonly RowLivingSpace[], anchor: Anchor): Real {
  const space = spaces[anchor.index]!;
  const base = anchor.at === 'B' ? space.posB : anchor.at === 'C' ? space.getPosC() : space.getPosD();
  return anchor.offset === 0 ? base : base.addFixed(anchor.offset);
}

/**
 * A message's, a self message's, a `ref`'s or an exo message's demand
 * (`CommunicationTile.java:404-427`, `CommunicationTileSelf.java:166-184`,
 * `ReferenceTile.java:113`, `CommunicationExoTile.java:176-181`): `right >=
 * left + span`, `left`/`right` the points {@link SpanConstraint} names.
 */
function addSpanForce(c: SpanConstraint, spaces: readonly RowLivingSpace[], origin: Real): void {
  const to = spaces[c.to]!;
  if (c.origin === true) {
    to.getPosC().ensureBiggerThan(origin.addFixed(c.span));
    return;
  }
  const from = spaces[c.from]!;
  if (c.edge === true) {
    to.getPosD().ensureBiggerThan(from.posB.addFixed(c.span));
    return;
  }
  // A create message binds the created head's near EDGE: `getPoint2`
  // (`CommunicationTile.java:435-443`) is its `posB`, or, reversed, its `posD`.
  const left = c.createdIndex === c.from ? from.getPosD() : from.getPosC();
  const right = c.createdIndex === c.to ? to.posB : to.getPosC();
  right.ensureBiggerThan(left.addFixed(c.span));
}

/**
 * `ensureDisjoint` (`PlayingSpace.java:263-266`): `bMin.ensureBiggerThan(aMax)`.
 * `aMax` is one `RealMax` bound by every force of this call; a group's is the
 * field it built once (`GroupingTile.java:984-990`), so every call it takes
 * part in shares it -- and its cache.
 */
function addDisjointForces(c: DisjointConstraint, spaces: readonly RowLivingSpace[], shared: Map<object, Real>): void {
  const build = (): Real => max(c.highs.map((anchor) => anchorReal(spaces, anchor)));
  const aMax = c.highsOwner === undefined ? build() : (shared.get(c.highsOwner) ?? build());
  if (c.highsOwner !== undefined) shared.set(c.highsOwner, aMax);
  for (const low of c.lows) anchorReal(spaces, low).ensureBiggerThan(aMax);
}

/** A `ref`'s force: registered when its tile is built, not by `addConstraints`. */
function isRefConstraint(c: RowConstraint): c is SpanConstraint {
  return !('disjoint' in c) && c.edge === true;
}

/**
 * Solve every participant's `posB`: the port of `xorigin.compileNow()`
 * (`SequenceDiagramFileMakerTeoz.java:116`). Returns each head's left edge,
 * `originX` added back to the origin-0 solution upstream draws translated.
 */
export function solveParticipantRow(env: RowForcesEnv): number[] {
  const origin = createOrigin();
  const spaces = createLivingSpaces(origin, env.widths);
  addDollsConstraints(spaces, origin, env.dolls);
  const refs = env.constraints.filter(isRefConstraint);
  for (const c of refs) addSpanForce(c, spaces, origin);
  addLivingSpacesConstraints(spaces, env);
  const shared = new Map<object, Real>();
  for (const c of env.constraints) {
    if ('disjoint' in c) addDisjointForces(c, spaces, shared);
    else if (c.edge !== true) addSpanForce(c, spaces, origin);
  }
  origin.compileNow();
  return spaces.map((space) => space.posB.getCurrentValue() + env.originX);
}
