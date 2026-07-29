/**
 * LineBreakStrategy — wraps the raw `wrapWidth`/`maxMessageSize` skinparam
 * string value (`"auto"`, a signed-integer pixel width, or unset/`null`
 * meaning "no wrapping") and exposes it as `isAuto()`/`getMaxWidth()`.
 * `SheetBlock1` and `Display#create0`'s call chain thread this opaquely
 * end to end; `Fission`'s `maxWidth` parameter (this port's word-wrap,
 * `Fission.ts`) is the resolved numeric value this class ultimately feeds.
 *
 * Upstream: klimt/LineBreakStrategy.java. Ported in full: the `NONE`
 * static sentinel, the constructor, `toString()`, `isAuto()`,
 * `getMaxWidth()` (including the `SIGNED_INTEGER` regex guard — a
 * non-numeric/non-"auto" value falls through to `0`, matching Java's
 * `Pattern.compile("-?\\d+")` exactly).
 */
export class LineBreakStrategy {
  static readonly NONE = new LineBreakStrategy(null);

  private static readonly SIGNED_INTEGER = /^-?\d+$/;

  private readonly value: string | null;

  constructor(value: string | null) {
    this.value = value;
  }

  toString(): string | null {
    return this.value;
  }

  isAuto(): boolean {
    return this.value !== null && this.value.toLowerCase() === 'auto';
  }

  getMaxWidth(): number {
    if (this.value !== null && LineBreakStrategy.SIGNED_INTEGER.test(this.value)) {
      return Number.parseFloat(this.value);
    }
    return 0;
  }
}
