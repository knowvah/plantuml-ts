import type { Real } from './Real.js';
import type { RealLine } from './RealLine.js';

/**
 * `java.lang.IllegalStateException`, as thrown by `RealLine.java:113`,
 * `RealMax.java:102` and caught by `PositiveForce.java:72`.
 * Not in `real/` upstream (it is a JDK class); it lives here because
 * `AbstractReal` is the one module every other file already imports.
 */
export class IllegalStateException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'IllegalStateException';
  }
}

/** `java.lang.IllegalArgumentException` (`PositiveForce.java:48`). */
export class IllegalArgumentException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'IllegalArgumentException';
  }
}

/** `java.lang.UnsupportedOperationException` (`RealMax.java:123` etc.). */
export class UnsupportedOperationException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UnsupportedOperationException';
  }
}

/** `java.lang.ClassCastException`, for the `(AbstractReal)`/`(RealMoveable)` casts. */
export class ClassCastException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ClassCastException';
  }
}

/**
 * `java.lang.Double.toString(double)` for the names and `toString`s that
 * concatenate a `double` (`RealDelta.java:55`, `RealImpl.java:60`,
 * `PositiveForce.java:61`): at least one fractional digit, and the
 * `d.dddE±n` form outside `[1e-3, 1e7)`. Digits are the shortest
 * round-trip ones, as the JDK 19+ algorithm yields.
 */
export function javaDoubleToString(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Number.POSITIVE_INFINITY) return 'Infinity';
  if (value === Number.NEGATIVE_INFINITY) return '-Infinity';
  if (value === 0) return Object.is(value, -0) ? '-0.0' : '0.0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const [mantissa = '', exponentText = '0'] = abs.toExponential().split('e');
  const digits = mantissa.replace('.', '');
  const exponent = Number(exponentText);
  if (abs >= 1e-3 && abs < 1e7) {
    if (exponent >= 0) {
      const padded = digits.padEnd(exponent + 1, '0');
      return `${sign}${padded.slice(0, exponent + 1)}.${padded.slice(exponent + 1) || '0'}`;
    }
    return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`;
  }
  return `${sign}${digits.slice(0, 1)}.${digits.slice(1) || '0'}E${exponent}`;
}

/**
 * `AbstractReal` — a {@link Real} that belongs to one {@link RealLine} and
 * registers itself there.
 *
 * Import-cycle ruling (gep T4d): this module has no runtime import of any
 * other `real/` module (`RealLine` is type-only), so every subclass module
 * can evaluate it first.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/AbstractReal.java:38-67
 */
export abstract class AbstractReal implements Real {
  private readonly line: RealLine;

  /** `AbstractReal.java:42-45`. */
  constructor(line: RealLine) {
    this.line = line;
    this.line.register2(this);
  }

  /** `AbstractReal.java:47-49` (package-private). */
  getLine(): RealLine {
    return this.line;
  }

  /** `AbstractReal.java:51` (package-private). */
  abstract getCurrentValueInternal(): number;

  /** `AbstractReal.java:53-57` (`final` upstream). */
  getCurrentValue(): number {
    const result = this.getCurrentValueInternal();
    this.line.register(result);
    return result;
  }

  /** `AbstractReal.java:59-61`. */
  getMaxAbsolute(): Real {
    return this.line.asMaxAbsolute();
  }

  /** `AbstractReal.java:63-65`. */
  getMinAbsolute(): Real {
    return this.line.asMinAbsolute();
  }

  // The `Real` members `AbstractReal` leaves to its subclasses (Java: an
  // abstract class may omit interface methods; TS must declare them).
  abstract printCreationStackTrace(): void;
  abstract getName(): string;
  abstract addFixed(delta: number): Real;
  abstract addAtLeast(delta: number): Real;
  abstract ensureBiggerThan(other: Real): void;
}

/** The Java cast `(AbstractReal) real`: throws where Java throws. */
export function castAbstractReal(real: Real): AbstractReal {
  if (!(real instanceof AbstractReal)) {
    throw new ClassCastException(`${real.getName()} cannot be cast to AbstractReal`);
  }
  return real;
}
