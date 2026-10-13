/**
 * `PSystemCharlieFactory` — two literals, compared to the raw line with
 * `equalsIgnoreCase`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlieFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { equalsIgnoreCase } from './equals-ignore-case.js';
import { PSystemCharlie } from './PSystemCharlie.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlieFactory.java:48 */
const LITERALS: readonly string[] = ['charlie', 'jesuischarlie'];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlieFactory.java:43 */
export class PSystemCharlieFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlieFactory.java:46-52 */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemCharlie | undefined {
    if (LITERALS.some((literal) => equalsIgnoreCase(line, literal))) return new PSystemCharlie(source, preprocessing);
    return undefined;
  }
}

/** The factory at `PSystemBuilder.java:181`, registered by T2a (D2). */
export const charliePlugin: SyncPlugin<
  PSystemCharlie,
  SingleLineGeometry<PSystemCharlie>
> = singleLinePlugin<PSystemCharlie>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => new PSystemCharlieFactory().executeLine(source, line, preprocessing),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
