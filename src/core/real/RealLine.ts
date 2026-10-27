import type { AbstractReal } from './AbstractReal.js';
import { IllegalStateException, UnsupportedOperationException } from './AbstractReal.js';
import type { PositiveForce } from './PositiveForce.js';
import type { Real } from './Real.js';

/**
 * `RealLine` — one axis: its forces, every {@link AbstractReal} on it, and
 * the fixed-point loop that settles them.
 *
 * Collections: `all` is a `HashSet<AbstractReal>` of identity-hashed objects
 * (`RealLine.java:51`); its iteration order is not defined upstream, and the
 * only loop over it (`:97-106`) takes a min and a max, which do not depend on
 * order. The JS `Set` iterates in insertion order. `forces` is an
 * `ArrayList` (`:47`), iterated in order (`:82`) as upstream.
 *
 * `System.err.println` in `printCounter` (`:119-126`) is not mirrored (no
 * console in `src/`, eslint `no-console`; gep T4d ruling), but the counter
 * map (`:79`, `incCounter` `:128-131`) and the throw (`:113`, message
 * verbatim) are kept. The commented-out prints (`:54-56,83,87,92,94,99,107`)
 * are comments upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealLine.java:45-184
 */
export class RealLine {
  /** `RealLine.java:75` `static private int CPT` (written at `:93`, never read). */
  static CPT = 0;

  private readonly forces: PositiveForce[] = [];

  private min = 0;
  private max = 0;
  private readonly all = new Set<AbstractReal>();

  /** `RealLine.java:53-57`: the body is entirely commented out upstream. */
  register(v: number): void {
    void v;
  }

  /** `RealLine.java:59-61`. */
  register2(abstractReal: AbstractReal): void {
    this.all.add(abstractReal);
  }

  /** `RealLine.java:63-65`. */
  getAbsoluteMin(): number {
    return this.min;
  }

  /** `RealLine.java:67-69`. */
  getAbsoluteMax(): number {
    return this.max;
  }

  /** `RealLine.java:71-73`. */
  addForce(force: PositiveForce): void {
    this.forces.push(force);
  }

  /** `RealLine.java:77-117`. */
  compile(): void {
    let cpt = 0;
    const counter = new Map<PositiveForce, number>();
    for (;;) {
      let done = true;
      for (const f of this.forces) {
        const change = f.apply();
        if (change) {
          RealLine.incCounter(counter, f);
          done = false;
        }
      }
      if (done) {
        RealLine.CPT += cpt;
        this.min = 0;
        this.max = 0;
        // Order-independent (see the class comment): min/max over a HashSet.
        for (const real of this.all) {
          const v = real.getCurrentValue();
          if (v > this.max) this.max = v;
          if (v < this.min) this.min = v;
        }
        return;
      }
      cpt++;
      if (cpt > 99999) {
        RealLine.printCounter();
        throw new IllegalStateException('Infinite Loop?');
      }
    }
  }

  /** `RealLine.java:119-126`: only prints, which is not mirrored. */
  private static printCounter(): void {
    // RealLine.java:121,124: System.err.println("force=" ...), ("count=" ...)
  }

  /** `RealLine.java:128-131`. */
  private static incCounter(counter: Map<PositiveForce, number>, f: PositiveForce): void {
    const v = counter.get(f);
    counter.set(f, v === undefined ? 1 : v + 1);
  }

  /** `RealLine.java:133-135` (package-private). */
  asMaxAbsolute(): Real {
    return new MaxAbsolute(this);
  }

  /** `RealLine.java:137-139` (package-private). */
  asMinAbsolute(): Real {
    return new MinAbsolute(this);
  }
}

/**
 * `RealLine.AbstractAbsolute` (`RealLine.java:153-182`): an inner class
 * upstream, so it reads the outer line; here the line is a field.
 */
abstract class AbstractAbsolute implements Real {
  constructor(protected readonly outer: RealLine) {}

  /** `RealLine.java:155-156`. */
  printCreationStackTrace(): void {
    // empty upstream
  }

  /** `RealLine.java:158-160`: `getClass().getName()`, the JVM binary name. */
  abstract getName(): string;

  abstract getCurrentValue(): number;

  /** `RealLine.java:162-164`. */
  addFixed(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealLine.java:166-168`. */
  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealLine.java:170-172`. */
  ensureBiggerThan(other: Real): void {
    void other;
    throw new UnsupportedOperationException();
  }

  /** `RealLine.java:174-176`. */
  getMaxAbsolute(): Real {
    return this.outer.asMaxAbsolute();
  }

  /** `RealLine.java:178-180`. */
  getMinAbsolute(): Real {
    return this.outer.asMinAbsolute();
  }
}

/** `RealLine.MaxAbsolute` (`RealLine.java:141-145`). */
class MaxAbsolute extends AbstractAbsolute {
  getName(): string {
    return 'net.sourceforge.plantuml.real.RealLine$MaxAbsolute';
  }

  getCurrentValue(): number {
    return this.outer.getAbsoluteMax();
  }
}

/** `RealLine.MinAbsolute` (`RealLine.java:147-151`). */
class MinAbsolute extends AbstractAbsolute {
  getName(): string {
    return 'net.sourceforge.plantuml.real.RealLine$MinAbsolute';
  }

  getCurrentValue(): number {
    return this.outer.getAbsoluteMin();
  }
}
