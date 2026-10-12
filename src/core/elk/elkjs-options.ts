/**
 * How an ELK property value is written into an elkjs `layoutOptions` entry:
 * the string ELK's `LayoutOptionData#parseValue` turns back into the value
 * (elkjs 0.12.0 `elk-worker.js:67549-67600`; `JsonImporter#setOption`,
 * `:77463-77478`).
 */
import { ElkBackendError } from './elk-backend.js';
import { ELK_OPTION_TYPE, type ElkPropertyValue, type ElkProxyEnumSetObject, type IProperty } from './elk-object.js';
import { CoreOptions } from './proxy/core/options/CoreOptions.js';

/**
 * The real ELK set that behaves exactly as a set of PROXY enums does, per
 * option. Upstream's `ElkWithProperty.java:30-39`:
 *
 *     result = EnumSet.noneOf((Class) elk.getClass());   // the PROXY class
 *     result.add(elk);                                    // never getTrueObject()
 *
 * so ELK holds a non-empty set whose `contains(...)` is false for every real
 * constant. JSON cannot carry proxy objects. For `nodeLabels.placement` every
 * reader in ELK 0.12.0 sees `[OUTSIDE]` exactly as it sees the proxy set:
 *  - `isEmpty()` is false for both: `ElkGraphLayoutTransferrer` writes the
 *    label's location back (`:196-199`, `:619-622`), and
 *    `GraphTransformer#transposeNodeLabelPlacement` (`:683-728`) does not
 *    return early.
 *  - That transposition adds `OUTSIDE` when `INSIDE` is absent and tests no
 *    other member either set holds, so both become `{OUTSIDE, H_PRIORITY}`;
 *    the H/V mirrors (`:308-322`, `:507-521`) test only H_LEFT/H_RIGHT/
 *    V_TOP/V_BOTTOM, absent from both.
 *  - `NodeLabelLocation#fromNodeLabelPlacement` (`:371-378`) needs an exact
 *    three-member match, so both resolve to `UNDEFINED` and the label is
 *    left where it is (`NodeLabelCellCreator#handleNodeLabel`, `:74-82`).
 * Paths are under `~/git/knowvah/elk/plugins/`. The contract suite pins the
 * result against the jar: label at (0, 0), where the intended set gives (0, 5).
 */
const PROXY_ENUM_SET_EQUIVALENT: ReadonlyMap<string, readonly string[]> = new Map([
  [CoreOptions.NODE_LABELS_PLACEMENT.id, ['OUTSIDE']],
]);

function typeError(property: IProperty, value: ElkPropertyValue): ElkBackendError {
  return new ElkBackendError(`${property.id} expects an ${property.type} value, got ${JSON.stringify(value)}`);
}

function effectiveProxyEnumSet(property: IProperty, value: ElkProxyEnumSetObject): string {
  const equivalent = PROXY_ENUM_SET_EQUIVALENT.get(property.id);
  if (equivalent === undefined) {
    throw new ElkBackendError(
      `${property.id}: no effective value is known for an EnumSet of proxy enums ` +
        `(${value.proxyClassName} [${value.names.join(', ')}]); upstream never sets it`,
    );
  }
  return `[${equivalent.join(', ')}]`;
}

/** `Spacing#toString` (`org/eclipse/elk/core/math/Spacing.java:211-213`), which `Spacing#parse` reads back. */
function paddingString(value: ElkPropertyValue, property: IProperty): string {
  if (typeof value !== 'object' || value.kind !== 'ElkPadding') throw typeError(property, value);
  return `[top=${value.top},left=${value.left},bottom=${value.bottom},right=${value.right}]`;
}

/** The `layoutOptions` string for `value`, by the option's `LayoutOptionData.Type`. */
export function encodeOptionValue(property: IProperty, value: ElkPropertyValue): string {
  switch (property.type) {
    case ELK_OPTION_TYPE.ENUM:
      if (typeof value === 'object' && value.kind === 'enum') return value.name;
      throw typeError(property, value);
    case ELK_OPTION_TYPE.BOOLEAN:
      if (typeof value === 'boolean') return String(value);
      throw typeError(property, value);
    case ELK_OPTION_TYPE.ENUMSET:
      if (typeof value === 'object' && value.kind === 'proxyEnumSet') return effectiveProxyEnumSet(property, value);
      throw typeError(property, value);
    case ELK_OPTION_TYPE.OBJECT:
      return paddingString(value, property);
  }
}
