import { ELK_CORE_OPTIONS_PACKAGE, ELK_PROXY_OPTIONS_PACKAGE } from '../../../elk-object.js';
import { ElkProxyEnum } from '../../ElkObjectProxy.js';

/**
 * Proxy for `org.eclipse.elk.core.options.EdgeLabelPlacement`: upstream
 * declares only the two constants it uses, in this order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/EdgeLabelPlacement.java:6-15
 */
export class EdgeLabelPlacement extends ElkProxyEnum {
  static readonly TAIL = new EdgeLabelPlacement(0, 'TAIL');
  static readonly HEAD = new EdgeLabelPlacement(1, 'HEAD');

  private constructor(ordinal: number, name: string) {
    super(
      `${ELK_PROXY_OPTIONS_PACKAGE}.EdgeLabelPlacement`,
      `${ELK_CORE_OPTIONS_PACKAGE}.EdgeLabelPlacement`,
      ordinal,
      name,
    );
  }
}
