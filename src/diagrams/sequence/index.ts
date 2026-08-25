/**
 * Sequence diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { DiagramPlugin, RenderFragment } from '../../core/dispatcher.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { SequenceDiagramAST, SequenceGeometry } from './ast.js';
import { parseSequence } from './parser.js';
import { layoutSequence } from './layout.js';
import { renderSequence } from './renderer.js';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const sequencePlugin: DiagramPlugin<SequenceDiagramAST, SequenceGeometry> =
  {
    type: 'sequence',

    // T4: widened to match `DiagramPlugin.parse`'s `AST | ParseRefusal`
    // contract (D1) now that `parseSequence` can return a `ParseRefusal`.
    // `accepts()` above is untouched -- T12 owns dispatch/routing.
    parse(source: UmlSource): SequenceDiagramAST | ParseRefusal {
      return parseSequence(source.lines);
    },

    layout(
      ast: SequenceDiagramAST,
      theme,
      measurer,
    ): Promise<SequenceGeometry> {
      return Promise.resolve(layoutSequence(ast, theme, measurer));
    },

    layoutSync(
      ast: SequenceDiagramAST,
      theme,
      measurer,
    ): SequenceGeometry {
      return layoutSequence(ast, theme, measurer);
    },

    render(geo: SequenceGeometry, theme): RenderFragment {
      return renderSequence(geo, theme);
    },
  };
