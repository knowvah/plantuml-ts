import type { UChange } from './UChange.js';
import type { UShape } from './UShape.js';
import type { UGraphic } from './UGraphic.js';
import type { Paint } from '../paint.js';
import { Fore } from './Fore.js';
import { Back } from './Back.js';

/**
 * UGraphicWithScale — the group + transform stack `SvgNanoParser.drawU`
 * threads through nested `<g transform=…>` elements, pushing/popping an
 * instance per depth. Not a `UGraphic` itself; it WRAPS one, carrying the
 * accumulated affine transform, rotation angle, and initial scale
 * alongside it (see `getAffineTransform`/`getAngle`/`getInitialScale`).
 *
 * The group + transform stack is core, not optional: a census of
 * `assets/stdlib` found `<g ` 19,416 times and `transform=` 18,241 times.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/UGraphicWithScale.java
 * (package `emoji/`, NOT `svg/parser/` or `klimt/sprite/`).
 */

/**
 * XAffineTransform — the 2D affine transform matrix this class threads
 * through nested groups. Upstream stores the matrix in
 * `java.awt.geom.AffineTransform` row-major form:
 *
 * ```
 * [ m00  m01  m02 ]   [ x ]   [ m00*x + m01*y + m02 ]
 * [ m10  m11  m12 ] * [ y ] = [ m10*x + m11*y + m12 ]
 * [  0    0    1  ]   [ 1 ]   [          1          ]
 * ```
 *
 * Scope reduction: only the members `UGraphicWithScale.java` itself
 * calls are ported here — `getScaleInstance`, the copy constructor (as
 * {@link XAffineTransform.copyOf}), the 6-element flat-matrix
 * constructor (as {@link XAffineTransform.fromFlatMatrix}), the mutating
 * `scale`/`translate`/`rotate`/`concatenate` operations, `getScaleX`/
 * `getScaleY`/`getTranslateX`/`getTranslateY`, and `toString` (all real
 * upstream members, needed here so tests can assert on the composed
 * matrix without inventing a non-upstream accessor). `getRotateInstance`/
 * `getTranslateInstance`/`transform(XPoint2D)`/`toAffineTransform()` have
 * no caller in `UGraphicWithScale.java` and are left for whichever later
 * task (T6/T8's `SvgNanoParser` port) first needs them — this class has
 * no standalone file yet in the port; extend it here rather than
 * duplicating a second copy elsewhere.
 *
 * NOTE on mutability: unlike this port's `UTranslate` (immutable, returns
 * new instances), `scale`/`translate`/`rotate`/`concatenate` mutate
 * `this` in place, faithfully matching upstream's
 * `java.awt.geom.AffineTransform`-style API. `UGraphicWithScale` relies
 * on this: every `apply*` method makes an explicit {@link
 * XAffineTransform.copyOf} BEFORE mutating, so the receiver's own `at`
 * field is never touched — the mutation is safe only because it always
 * targets a fresh copy.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/XAffineTransform.java
 */
export class XAffineTransform {
  private m00: number;
  private m10: number;
  private m01: number;
  private m11: number;
  private m02: number;
  private m12: number;

  constructor(m00: number, m10: number, m01: number, m11: number, m02: number, m12: number) {
    this.m00 = m00;
    this.m10 = m10;
    this.m01 = m01;
    this.m11 = m11;
    this.m02 = m02;
    this.m12 = m12;
    // #lizard forgives -- 6-param constructor is a faithful port of
    // upstream XAffineTransform's own 6-arg constructor (m00,m10,m01,
    // m11,m02,m12), the row-major affine matrix upstream itself uses.
  }

  /** Mirrors `new XAffineTransform(XAffineTransform other)` (the copy constructor). */
  static copyOf(other: XAffineTransform): XAffineTransform {
    return new XAffineTransform(other.m00, other.m10, other.m01, other.m11, other.m02, other.m12);
  }

  /** Mirrors `new XAffineTransform(double[] flatMatrix)`. */
  static fromFlatMatrix(flat: readonly [number, number, number, number, number, number]): XAffineTransform {
    const [m00, m10, m01, m11, m02, m12] = flat;
    return new XAffineTransform(m00, m10, m01, m11, m02, m12);
  }

  /** @see XAffineTransform.java#getScaleInstance */
  static getScaleInstance(sx: number, sy: number): XAffineTransform {
    return new XAffineTransform(sx, 0, 0, sy, 0, 0);
  }

  /** Mutates `this` in place. @see XAffineTransform.java#scale */
  scale(sx: number, sy: number): void {
    this.m00 *= sx;
    this.m01 *= sx;
    this.m02 *= sx;
    this.m10 *= sy;
    this.m11 *= sy;
    this.m12 *= sy;
  }

  /** Mutates `this` in place. @see XAffineTransform.java#translate */
  translate(tx: number, ty: number): void {
    this.m02 += this.m00 * tx + this.m01 * ty;
    this.m12 += this.m10 * tx + this.m11 * ty;
  }

  /** Mutates `this` in place, rotating about `(anchorX, anchorY)`. @see XAffineTransform.java#rotate */
  rotate(thetaRadians: number, anchorX: number, anchorY: number): void {
    this.translate(anchorX, anchorY);
    const cos = Math.cos(thetaRadians);
    const sin = Math.sin(thetaRadians);
    const n00 = this.m00 * cos + this.m01 * sin;
    const n01 = this.m00 * -sin + this.m01 * cos;
    const n10 = this.m10 * cos + this.m11 * sin;
    const n11 = this.m10 * -sin + this.m11 * cos;
    this.m00 = n00;
    this.m01 = n01;
    this.m10 = n10;
    this.m11 = n11;
    this.translate(-anchorX, -anchorY);
  }

  /** Mutates `this` in place: `this = this * other`. @see XAffineTransform.java#concatenate */
  concatenate(other: XAffineTransform): void {
    const n00 = this.m00 * other.m00 + this.m01 * other.m10;
    const n01 = this.m00 * other.m01 + this.m01 * other.m11;
    const n02 = this.m00 * other.m02 + this.m01 * other.m12 + this.m02;
    const n10 = this.m10 * other.m00 + this.m11 * other.m10;
    const n11 = this.m10 * other.m01 + this.m11 * other.m11;
    const n12 = this.m10 * other.m02 + this.m11 * other.m12 + this.m12;
    this.m00 = n00;
    this.m01 = n01;
    this.m02 = n02;
    this.m10 = n10;
    this.m11 = n11;
    this.m12 = n12;
  }

  getScaleX(): number {
    return this.m00;
  }

  getScaleY(): number {
    return this.m11;
  }

  getTranslateX(): number {
    return this.m02;
  }

  getTranslateY(): number {
    return this.m12;
  }

  toString(): string {
    return `XAffineTransform[[${this.m00}, ${this.m01}, ${this.m02}], [${this.m10}, ${this.m11}, ${this.m12}]]`;
  }
}

/**
 * Structural contract this class needs from a color resolver
 * (`emoji/ColorResolver.java`; ported separately at
 * `src/core/klimt/sprite/ColorResolver.ts` — a sibling task in this
 * mission batch, running in parallel with no shared write target per
 * `batch-1/overview.md`, and not yet landed when this file was
 * authored). Declared locally and structurally rather than imported, so
 * this file compiles independently of that sibling file; TypeScript's
 * structural typing means the real `ColorResolver` class satisfies this
 * interface automatically once it lands, with no import needed here.
 *
 * Adaptation seam (matches `UBackground.ts`/`UForeground.ts`): upstream
 * `getDefaultColor()`/`getTrueColor(String)` return `HColor`; this port
 * has no `HColor` type, so both return `Paint` here, mirroring every
 * other klimt seam where upstream carries `HColor`.
 */
export interface ColorResolver {
  getDefaultColor(): Paint;
  getTrueColor(code: string): Paint;
}

/**
 * `UGraphicWithScale.java#updateColor`: apply the resolver's default
 * color as both foreground and background before scaling begins, so
 * every primitive drawn without an explicit color inherits the sprite's
 * default. `color.bg()` in Java (`HColor#bg()` wraps the SAME color as a
 * `UBackground`) becomes `new Back(color)` here — this port's `Paint`
 * has no `.bg()` method of its own (see `Back.ts`'s own seam note).
 */
function updateColor(ug: UGraphic, colorResolver: ColorResolver): UGraphic {
  const color = colorResolver.getDefaultColor();
  return ug.apply(new Fore(color)).apply(new Back(color));
}

/**
 * UGraphicWithScale — see the module-level doc comment above.
 *
 * Immutability discipline (interface contract, load-bearing for the
 * `SvgNanoParser` stack): every `apply*` method returns a NEW instance;
 * the receiver's own fields are never mutated. `SvgNanoParser`'s stack
 * (`stack.add(0, ugs)`) stores the OLD instance pushed at each `<g>`
 * depth and restores exactly that reference on `</g>` — never a
 * recomputed equivalent.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/UGraphicWithScale.java
 */
export class UGraphicWithScale {
  private readonly ug: UGraphic;
  private readonly at: XAffineTransform;
  private readonly angle: number;
  private readonly scale: number;
  private readonly colorResolver: ColorResolver;

  private constructor(
    ug: UGraphic,
    colorResolver: ColorResolver,
    at: XAffineTransform,
    angle: number,
    scale: number,
  ) {
    this.ug = ug;
    this.colorResolver = colorResolver;
    this.at = at;
    this.angle = angle;
    this.scale = scale;
  }

  /**
   * Mirrors the public Java constructor
   * `UGraphicWithScale(UGraphic, ColorResolver, double)`. TS has no
   * public/private constructor overload pair, so the Java private
   * 5-arg constructor became this class's actual `constructor`
   * (private here too), and this static factory is the public entry
   * point — matching the pattern already used elsewhere in this port
   * (see `UGraphicStencil.ts`'s `create`/private-constructor pair).
   */
  static create(ug: UGraphic, colorResolver: ColorResolver, scale: number): UGraphicWithScale {
    return new UGraphicWithScale(
      updateColor(ug, colorResolver),
      colorResolver,
      XAffineTransform.getScaleInstance(scale, scale),
      0,
      scale,
    );
  }

  getUg(): UGraphic {
    return this.ug;
  }

  apply(change: UChange): UGraphicWithScale {
    return new UGraphicWithScale(this.ug.apply(change), this.colorResolver, this.at, this.angle, this.scale);
  }

  getTrueColor(code: string): Paint {
    return this.colorResolver.getTrueColor(code);
  }

  getDefaultColor(): Paint {
    return this.colorResolver.getDefaultColor();
  }

  /**
   * @throws {Error} if `changex !== changey` — upstream throws a bare
   * `IllegalArgumentException()`; this port's error-handling convention
   * requires an identifying message even for a faithfully-preserved
   * upstream invariant violation.
   *
   * NOTE — preserved upstream quirk, do not "fix": the new `scale` field
   * is `1 * changex` (i.e. just `changex`), NOT `this.scale * changex`.
   * It does NOT compound with the previous scale, even though the
   * underlying `XAffineTransform` DOES compound (`copy.scale(...)` is
   * applied on top of the existing `at`). `getInitialScale()` therefore
   * reflects only the LAST `applyScale` call's argument, never a
   * cumulative product — faithfully ported as-is (CLAUDE.md: port
   * awkward code unchanged).
   */
  applyScale(changex: number, changey: number): UGraphicWithScale {
    if (changex !== changey) {
      throw new Error(`UGraphicWithScale.applyScale: non-uniform scale is not supported (${changex} !== ${changey})`);
    }
    const copy = XAffineTransform.copyOf(this.at);
    copy.scale(changex, changey);
    return new UGraphicWithScale(this.ug, this.colorResolver, copy, this.angle, 1 * changex);
  }

  draw(shape: UShape): void {
    this.ug.draw(shape);
  }

  applyRotate(deltaAngle: number, x: number, y: number): UGraphicWithScale {
    const copy = XAffineTransform.copyOf(this.at);
    copy.rotate((deltaAngle * Math.PI) / 180, x, y);
    return new UGraphicWithScale(this.ug, this.colorResolver, copy, this.angle + deltaAngle, this.scale);
  }

  applyTranslate(x: number, y: number): UGraphicWithScale {
    const copy = XAffineTransform.copyOf(this.at);
    copy.translate(x, y);
    return new UGraphicWithScale(this.ug, this.colorResolver, copy, this.angle, this.scale);
  }

  getAffineTransform(): XAffineTransform {
    return this.at;
  }

  applyMatrix(v1: number, v2: number, v3: number, v4: number, v5: number, v6: number): UGraphicWithScale {
    // #lizard forgives -- 6-param signature is a faithful port of
    // upstream's `applyMatrix(double v1, v2, v3, v4, v5, v6)`, mirroring
    // the SVG `matrix(a,b,c,d,e,f)` transform function's own 6 operands.
    const copy = XAffineTransform.copyOf(this.at);
    copy.concatenate(XAffineTransform.fromFlatMatrix([v1, v2, v3, v4, v5, v6]));
    return new UGraphicWithScale(this.ug, this.colorResolver, copy, this.angle, this.scale);
  }

  getAngle(): number {
    return this.angle;
  }

  getInitialScale(): number {
    return this.scale;
  }
}
