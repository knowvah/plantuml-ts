/**
 * The `real` package port (`sequence-real-line.ts`): every expectation is a
 * value the Java produces for the same graph, derived from the quoted lines.
 */
import { describe, expect, it } from 'vitest';
import {
  AbstractReal,
  createOrigin,
  lineOf,
  max,
  MAX_PASSES,
  min,
  PositiveForce,
  RealDelta,
  RealDeltaLive,
  RealImpl,
  RealLine,
  RealMax,
  RealMin,
  ulp,
  withLiveOffset,
  type Real,
  type RealOrigin,
} from '../../../src/diagrams/sequence/sequence-real-line.js';

/** A fresh line with one variable per value, as `RealUtils.createOrigin` + `addAtLeast` builds them. */
function variables(...values: number[]): { line: RealLine; vars: RealImpl[] } {
  const line = new RealLine();
  return { line, vars: values.map((v, i) => new RealImpl(`v${i}`, line, v)) };
}

/** A candidate that is not an `AbstractReal`, so it carries no line (`RealMax.java:82`). */
function foreign(read: () => number): Real {
  return {
    getName: () => 'foreign',
    getCurrentValue: read,
    addFixed: () => {
      throw new Error('unused');
    },
    addAtLeast: () => {
      throw new Error('unused');
    },
    ensureBiggerThan: () => {
      throw new Error('unused');
    },
  };
}

describe('ulp (Math.ulp)', () => {
  it('is the gap to the next double of larger magnitude', () => {
    expect(ulp(1)).toBe(2 ** -52);
    expect(ulp(-1)).toBe(2 ** -52);
    expect(ulp(1024)).toBe(2 ** -42);
    expect(ulp(0)).toBe(Number.MIN_VALUE);
  });

  it('follows the Java special cases', () => {
    expect(ulp(Number.MAX_VALUE)).toBe(2 ** 971);
    expect(ulp(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
    expect(ulp(Number.NaN)).toBeNaN();
  });
});

describe('RealImpl (RealImpl.java:38-72)', () => {
  it('addAtLeast starts at this + delta and is forced to stay there (:56-63)', () => {
    const { vars } = variables(10);
    const next = vars[0]!.addAtLeast(5);
    expect(next.getCurrentValue()).toBe(15);
    expect(next.getName()).toBe('addAtLeast5');
    vars[0]!.move(20);
    next.ensureBiggerThan(vars[0]!.addFixed(5));
    vars[0]!.compileNow();
    expect(next.getCurrentValue()).toBe(35);
  });

  it('ensureBiggerThan registers `this >= other` (:65-67)', () => {
    const { vars } = variables(0, 8);
    vars[0]!.ensureBiggerThan(vars[1]!);
    vars[0]!.compileNow();
    expect(vars[0]!.getCurrentValue()).toBe(8);
  });

  it('createOrigin is a variable at 0 on its own line (RealUtils.java:44-48)', () => {
    const origin: RealOrigin = createOrigin();
    expect(origin.getCurrentValue()).toBe(0);
    expect(origin.getName()).toBe('O');
    const above = origin.addAtLeast(0);
    expect(lineOf(above)).toBe(lineOf(origin));
  });
});

describe('RealDelta (RealDelta.java:38-77)', () => {
  it('reads delegated + diff and moves its delegate', () => {
    const { vars } = variables(10);
    const delta = vars[0]!.addFixed(3) as RealDelta;
    expect(delta.getCurrentValue()).toBe(13);
    delta.move(4);
    expect(vars[0]!.getCurrentValue()).toBe(14);
    expect(delta.getName()).toBe('[Delegated d=3]');
  });

  it('ensureBiggerThan bounds the delegate by other - diff (:69-71)', () => {
    const { vars } = variables(0, 10);
    vars[0]!.addFixed(3).ensureBiggerThan(vars[1]!);
    vars[0]!.compileNow();
    expect(vars[0]!.getCurrentValue()).toBe(7);
  });

  it('addAtLeast wraps the delegate`s fresh variable (:65-67)', () => {
    const { vars } = variables(10);
    const next = vars[0]!.addFixed(3).addAtLeast(2);
    expect(next.getCurrentValue()).toBe(15);
    expect(next).toBeInstanceOf(RealDelta);
  });

  it('takes its line from the delegate, and only an AbstractReal has one (RealDelta.java:55)', () => {
    const { vars } = variables(1);
    expect(lineOf(new RealDelta(vars[0]!, 1))).toBe(lineOf(vars[0]!));
    expect(
      () =>
        new RealDelta(
          foreign(() => 0),
          1,
        ),
    ).toThrow(TypeError);
  });
});

describe('RealDeltaLive (RealDeltaLive.java:50-78)', () => {
  it('reads its offset at every resolution, so a later growth is seen', () => {
    const { vars } = variables(10);
    let margin = 2;
    const live = withLiveOffset(vars[0]!, () => margin);
    expect(live.getCurrentValue()).toBe(12);
    margin = 5;
    expect(live.getCurrentValue()).toBe(15);
    expect(live).toBeInstanceOf(RealDeltaLive);
  });

  it('ensureBiggerThan negates the live offset (:70-72)', () => {
    const { vars } = variables(0, 10);
    let margin = 1;
    withLiveOffset(vars[0]!, () => margin).ensureBiggerThan(vars[1]!);
    margin = 4;
    vars[0]!.compileNow();
    expect(vars[0]!.getCurrentValue()).toBe(6);
  });

  it('addAtLeast and move pass through the delegate (:66-68,74-76)', () => {
    const { vars } = variables(10);
    const live = new RealDeltaLive(vars[0]!, () => 3);
    expect(live.addAtLeast(2).getCurrentValue()).toBe(15);
    live.move(1);
    expect(vars[0]!.getCurrentValue()).toBe(11);
    expect(live.getName()).toBe('[DelegatedLive]');
  });
});

describe('RealMax (RealMax.java:42-134)', () => {
  it('caches the value of its FIRST read for good (:89-94,109-111)', () => {
    const { vars } = variables(10, 4);
    const m = max([vars[0]!, vars[1]!]);
    expect(m.getCurrentValue()).toBe(10);
    vars[1]!.move(100);
    expect(vars[1]!.getCurrentValue()).toBe(104);
    expect(m.getCurrentValue()).toBe(10);
  });

  it('is not resolved until read: a move before the first read is seen', () => {
    const { vars } = variables(10, 4);
    const m = new RealMax([vars[0]!, vars[1]!]);
    vars[1]!.move(100);
    expect(m.getCurrentValue()).toBe(104);
    expect(m.getName()).toBe('max 2');
  });

  it('takes the line of its first candidate and needs one (:81-83)', () => {
    const { vars } = variables(1);
    expect(lineOf(max([vars[0]!]))).toBe(lineOf(vars[0]!));
    expect(() => max([])).toThrow('at least one candidate');
  });

  it('refuses addAtLeast and ensureBiggerThan (:122-128), and addFixed wraps it', () => {
    const { vars } = variables(1);
    const m = new RealMax([vars[0]!]);
    expect(() => m.addAtLeast()).toThrow('unsupported');
    expect(() => m.ensureBiggerThan()).toThrow('unsupported');
    expect(m.addFixed(2).getCurrentValue()).toBe(3);
  });

  it('stops a candidate that depends on the max itself (:95-103)', () => {
    const { vars } = variables(1);
    const holder: { max?: Real } = {};
    const loop = foreign(() => holder.max!.getCurrentValue());
    const self = new RealMax([vars[0]!, loop]);
    holder.max = self;
    expect(() => self.getCurrentValue()).toThrow('Infinite recursion?');
    // The depth counter unwinds: an unrelated max still resolves.
    expect(max([vars[0]!]).getCurrentValue()).toBe(1);
  });
});

describe('RealMin (RealMin.java:42-95)', () => {
  it('caches the value of its FIRST read for good (:55-70)', () => {
    const { vars } = variables(10, 4);
    const m = min([vars[0]!, vars[1]!]);
    expect(m.getCurrentValue()).toBe(4);
    vars[1]!.move(100);
    expect(m.getCurrentValue()).toBe(4);
    expect(m.getName()).toBe('min 2');
  });

  it('ensureBiggerThan binds every candidate and reads none (:81-85)', () => {
    const { vars } = variables(0, 3, 50);
    const m = new RealMin([vars[0]!, vars[1]!]);
    m.ensureBiggerThan(vars[2]!);
    vars[0]!.compileNow();
    expect([vars[0]!.getCurrentValue(), vars[1]!.getCurrentValue()]).toEqual([50, 50]);
    // Never read while binding, so the first read sees the pushed values.
    expect(m.getCurrentValue()).toBe(50);
  });

  it('refuses addAtLeast (:77-79), and addFixed wraps it', () => {
    const { vars } = variables(1);
    const m = new RealMin([vars[0]!]);
    expect(() => m.addAtLeast()).toThrow('unsupported');
    expect(m.addFixed(2).getCurrentValue()).toBe(3);
  });
});

describe('PositiveForce (PositiveForce.java:38-106)', () => {
  it('pushes moving to fixed + distance and reports it moved (:80-103)', () => {
    const { vars } = variables(0, 10);
    const force = new PositiveForce(vars[1]!, vars[0]!, 4);
    expect(force.apply()).toBe(true);
    expect(vars[0]!.getCurrentValue()).toBe(14);
    expect(force.apply()).toBe(false);
  });

  it('leaves a shortfall inside the 1e-6 floor alone, moves one past it (:91-93)', () => {
    const { vars } = variables(0, 5e-7, 5e-6);
    expect(new PositiveForce(vars[1]!, vars[0]!, 0).apply()).toBe(false);
    expect(vars[0]!.getCurrentValue()).toBe(0);
    expect(new PositiveForce(vars[2]!, vars[0]!, 0).apply()).toBe(true);
    expect(vars[0]!.getCurrentValue()).toBe(5e-6);
  });

  it('scales the tolerance with the magnitude: 1000 ulps (:82-92)', () => {
    const big = 2 ** 50;
    const tolerance = 1000 * ulp(big);
    const { vars } = variables(big, big + tolerance / 2, big + tolerance * 4);
    expect(new PositiveForce(vars[1]!, vars[0]!, 0).apply()).toBe(false);
    expect(new PositiveForce(vars[2]!, vars[0]!, 0).apply()).toBe(true);
  });

  it('refuses to bind a Real to itself (:47-49)', () => {
    const { vars } = variables(0);
    expect(() => new PositiveForce(vars[0]!, vars[0]!, 0)).toThrow('itself');
  });

  it('describes itself (:60-62)', () => {
    const { vars } = variables(0, 1);
    expect(new PositiveForce(vars[1]!, vars[0]!, 2).toString()).toBe('PositiveForce fixed=v1 moving=v0 min=2');
  });

  it('reads moving before fixed (:68-71): a RealMax is first read on the fixed side', () => {
    const reads: string[] = [];
    class Watched extends RealImpl {
      override getCurrentValueInternal(): number {
        reads.push(this.getName());
        return super.getCurrentValueInternal();
      }
    }
    const line = new RealLine();
    new PositiveForce(new Watched('fixed', line, 7), new Watched('moving', line, 0), 0).apply();
    expect(reads).toEqual(['moving', 'fixed']);
  });
});

describe('RealLine#compile (RealLine.java:77-117)', () => {
  it('applies the forces in creation order until a pass moves nothing', () => {
    const { line, vars } = variables(0, 0, 0);
    // Created in the order that needs two passes: c >= b, b >= a, a >= 10.
    line.addForce(new PositiveForce(vars[1]!, vars[2]!, 1));
    line.addForce(new PositiveForce(vars[0]!, vars[1]!, 1));
    line.addForce(new PositiveForce(new RealImpl('ten', line, 10), vars[0]!, 0));
    line.compile();
    expect(vars.map((v) => v.getCurrentValue())).toEqual([10, 11, 12]);
  });

  it('is a no-op without forces', () => {
    const { line, vars } = variables(3);
    line.compile();
    expect(vars[0]!.getCurrentValue()).toBe(3);
  });

  it('throws "Infinite Loop?" past 99999 passes, naming the forces that kept moving (:111-114)', () => {
    const { line, vars } = variables(0, 0);
    line.addForce(new PositiveForce(vars[1]!, vars[0]!, 1));
    line.addForce(new PositiveForce(vars[0]!, vars[1]!, 1));
    expect(() => line.compile()).toThrow(/Infinite Loop\? count=\d+ for PositiveForce fixed=v1 moving=v0 min=1/);
    expect(MAX_PASSES).toBe(99999);
  });

  it('a force whose fixed point is a RealMax terminates only because the max froze (RealMax.java:89-94)', () => {
    // a >= max(b) and b >= a + 1: with a live max this is the loop above.
    const { line, vars } = variables(0, 5);
    const frozen = new RealMax([vars[1]!]);
    line.addForce(new PositiveForce(frozen, vars[0]!, 0));
    line.addForce(new PositiveForce(vars[0]!, vars[1]!, 1));
    line.compile();
    expect(vars.map((v) => v.getCurrentValue())).toEqual([5, 6]);
  });
});

describe('AbstractReal', () => {
  it('getCurrentValue returns the internal value (AbstractReal.java:53-57)', () => {
    class Constant extends AbstractReal {
      getCurrentValueInternal(): number {
        return 42;
      }
      getName(): string {
        return 'c';
      }
      addFixed(): Real {
        throw new Error('unused');
      }
      addAtLeast(): Real {
        throw new Error('unused');
      }
      ensureBiggerThan(): void {
        throw new Error('unused');
      }
    }
    expect(new Constant(new RealLine()).getCurrentValue()).toBe(42);
  });
});
