/**
 * `PSystemDonorsFactory` -- accepts the single line `donors` (any case,
 * trailing whitespace allowed), as a `singleLinePlugin` (decisions.md D2).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonorsFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemDonors } from './PSystemDonors.js';

/** `line.matches("(?i)^(donors)\\s*$")`; Java's `\s` is `[ \t\n\x0B\f\r]`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonorsFactory.java:49 */
const DONORS_LINE = /^(donors)[ \t\n\x0B\f\r]*$/i;

/** The factory's accept test.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonorsFactory.java:49 */
export function acceptsDonorsLine(line: string): boolean {
  return DONORS_LINE.test(line);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonorsFactory.java:48-52 */
export function executeLine(
  source: UmlSource,
  line: string,
  preprocessing: PreprocessingArtifact,
): PSystemDonors | undefined {
  return acceptsDonorsLine(line) ? PSystemDonors.create(source, preprocessing) : undefined;
}

/** Registered by T2a at `PSystemBuilder.java:144-152`'s position. */
export const donorsPlugin = singleLinePlugin<PSystemDonors>({
  type: 'sequence',
  executeLine,
  render: (diagram, ctx) => ({ completeSvg: diagram.exportDiagram(0, ctx.measurer) }),
});
