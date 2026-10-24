/**
 * Sequence diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { DiagramPlugin, ParseOptions, RenderFragment } from '../../core/dispatcher.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { SequenceDiagramAST } from './ast.js';
import { parseSequence } from './parser.js';
import { layoutSequence } from './layout.js';
import { renderSequence, renderSequencePage } from './renderer.js';
import { sequencePageAst, sequencePageCount } from './sequence-page.js';
import {
  withGeometryWarnings,
  withSequenceWarningBanner,
  withSkinParamWarnings,
  type SequencePluginGeometry,
} from './sequence-warnings.js';

/** The pipeline always hands `render` the measurer layout used
 *  (`src/index.ts#assemblePagesUnscoped`); its absence is a caller bug. */
function requireMeasurer(measurer: StringMeasurer | undefined): StringMeasurer {
  if (measurer === undefined) throw new Error('sequence render requires the render measurer');
  return measurer;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const sequencePlugin: DiagramPlugin<SequenceDiagramAST, SequencePluginGeometry> = {
  type: 'sequence',

  // T4: widened to match `DiagramPlugin.parse`'s `AST | ParseRefusal`
  // contract (D1) now that `parseSequence` can return a `ParseRefusal`.
  // `accepts()` above is untouched -- T12 owns dispatch/routing. D6
  // (cdd6-T1c): forwards `options.assetStore`, mirroring
  // `class/parser.ts:317-318` / `description/index.ts:59-67`. sdd1 D3: the
  // whole `UmlSource`, whose style sources replay per command.
  parse(source: UmlSource, options?: ParseOptions): SequenceDiagramAST | ParseRefusal {
    const ast = parseSequence(source, options);
    // `refused` is `ParseRefusal`'s discriminant (`dispatcher.ts#parseRefusalOf`).
    if ('refused' in ast) return ast;
    // sdd2-T7e: `CommandSkinParam.java:92-99` -> `ast.warnings`.
    return withSkinParamWarnings(ast, source.styleSource);
  },

  layout(ast: SequenceDiagramAST, theme, measurer): Promise<SequencePluginGeometry> {
    return Promise.resolve(withGeometryWarnings(layoutSequence(ast, theme, measurer), ast));
  },

  layoutSync(ast: SequenceDiagramAST, theme, measurer): SequencePluginGeometry {
    return withGeometryWarnings(layoutSequence(ast, theme, measurer), ast);
  },

  // sdd2-T7e: the warning banner (`DiagramChromeFactory#addWarnings`) is
  // stacked above the page before chrome (`sequence-warnings.ts`).
  render(geo: SequencePluginGeometry, theme, measurer): RenderFragment {
    const m = requireMeasurer(measurer);
    return withSequenceWarningBanner(renderSequence(geo, theme, m), geo.warnings, m);
  },

  // The `PaginatedPlugin` trio (`core/dispatcher.ts`). Sequence is the only
  // engine in this port that implements it: `newpage` is the only command
  // in the corpus that makes one source produce more than one image, and
  // upstream's own `getNbPages()` is `countNewpage + 1` on
  // `SequenceDiagram` alone (`:517-519`).
  getNbPages(geo: SequencePluginGeometry): number {
    return sequencePageCount(geo);
  },

  renderPage(geo: SequencePluginGeometry, theme, pageIndex: number, measurer): RenderFragment {
    const m = requireMeasurer(measurer);
    return withSequenceWarningBanner(renderSequencePage(geo, theme, pageIndex, m), geo.warnings, m);
  },

  pageAst(ast: SequenceDiagramAST, pageIndex: number): SequenceDiagramAST {
    return sequencePageAst(ast, pageIndex);
  },
};
