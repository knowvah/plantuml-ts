/**
 * The `real` package: upstream's lazily-resolved coordinates and the
 * Gauss-Seidel solver that settles them. A faithful port of
 * `net/sourceforge/plantuml/real/*.java`, in upstream's names and order.
 *
 * Teoz lays a sequence diagram's participants out by building a graph of
 * {@link Real}s -- `posB`, `posC`, `posD` and the points tiles derive from
 * them -- joined by {@link PositiveForce}s (`a >= b + distance`), then calling
 * {@link RealLine.compile}: apply every force in creation order, again and
 * again, until a full pass moves nothing (`RealLine.java:77-110`). That loop is
 * not a general constraint solver. Its answer depends on force ORDER, because a
 * {@link RealMax}/{@link RealMin} caches the value it resolves at its FIRST
 * `getCurrentValue()` and never again (`RealMax.java:89-94,109-111`,
 * `RealMin.java:55-60,69`): the first read happens inside the first pass, with
 * the participants it aggregates still partly unmoved. So reproducing the jar
 * means reproducing the creation order and the initial values, not just the
 * fixed point (`plans/sequence-divergence-drive-3/diagnosis/leftovers.md` M2).
 *
 * Not ported, because nothing a participant row reaches uses them:
 * `RealMiddle`/`RealMiddle2`, `RealDebug` (creation stack traces),
 * `MaxAbsolute`/`MinAbsolute` and `RealLine`'s `all`/`min`/`max` bookkeeping
 * (`:49-61,95-107`), which only feed those two.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/Real.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealLine.java
 */

/** `RealLine#compile`'s pass cap: `if (cpt > 99999) throw "Infinite Loop?"` (`RealLine.java:111-114`). */
export const MAX_PASSES = 99999;

/** `RealMax.MAX_RECURSION_DEPTH` (`RealMax.java:61`). */
const MAX_RECURSION_DEPTH = 1000;

/** `Double.MAX_VALUE`, the "not resolved yet" sentinel of `RealMax#cache`/`RealMin#cache`
 *  (`RealMax.java:89`, `RealMin.java:55`). */
const UNRESOLVED = Number.MAX_VALUE;

/** `PositiveForce`'s floor on the tolerance (`PositiveForce.java:91`). */
const EPSILON_FLOOR = 0.000001;

/** `PositiveForce`'s ulp multiplier (`PositiveForce.java:92`). */
const EPSILON_ULPS = 1000;

/** `Real.java:38-50`: a coordinate that may not be known until the line is solved. */
export interface Real {
  getName(): string;
  getCurrentValue(): number;
  addFixed(delta: number): Real;
  addAtLeast(delta: number): Real;
  ensureBiggerThan(other: Real): void;
}

/** `RealOrigin.java:38-41`: a {@link Real} that can solve its own line. */
export interface RealOrigin extends Real {
  compileNow(): void;
}

const ULP_VIEW = new DataView(new ArrayBuffer(8));

/** `Math.ulp(double)`: the gap to the next double of larger magnitude. */
export function ulp(value: number): number {
  const magnitude = Math.abs(value);
  if (Number.isNaN(magnitude) || magnitude === Number.POSITIVE_INFINITY) return magnitude;
  if (magnitude === Number.MAX_VALUE) return 2 ** 971;
  ULP_VIEW.setFloat64(0, magnitude);
  ULP_VIEW.setBigUint64(0, ULP_VIEW.getBigUint64(0) + 1n);
  return ULP_VIEW.getFloat64(0) - magnitude;
}

/**
 * `RealLine.java:45-184`: every force of one line, and the loop that settles it.
 */
export class RealLine {
  private readonly forces: PositiveForce[] = [];

  /** `addForce` (`:71-73`). */
  addForce(force: PositiveForce): void {
    this.forces.push(force);
  }

  /**
   * `compile` (`:77-117`): apply the forces in creation order, repeatedly,
   * until a whole pass changes nothing. `cpt > 99999` is upstream's own
   * non-termination guard (`:111-114`) and throws, as there.
   */
  compile(): void {
    const counter = new Map<PositiveForce, number>();
    for (let cpt = 0; ; cpt++) {
      let done = true;
      for (const force of this.forces) {
        if (force.apply()) {
          counter.set(force, (counter.get(force) ?? 0) + 1);
          done = false;
        }
      }
      if (done) return;
      if (cpt + 1 > MAX_PASSES) throw new Error(`Infinite Loop? ${describeCounter(counter)}`);
    }
  }
}

/** `printCounter` (`RealLine.java:119-126`), as the error's text instead of stderr. */
function describeCounter(counter: ReadonlyMap<PositiveForce, number>): string {
  return [...counter].map(([force, count]) => `count=${count} for ${force.toString()}`).join('; ');
}

/** The line a {@link Real} belongs to: `((AbstractReal) real).getLine()`
 *  (`RealDelta.java:55`, `RealMax.java:81-83`). */
export function lineOf(real: Real): RealLine {
  if (real instanceof AbstractReal) return real.getLine();
  throw new TypeError(`${real.getName()} is not an AbstractReal`);
}

/** `AbstractReal.java:38-67`. */
export abstract class AbstractReal implements Real {
  constructor(private readonly line: RealLine) {}

  getLine(): RealLine {
    return this.line;
  }

  abstract getCurrentValueInternal(): number;
  abstract getName(): string;
  abstract addFixed(delta: number): Real;
  abstract addAtLeast(delta: number): Real;
  abstract ensureBiggerThan(other: Real): void;

  /** `getCurrentValue` (`:53-57`); the `line.register(result)` it calls is a no-op upstream (`RealLine.java:53-57`). */
  getCurrentValue(): number {
    return this.getCurrentValueInternal();
  }
}

/** `RealMoveable.java:40-74`: a {@link Real} a force can push. */
export abstract class RealMoveable extends AbstractReal {
  constructor(
    line: RealLine,
    private readonly name: string,
  ) {
    super(line);
  }

  abstract move(delta: number): void;

  /** `addFixed` (`:62-64`). */
  addFixed(delta: number): Real {
    return new RealDelta(this, delta);
  }

  getName(): string {
    return this.name;
  }
}

/**
 * `RealImpl.java:38-72`: a variable. It holds a value and is what a force
 * actually moves; every other {@link Real} is derived from one.
 */
export class RealImpl extends RealMoveable implements RealOrigin {
  constructor(
    name: string,
    line: RealLine,
    private currentValue: number,
  ) {
    super(line, name);
  }

  /** `move` (`:47-49`). */
  move(delta: number): void {
    this.currentValue += delta;
  }

  getCurrentValueInternal(): number {
    return this.currentValue;
  }

  /** `addAtLeast` (`:56-63`): a fresh variable starting at `this + delta`, forced to stay there or beyond. */
  addAtLeast(delta: number): Real {
    const result = new RealImpl(`addAtLeast${delta}`, this.getLine(), this.currentValue + delta);
    this.getLine().addForce(new PositiveForce(this, result, delta));
    return result;
  }

  /** `ensureBiggerThan` (`:65-67`): `this >= other`. */
  ensureBiggerThan(other: Real): void {
    this.getLine().addForce(new PositiveForce(other, this, 0));
  }

  /** `compileNow` (`:69-71`). */
  compileNow(): void {
    this.getLine().compile();
  }
}

/** `RealDelta.java:38-77`: `delegated + diff`. A move or a bound passes through to the delegate. */
export class RealDelta extends RealMoveable {
  constructor(
    private readonly delegated: Real,
    private readonly diff: number,
  ) {
    super(lineOf(delegated), `[Delegated d=${diff}]`);
  }

  getCurrentValueInternal(): number {
    return this.delegated.getCurrentValue() + this.diff;
  }

  /** `addAtLeast` (`:65-67`). */
  addAtLeast(delta: number): Real {
    return new RealDelta(this.delegated.addAtLeast(delta), this.diff);
  }

  /** `ensureBiggerThan` (`:69-71`): `delegated >= other - diff`. */
  ensureBiggerThan(other: Real): void {
    this.delegated.ensureBiggerThan(new RealDelta(other, -this.diff));
  }

  /** `move` (`:73-75`). */
  move(delta: number): void {
    (this.delegated as RealMoveable).move(delta);
  }
}

/**
 * `RealDeltaLive.java:50-78`: {@link RealDelta} with the offset read each time,
 * for an offset that may still grow after the Real is built (a box margin).
 */
export class RealDeltaLive extends RealMoveable {
  constructor(
    private readonly delegated: Real,
    private readonly delta: () => number,
  ) {
    super(lineOf(delegated), '[DelegatedLive]');
  }

  getCurrentValueInternal(): number {
    return this.delegated.getCurrentValue() + this.delta();
  }

  /** `addAtLeast` (`:66-68`). */
  addAtLeast(d: number): Real {
    return new RealDeltaLive(this.delegated.addAtLeast(d), this.delta);
  }

  /** `ensureBiggerThan` (`:70-72`). */
  ensureBiggerThan(other: Real): void {
    this.delegated.ensureBiggerThan(new RealDeltaLive(other, () => -this.delta()));
  }

  /** `move` (`:74-76`). */
  move(d: number): void {
    (this.delegated as RealMoveable).move(d);
  }
}

/** The nesting of `RealMax` evaluations on the stack: `RealMax.RECURSION_DEPTH` (`:62-67`). */
let recursionDepth = 0;

/** `RealMax.java:42-134`: the greatest of its candidates, resolved ONCE. */
export class RealMax extends AbstractReal {
  private readonly all: Real[];
  private cache = UNRESOLVED;

  constructor(reals: readonly Real[]) {
    super(RealMax.line(reals));
    this.all = [...reals];
  }

  /** `line` (`:81-83`). */
  static line(reals: readonly Real[]): RealLine {
    const first = reals[0];
    if (first === undefined) throw new Error('a RealMax or RealMin needs at least one candidate');
    return lineOf(first);
  }

  getName(): string {
    return `max ${this.all.length}`;
  }

  /**
   * `getCurrentValueInternal` (`:91-116`): the first call resolves and caches
   * (`cache = result`, `:111`); every later one returns the cache (`:93-94`),
   * whatever the candidates have since become. The depth guard (`:95-103`)
   * stops a candidate that depends on this very max.
   */
  getCurrentValueInternal(): number {
    if (this.cache !== UNRESOLVED) return this.cache;
    recursionDepth++;
    try {
      if (recursionDepth > MAX_RECURSION_DEPTH) throw new Error(`Infinite recursion? The faulty ${this.getName()}`);
      let result = this.all[0]!.getCurrentValue();
      for (let i = 1; i < this.all.length; i++) {
        const v = this.all[i]!.getCurrentValue();
        if (v > result) result = v;
      }
      this.cache = result;
      return result;
    } finally {
      recursionDepth--;
    }
  }

  addFixed(delta: number): Real {
    return new RealDelta(this, delta);
  }

  /** `:122-124`. */
  addAtLeast(): Real {
    throw new Error('RealMax.addAtLeast is unsupported');
  }

  /** `:126-128`. */
  ensureBiggerThan(): void {
    throw new Error('RealMax.ensureBiggerThan is unsupported');
  }
}

/** `RealMin.java:42-95`: the least of its candidates, resolved ONCE. */
export class RealMin extends AbstractReal {
  private readonly all: Real[];
  private cache = UNRESOLVED;

  constructor(reals: readonly Real[]) {
    super(RealMax.line(reals));
    this.all = [...reals];
  }

  getName(): string {
    return `min ${this.all.length}`;
  }

  /** `getCurrentValueInternal` (`:57-71`): cached at the first read, as {@link RealMax}. */
  getCurrentValueInternal(): number {
    if (this.cache !== UNRESOLVED) return this.cache;
    let result = this.all[0]!.getCurrentValue();
    for (let i = 1; i < this.all.length; i++) {
      const v = this.all[i]!.getCurrentValue();
      if (v < result) result = v;
    }
    this.cache = result;
    return result;
  }

  addFixed(delta: number): Real {
    return new RealDelta(this, delta);
  }

  /** `:77-79`. */
  addAtLeast(): Real {
    throw new Error('RealMin.addAtLeast is unsupported');
  }

  /** `ensureBiggerThan` (`:81-85`): every candidate is bound, none is read. */
  ensureBiggerThan(other: Real): void {
    for (const r of this.all) r.ensureBiggerThan(other);
  }
}

/**
 * `PositiveForce.java:38-106`: `moving >= fixed + minimumDistance`, enforced by
 * pushing `moving` right.
 */
export class PositiveForce {
  constructor(
    private readonly fixedPoint: Real,
    private readonly movingPoint: RealMoveable,
    private readonly minimunDistance: number,
  ) {
    if (fixedPoint === movingPoint) throw new Error('a force cannot bind a Real to itself');
  }

  toString(): string {
    return `PositiveForce fixed=${this.fixedPoint.getName()} moving=${this.movingPoint.getName()} min=${this.minimunDistance}`;
  }

  /**
   * `apply` (`:64-104`): reads moving then fixed (`:68-71`, the order the first
   * read of a cached {@link RealMax} follows), and moves `moving` only when it
   * is short by more than a tolerance that scales with the operands'
   * magnitude -- `max(1e-6, 1000 * ulp(max(|moving|, |fixed|)))` (`:91-92`).
   * Returns whether it moved.
   */
  apply(): boolean {
    const movingPointValue = this.movingPoint.getCurrentValue();
    const fixedPointValue = this.fixedPoint.getCurrentValue();
    const distance = movingPointValue - fixedPointValue;
    const diff = distance - this.minimunDistance;
    const epsilon = Math.max(
      EPSILON_FLOOR,
      EPSILON_ULPS * ulp(Math.max(Math.abs(movingPointValue), Math.abs(fixedPointValue))),
    );
    if (diff >= -epsilon) return false;
    this.movingPoint.move(-diff);
    return true;
  }
}

/** `RealUtils.createOrigin` (`:44-48`): a fresh line, and its variable at 0. */
export function createOrigin(): RealOrigin {
  return new RealImpl('O', new RealLine(), 0);
}

/** `RealUtils.withLiveOffset` (`:57-59`). */
export function withLiveOffset(base: Real, offset: () => number): Real {
  return new RealDeltaLive(base, offset);
}

/** `RealUtils.max` (`:65-71`). */
export function max(reals: readonly Real[]): Real {
  return new RealMax(reals);
}

/** `RealUtils.min` (`:73-79`). */
export function min(reals: readonly Real[]): Real {
  return new RealMin(reals);
}
