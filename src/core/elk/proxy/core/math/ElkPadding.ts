import type { ElkPaddingObject } from '../../../elk-object.js';
import type { ElkObjectProxy } from '../../ElkObjectProxy.js';

/**
 * Proxy for `org.eclipse.elk.core.math.ElkPadding`, in upstream's
 * constructor order: top, right, bottom, left.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/math/ElkPadding.java:6-20
 */
export class ElkPadding implements ElkObjectProxy {
  constructor(
    private readonly top: number,
    private readonly right: number,
    private readonly bottom: number,
    private readonly left: number,
  ) {}

  getTrueObject(): ElkPaddingObject {
    return { kind: 'ElkPadding', top: this.top, right: this.right, bottom: this.bottom, left: this.left };
  }
}
