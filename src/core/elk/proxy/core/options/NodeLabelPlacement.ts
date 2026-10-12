import { ELK_CORE_OPTIONS_PACKAGE, ELK_PROXY_OPTIONS_PACKAGE } from '../../../elk-object.js';
import { ElkProxyEnum } from '../../ElkObjectProxy.js';

/**
 * Proxy for `org.eclipse.elk.core.options.NodeLabelPlacement`: upstream
 * declares only the three constants it uses, in this order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/NodeLabelPlacement.java:6-15
 */
export class NodeLabelPlacement extends ElkProxyEnum {
  static readonly INSIDE = new NodeLabelPlacement(0, 'INSIDE');
  static readonly V_CENTER = new NodeLabelPlacement(1, 'V_CENTER');
  static readonly H_CENTER = new NodeLabelPlacement(2, 'H_CENTER');

  private constructor(ordinal: number, name: string) {
    super(
      `${ELK_PROXY_OPTIONS_PACKAGE}.NodeLabelPlacement`,
      `${ELK_CORE_OPTIONS_PACKAGE}.NodeLabelPlacement`,
      ordinal,
      name,
    );
  }
}
