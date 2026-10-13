/**
 * `PSystemRIPFactory` — one literal, compared to the raw line with
 * `equalsIgnoreCase`. `PSystemRIP`'s `IOException` arm (java:55-58, an image
 * decode) has no counterpart: the image is a module constant.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { equalsIgnoreCase } from './equals-ignore-case.js';
import { PSystemRIP } from './PSystemRIP.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:52 */
const LITERAL = 'jean canouet';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:47 */
export class PSystemRIPFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIPFactory.java:50-61 */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemRIP | undefined {
    if (equalsIgnoreCase(line, LITERAL)) return new PSystemRIP(source, preprocessing);
    return undefined;
  }
}

/** The factory at `PSystemBuilder.java:177`, registered by T2a (D2). */
export const ripPlugin: SyncPlugin<PSystemRIP, SingleLineGeometry<PSystemRIP>> = singleLinePlugin<PSystemRIP>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => new PSystemRIPFactory().executeLine(source, line, preprocessing),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
