import type { Paint } from '../paint.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { UDrawable } from '../klimt/shape/UDrawable.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { Fore } from '../klimt/Fore.js';
import { Back } from '../klimt/Back.js';
import { UTranslate } from '../klimt/UTranslate.js';
import { UGroup, UGroupType } from '../klimt/shape/UGroup.js';
import { URectangle } from '../klimt/shape/URectangle.js';
import { UEllipse } from '../klimt/shape/UEllipse.js';
import { UPolygon } from '../klimt/shape/UPolygon.js';
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { ColorParam } from './ColorParam.js';
import type { StyleSignatureBasic } from '../style/StyleSignatureBasic.js';

export { ColorParam } from './ColorParam.js';
export type { SName, StyleSignatureBasic } from '../style/StyleSignatureBasic.js';

/**
 * The `StringUtils` private-use-area placeholder chars each modifier
 * rewrites its leading visibility character to (consumed slice — the
 * full `StringUtils.java` port is future missions' work; move there
 * when it lands). Kept as an object named like the upstream class so
 * call sites read `StringUtils.PRIVATE_FIELD` exactly as in Java.
 *
 * @see net/sourceforge/plantuml/StringUtils.java:102-110
 */
const StringUtils = {
  PRIVATE_FIELD: '',
  PROTECTED_FIELD: '',
  PACKAGE_PRIVATE_FIELD: '',
  PUBLIC_FIELD: '',
  PRIVATE_METHOD: '',
  PROTECTED_METHOD: '',
  PACKAGE_PRIVATE_METHOD: '',
  PUBLIC_METHOD: '',
  IE_MANDATORY: '',
} as const;

/**
 * The `startGroup`/`closeGroup` surface — extra duck-typed surface on
 * concrete UGraphics, outside the scoped `UGraphic` interface. Local
 * copy per the one-local-helper-per-call-site convention (see
 * `svek/Cluster.ts#requireGroups` and `svek/DecorateEntityImage.ts`,
 * whose own helper is not exported; importing svek from skin/ would
 * also invert upstream's package direction).
 */
interface UGraphicWithGroups extends UGraphic {
  startGroup(group: UGroup): void;
  closeGroup(): void;
}

function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('VisibilityModifier: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}

/**
 * VisibilityModifier — the class-member visibility markers (`-` `#` `+`
 * `~` `*`): parsing statics that map a member's leading character to a
 * modifier (Member.java:133-134 callers), the placeholder-char round
 * trip through `StringUtils`, and the icon geometry (square/diamond/
 * triangle/circle) drawn in front of fields and methods.
 *
 * Upstream: skin/VisibilityModifier.java — a 9-constant Java enum,
 * ported as a class with static readonly instances (per-constant data +
 * instance methods rule out the as-const string-union convention used
 * for data-free enums; see `ActorStyle.ts` for that other pattern).
 * Ported in full, including the icon-drawing members with no TS caller
 * today (ADR-1: this port is porting every diagram type — callerless is
 * not unreachable).
 *
 * Enum-mechanics flattening (reported): Java's inherited `name()` is
 * the readonly field `name`; `values()` is a static method over the
 * declaration-ordered instance list.
 *
 * Color seam: `HColor` parameters/returns map to `Paint`
 * (`HColors.none()` -> `'none'`, `.bg()` -> `new Back(...)`, foreground
 * apply -> `new Fore(...)` — the established klimt seam, see `Back.ts`).
 *
 * `getUBlock` omission (reported): upstream's anonymous TextBlock
 * overrides `getInnerPosition` to return null; this port's `TextBlock`
 * interface dropped that member project-wide (see `TextBlock.ts`), so
 * the override has no seat — behavior (no inner position) is identical.
 */
export class VisibilityModifier {
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:58 */
  static readonly PRIVATE_FIELD = new VisibilityModifier(
    'PRIVATE_FIELD',
    StringUtils.PRIVATE_FIELD,
    ColorParam.iconPrivate,
    null,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:59 */
  static readonly PROTECTED_FIELD = new VisibilityModifier(
    'PROTECTED_FIELD',
    StringUtils.PROTECTED_FIELD,
    ColorParam.iconProtected,
    null,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:60 */
  static readonly PACKAGE_PRIVATE_FIELD = new VisibilityModifier(
    'PACKAGE_PRIVATE_FIELD',
    StringUtils.PACKAGE_PRIVATE_FIELD,
    ColorParam.iconPackage,
    null,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:61 */
  static readonly PUBLIC_FIELD = new VisibilityModifier(
    'PUBLIC_FIELD',
    StringUtils.PUBLIC_FIELD,
    ColorParam.iconPublic,
    null,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:63 */
  static readonly PRIVATE_METHOD = new VisibilityModifier(
    'PRIVATE_METHOD',
    StringUtils.PRIVATE_METHOD,
    ColorParam.iconPrivate,
    ColorParam.iconPrivateBackground,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:64 */
  static readonly PROTECTED_METHOD = new VisibilityModifier(
    'PROTECTED_METHOD',
    StringUtils.PROTECTED_METHOD,
    ColorParam.iconProtected,
    ColorParam.iconProtectedBackground,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:65-66 */
  static readonly PACKAGE_PRIVATE_METHOD = new VisibilityModifier(
    'PACKAGE_PRIVATE_METHOD',
    StringUtils.PACKAGE_PRIVATE_METHOD,
    ColorParam.iconPackage,
    ColorParam.iconPackageBackground,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:67 */
  static readonly PUBLIC_METHOD = new VisibilityModifier(
    'PUBLIC_METHOD',
    StringUtils.PUBLIC_METHOD,
    ColorParam.iconPublic,
    ColorParam.iconPublicBackground,
  );
  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:69 */
  static readonly IE_MANDATORY = new VisibilityModifier(
    'IE_MANDATORY',
    StringUtils.IE_MANDATORY,
    ColorParam.iconIEMandatory,
    ColorParam.iconIEMandatory,
  );

  private static readonly ENUM_VALUES: readonly VisibilityModifier[] = [
    VisibilityModifier.PRIVATE_FIELD,
    VisibilityModifier.PROTECTED_FIELD,
    VisibilityModifier.PACKAGE_PRIVATE_FIELD,
    VisibilityModifier.PUBLIC_FIELD,
    VisibilityModifier.PRIVATE_METHOD,
    VisibilityModifier.PROTECTED_METHOD,
    VisibilityModifier.PACKAGE_PRIVATE_METHOD,
    VisibilityModifier.PUBLIC_METHOD,
    VisibilityModifier.IE_MANDATORY,
  ];

  /** Java `Enum#values()` — declaration order. */
  static values(): readonly VisibilityModifier[] {
    return VisibilityModifier.ENUM_VALUES;
  }

  /** Java `Enum#name()`, flattened to a field (see the class doc). */
  readonly name: string;
  private readonly foregroundParam: ColorParam;
  private readonly backgroundParam: ColorParam | null;
  private readonly unicode: string;

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:75-77 */
  static regexForVisibilityCharacter(): string {
    return '[-#+~]';
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java:79-83 */
  private constructor(name: string, unicode: string, foreground: ColorParam, background: ColorParam | null) {
    this.name = name;
    this.foregroundParam = foreground;
    this.backgroundParam = background;
    this.unicode = unicode;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getUDrawable */
  getUDrawable(size: number, foregroundColor: Paint, backgoundColor: Paint | null): UDrawable {
    return {
      drawU: (ug: UGraphic): void => {
        this.drawWithGroup(ug, size, foregroundColor, backgoundColor, 0, 0);
      },
    };
  }

  /**
   * Upstream marks `calculateDimension` `@Fast` (annotation only — no
   * behavior).
   *
   * @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getUBlock
   */
  getUBlock(
    size: number,
    foregroundColor: Paint,
    backgoundColor: Paint | null,
    withInvisibleRectanble: boolean,
  ): TextBlock {
    return {
      calculateDimension: (): XDimension2D => new XDimension2D(size + 1, size + 1),
      drawU: (ug: UGraphic): void => {
        if (withInvisibleRectanble) ug.apply(new Fore('none')).draw(URectangle.build(size * 2, size));

        this.drawWithGroup(ug, size, foregroundColor, backgoundColor, 0, 0);
      },
    };
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawWithGroup */
  private drawWithGroup(
    ug: UGraphic,
    size: number,
    foregroundColor: Paint,
    backgoundColor: Paint | null,
    x: number,
    y: number,
  ): void {
    const group = new UGroup();
    group.put(UGroupType.DATA_VISIBILITY_MODIFIER, this.name);
    const ugg = requireGroups(ug);
    ugg.startGroup(group);
    this.drawInternal(ugg, size, foregroundColor, backgoundColor, x, y);
    // #lizard forgives -- upstream's own 6-parameter signature
    // (VisibilityModifier.java#drawWithGroup); preserved verbatim
    // (do-not-refactor-while-porting, CLAUDE.md).
    ugg.closeGroup();
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawInternal */
  private drawInternal(
    ug: UGraphic,
    size: number,
    foregroundColor: Paint,
    backgoundColor: Paint | null,
    x: number,
    y: number,
  ): void {
    if (backgoundColor === null) ug = ug.apply(new Back('none'));
    else ug = ug.apply(new Back(backgoundColor));

    ug = ug.apply(new Fore(foregroundColor));
    size = VisibilityModifier.ensureEven(size);
    switch (this) {
      case VisibilityModifier.PACKAGE_PRIVATE_FIELD:
        this.drawTriangle(ug, false, size, x, y);
        break;

      case VisibilityModifier.PRIVATE_FIELD:
        this.drawSquare(ug, false, size, x, y);
        break;

      case VisibilityModifier.PROTECTED_FIELD:
        this.drawDiamond(ug, false, size, x, y);
        break;

      case VisibilityModifier.PUBLIC_FIELD:
        this.drawCircle(ug, false, size, x, y);
        break;

      case VisibilityModifier.PACKAGE_PRIVATE_METHOD:
        this.drawTriangle(ug, true, size, x, y);
        break;

      case VisibilityModifier.PRIVATE_METHOD:
        this.drawSquare(ug, true, size, x, y);
        break;

      case VisibilityModifier.PROTECTED_METHOD:
        this.drawDiamond(ug, true, size, x, y);
        break;

      case VisibilityModifier.PUBLIC_METHOD:
        this.drawCircle(ug, true, size, x, y);
        break;

      case VisibilityModifier.IE_MANDATORY:
        this.drawCircle(ug, true, size, x, y);
        break;

      default:
        // #lizard forgives -- faithful port of upstream's 9-case shape
        // dispatch switch (VisibilityModifier.java#drawInternal);
        // do-not-refactor-while-porting, CLAUDE.md.
        throw new Error('IllegalStateException');
    }
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawSquare */
  private drawSquare(ug: UGraphic, filled: boolean, size: number, x: number, y: number): void {
    ug.apply(new UTranslate(x + 2, y + 2)).draw(URectangle.build(size - 4, size - 4));
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawCircle */
  private drawCircle(ug: UGraphic, filled: boolean, size: number, x: number, y: number): void {
    ug.apply(new UTranslate(x + 2, y + 2)).draw(UEllipse.build(size - 4, size - 4));
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#ensureEven */
  private static ensureEven(n: number): number {
    if (n % 2 === 1) n--;

    return n;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawDiamond */
  private drawDiamond(ug: UGraphic, filled: boolean, size: number, x: number, y: number): void {
    const poly = new UPolygon();
    size -= 2;
    poly.addPoint(size / 2.0, 0);
    poly.addPoint(size, size / 2.0);
    poly.addPoint(size / 2.0, size);
    poly.addPoint(0, size / 2.0);
    ug.apply(new UTranslate(x + 1, y)).draw(poly);
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#drawTriangle */
  private drawTriangle(ug: UGraphic, filled: boolean, size: number, x: number, y: number): void {
    const poly = new UPolygon();
    size -= 2;
    poly.addPoint(size / 2.0, 1);
    poly.addPoint(0, size - 1);
    poly.addPoint(size, size - 1);
    ug.apply(new UTranslate(x + 1, y)).draw(poly);
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#isVisibilityCharacter */
  static isVisibilityCharacter(s: string): boolean {
    if (s.length <= 2) return false;

    const c = s.charAt(0);
    if (s.charAt(1) === c) return false;

    if (c === '-') return true;

    if (c === '#') return true;

    if (c === '+') return true;

    if (c === '~') return true;

    if (c === '*') return true;

    return false;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getByUnicode */
  static getByUnicode(c: string): VisibilityModifier | null {
    for (const modifier of VisibilityModifier.values()) if (modifier.unicode === c) return modifier;

    return null;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#replaceVisibilityModifierByUnicodeChar */
  static replaceVisibilityModifierByUnicodeChar(s: string, isField: boolean): string {
    const modifier = VisibilityModifier.getVisibilityModifier(s, isField);
    if (modifier === null) return s;

    return modifier.unicode + s.substring(1);
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getVisibilityModifier */
  static getVisibilityModifier(s: string, isField: boolean): VisibilityModifier | null {
    if (s.length <= 2) return null;

    const c = s.charAt(0);
    if (s.charAt(1) === c) return null;

    if (isField) return VisibilityModifier.getVisibilityModifierForField(c);

    return VisibilityModifier.getVisibilityModifierForMethod(c);
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getVisibilityModifierForField */
  private static getVisibilityModifierForField(c: string): VisibilityModifier | null {
    if (c === '-') return VisibilityModifier.PRIVATE_FIELD;

    if (c === '#') return VisibilityModifier.PROTECTED_FIELD;

    if (c === '+') return VisibilityModifier.PUBLIC_FIELD;

    if (c === '~') return VisibilityModifier.PACKAGE_PRIVATE_FIELD;

    if (c === '*') return VisibilityModifier.IE_MANDATORY;

    return null;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getVisibilityModifierForMethod */
  private static getVisibilityModifierForMethod(c: string): VisibilityModifier | null {
    if (c === '-') return VisibilityModifier.PRIVATE_METHOD;

    if (c === '#') return VisibilityModifier.PROTECTED_METHOD;

    if (c === '+') return VisibilityModifier.PUBLIC_METHOD;

    if (c === '~') return VisibilityModifier.PACKAGE_PRIVATE_METHOD;

    if (c === '*') return VisibilityModifier.IE_MANDATORY;

    return null;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getForeground */
  getForeground(): ColorParam {
    return this.foregroundParam;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getBackground */
  getBackground(): ColorParam | null {
    return this.backgroundParam;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getXmiVisibility */
  getXmiVisibility(): string {
    if (this === VisibilityModifier.PUBLIC_FIELD || this === VisibilityModifier.PUBLIC_METHOD) return 'public';

    if (this === VisibilityModifier.PRIVATE_FIELD || this === VisibilityModifier.PRIVATE_METHOD)
      return 'private';

    if (this === VisibilityModifier.PROTECTED_FIELD || this === VisibilityModifier.PROTECTED_METHOD)
      return 'protected';

    if (this === VisibilityModifier.PACKAGE_PRIVATE_FIELD || this === VisibilityModifier.PACKAGE_PRIVATE_METHOD)
      return 'package';

    throw new Error('IllegalStateException');
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#isField */
  isField(): boolean {
    if (
      this === VisibilityModifier.PUBLIC_FIELD ||
      this === VisibilityModifier.PRIVATE_FIELD ||
      this === VisibilityModifier.PROTECTED_FIELD ||
      this === VisibilityModifier.PACKAGE_PRIVATE_FIELD
    )
      return true;

    return false;
  }

  /** @see net/sourceforge/plantuml/skin/VisibilityModifier.java#getStyleSignature */
  getStyleSignature(): StyleSignatureBasic {
    if (this === VisibilityModifier.IE_MANDATORY)
      return { names: ['root', 'element', 'visibilityIcon', 'IEMandatory'] };

    if (this === VisibilityModifier.PUBLIC_FIELD || this === VisibilityModifier.PUBLIC_METHOD)
      return { names: ['root', 'element', 'visibilityIcon', 'public_'] };

    if (this === VisibilityModifier.PRIVATE_FIELD || this === VisibilityModifier.PRIVATE_METHOD)
      return { names: ['root', 'element', 'visibilityIcon', 'private_'] };

    if (this === VisibilityModifier.PROTECTED_FIELD || this === VisibilityModifier.PROTECTED_METHOD)
      return { names: ['root', 'element', 'visibilityIcon', 'protected_'] };

    if (this === VisibilityModifier.PACKAGE_PRIVATE_FIELD || this === VisibilityModifier.PACKAGE_PRIVATE_METHOD)
      return { names: ['root', 'element', 'visibilityIcon', 'package_'] };

    // #lizard forgives -- faithful port of upstream's five paired-constant
    // if chains (VisibilityModifier.java#getStyleSignature);
    // do-not-refactor-while-porting, CLAUDE.md.
    throw new Error('IllegalStateException');
  }
}
