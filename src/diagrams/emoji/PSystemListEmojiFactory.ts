/**
 * `PSystemListEmojiFactory` — accepts `emoji` (code `26`) or `emoji <block>`.
 *
 * `listEmojiPlugin` is registered by T2a at `PSystemBuilder.java:144-152`
 * (decisions.md D2), not here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmojiFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { ParseOptions } from '../../core/dispatcher.js';
import { internalEmojiStoreFrom } from '../../core/internal-emoji-store.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemListEmoji } from './PSystemListEmoji.js';

/** `lineLower.equals("emoji") || lineLower.startsWith("emoji ")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmojiFactory.java:50 */
const KEYWORD = 'emoji';

/** `idx == -1 ? "26" : ...`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/PSystemListEmojiFactory.java:52 */
const DEFAULT_CODE = '26';

/** `executeLine` (java:48-56); `StringUtils.goLowerCase` is `toLowerCase(Locale.ENGLISH)`. */
export function executeLine(
  source: UmlSource,
  line: string,
  preprocessing: PreprocessingArtifact,
  options?: ParseOptions,
): PSystemListEmoji | undefined {
  const lineLower = line.toLowerCase();
  if (lineLower !== KEYWORD && !lineLower.startsWith(`${KEYWORD} `)) return undefined;
  const idx = line.indexOf(' ');
  const code = idx === -1 ? DEFAULT_CODE : line.slice(idx + 1);
  const emoji = options?.assetStore === undefined ? undefined : internalEmojiStoreFrom(options.assetStore);
  return new PSystemListEmoji(source, code.toLowerCase(), preprocessing, emoji);
}

export const listEmojiPlugin: ReturnType<typeof singleLinePlugin<PSystemListEmoji>> =
  singleLinePlugin<PSystemListEmoji>({
    type: 'sequence',
    executeLine,
    render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
  });
