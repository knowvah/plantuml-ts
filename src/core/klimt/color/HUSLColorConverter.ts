/**
 * HUSLColorConverter -- the HSLuv / HPLuv colour-space conversions
 * (Alexei Boronine's reference implementation, as vendored upstream).
 * Every constant and branch below is upstream's, in upstream's order;
 * tuples are plain `number[]` like upstream's `double[]`.
 *
 * cdd6 T3f: ported whole for `ColorUtils#getReversed` (the `skinparam
 * reversecolor dark` mapper, `ColorMapper.LIGTHNESS_INVERSE`,
 * `ColorMapper.java:74-79`). Two older private subsets of the same
 * algorithm exist (`tim/builtin/color-utils.ts`, `klimt/sprite/
 * ColorResolver.ts`); they are left in place (outside this task's
 * write-set).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HUSLColorConverter.java
 */

/** `HUSLColorConverter.java:20-23` -- XYZ -> linear sRGB. */
const M: readonly (readonly number[])[] = [
  [3.240969941904521, -1.537383177570093, -0.498610760293],
  [-0.96924363628087, 1.87596750150772, 0.041555057407175],
  [0.055630079696993, -0.20397695888897, 1.056971514242878],
];

/** `HUSLColorConverter.java:25-28` -- linear sRGB -> XYZ. */
const MINV: readonly (readonly number[])[] = [
  [0.41239079926595, 0.35758433938387, 0.18048078840183],
  [0.21263900587151, 0.71516867876775, 0.072192315360733],
  [0.019330818715591, 0.11919477979462, 0.95053215224966],
];

/** `HUSLColorConverter.java:30-36`. */
const REF_Y = 1.0;
const REF_U = 0.19783000664283;
const REF_V = 0.46831999493879;
const KAPPA = 903.2962962;
const EPSILON = 0.0088564516;

/** `Double.MAX_VALUE`. */
const JAVA_DOUBLE_MAX = Number.MAX_VALUE;

/** `HUSLColorConverter.java:38-59`: the six gamut-boundary lines at `L`. */
function getBounds(L: number): number[][] {
  const result: number[][] = [];
  const sub1 = Math.pow(L + 16, 3) / 1560896;
  const sub2 = sub1 > EPSILON ? sub1 : L / KAPPA;
  for (let c = 0; c < 3; ++c) {
    const m1 = M[c]![0]!;
    const m2 = M[c]![1]!;
    const m3 = M[c]![2]!;
    for (let t = 0; t < 2; ++t) {
      const top1 = (284517 * m1 - 94839 * m3) * sub2;
      const top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
      const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
      result.push([top1 / bottom, top2 / bottom]);
    }
  }
  return result;
}

/** `HUSLColorConverter.java:61-63`. */
function intersectLineLine(lineA: readonly number[], lineB: readonly number[]): number {
  return (lineA[1]! - lineB[1]!) / (lineB[0]! - lineA[0]!);
}

/** `HUSLColorConverter.java:65-67`. */
function distanceFromPole(point: readonly number[]): number {
  return Math.sqrt(Math.pow(point[0]!, 2) + Math.pow(point[1]!, 2));
}

/** `HUSLColorConverter.java:75-83` (`Length`): the ray length plus its
 *  `greaterEqualZero` flag. */
interface Length {
  readonly greaterEqualZero: boolean;
  readonly length: number;
}

/** `HUSLColorConverter.java:69-73`. */
function lengthOfRayUntilIntersect(theta: number, line: readonly number[]): Length {
  const length = line[1]! / (Math.sin(theta) - line[0]! * Math.cos(theta));
  return { greaterEqualZero: length >= 0, length };
}

/** `HUSLColorConverter.java:85-101`. */
function maxSafeChromaForL(L: number): number {
  const bounds = getBounds(L);
  let min = JAVA_DOUBLE_MAX;
  for (let i = 0; i < 2; ++i) {
    const m1 = bounds[i]![0]!;
    const b1 = bounds[i]![1]!;
    const line = [m1, b1];
    const x = intersectLineLine(line, [-1 / m1, 0]);
    const length = distanceFromPole([x, b1 + x * m1]);
    min = Math.min(min, length);
  }
  return min;
}

/** `HUSLColorConverter.java:103-117`. */
function maxChromaForLH(L: number, H: number): number {
  const hrad = (H / 360) * Math.PI * 2;
  const bounds = getBounds(L);
  let min = JAVA_DOUBLE_MAX;
  for (const bound of bounds) {
    const length = lengthOfRayUntilIntersect(hrad, bound);
    if (length.greaterEqualZero) min = Math.min(min, length.length);
  }
  return min;
}

/** `HUSLColorConverter.java:119-127`. */
function dotProduct(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; ++i) sum += a[i]! * b[i]!;
  return sum;
}

/** `HUSLColorConverter.java:129-133` -- `Math.round` is Java's half-up,
 *  which JS `Math.round` matches for every sign. */
function round(value: number, places: number): number {
  const n = Math.pow(10, places);
  return Math.round(value * n) / n;
}

/** `HUSLColorConverter.java:135-141`. */
function fromLinear(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** `HUSLColorConverter.java:143-149`. */
function toLinear(c: number): number {
  if (c > 0.04045) return Math.pow((c + 0.055) / (1 + 0.055), 2.4);
  return c / 12.92;
}

/** `HUSLColorConverter.java:151-167`.
 *  @throws Error when a channel rounds outside `[-0.0001, 1.0001]`
 *  (upstream's `IllegalArgumentException`). */
function rgbPrepare(tuple: readonly number[]): number[] {
  return tuple.map((chan) => {
    const rounded = round(chan, 3);
    if (rounded < -0.0001 || rounded > 1.0001) throw new Error(`Illegal rgb value: ${rounded}`);
    return Math.round(rounded * 255);
  });
}

/** `HUSLColorConverter.java:169-172`. */
export function xyzToRgb(tuple: readonly number[]): number[] {
  return [
    fromLinear(dotProduct(M[0]!, tuple)),
    fromLinear(dotProduct(M[1]!, tuple)),
    fromLinear(dotProduct(M[2]!, tuple)),
  ];
}

/** `HUSLColorConverter.java:174-178`. */
export function rgbToXyz(tuple: readonly number[]): number[] {
  const rgbl = [toLinear(tuple[0]!), toLinear(tuple[1]!), toLinear(tuple[2]!)];
  return [dotProduct(MINV[0]!, rgbl), dotProduct(MINV[1]!, rgbl), dotProduct(MINV[2]!, rgbl)];
}

/** `HUSLColorConverter.java:180-186`. */
function yToL(Y: number): number {
  if (Y <= EPSILON) return (Y / REF_Y) * KAPPA;
  return 116 * Math.pow(Y / REF_Y, 1.0 / 3.0) - 16;
}

/** `HUSLColorConverter.java:188-194`. */
function lToY(L: number): number {
  if (L <= 8) return (REF_Y * L) / KAPPA;
  return REF_Y * Math.pow((L + 16) / 116, 3);
}

/** `HUSLColorConverter.java:196-214`. */
export function xyzToLuv(tuple: readonly number[]): number[] {
  const X = tuple[0]!;
  const Y = tuple[1]!;
  const Z = tuple[2]!;
  const varU = (4 * X) / (X + 15 * Y + 3 * Z);
  const varV = (9 * Y) / (X + 15 * Y + 3 * Z);
  const L = yToL(Y);
  if (L === 0) return [0, 0, 0];
  const U = 13 * L * (varU - REF_U);
  const V = 13 * L * (varV - REF_V);
  return [L, U, V];
}

/** `HUSLColorConverter.java:216-233`. */
export function luvToXyz(tuple: readonly number[]): number[] {
  const L = tuple[0]!;
  const U = tuple[1]!;
  const V = tuple[2]!;
  if (L === 0) return [0, 0, 0];
  const varU = U / (13 * L) + REF_U;
  const varV = V / (13 * L) + REF_V;
  const Y = lToY(L);
  const X = 0 - (9 * Y * varU) / ((varU - 4) * varV - varU * varV);
  const Z = (9 * Y - 15 * varV * Y - varV * X) / (3 * varV);
  return [X, Y, Z];
}

/** `HUSLColorConverter.java:235-257` -- the `3.1415926535897932` literal
 *  (not `Math.PI`) is upstream's. */
export function luvToLch(tuple: readonly number[]): number[] {
  const L = tuple[0]!;
  const U = tuple[1]!;
  const V = tuple[2]!;
  const C = Math.sqrt(U * U + V * V);
  let H: number;
  if (C < 0.00000001) {
    H = 0;
  } else {
    const Hrad = Math.atan2(V, U);
    H = (Hrad * 180.0) / 3.1415926535897932;
    if (H < 0) H = 360 + H;
  }
  return [L, C, H];
}

/** `HUSLColorConverter.java:259-269`. */
export function lchToLuv(tuple: readonly number[]): number[] {
  const L = tuple[0]!;
  const C = tuple[1]!;
  const H = tuple[2]!;
  const Hrad = (H / 360.0) * 2 * Math.PI;
  const U = Math.cos(Hrad) * C;
  const V = Math.sin(Hrad) * C;
  return [L, U, V];
}

/** `HUSLColorConverter.java:271-288`. */
export function hsluvToLch(tuple: readonly number[]): number[] {
  const H = tuple[0]!;
  const S = tuple[1]!;
  const L = tuple[2]!;
  if (L > 99.9999999) return [100, 0, H];
  if (L < 0.00000001) return [0, 0, H];
  const max = maxChromaForLH(L, H);
  const C = (max / 100) * S;
  return [L, C, H];
}

/** `HUSLColorConverter.java:290-307`. */
export function lchToHsluv(tuple: readonly number[]): number[] {
  const L = tuple[0]!;
  const C = tuple[1]!;
  const H = tuple[2]!;
  if (L > 99.9999999) return [H, 0, 100];
  if (L < 0.00000001) return [H, 0, 0];
  const max = maxChromaForLH(L, H);
  const S = (C / max) * 100;
  return [H, S, L];
}

/** `HUSLColorConverter.java:309-326`. */
export function hpluvToLch(tuple: readonly number[]): number[] {
  const H = tuple[0]!;
  const S = tuple[1]!;
  const L = tuple[2]!;
  if (L > 99.9999999) return [100, 0, H];
  if (L < 0.00000001) return [0, 0, H];
  const max = maxSafeChromaForL(L);
  const C = (max / 100) * S;
  return [L, C, H];
}

/** `HUSLColorConverter.java:328-345`. */
export function lchToHpluv(tuple: readonly number[]): number[] {
  const L = tuple[0]!;
  const C = tuple[1]!;
  const H = tuple[2]!;
  if (L > 99.9999999) return [H, 0, 100];
  if (L < 0.00000001) return [H, 0, 0];
  const max = maxSafeChromaForL(L);
  const S = (C / max) * 100;
  return [H, S, L];
}

/** `HUSLColorConverter.java:347-351` -- `String.format("#%02x%02x%02x")`,
 *  lower-case. */
export function rgbToHex(tuple: readonly number[]): string {
  const prepared = rgbPrepare(tuple);
  return `#${prepared.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** `HUSLColorConverter.java:353-356`. */
export function hexToRgb(hex: string): number[] {
  return [
    Number.parseInt(hex.substring(1, 3), 16) / 255.0,
    Number.parseInt(hex.substring(3, 5), 16) / 255.0,
    Number.parseInt(hex.substring(5, 7), 16) / 255.0,
  ];
}

/** `HUSLColorConverter.java:358-360`. */
export function lchToRgb(tuple: readonly number[]): number[] {
  return xyzToRgb(luvToXyz(lchToLuv(tuple)));
}

/** `HUSLColorConverter.java:362-364`. */
export function rgbToLch(tuple: readonly number[]): number[] {
  return luvToLch(xyzToLuv(rgbToXyz(tuple)));
}

/** `HUSLColorConverter.java:368-370`. */
export function hsluvToRgb(tuple: readonly number[]): number[] {
  return lchToRgb(hsluvToLch(tuple));
}

/** `HUSLColorConverter.java:372-374`. */
export function rgbToHsluv(tuple: readonly number[]): number[] {
  return lchToHsluv(rgbToLch(tuple));
}

/** `HUSLColorConverter.java:376-378`. */
export function hpluvToRgb(tuple: readonly number[]): number[] {
  return lchToRgb(hpluvToLch(tuple));
}

/** `HUSLColorConverter.java:380-382`. */
export function rgbToHpluv(tuple: readonly number[]): number[] {
  return lchToHpluv(rgbToLch(tuple));
}

/** `HUSLColorConverter.java:386-388`. */
export function hsluvToHex(tuple: readonly number[]): string {
  return rgbToHex(hsluvToRgb(tuple));
}

/** `HUSLColorConverter.java:390-392`. */
export function hpluvToHex(tuple: readonly number[]): string {
  return rgbToHex(hpluvToRgb(tuple));
}

/** `HUSLColorConverter.java:394-396`. */
export function hexToHsluv(s: string): number[] {
  return rgbToHsluv(hexToRgb(s));
}

/** `HUSLColorConverter.java:398-400`. */
export function hexToHpluv(s: string): number[] {
  return rgbToHpluv(hexToRgb(s));
}
