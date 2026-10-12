import { ELK_CORE_OPTIONS_PACKAGE, ELK_PROXY_OPTIONS_PACKAGE } from '../../../elk-object.js';
import { ElkProxyEnum } from '../../ElkObjectProxy.js';

/**
 * Proxy for `org.eclipse.elk.core.options.SizeConstraint`. Upstream's only
 * use is commented out (`CucaDiagramFileMakerElk.java:403-405`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/SizeConstraint.java:6-14
 */
export class SizeConstraint extends ElkProxyEnum {
  static readonly NODE_LABELS = new SizeConstraint(0, 'NODE_LABELS');

  private constructor(ordinal: number, name: string) {
    super(`${ELK_PROXY_OPTIONS_PACKAGE}.SizeConstraint`, `${ELK_CORE_OPTIONS_PACKAGE}.SizeConstraint`, ordinal, name);
  }
}
