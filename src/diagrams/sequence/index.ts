/**
 * Sequence diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { DiagramPlugin, ParseOptions, RenderFragment } from '../../core/dispatcher.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { SequenceDiagramAST, SequenceGeometry } from './ast.js';
import { parseSequence } from './parser.js';
import { layoutSequence } from './layout.js';
import { renderSequence, renderSequencePage } from './renderer.js';
import { sequencePageAst, sequencePageCount } from './sequence-page.js';

/** The pipeline always hands `render` the measurer layout used
 *  (`src/index.ts#assemblePagesUnscoped`); its absence is a caller bug. */
function requireMeasurer(measurer: StringMeasurer | undefined): StringMeasurer {
  if (measurer === undefined) throw new Error('sequence render requires the render measurer');
  return measurer;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const sequencePlugin: DiagramPlugin<SequenceDiagramAST, SequenceGeometry> = {
  type: 'sequence',

  // T4: widened to match `DiagramPlugin.parse`'s `AST | ParseRefusal`
  // contract (D1) now that `parseSequence` can return a `ParseRefusal`.
  // `accepts()` above is untouched -- T12 owns dispatch/routing. D6
  // (cdd6-T1c): forwards `options.assetStore`, mirroring
  // `class/parser.ts:317-318` / `description/index.ts:59-67`.
  parse(source: UmlSource, options?: ParseOptions): SequenceDiagramAST | ParseRefusal {
    return parseSequence(source.lines, options);
  },

  layout(ast: SequenceDiagramAST, theme, measurer): Promise<SequenceGeometry> {
    return Promise.resolve(layoutSequence(ast, theme, measurer));
  },

  layoutSync(ast: SequenceDiagramAST, theme, measurer): SequenceGeometry {
    return layoutSequence(ast, theme, measurer);
  },

  render(geo: SequenceGeometry, theme, measurer): RenderFragment {
    return renderSequence(geo, theme, requireMeasurer(measurer));
  },

  // The `PaginatedPlugin` trio (`core/dispatcher.ts`). Sequence is the only
  // engine in this port that implements it: `newpage` is the only command
  // in the corpus that makes one source produce more than one image, and
  // upstream's own `getNbPages()` is `countNewpage + 1` on
  // `SequenceDiagram` alone (`:517-519`).
  getNbPages(geo: SequenceGeometry): number {
    return sequencePageCount(geo);
  },

  renderPage(geo: SequenceGeometry, theme, pageIndex: number, measurer): RenderFragment {
    return renderSequencePage(geo, theme, pageIndex, requireMeasurer(measurer));
  },

  pageAst(ast: SequenceDiagramAST, pageIndex: number): SequenceDiagramAST {
    return sequencePageAst(ast, pageIndex);
  },
};
