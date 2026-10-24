import type { Gradient, LinearGradientPaint, Paint } from '../../../paint.js';
import type { BufferedElement, GradientStop } from './sax-defs.js';
import type { RenderContext } from './sax-context.js';

/**
 * Gradient half of `RenderHandler`'s helpers (split from `sax-style.ts` at the
 * 500-line hook; imported by `sax-style.ts` only), plus the Java-number parser
 * both halves share.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:915-1093
 */

/**
 * `HColorLinearGradient.SpreadMethod`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:56-72
 */
export const SpreadMethod = {
  PAD: 'PAD',
  REFLECT: 'REFLECT',
  REPEAT: 'REPEAT',
} as const;
export type SpreadMethod = (typeof SpreadMethod)[keyof typeof SpreadMethod];

/**
 * `HColorLinearGradient.Stop`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:77-137
 */
export interface LinearGradientStop {
  readonly offset: number;
  readonly color: Paint;
  readonly opacity: number;
}

/** `normalizeStops`' tie nudge (`HColorLinearGradient.java:219`). */
const TIE_EPSILON = 0.000001;

/** Direction characters `determineGradientPolicy` returns (`SvgSaxParser.java:1055-1069`). */
const POLICY_HORIZONTAL = '|';
const POLICY_VERTICAL = '-';
const POLICY_DIAGONAL_DOWN = '/';
const POLICY_DIAGONAL_UP = '\\';

/** Thresholds of `determineGradientPolicy`, Java literals (`SvgSaxParser.java:1053,1058,1063`). */
const CONSTANT_AXIS_DELTA = 0.1;
const CHANGING_AXIS_DELTA = 0.5;
const DIAGONAL_DELTA = 0.3;

/** `parseSpreadMethod` keywords (`SvgSaxParser.java:1024-1027`). */
const SPREAD_REFLECT = 'reflect';
const SPREAD_REPEAT = 'repeat';

/** `userSpaceOnUse` (`SvgSaxParser.java:931-932`). */
const USER_SPACE_ON_USE = 'userSpaceOnUse';

/** Java `Double.parseDouble` after `String.trim()` minus the hex-float form (not valid in SVG numbers). */
const JAVA_DOUBLE = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?)$/;
const JAVA_TRIM = /^[\u0000- ]+|[\u0000- ]+$/g;
const JAVA_DOUBLE_SUFFIX = /[fFdD]$/;

/**
 * `Double.parseDouble(String)`: `undefined` where Java throws
 * `NumberFormatException`. Java trims (chars <= U+0020), accepts `NaN`,
 * `Infinity`, a trailing `f`/`F`/`d`/`D`, and rejects the empty string, where
 * JS `Number` would answer 0 or ignore the suffix. Hexadecimal floating point
 * (`0x1p3`) is not accepted: nothing in an SVG sprite spells it.
 */
export function parseJavaDouble(value: string): number | undefined {
  const trimmed = value.replace(JAVA_TRIM, '');
  if (!JAVA_DOUBLE.test(trimmed)) return undefined;
  return Number(trimmed.replace(JAVA_DOUBLE_SUFFIX, ''));
}

/** `Double.compare(double, double)`: NaN sorts last, -0.0 before 0.0. */
function compareDouble(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  if (Object.is(a, b)) return 0;
  if (Object.is(a, -0)) return -1;
  if (Object.is(b, -0)) return 1;
  return Number.isNaN(a) ? (Number.isNaN(b) ? 0 : 1) : -1;
}

/**
 * `HColorLinearGradient#normalizeStops`: stable sort by offset, clamp to 0..1,
 * and nudge ties forward by 1e-6 (or hold at `last` when that would pass 1).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:200-225
 */
function normalizeStops(input: readonly LinearGradientStop[]): readonly LinearGradientStop[] {
  const sorted = [...input].sort((o1, o2) => compareDouble(o1.offset, o2.offset));
  const normalized: LinearGradientStop[] = [];
  let last = -1.0;
  for (const stop of sorted) {
    let offset = stop.offset;
    if (offset < 0.0) offset = 0.0;
    if (offset > 1.0) offset = 1.0;
    if (offset <= last) {
      const candidate = last + TIE_EPSILON;
      offset = candidate > 1.0 ? last : candidate;
    }
    last = offset;
    normalized.push({ offset, color: stop.color, opacity: stop.opacity });
  }
  return normalized;
}

/** A stop colour reduced to the one colour string a `Gradient` can carry. */
function solidOf(paint: Paint): string {
  return typeof paint === 'string' ? paint : paint.color1;
}

/** The gradient vector `(x1,y1)` -> `(x2,y2)` (`HColorLinearGradient.java:150-168`). */
export interface GradientVector {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** `getColor1()` (`HColorLinearGradient.java:303-305`); an empty list cannot occur past `size() >= 2`. */
function firstColor(stops: readonly LinearGradientStop[]): Paint {
  return stops[0]?.color ?? '';
}

function lastColor(stops: readonly LinearGradientStop[]): Paint {
  return stops[stops.length - 1]?.color ?? '';
}

/**
 * `HColorLinearGradient`: an SVG-like linear gradient with multiple stops.
 *
 * It is a {@link LinearGradientPaint} (the port's `Paint` seam for upstream's
 * `HColorLinearGradient`, `paint.ts`): the driver that registers an SVG
 * `<linearGradient>` (`DriverRectangleSvg#applyFillColor` ->
 * `SvgGraphics#createSvgLinearGradient`) reads every field of the Java class
 * (`:150-196`, `:241-295`). It is also a two-colour {@link Gradient}:
 * `color1` is `getColor1()` (the first stop, `:303-305`), `color2` the last
 * stop and `policy` is `determineGradientPolicy`'s direction character
 * (`SvgSaxParser.java:1036-1078`, which no Java caller reaches), so a
 * consumer that cannot draw N stops (`ULine`'s `noGradient`) reads the same
 * first-stop colour `HColor#toSvg` gives it upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:50-330
 */
export class HColorLinearGradient implements LinearGradientPaint {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color1: string;
  readonly color2: string;
  readonly policy: Gradient['policy'];
  readonly stops: readonly LinearGradientStop[];

  /**
   * The Java constructor's seven arguments, with the vector grouped (the
   * complexity hook allows five parameters): `(x1, y1, x2, y2, userSpaceOnUse,
   * spreadMethod, stops)` -> `(vector, userSpaceOnUse, spreadMethod, stops)`.
   *
   * @see HColorLinearGradient.java:187-196
   */
  constructor(
    vector: GradientVector,
    readonly userSpaceOnUse: boolean,
    readonly spreadMethod: SpreadMethod,
    stops: readonly LinearGradientStop[],
  ) {
    ({ x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 } = vector);
    this.stops = normalizeStops(stops);
    this.color1 = solidOf(firstColor(this.stops));
    this.color2 = solidOf(lastColor(this.stops));
    this.policy = determineGradientPolicy(this.x1, this.y1, this.x2, this.y2);
  }
}

/**
 * `parsePercentOrNumber`: `"50%"` -> 0.5, a number as is, `defaultValue` for
 * absent, empty or unparseable input.
 *
 * @see SvgSaxParser.java:1079-1093
 */
function parsePercentOrNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') return defaultValue;
  if (value.endsWith('%')) {
    const percent = parseJavaDouble(value.substring(0, value.length - 1));
    return percent === undefined ? defaultValue : percent / 100.0;
  }
  return parseJavaDouble(value) ?? defaultValue;
}

/**
 * `determineGradientPolicy` over the already parsed vector (the Java reads the
 * same four attributes through `parsePercentOrNumber` at `:1043-1050`, which
 * {@link extractGradientPaint} has just done for the constructor).
 *
 * @see SvgSaxParser.java:1036-1078
 */
export function determineGradientPolicy(x1: number, y1: number, x2: number, y2: number): Gradient['policy'] {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  if (Math.abs(deltaY) < CONSTANT_AXIS_DELTA && Math.abs(deltaX) > CHANGING_AXIS_DELTA) return POLICY_HORIZONTAL;
  if (Math.abs(deltaX) < CONSTANT_AXIS_DELTA && Math.abs(deltaY) > CHANGING_AXIS_DELTA) return POLICY_VERTICAL;
  if (Math.abs(deltaX) > DIAGONAL_DELTA && Math.abs(deltaY) > DIAGONAL_DELTA) {
    return deltaX * deltaY > 0 ? POLICY_DIAGONAL_DOWN : POLICY_DIAGONAL_UP;
  }
  return POLICY_HORIZONTAL;
}

/** @see SvgSaxParser.java:1011-1018 clamp01 */
function clamp01(value: number): number {
  if (value < 0.0) return 0.0;
  if (value > 1.0) return 1.0;
  return value;
}

/** @see SvgSaxParser.java:987-999 parseOffset */
function parseOffset(value: string): number {
  if (value === '') return 0.0;
  if (value.endsWith('%')) {
    const percent = parseJavaDouble(value.substring(0, value.length - 1));
    return percent === undefined ? 0.0 : clamp01(percent / 100.0);
  }
  const number = parseJavaDouble(value);
  return number === undefined ? 0.0 : clamp01(number);
}

/** @see SvgSaxParser.java:1000-1010 parseOpacity */
function parseOpacity(value: string | undefined): number {
  if (value === undefined || value === '') return 1.0;
  const number = parseJavaDouble(value);
  return number === undefined ? 1.0 : clamp01(number);
}

/** @see SvgSaxParser.java:1019-1035 parseSpreadMethod */
function parseSpreadMethod(value: string | undefined): SpreadMethod {
  if (value === undefined || value === '') return SpreadMethod.PAD;
  const lower = value.toLowerCase();
  if (lower === SPREAD_REFLECT) return SpreadMethod.REFLECT;
  if (lower === SPREAD_REPEAT) return SpreadMethod.REPEAT;
  return SpreadMethod.PAD;
}

/**
 * `ugs.getTrueColor(stop.color)` through the handler's current graphic, or
 * `undefined` for an empty or `none` colour.
 *
 * @see SvgSaxParser.java:977-986 getStopColor
 */
function getStopColor(ctx: RenderContext, stop: GradientStop | undefined): Paint | undefined {
  if (stop === undefined) return undefined;
  if (stop.color === '') return undefined;
  if (stop.color.toLowerCase() === 'none') return undefined;
  return ctx.ugs.getTrueColor(stop.color);
}

/** @see SvgSaxParser.java:963-976 buildGradientStops */
function buildGradientStops(ctx: RenderContext, stops: readonly GradientStop[]): LinearGradientStop[] {
  const result: LinearGradientStop[] = [];
  for (const stop of stops) {
    const color = getStopColor(ctx, stop);
    if (color === undefined) continue;
    result.push({ offset: parseOffset(stop.offset), color, opacity: parseOpacity(stop.opacity) });
  }
  return result;
}

/** @see SvgSaxParser.java:927-949 (the `linearGradient` arm up to the `size() >= 2` return) */
function buildLinearGradient(element: BufferedElement, stops: LinearGradientStop[]): HColorLinearGradient {
  const attributes = element.attributes;
  const vector = {
    x1: parsePercentOrNumber(attributes.get('x1'), 0.0),
    y1: parsePercentOrNumber(attributes.get('y1'), 0.0),
    x2: parsePercentOrNumber(attributes.get('x2'), 1.0),
    y2: parsePercentOrNumber(attributes.get('y2'), 0.0),
  };
  return new HColorLinearGradient(
    vector,
    attributes.get('gradientUnits') === USER_SPACE_ON_USE,
    parseSpreadMethod(attributes.get('spreadMethod')),
    stops,
  );
}

/** @see SvgSaxParser.java:943-948, 951-957: the first stop colour, when the element has stops */
function firstStopFallback(ctx: RenderContext, element: BufferedElement): Paint | undefined {
  if (element.stops.length === 0) return undefined;
  return getStopColor(ctx, element.stops[0]);
}

/**
 * Extract a colour or gradient from a gradient definition: a linear gradient
 * with two or more usable stops becomes an {@link HColorLinearGradient}; any
 * other case falls back to the first stop colour; unknown id -> `undefined`.
 *
 * @see SvgSaxParser.java:915-962 extractGradientColor
 */
export function extractGradientPaint(ctx: RenderContext, gradientId: string): Paint | undefined {
  const element = ctx.definitions.get(gradientId);
  if (element === undefined) return undefined;

  if (element.tagName === 'linearGradient') {
    const stops = buildGradientStops(ctx, element.stops);
    if (stops.length >= 2) return buildLinearGradient(element, stops);
    const fallback = firstStopFallback(ctx, element);
    if (fallback !== undefined) return fallback;
  }

  if (element.tagName === 'radialGradient') {
    const fallback = firstStopFallback(ctx, element);
    if (fallback !== undefined) return fallback;
  }

  return undefined;
}
