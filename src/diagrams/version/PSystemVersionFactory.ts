/**
 * `PSystemVersionFactory` — `about`/`authors`/`author` and bare `stdlib` as
 * single-line `@startuml` pages, through the ported `PSystemSingleLineFactory`
 * gate (`singleLinePlugin`, decisions.md D2/D3). Registration in
 * `src/index.ts` is T2a's (`PSystemBuilder.java:144-152` position).
 *
 * Not accepted, so the line falls through to `null` ("Syntax Error?"):
 * - `version` (java:55-56): `createShowVersion` prints host state (the `dot`
 *   executable, JVM properties, an environment variable) — stop 14, reported
 *   for a ruling (see `PSystemVersion.ts`).
 * - `testdot` and the key tools (java:62-83): out by decisions.md D8.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersionFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { RenderContext, SingleLineGeometry } from '../../core/command/PSystemSingleLineFactory.js';
import type { CompleteSvg, SyncPlugin } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemVersion } from './PSystemVersion.js';

/** Java's `\s` without `UNICODE_CHARACTER_CLASS`; `matches` anchors the line,
 *  and `(?i)` folds ASCII only, as JS's non-unicode `i` does here. */
const JAVA_SPACES = '[ \\t\\n\\x0B\\f\\r]*$';

/** `(?i)^(authors?|about)\\s*$`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersionFactory.java:52 */
const AUTHORS = new RegExp(`^(authors?|about)${JAVA_SPACES}`, 'i');

/** `(?i)^stdlib\\s*$`, inside `if (!TeaVM.isTeaVM())` (java:58): the port
 *  mirrors the JVM jar.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersionFactory.java:59 */
const STDLIB = new RegExp(`^stdlib${JAVA_SPACES}`, 'i');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersionFactory.java:47 */
export class PSystemVersionFactory {
  /**
   * The line arrives untrimmed (`PSystemSingleLineFactory.java:95`). The
   * `catch (Exception e)` (java:85-88) guards factory methods that cannot
   * throw here.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersionFactory.java:49-90
   */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemVersion | undefined {
    if (AUTHORS.test(line)) return PSystemVersion.createShowAuthors(source, preprocessing);
    if (STDLIB.test(line)) return PSystemVersion.createStdLib(source, preprocessing);
    return undefined;
  }
}

const factory = new PSystemVersionFactory();

/** The `about`/`authors`/`stdlib` page plugin; `UgDiagram#exportDiagram` is the whole render. */
export const versionPlugin: SyncPlugin<
  PSystemVersion,
  SingleLineGeometry<PSystemVersion>
> = singleLinePlugin<PSystemVersion>({
  type: 'sequence',
  executeLine: (source, line, preprocessing) => factory.executeLine(source, line, preprocessing),
  render: (diagram: PSystemVersion, ctx: RenderContext): CompleteSvg => ({
    completeSvg: diagram.exportDiagram(0, ctx.measurer),
  }),
});
