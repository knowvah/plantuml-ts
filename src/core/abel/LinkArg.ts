import { Display } from '../klimt/creole/Display.js';
import { VisibilityModifier } from '../skin/VisibilityModifier.js';

/**
 * LinkArg — the label bundle of a `Link`: creole label, dot length,
 * quantifiers, roles, kals, labeldistance/labelangle, plus the
 * visibility modifier extracted from the label's first character.
 * Fluent `with*` builders return NEW instances (upstream's private
 * constructor is the single assignment site); `visibilityModifier`
 * and `length` are the two mutable fields.
 *
 * SI1/T6 — full port (15/15 members).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LinkArg.java:41
 */
export class LinkArg {
  /** @see abel/LinkArg.java:43-55 */
  private readonly label: Display;
  private readonly quantifier1: string | undefined;
  private readonly quantifier2: string | undefined;
  private readonly role1: string | undefined;
  private readonly role2: string | undefined;
  private readonly labeldistance: string | undefined;
  private readonly labelangle: string | undefined;
  private readonly kal1: string | undefined;
  private readonly kal2: string | undefined;
  private visibilityModifier: VisibilityModifier | undefined;
  private length: number;

  /** Java's 11-arg private constructor, verbatim parameter order.
   * @see abel/LinkArg.java:98-113 */
  private constructor(
    label: Display,
    length: number,
    quantifier1: string | undefined,
    quantifier2: string | undefined,
    labeldistance: string | undefined,
    labelangle: string | undefined,
    visibilityModifier: VisibilityModifier | undefined,
    kal1: string | undefined,
    kal2: string | undefined,
    role1: string | undefined,
    role2: string | undefined,
  ) {
    this.label = label;
    this.visibilityModifier = visibilityModifier;
    this.length = length;
    this.quantifier1 = quantifier1;
    this.quantifier2 = quantifier2;
    this.labeldistance = labeldistance;
    this.labelangle = labelangle;
    this.kal1 = kal1;
    this.kal2 = kal2;
    this.role1 = role1;
    this.role2 = role2;
    // #lizard forgives -- 11 PARAM mirror upstream's private constructor
    // verbatim (LinkArg.java:98-113); do-not-refactor-while-porting.
  }

  /** Both `build` overloads (2-arg delegates with `true`). Upstream
   * passes `label.get(0)` (a `CharSequence`) to the two
   * `VisibilityModifier` statics; this port's `DisplayElement` union is
   * stringified first, and the statics' `null` becomes `undefined`.
   * @see abel/LinkArg.java:57-59 (2-arg), :65-76 (3-arg) */
  static build(label: Display, length: number, manageVisibilityModifier = true): LinkArg {
    let visibilityModifier: VisibilityModifier | undefined = undefined;
    let newLabel: Display;
    if (Display.isNull(label)) {
      newLabel = Display.NULL;
    } else {
      newLabel = label.manageGuillemet(manageVisibilityModifier);
      if (manageVisibilityModifier && VisibilityModifier.isVisibilityCharacter(String(label.get(0))))
        visibilityModifier =
          VisibilityModifier.getVisibilityModifier(String(label.get(0)), false) ?? undefined;
    }
    return new LinkArg(
      newLabel,
      length,
      undefined,
      undefined,
      undefined,
      undefined,
      visibilityModifier,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  /** @see abel/LinkArg.java:61-63 */
  static noDisplay(length: number): LinkArg {
    return LinkArg.build(Display.NULL, length, true);
  }

  /** @see abel/LinkArg.java:78-81 */
  withQuantifier(quantifier1: string | undefined, quantifier2: string | undefined): LinkArg {
    return new LinkArg(
      this.label,
      this.length,
      quantifier1,
      quantifier2,
      this.labeldistance,
      this.labelangle,
      this.visibilityModifier,
      this.kal1,
      this.kal2,
      this.role1,
      this.role2,
    );
  }

  /** @see abel/LinkArg.java:83-86 */
  withRole(role1: string | undefined, role2: string | undefined): LinkArg {
    return new LinkArg(
      this.label,
      this.length,
      this.quantifier1,
      this.quantifier2,
      this.labeldistance,
      this.labelangle,
      this.visibilityModifier,
      this.kal1,
      this.kal2,
      role1,
      role2,
    );
  }

  /** @see abel/LinkArg.java:88-91 */
  withKal(kal1: string | undefined, kal2: string | undefined): LinkArg {
    return new LinkArg(
      this.label,
      this.length,
      this.quantifier1,
      this.quantifier2,
      this.labeldistance,
      this.labelangle,
      this.visibilityModifier,
      kal1,
      kal2,
      this.role1,
      this.role2,
    );
  }

  /** @see abel/LinkArg.java:93-96 */
  withDistanceAngle(labeldistance: string | undefined, labelangle: string | undefined): LinkArg {
    return new LinkArg(
      this.label,
      this.length,
      this.quantifier1,
      this.quantifier2,
      labeldistance,
      labelangle,
      this.visibilityModifier,
      this.kal1,
      this.kal2,
      this.role1,
      this.role2,
    );
  }

  /** Swaps quantifiers, kals, and roles (1↔2); everything else carried.
   * @see abel/LinkArg.java:115-118 */
  getInv(): LinkArg {
    return new LinkArg(
      this.label,
      this.length,
      this.quantifier2,
      this.quantifier1,
      this.labeldistance,
      this.labelangle,
      this.visibilityModifier,
      this.kal2,
      this.kal1,
      this.role2,
      this.role1,
    );
  }

  /** @see abel/LinkArg.java:120-122 */
  getLabel(): Display {
    return this.label;
  }

  /** @see abel/LinkArg.java:124-126 */
  getLength(): number {
    return this.length;
  }

  /** @see abel/LinkArg.java:128-130 */
  getQuantifier1(): string | undefined {
    return this.quantifier1;
  }

  /** @see abel/LinkArg.java:132-134 */
  getQuantifier2(): string | undefined {
    return this.quantifier2;
  }

  /** @see abel/LinkArg.java:136-138 */
  getLabeldistance(): string | undefined {
    return this.labeldistance;
  }

  /** @see abel/LinkArg.java:140-142 */
  getLabelangle(): string | undefined {
    return this.labelangle;
  }

  /** @see abel/LinkArg.java:144-146 */
  getVisibilityModifier(): VisibilityModifier | undefined {
    return this.visibilityModifier;
  }

  /** @see abel/LinkArg.java:148-150 */
  setVisibilityModifier(visibilityModifier: VisibilityModifier | undefined): void {
    this.visibilityModifier = visibilityModifier;
  }

  /** @see abel/LinkArg.java:152-154 */
  setLength(length: number): void {
    this.length = length;
  }

  /** @see abel/LinkArg.java:156-158 */
  getKal1(): string | undefined {
    return this.kal1;
  }

  /** @see abel/LinkArg.java:160-162 */
  getKal2(): string | undefined {
    return this.kal2;
  }

  /** @see abel/LinkArg.java:164-166 */
  getRole1(): string | undefined {
    return this.role1;
  }

  /** @see abel/LinkArg.java:168-170 */
  getRole2(): string | undefined {
    return this.role2;
  }
}
