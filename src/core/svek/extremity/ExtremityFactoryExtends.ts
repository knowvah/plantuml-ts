import type { Point2D } from '../../klimt/UTranslate.js';
import type { Paint } from '../../paint.js';
import { ExtremityExtends } from './ExtremityExtends.js';
import type { ExtremityFactory } from './ExtremityFactory.js';
import type { Side } from './Side.js';

/**
 * ExtremityFactoryExtends — builds the ELK path's EXTENDS head
 * (`MyElkEdge.java:231-232`): an {@link ExtremityExtends} at `angle - PI/2`.
 *
 * Ported: the constructor and `createUDrawable`. Not ported:
 * `createTBRDrawableLegacy` (`:57-62`; it throws `UnsupportedOperationException`
 * upstream and is not part of this port's `ExtremityFactory`, see
 * `ExtremityFactory.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityFactoryExtends.java
 */
export class ExtremityFactoryExtends implements ExtremityFactory {
  private readonly backgroundColor: Paint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityFactoryExtends.java:48-50 */
  constructor(backgroundColor: Paint) {
    this.backgroundColor = backgroundColor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityFactoryExtends.java:52-55 */
  createUDrawable(p0: Point2D, angle: number, _side: Side | null): ExtremityExtends {
    return new ExtremityExtends(p0, angle - Math.PI / 2, this.backgroundColor);
  }
}
