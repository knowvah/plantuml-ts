/**
 * `PSystemListOpenIconicFactory` — the single-line factory for `listopeniconic`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconicFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { RenderContext } from '../../core/command/PSystemSingleLineFactory.js';
import type { CompleteSvg } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemListOpenIconic } from './PSystemListOpenIconic.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconicFactory.java:50 */
const LISTOPENICONIC_PREFIX = 'listopeniconic';

/**
 * `executeLine`: the raw line, lower-cased (`StringUtils.goLowerCase`,
 * `toLowerCase(Locale.US)`), must start with `listopeniconic` — anything may
 * follow (jar probe `listopeniconicfoo` draws the list). `null` (a
 * "Syntax Error?") otherwise.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconicFactory.java:47-54
 */
export function executeLineListOpenIconic(
  source: UmlSource,
  line: string,
  preprocessing: PreprocessingArtifact,
): PSystemListOpenIconic | undefined {
  const lineLower = line.toLowerCase();
  if (lineLower.startsWith(LISTOPENICONIC_PREFIX)) return new PSystemListOpenIconic(source, preprocessing);

  return undefined;
}

/** `UgDiagram#exportDiagram`'s SVG document, for the single-line helper. */
function render(diagram: PSystemListOpenIconic, ctx: RenderContext): CompleteSvg {
  return { completeSvg: diagram.exportDiagram(0, ctx.measurer) };
}

/** `PSystemListOpenIconicFactory` as a plugin (decisions.md D2; registered by T2a).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconicFactory.java:44 */
export const listOpenIconicPlugin = singleLinePlugin<PSystemListOpenIconic>({
  type: 'sequence',
  executeLine: executeLineListOpenIconic,
  render,
});
