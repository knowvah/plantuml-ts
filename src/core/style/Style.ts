import type { Colors, HColor as ColorsHColor } from '../abel/Colors.js';
import { ColorType } from '../abel/ColorType.js';
import { FontConfiguration } from '../abel/FontConfiguration.js';
import { Fashion } from '../klimt/Fashion.js';
import { Fore } from '../klimt/Fore.js';
import { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UStroke } from '../klimt/UStroke.js';
import { HColorGradient } from '../klimt/color/HColorGradient.js';
import { HColorSimple } from '../klimt/color/HColorSimple.js';
import { HColors } from '../klimt/color/HColors.js';
import type { UFont } from '../klimt/font/UFont.js';
import { UFontFactory } from '../klimt/font/UFontFactory.js';
import { ClockwiseTopRightBottomLeft } from '../klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { javaDoubleToString } from '../decoration/LinkStyle.js';
import { MergeStrategy } from './MergeStrategy.js';
import { PNAMES, type PName } from './PName.js';
import type { StyleSignatureBasic } from './StyleSignatureBasic.js';
import type { HColor, HColorSet, Value } from './Value.js';
import { ValueColor } from './ValueColor.js';
import { ValueImpl } from './ValueImpl.js';
import { ValueNull } from './ValueNull.js';

/**
 * `StyleLoader.DELTA_PRIORITY_FOR_STEREOTYPE`: the priority lift a
 * stereotype style gets on load (StyleLoader.java:183), and the threshold
 * `mergeWith(KEEP_EXISTING_VALUE_OF_STEREOTYPE)` protects. `StyleLoader`
 * is T3a's port; it imports this rather than redeclaring it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:178
 */
export const DELTA_PRIORITY_FOR_STEREOTYPE = 1000;

/**
 * `ValueImpl.regular(value, Integer.MAX_VALUE)` priority of an overridden value (Style.java:191);
 * `Integer.MAX_VALUE` = 2^31 - 1.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:191
 */
const INTEGER_MAX_VALUE = 2147483647;

/** `getShadowing`'s `asDoubleDefaultTo` argument (Style.java:114). */
const SHADOWING_DEFAULT = 1.5;
/** `getUFont`'s fallback when `FontSize` carries no digits (Style.java:244-245). */
const DEFAULT_FONT_SIZE = 14;
/** `UFontWeight`'s normal CSS weight, the "no FontWeight override" test (Style.java:249). */
const NORMAL_CSS_WEIGHT = 400;
/** `new StringTokenizer(dash, "-;,")` delimiters (Style.java:310). */
const DASH_DELIMITERS = /[-;,]/;
/** `Double.parseDouble` over a trimmed decimal literal (hex floats not ported). */
const JAVA_DOUBLE = /^[+-]?(NaN|Infinity|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?)$/;

/** `ug.apply(HColor)`: the style layer's `HColor` is an `HColorSimple`/`HColorGradient`; Java's cast otherwise. */
function foregroundOf(color: HColor): HColorSimple | HColorGradient {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: line colour is not an HColorSimple');
}

/** `((ValueImpl) value)`: Java's checked cast. */
function asValueImpl(value: Value): ValueImpl {
  if (value instanceof ValueImpl) return value;
  throw new Error(`ClassCastException: ${value.constructor.name} cannot be cast to ValueImpl`);
}

/** A Java `String` dereference: `null` is a NullPointerException. */
function requireString(s: string | null): string {
  if (s === null) throw new Error('NullPointerException');
  return s;
}

/** `Double.parseDouble(s)` (it trims first); throws `NumberFormatException`. */
function javaParseDouble(s: string): number {
  const t = s.trim();
  if (!JAVA_DOUBLE.test(t)) throw new Error(`NumberFormatException: For input string: "${s}"`);
  return Number.parseFloat(t.replace(/^\+/, '').replace(/[fFdD]$/, ''));
}

/**
 * The port's `abel/Colors` stores colours as an opaque `object` (its
 * `HColor` stand-in); upstream's `Colors` holds `HColor`s. Narrowed here,
 * at the seam into the style engine.
 */
function isHColor(color: ColorsHColor): color is HColor {
  return 'withDark' in color && typeof color.withDark === 'function';
}

function colorsGet(colors: Colors, type: ColorType): HColor | undefined {
  const color = colors.getColor(type);
  if (color === undefined || isHColor(color)) return color;
  throw new Error(`Colors.getColor(${type}) is not an HColor: ${JSON.stringify(color)}`);
}

/**
 * `new StringTokenizer(dash, "-;,")`: the non-empty tokens; then the
 * visible length, and the space length (the visible one again when
 * absent). `undefined` for upstream's `catch (Exception e)`.
 * @see Style.java:309-319
 */
function parseDash(dash: string): [number, number] | undefined {
  const tokens = dash.split(DASH_DELIMITERS).filter((t) => t.length > 0);
  try {
    const first = tokens[0];
    if (first === undefined) return undefined; // NoSuchElementException
    const dashVisible = javaParseDouble(first);
    const second = tokens[1];
    return [dashVisible, second === undefined ? dashVisible : javaParseDouble(second)];
  } catch {
    return undefined;
  }
}

/**
 * Style — a signature plus its `PName → Value` map. Immutable, as
 * upstream: every `mergeWith`/`deltaPriority`/`eventuallyOverride`
 * returns a new `Style` over a copied map.
 *
 * Translation notes:
 * - `EnumMap<PName, Value>` → a `ReadonlyMap`; `toString` prints in PName
 *   ordinal order, as `EnumMap` iterates.
 * - The six reached `eventuallyOverride` overloads — `(Colors)`,
 *   `(Fashion)`, `(PName, HColor)` (FtileBoxOld.java:155), `(PName, double)`
 *   (Style.java:185-187), `(PName, String)` (:189-193) and `(UStroke)`
 *   (:288-296; GanttConstraint.java:101-103) — are one method dispatching on
 *   argument shape.
 * - `getFontConfiguration(set)` and `(set, colors)` are one method.
 *
 * Not ported (no consumer on the mindmap path): `printMe`,
 * `getSymbolContext`, `getStroke(Colors)`
 * (needs `Colors#getSpecificLineStroke`), `createTextBlockBordered`,
 * `toColors`, and the `ID_*` constants.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:62-387
 */
export class Style {
  /** @see Style.java:67-70 */
  constructor(
    /** @see Style.java:65 */
    private readonly signature: StyleSignatureBasic,
    /** @see Style.java:64 */
    private readonly map: ReadonlyMap<PName, Value>,
  ) {}

  /** Every value lifted by `delta`; only a starred style may be lifted. @see Style.java:72-82 */
  deltaPriority(delta: number): Style {
    if (!this.signature.isStarred()) throw new Error('UnsupportedOperationException');

    const copy = new Map<PName, Value>();
    for (const [key, value] of this.map) copy.set(key, asValueImpl(value).addPriority(delta));
    return new Style(this.signature, copy);
  }

  /** `signature + " " + map`. @see Style.java:96-99 */
  toString(): string {
    const entries = PNAMES.filter((p) => this.map.has(p)).map((p) => `${p}=${this.value(p).toString()}`);
    return `${this.signature.toString()} {${entries.join(', ')}}`;
  }

  /** The stored value, else `ValueNull.NULL`. @see Style.java:101-107 */
  value(name: PName): Value {
    return this.map.get(name) ?? ValueNull.NULL;
  }

  /** 0 when unset, else `asDoubleDefaultTo(1.5)`. @see Style.java:109-115 */
  getShadowing(): number {
    if (!this.map.has('Shadowing')) return 0;
    return this.value('Shadowing').asDoubleDefaultTo(SHADOWING_DEFAULT);
  }

  /** @see Style.java:117-119 */
  hasValue(name: PName): boolean {
    return this.map.has(name);
  }

  /**
   * Each of `other`'s values merged over this one's (`ValueImpl#mergeWith`,
   * higher priority wins); under `KEEP_EXISTING_VALUE_OF_STEREOTYPE` an
   * existing value above `DELTA_PRIORITY_FOR_STEREOTYPE` is kept.
   * @see Style.java:121-134
   */
  mergeWith(other: Style | undefined, strategy: MergeStrategy): Style {
    if (other === undefined) return this;

    const both = new Map<PName, Value>(this.map);
    for (const [key, value] of other.map) {
      const previous = this.map.get(key);
      if (
        previous !== undefined &&
        previous.getPriority() > DELTA_PRIORITY_FOR_STEREOTYPE &&
        strategy === MergeStrategy.KEEP_EXISTING_VALUE_OF_STEREOTYPE
      )
        continue;
      both.set(key, asValueImpl(value).mergeWith(previous));
    }
    return new Style(this.signature.mergeWith(other.getSignature()), both);
  }

  /**
   * Layers a nested child selector's style (e.g. `group.header`) on top of
   * this legacy/sibling style (e.g. flat `groupHeader`) WITHOUT letting
   * properties that `nested` only carries because they cascaded down from
   * `nestedParent` (e.g. plain `group`) overwrite this style's own values:
   * only a nested value absent from, or differing (by `asString()`) from,
   * the parent's is merged on top. Returns `this` when `nested` is
   * undefined or nothing diverges.
   * @see Style.java:137-173
   */
  mergeNestedChildOver(nested: Style | undefined, nestedParent: Style | undefined, strategy: MergeStrategy): Style {
    if (nested === undefined) return this;

    const divergentOnly = new Map<PName, Value>();
    for (const [key, value] of nested.map) {
      const ancestorValue = nestedParent === undefined ? undefined : nestedParent.map.get(key);
      if (ancestorValue === undefined || ancestorValue.asString() !== value.asString()) divergentOnly.set(key, value);
    }

    if (divergentOnly.size === 0) return this;

    return this.mergeWith(new Style(nested.signature, divergentOnly), strategy);
  }

  /**
   * `(Colors)`: BACK/LINE/TEXT onto BackGroundColor/LineColor/FontColor
   * (Style.java:195-212). `(Fashion)`: its back colour onto
   * BackGroundColor (Style.java:214-223). `(PName, HColor)`: a
   * `ValueColor` at the old value's priority — an absent old value is
   * upstream's NullPointerException (Style.java:175-183). A null
   * `Colors`/`Fashion`/`HColor` returns this. `(PName, number)` is
   * `"" + value` (Java `Double.toString`) and `(PName, string)` stores
   * `ValueImpl.regular(value, Integer.MAX_VALUE)` (Style.java:185-193).
   * `(UStroke)` overrides `LineThickness` and `LineStyle`
   * (`visible-space`), a null stroke returns this (Style.java:288-296).
   */
  eventuallyOverride(colors: Colors | Fashion | undefined): Style;
  eventuallyOverride(param: PName, color: HColor | undefined): Style;
  eventuallyOverride(param: PName, value: number): Style;
  eventuallyOverride(param: PName, value: string): Style;
  eventuallyOverride(stroke: UStroke | undefined): Style;
  eventuallyOverride(arg: Colors | Fashion | UStroke | PName | undefined, value?: HColor | number | string): Style {
    if (typeof arg === 'string') {
      if (typeof value === 'number') return this.eventuallyOverrideString(arg, javaDoubleToString(value));
      if (typeof value === 'string') return this.eventuallyOverrideString(arg, value);
      return this.eventuallyOverrideColor(arg, value);
    }
    if (arg instanceof UStroke) return this.eventuallyOverrideStroke(arg);
    if (arg instanceof Fashion) return this.eventuallyOverrideColor('BackGroundColor', arg.getBackColor());
    if (arg === undefined) return this;
    return this.eventuallyOverrideColor('BackGroundColor', colorsGet(arg, ColorType.BACK))
      .eventuallyOverrideColor('LineColor', colorsGet(arg, ColorType.LINE))
      .eventuallyOverrideColor('FontColor', colorsGet(arg, ColorType.TEXT));
  }

  /** `ValueImpl.regular(value, Integer.MAX_VALUE)`; no old value needed. @see Style.java:189-193 */
  private eventuallyOverrideString(param: PName, value: string): Style {
    const result = new Map<PName, Value>(this.map);
    result.set(param, ValueImpl.regular(value, INTEGER_MAX_VALUE));
    return new Style(this.signature, result);
  }

  /** `LineThickness` then `LineStyle` = `visible + "-" + space` (Java `double` concatenation). @see Style.java:288-296 */
  private eventuallyOverrideStroke(stroke: UStroke): Style {
    const result = this.eventuallyOverrideString('LineThickness', javaDoubleToString(stroke.getThickness()));
    const space = stroke.getDashSpace();
    const visible = stroke.getDashVisible();
    return result.eventuallyOverrideString('LineStyle', javaDoubleToString(visible) + '-' + javaDoubleToString(space));
  }

  /** @see Style.java:175-183 */
  private eventuallyOverrideColor(param: PName, color: HColor | undefined): Style {
    if (color === undefined) return this;

    const result = new Map<PName, Value>(this.map);
    const old = result.get(param);
    if (old === undefined) throw new Error('NullPointerException');
    result.set(param, new ValueColor(color, old.getPriority()));
    return new Style(this.signature, result);
  }

  /** @see Style.java:225-227 */
  getSignature(): StyleSignatureBasic {
    return this.signature;
  }

  /**
   * FontName / FontStyle / FontWeight / FontSize: a non-400 `FontWeight`
   * replaces only the weight axis of the `FontStyle` face.
   * @see Style.java:241-253
   */
  getUFont(): UFont {
    const fontName = requireString(this.value('FontName').asString());
    let size = this.value('FontSize').asIntButMinusOneIfError();
    if (size === -1) size = DEFAULT_FONT_SIZE;

    let face = this.value('FontStyle').asFontFace();
    const weightFace = this.value('FontWeight').asFontFace();
    // UFontFace#withWeight (UFontFace.java:174-179) clamps via UFontWeight.fromCssValue;
    // asFontFace already returns a clamped weight, so the clamp is the identity here.
    if (weightFace.cssWeight !== NORMAL_CSS_WEIGHT) face = { cssWeight: weightFace.cssWeight, italic: face.italic };

    return UFontFactory.build(fontName, face, size);
  }

  /**
   * A `Colors` TEXT colour, else FontColor; HyperLinkColor; the
   * HyperlinkUnderlineThickness/Style stroke; tab size 8
   * (`FontConfiguration.create` 4-arg, FontConfiguration.java:229-232).
   * @see Style.java:255-268
   */
  getFontConfiguration(set: HColorSet, colors?: Colors): FontConfiguration {
    const font = this.getUFont();
    const color = (colors === undefined ? undefined : colorsGet(colors, ColorType.TEXT)) ?? this.fontColor(set);
    const hyperlinkColor = this.value('HyperLinkColor').asColor(set);
    const stroke = this.getStrokeOf('HyperlinkUnderlineThickness', 'HyperlinkUnderlineStyle');
    return FontConfiguration.create(font, color, hyperlinkColor, stroke);
  }

  private fontColor(set: HColorSet): HColor {
    return this.value('FontColor').asColor(set);
  }

  /** @see Style.java:299-301 */
  getStroke(): UStroke {
    return this.getStrokeOf('LineThickness', 'LineStyle');
  }

  /**
   * `LineColor` as the foreground (`HColors.none()` where it is null),
   * then {@link getStroke}. Applying an `HColor` sets the foreground
   * (AbstractCommonUGraphic.java:123-124), which is the port's `Fore`.
   * @see Style.java:372-381
   */
  applyStrokeAndLineColor(ug: UGraphic, colorSet: HColorSet): UGraphic {
    const color: HColor | undefined = this.value('LineColor').asColor(colorSet);
    if (color === undefined) ug = ug.apply(new Fore(HColors.none()));
    else ug = ug.apply(new Fore(foregroundOf(color)));

    ug = ug.apply(this.getStroke());
    return ug;
  }

  /** Thickness, plus a dash from the `-;,`-separated style when it parses. @see Style.java:303-320 */
  private getStrokeOf(thicknessParam: PName, styleParam: PName): UStroke {
    const thickness = this.value(thicknessParam).asDouble();
    const dash = requireString(this.value(styleParam).asString());
    if (dash.length === 0) return UStroke.withThickness(thickness);

    const parsed = parseDash(dash);
    if (parsed === undefined) return UStroke.withThickness(thickness);
    return new UStroke(parsed[0], parsed[1], thickness);
  }

  /** @see Style.java:330-333 */
  wrapWidth(): LineBreakStrategy {
    return new LineBreakStrategy(this.value('MaximumWidth').asString());
  }

  /** @see Style.java:335-338 */
  getPadding(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.read(requireString(this.value('Padding').asString()));
  }

  /** @see Style.java:340-343 */
  getMargin(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.read(requireString(this.value('Margin').asString()));
  }

  /** `undefined` where `HorizontalAlignment.fromString` returns null. @see Style.java:345-347 */
  getHorizontalAlignment(): HorizontalAlignment | undefined {
    return this.value('HorizontalAlignment').asHorizontalAlignment();
  }
}
