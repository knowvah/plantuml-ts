/**
 * `PSystemRIPFactory` — one literal, compared to the raw line with
 * `equalsIgnoreCase`. `PSystemRIP`'s `IOException` arm (java:55-58) is
 * `EggImageUnavailableError`: the store did not serve the picture, so the factory
 * returns null (`Log.error` has no counterpart).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { ParseOptions, SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { EggImageUnavailableError } from './apple2-image.js';
import { equalsIgnoreCase } from './equals-ignore-case.js';
import { PSystemRIP } from './PSystemRIP.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:52 */
const LITERAL = 'jean canouet';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:47 */
export class PSystemRIPFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:50-61 */
  executeLine(
    source: UmlSource,
    line: string,
    preprocessing: PreprocessingArtifact,
    options?: ParseOptions,
  ): PSystemRIP | undefined {
    if (!equalsIgnoreCase(line, LITERAL)) return undefined;
    try {
      return new PSystemRIP(source, preprocessing, options?.assetStore);
    } catch (error) {
      if (error instanceof EggImageUnavailableError) return undefined;
      throw error;
    }
  }
}

/** The factory at `PSystemBuilder.java:177`, registered by T2a (D2). */
export const ripPlugin: SyncPlugin<PSystemRIP, SingleLineGeometry<PSystemRIP>> = singleLinePlugin<PSystemRIP>({
  type: 'sequence',
  executeLine: (source, line, preprocessing, options) =>
    new PSystemRIPFactory().executeLine(source, line, preprocessing, options),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
