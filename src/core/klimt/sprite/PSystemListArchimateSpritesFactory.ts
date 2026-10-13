/**
 * `PSystemListArchimateSpritesFactory` -- accepts a one-line source starting
 * (case-insensitively) with `listsprite`. Registered by T2a, not here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSpritesFactory.java
 */
import { singleLinePlugin } from '../../command/PSystemSingleLineFactory.js';
import { internalSpriteStoreFrom } from '../../internal-sprite-store.js';
import type { SyncPlugin } from '../../dispatcher.js';
import type { SingleLineGeometry } from '../../command/PSystemSingleLineFactory.js';
import { PSystemListArchimateSprites } from './PSystemListArchimateSprites.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSpritesFactory.java:50 */
const KEYWORD = 'listsprite';

/** `StringUtils.goLowerCase` -- `toLowerCase(Locale.ENGLISH)`. */
function goLowerCase(s: string): string {
  return s.toLowerCase();
}

/** The factory's accept test, `executeLine`'s condition (java:50).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSpritesFactory.java:48-53 */
export function acceptsListArchimateSprites(line: string): boolean {
  return goLowerCase(line).startsWith(KEYWORD);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSpritesFactory.java:46 */
export const listArchimateSpritesPlugin: SyncPlugin<
  PSystemListArchimateSprites,
  SingleLineGeometry<PSystemListArchimateSprites>
> = singleLinePlugin<PSystemListArchimateSprites>({
  type: 'sequence',
  executeLine(source, line, preprocessing, options) {
    if (!acceptsListArchimateSprites(line)) return undefined;
    const store = options?.assetStore === undefined ? undefined : internalSpriteStoreFrom(options.assetStore);
    return new PSystemListArchimateSprites(source, preprocessing, store);
  },
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
