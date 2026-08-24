/**
 * Sequence diagram plugin — wires together parser, layout, and renderer
 * for use with the DiagramRegistry dispatcher.
 */

import type { DiagramPlugin, RenderFragment } from '../../core/dispatcher.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { SequenceDiagramAST, SequenceGeometry } from './ast.js';
import { hasDescriptiveSignal } from '../../core/descriptive-keywords.js';
import { parseSequence } from './parser.js';
import { layoutSequence } from './layout.js';
import { renderSequence } from './renderer.js';

// ---------------------------------------------------------------------------
// Accepts heuristics
// ---------------------------------------------------------------------------

const ARROW_PATTERN = /->>?|-->>?/;
const SEQUENCE_KEYWORD_PATTERN =
  /^(participant|actor|boundary|control|entity|database|collections|queue)\s/;

/**
 * Upstream's arrow grammar (`CommandArrow.java:88-133`) matches a whole
 * line — `RegexLeaf.start()` … `RegexLeaf.end()` — and its quoted
 * participant form (`:94`, `[%g]([^%g]+)[%g]`) consumes an entire `"..."`
 * span as ONE atomic PART token before the arrow leaf is ever tried. Dash
 * characters inside a quote are therefore never candidates for the arrow
 * itself upstream; only dashes OUTSIDE any quote can be "in arrow
 * position". `object/zuvila-56-nuda425` (a CLASS diagram per the jar)
 * carries `$arrow("-->")` — a `!procedure` argument — whose `-->` sits
 * entirely inside a quoted string and is not an arrow at all. Strip quoted
 * spans before testing so a trapped arrow token can't satisfy the pattern.
 */
function stripQuotedSpans(line: string): string {
  return line.replace(/"[^"]*"/g, '');
}

function isSequenceLine(line: string): boolean {
  return (
    ARROW_PATTERN.test(stripQuotedSpans(line)) ||
    SEQUENCE_KEYWORD_PATTERN.test(line)
  );
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const sequencePlugin: DiagramPlugin<SequenceDiagramAST, SequenceGeometry> =
  {
    type: 'sequence',

    accepts(lines: readonly string[]): boolean {
      // Upstream's sequence factory fails on descriptive element lines, so the
      // description factory claims use-case/deployment blocks even when they
      // contain a bare `actor`. Decline anything with a descriptive signal
      // (e.g. `actor Bob` + `(Login)`) before the arrow/actor patterns match.
      if (hasDescriptiveSignal(lines)) return false;
      return lines.slice(0, 20).some((l) => isSequenceLine(l));
    },

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
