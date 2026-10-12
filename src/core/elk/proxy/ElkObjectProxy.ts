import { elkEnum, type ElkEnumObject, type ElkTrueObject } from '../elk-object.js';

/**
 * A proxy whose ELK counterpart is built on demand.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/ElkObjectProxy.java:3-7
 */
export interface ElkObjectProxy {
  getTrueObject(): ElkTrueObject;
}

/**
 * A Java `enum X implements ElkObjectProxy` (`EdgeLabelPlacement`,
 * `NodeLabelPlacement`, `SizeConstraint`). Each upstream enum's
 * `getTrueObject()` is `Reflect.getEnum("org.eclipse.elk.core.options.X",
 * name())`; TypeScript enums cannot carry methods, so the three share this
 * base. `ordinal` is the declaration index, the order an `EnumSet` iterates.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/NodeLabelPlacement.java:6-13
 */
export abstract class ElkProxyEnum implements ElkObjectProxy {
  protected constructor(
    /** The proxy enum's own class: the element class of a proxy `EnumSet`. */
    readonly proxyClassName: string,
    /** The ELK enum `getTrueObject` names. */
    readonly trueClassName: string,
    readonly ordinal: number,
    readonly name: string,
  ) {}

  getTrueObject(): ElkEnumObject {
    return elkEnum(this.trueClassName, this.name);
  }

  /** `Enum#toString()`: the constant's name. */
  toString(): string {
    return this.name;
  }
}
