/**
 * The objects upstream's ELK proxy layer hands to ELK itself, named
 * backend-neutrally.
 *
 * Upstream reaches ELK only through reflection so the jar runs without ELK
 * on the classpath (`elk/proxy/Reflect.java`; `CucaDiagramFileMakerElk.java:56-66`).
 * Every value it passes is one of: an `IProperty` read off `CoreOptions` by
 * `Reflect.field`, an ELK enum constant (`Reflect.field` / `Reflect.getEnum`),
 * a `new org.eclipse.elk.core.math.ElkPadding(...)` (`Reflect.newInstance`),
 * a boxed primitive, or — the proxy's own defect — an `EnumSet` of PROXY
 * enums (`ElkWithProperty.java:30-39`). `Reflect.java` has no port: its role
 * is the `ElkBackend` (cdd8 D2), and these types are what crosses into it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/Reflect.java
 */

/** `org.eclipse.elk.core.options`: the package of every option class upstream reflects. */
export const ELK_CORE_OPTIONS_PACKAGE = 'org.eclipse.elk.core.options';

/** `net.sourceforge.plantuml.elk.proxy.core.options`: the package of upstream's proxy enums. */
export const ELK_PROXY_OPTIONS_PACKAGE = 'net.sourceforge.plantuml.elk.proxy.core.options';

/**
 * ELK's `LayoutOptionData.Type` for the options upstream sets — how a value is
 * parsed from its serialised form (elkjs 0.12.0 `elk-worker.js:67549-67600`,
 * `LayoutOptionData#parseValue`).
 */
export const ELK_OPTION_TYPE = {
  ENUM: 'ENUM',
  ENUMSET: 'ENUMSET',
  BOOLEAN: 'BOOLEAN',
  OBJECT: 'OBJECT',
} as const;

export type ElkOptionType = (typeof ELK_OPTION_TYPE)[keyof typeof ELK_OPTION_TYPE];

/** An `org.eclipse.elk.graph.properties.IProperty`: one `CoreOptions` field. */
export interface IProperty {
  /** The `CoreOptions` field name upstream reflects (`CoreOptions.java:7-21`). */
  readonly field: string;
  /** ELK's option id, the key of an elkjs `layoutOptions` entry. */
  readonly id: string;
  readonly type: ElkOptionType;
}

/** An ELK enum constant: `Reflect.field(className, name)` or `Reflect.getEnum(className, name)`. */
export interface ElkEnumObject {
  readonly kind: 'enum';
  readonly className: string;
  readonly name: string;
}

/** `new org.eclipse.elk.core.math.ElkPadding(top, right, bottom, left)` (`ElkPadding.java:11-13`). */
export interface ElkPaddingObject {
  readonly kind: 'ElkPadding';
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * What `ElkWithProperty#setProperty` passes for an `EnumSet` value: a set
 * whose elements are the PROXY enums themselves, never their
 * `getTrueObject()` (`ElkWithProperty.java:30-39`). ELK's `contains(...)` on
 * it is false for every real constant. `names` is in ordinal order, the
 * order `EnumSet` iterates.
 */
export interface ElkProxyEnumSetObject {
  readonly kind: 'proxyEnumSet';
  readonly proxyClassName: string;
  readonly names: readonly string[];
}

/** What `ElkObjectProxy#getTrueObject` returns. */
export type ElkTrueObject = ElkEnumObject | ElkPaddingObject;

/** Every value a property can hold once the proxy layer has passed it on. */
export type ElkPropertyValue = ElkTrueObject | ElkProxyEnumSetObject | boolean | number | string;

export function elkEnum(className: string, name: string): ElkEnumObject {
  return { kind: 'enum', className, name };
}

export function elkProperty(field: string, id: string, type: ElkOptionType): IProperty {
  return { field, id, type };
}
