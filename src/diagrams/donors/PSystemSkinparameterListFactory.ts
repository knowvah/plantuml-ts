/**
 * `PSystemSkinparameterListFactory` -- accepts the single line `skinparameters` (any case,
 * trailing whitespace allowed), as a `singleLinePlugin` (decisions.md D2).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterListFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemSkinparameterList } from './PSystemSkinparameterList.js';

/** `line.matches("(?i)^(skinparameters)\\s*$")`; Java's `\s` is `[ \t\n\x0B\f\r]`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterListFactory.java:48 */
const SKINPARAMETERS_LINE = /^(skinparameters)[ \t\n\x0B\f\r]*$/i;

/** The factory's accept test.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterListFactory.java:48 */
export function acceptsSkinparametersLine(line: string): boolean {
  return SKINPARAMETERS_LINE.test(line);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterListFactory.java:47-51 */
export function executeLine(
  source: UmlSource,
  line: string,
  preprocessing: PreprocessingArtifact,
): PSystemSkinparameterList | undefined {
  return acceptsSkinparametersLine(line) ? PSystemSkinparameterList.create(source, preprocessing) : undefined;
}

/** Registered by T2a at `PSystemBuilder.java:144-152`'s position. */
export const skinparameterListPlugin = singleLinePlugin<PSystemSkinparameterList>({
  type: 'sequence',
  executeLine,
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
