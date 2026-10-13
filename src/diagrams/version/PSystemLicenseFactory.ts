/**
 * `PSystemLicenseFactory` — `license` (and its misspellings) as a single-line
 * `@startuml` page, through the ported `PSystemSingleLineFactory` gate
 * (`singleLinePlugin`, decisions.md D2/D3). Registration in `src/index.ts` is
 * T2a's (`PSystemBuilder.java:144-152` position).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicenseFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { RenderContext, SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { CompleteSvg, SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemLicense } from './PSystemLicense.js';

/**
 * `line.matches("(?i)^li[sc][ea]n[sc]e\\s*$")`: `matches` anchors the whole
 * line; Java's `\s` (no `UNICODE_CHARACTER_CLASS`) is `[ \t\n\x0B\f\r]`, and
 * `(?i)` folds ASCII only, as JS's non-unicode `i` does for an ASCII pattern.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicenseFactory.java:51
 */
const LICENSE = /^li[sc][ea]n[sc]e[ \t\n\x0B\f\r]*$/i;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicenseFactory.java:45 */
export class PSystemLicenseFactory {
  /**
   * The line arrives untrimmed (`PSystemSingleLineFactory.java:95`). The
   * `IOException` catch (java:54-56) guards `PSystemLicense.create`, which
   * cannot throw here.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicenseFactory.java:48-58
   */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemLicense | undefined {
    if (LICENSE.test(line)) return PSystemLicense.create(source, preprocessing);
    return undefined;
  }
}

const factory = new PSystemLicenseFactory();

/** The `license` page plugin; `UgDiagram#exportDiagram` is the whole render. */
export const licensePlugin: SyncPlugin<
  PSystemLicense,
  SingleLineGeometry<PSystemLicense>
> = singleLinePlugin<PSystemLicense>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => factory.executeLine(source, line, preprocessing),
  render: (diagram: PSystemLicense, ctx: RenderContext): CompleteSvg => ({
    completeSvg: diagram.exportDiagram(0, ctx.measurer),
  }),
});
