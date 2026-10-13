/**
 * `PSystemColorsFactory` — `colors`, `color`, optionally followed by a colour
 * name or hex value: the `@startuml` single-line factory for
 * {@link PSystemColors}. Registered ahead of the sequence factory
 * (PSystemBuilder.java:134, decisions.md D2 — by T2a, not here).
 *
 * The factory is the port's `SingleLineSpec` (`executeLine` plus the
 * `UgDiagram` export), and {@link colorsPlugin} the plugin built from it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColorsFactory.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { singleLinePlugin } from '../../core/command/PSystemSingleLineFactory.js';
import type { RenderContext, SingleLineSpec } from '../../core/command/PSystemSingleLineFactory.js';
import type { AssembledSvg } from '../../core/dispatcher.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { PSystemColors } from './PSystemColors.js';

/**
 * `Pattern.compile("^colors?\\s*(#?\\w+)?\\s*$")` with `matches()`. Java's
 * `\s` (no `UNICODE_CHARACTER_CLASS`) is `[ \t\n\x0B\f\r]`, spelled out;
 * Java's and JavaScript's non-unicode `\w` are both `[a-zA-Z_0-9]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColorsFactory.java:48
 */
const PATTERN = /^colors?[ \t\n\x0B\f\r]*(#?\w+)?[ \t\n\x0B\f\r]*$/;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColorsFactory.java:46 */
export const PSystemColorsFactory: SingleLineSpec<PSystemColors> = {
  type: 'sequence',

  /** `undefined` is upstream's `null`; an unmatched group 1 is `undefined`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemColorsFactory.java:50-57 */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): PSystemColors | undefined {
    const matcher = PATTERN.exec(line);
    if (matcher !== null) return new PSystemColors(source, matcher[1], preprocessing);

    return undefined;
  },

  /** `UgDiagram#exportDiagram` (UgDiagram.java:74-115). */
  render(diagram: PSystemColors, ctx: RenderContext): AssembledSvg {
    return { completeSvg: diagram.exportDiagram(0, ctx.measurer) };
  },
};

/** The `colors` plugin (`singleLinePlugin` over {@link PSystemColorsFactory}). */
export const colorsPlugin = singleLinePlugin(PSystemColorsFactory);
