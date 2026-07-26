/**
 * UmlSource seed hashing (seedOf/getSeed) + gradient-vector policy for the
 * SVG emitter. Split out of `svg-graphics-core.ts` (line cap). seedOf is
 * re-exported from svg-graphics-core.ts for existing import sites.
 */

const LONG_MIN_VALUE = -(2n ** 63n); // Math.abs overflows to itself (D8)

// Widens a `number` seed to `bigint` (D8) — exact for small literals.
function toSeedBigInt(seed: bigint | number): bigint {
  return typeof seed === 'bigint' ? seed : BigInt(seed);
}

// Upstream: SvgGraphics.java's getSeed(long) (D8, see above).
export function getSeed(seed: bigint | number): string {
  const s = toSeedBigInt(seed);
  const abs = s === LONG_MIN_VALUE ? LONG_MIN_VALUE : s < 0n ? -s : s;
  return abs.toString(36);
}

// Java String.hashCode() folded with 32-bit overflow (D8, see above).
function javaStringHashCode(s: string): bigint {
  let h = 0n;
  for (let i = 0; i < s.length; i++) {
    h = BigInt.asIntN(32, h * 31n + BigInt(s.charCodeAt(i)));
  }
  return h;
}

// Upstream: UmlSource.seed() (core/UmlSource.java), NOT
// StringUtils.seed(String) — a different algorithm (D8, see above).
const UML_SOURCE_SEED_INITIAL = 1125899906842597n;
const NEWLINE_CODE_POINT = 10n;

export function seedOf(source: string): bigint {
  let h = UML_SOURCE_SEED_INITIAL;
  for (const line of source.split('\n')) {
    h = BigInt.asIntN(64, h * 31n + javaStringHashCode(line));
    h = BigInt.asIntN(64, h * 31n + NEWLINE_CODE_POINT);
  }
  return h;
}

// G2 N4: javaFixed4/trimTrailingZeros moved to the shared, klimt-independent
// `core/number-format.ts` (pure move -- see that module's own doc comment)
// so class's pure-string renderer (`class-layout-helpers.ts`'s `row.width`)
// can reuse the SAME Java-%.4f rounding for `textLength` without pulling in
// the klimt drawing stack. Re-verified byte-identical via the description
// census (48/355 zero-diff unchanged) after this extraction.

// Upstream: the if/else-if chain inside createSvgGradient(color1, color2,
// policy) selecting the gradient vector. Factored out to keep
// createSvgGradient's own CCN low.
export function gradientVector(policy: string): { x1: string; y1: string; x2: string; y2: string } {
  if (policy === '|') return { x1: '0%', y1: '50%', x2: '100%', y2: '50%' };
  if (policy === '\\') return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' };
  if (policy === '-') return { x1: '50%', y1: '0%', x2: '50%', y2: '100%' };
  return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
}
