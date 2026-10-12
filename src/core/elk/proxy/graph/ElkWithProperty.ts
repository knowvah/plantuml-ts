import type { ElkEnumObject, ElkPropertyValue, ElkProxyEnumSetObject, IProperty } from '../../elk-object.js';
import type { ElkObjectProxy, ElkProxyEnum } from '../ElkObjectProxy.js';

/**
 * Every value upstream passes to `setProperty`: an `EnumSet` of proxy enums
 * (a `Set` here, as `StyleKey.ts` ports `EnumSet`), a proxy, a reflected ELK
 * constant, or a primitive.
 */
export type ElkPropertyArgument =
  ReadonlySet<ElkProxyEnum> | ElkObjectProxy | ElkEnumObject | boolean | number | string;

/**
 * The property-holding part of every graph-element proxy. Java's
 * `hashCode`/`equals` delegate to the wrapped object; a backend hands out
 * one object per element, so identity already holds here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkWithProperty.java:10-48
 */
export interface ElkWithProperty {
  /** Implementations store {@link trueValueOf}`(value)`; `null` removes the property. */
  setProperty(key: IProperty, value: ElkPropertyArgument): void;
}

function isElkObjectProxy(value: ElkPropertyArgument): value is ElkObjectProxy {
  return typeof value === 'object' && 'getTrueObject' in value;
}

/**
 * `ElkWithProperty.java:30-39`, kept exactly: the loop adds each PROXY enum
 * (`result.add(elk)`) to `EnumSet.noneOf(elk.getClass())` — the proxy's
 * class — and never calls `getTrueObject()`. ELK receives a set of proxy
 * enums and honours none of them. An empty set leaves `result` null.
 */
function proxyEnumSetOf(set: ReadonlySet<ElkProxyEnum>): ElkProxyEnumSetObject | null {
  const members = [...set].sort((a, b) => a.ordinal - b.ordinal);
  const first = members[0];
  if (first === undefined) return null;
  return { kind: 'proxyEnumSet', proxyClassName: first.proxyClassName, names: members.map((m) => m.name) };
}

/**
 * The value ELK receives from `setProperty(key, value)`: the body of
 * `ElkWithProperty#setProperty` up to its `Reflect.call2`. Only a SINGLE
 * proxy goes through `getTrueObject()` (`:40-42`); a set does not (`:30-39`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/graph/ElkWithProperty.java:29-46
 */
export function trueValueOf(value: ElkPropertyArgument): ElkPropertyValue | null {
  if (value instanceof Set) return proxyEnumSetOf(value as ReadonlySet<ElkProxyEnum>);
  if (isElkObjectProxy(value)) return value.getTrueObject();
  return value as ElkEnumObject | boolean | number | string;
}
