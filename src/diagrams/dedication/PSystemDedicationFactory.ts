/**
 * `PSystemDedicationFactory` — a line `Dedications.get` recognises is a
 * dedication page. The image bytes come through `options.assetStore` (ADR-2,
 * D4); without a store serving them no dedication matches, as upstream when
 * its classpath read fails.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedicationFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { ParseOptions, SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { Dedications } from './Dedications.js';
import { PSystemDedication } from './PSystemDedication.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedicationFactory.java:44 */
export class PSystemDedicationFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedicationFactory.java:46-53 */
  executeLine(
    source: UmlSource,
    line: string,
    preprocessing: PreprocessingArtifact,
    options?: ParseOptions,
  ): PSystemDedication | undefined {
    const dedication = Dedications.get(line, options?.assetStore);
    if (dedication !== undefined) return new PSystemDedication(source, dedication, preprocessing);
    return undefined;
  }
}

/** The factory at `PSystemBuilder.java:186`, registered by T2a (D2). */
export const dedicationPlugin: SyncPlugin<
  PSystemDedication,
  SingleLineGeometry<PSystemDedication>
> = singleLinePlugin<PSystemDedication>({
  type: 'sequence',
  executeLine: (source, line, preprocessing, options) =>
    new PSystemDedicationFactory().executeLine(source, line, preprocessing, options),
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
