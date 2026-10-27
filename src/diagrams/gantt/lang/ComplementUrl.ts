import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { UbrexUrlBuilder } from '../../../core/url/UbrexUrlBuilder.js';
import type { Url } from '../../../core/url/Url.js';
import { UrlMode } from '../../../core/url/UrlMode.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';

/**
 * ComplementUrl -- `[[url tooltip label]]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementUrl.java:46-62
 */
export class ComplementUrl implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementUrl.java:48-51 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexNamed('COMPLEMENT', new UBrexLeaf('[[〄>]]'));
  }

  /**
   * `UbrexUrlBuilder.getUrl` falls through to `return null` (UbrexUrlBuilder.java:112-139) and
   * java:60-61 hands that straight to `Failable.ok`, whose private constructor throws
   * `IllegalArgumentException` when data and error are both null (Failable.java:57-58). The port's
   * `getUrl` returns `null` for Java's null; mapping it to `undefined` reaches the same throw
   * (src/core/gantt/Failable.ts), so an unparseable url throws here and the result is `Failable<Url>`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementUrl.java:53-61
   */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<Url> {
    const urlString = arg.findFirstValueByKey('COMPLEMENT');
    const urlBuilder = new UbrexUrlBuilder('', UrlMode.STRICT);
    const url = urlBuilder.getUrl(urlString as string);
    // `never` keeps Java's non-null `Failable<Url>` while still reaching the constructor throw.
    return Failable.ok(url ?? (undefined as never));
  }
}
