/**
 * `PSystemOpenIconicFactory` — the single-line factory for `openiconic <name>`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconicFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { RenderContext } from '../../core/command/PSystemSingleLineFactory.js';
import type { CompleteSvg } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemOpenIconic } from './PSystemOpenIconic.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconicFactory.java:50 */
const OPENICONIC_PREFIX = 'openiconic ';

/** `new PSystemOpenIconic(source, ..., 1.0, preprocessing)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconicFactory.java:52 */
const OPENICONIC_FACTOR = 1.0;

/** `StringUtils.goLowerCase` — `toLowerCase(Locale.US)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java */
function goLowerCase(s: string): string {
  return s.toLowerCase();
}

/**
 * `executeLine`: the raw line, lower-cased, must start with `openiconic `;
 * the icon name is the lower-cased line after the raw line's first space
 * (so `openiconic  x` asks for ` x`, which the jar crashes on). `null` (a
 * "Syntax Error?") otherwise.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconicFactory.java:47-56
 */
export function executeLineOpenIconic(
  source: UmlSource,
  line: string,
  preprocessing: PreprocessingArtifact,
): PSystemOpenIconic | undefined {
  const lineLower = goLowerCase(line);
  if (lineLower.startsWith(OPENICONIC_PREFIX)) {
    const idx = line.indexOf(' ');
    return new PSystemOpenIconic(source, lineLower.substring(idx + 1), OPENICONIC_FACTOR, preprocessing);
  }
  return undefined;
}

/** `UgDiagram#exportDiagram`'s SVG document, for the single-line helper. */
function render(diagram: PSystemOpenIconic, ctx: RenderContext): CompleteSvg {
  return { completeSvg: diagram.exportDiagram(0, ctx.measurer) };
}

/** `PSystemOpenIconicFactory` as a plugin (decisions.md D2; registered by T2a).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemOpenIconicFactory.java:44 */
export const openIconicPlugin = singleLinePlugin<PSystemOpenIconic>({
  type: 'sequence',
  executeLine: executeLineOpenIconic,
  render,
});
