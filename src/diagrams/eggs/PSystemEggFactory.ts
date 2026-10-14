/**
 * `PSystemEggFactory` — a line that decrypts one of two stored payloads to
 * printable text is an easter egg (`SentenceDecoder`). The payloads are
 * ported verbatim; what they decode to stays secret (D10).
 *
 * `catch (UnsupportedEncodingException)` (java:63-65) cannot fire: the
 * decoder uses the `UTF_8` constant.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEggFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { EggUtils } from './EggUtils.js';
import { PSystemEgg } from './PSystemEgg.js';
import { SentenceDecoder } from './SentenceDecoder.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEggFactory.java:50-52 */
const ALL: readonly Uint8Array[] = [
  EggUtils.toByteArrays(
    '56092d35fce86a0dd88047a766c1d6541a7c5fd5ba212fa02db9a32a463422febd71a75a934eb135dec7d6c6325ddd17fd2fa437eba863462b28e3e92514998306a72790d93501335ed6b1262ea46ab79573142c28f8e92508978255a533d9cf7903394f9ab73a33b230a2b273033633adf16044888243b92f9bd8351f3d4f9aa2302fb264afa37546368424fa6a07919152bd2990d935092e49d9a02038b437aeb528',
  ),
  EggUtils.toByteArrays('421e5b773c5df733a1194f716f18e8842155196b3b'),
];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEggFactory.java:47 */
export class PSystemEggFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEggFactory.java:55-68 */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemEgg | undefined {
    for (const encrypted of ALL) {
      const decoder = new SentenceDecoder(line, encrypted);
      if (decoder.isOk()) return new PSystemEgg(source, decoder.getSecret(), preprocessing);
    }
    return undefined;
  }
}

/** The factory at `PSystemBuilder.java:175`, registered by T2a (D2). */
export const eggPlugin: SyncPlugin<PSystemEgg, SingleLineGeometry<PSystemEgg>> = singleLinePlugin<PSystemEgg>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => new PSystemEggFactory().executeLine(source, line, preprocessing),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
