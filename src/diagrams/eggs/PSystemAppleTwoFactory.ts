/**
 * `PSystemAppleTwoFactory` — five literals, compared to the raw line with
 * `equalsIgnoreCase`. `PSystemAppleTwo`'s `IOException` arm (java:56-59, a
 * classpath read) has no counterpart: the image is a module constant.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwoFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { equalsIgnoreCase } from './equals-ignore-case.js';
import { PSystemAppleTwo } from './PSystemAppleTwo.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwoFactory.java:52-53 */
const LITERALS: readonly string[] = ['apple //e', 'apple ][', 'apple II', 'Steve Jobs', 'Steve Wozniak'];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwoFactory.java:47 */
export class PSystemAppleTwoFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwoFactory.java:50-62 */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemAppleTwo | undefined {
    if (LITERALS.some((literal) => equalsIgnoreCase(line, literal))) return new PSystemAppleTwo(source, preprocessing);
    return undefined;
  }
}

/** The factory at `PSystemBuilder.java:176`, registered by T2a (D2). */
export const appleTwoPlugin: SyncPlugin<
  PSystemAppleTwo,
  SingleLineGeometry<PSystemAppleTwo>
> = singleLinePlugin<PSystemAppleTwo>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => new PSystemAppleTwoFactory().executeLine(source, line, preprocessing),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
