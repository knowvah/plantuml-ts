/**
 * `MindMapDiagramFactory#executeCommands` looped over `source.lines` --
 * upstream's `@start`/`@end` and every directive line already stripped
 * (`block-extractor.ts#UmlSource.lines` doc) -- and passed that INTERIOR
 * index straight to `refuse(kind, i, i, message)`. `errorSvg`'s own
 * `trace`, though, is `readLines()` over the FULL raw document
 * (`error-diagrams.ts#errorSvg`), `@startmindmap` included. For a
 * single-block document (every fixture here) that is a constant
 * off-by-one: interior index `i` is the SAME NUMBER as the `@startmindmap`
 * line itself in the full-document trace, so `refusal.line = i` names the
 * line ONE BEFORE the one that actually refused, and `errorSvg`'s
 * `listing = trace.slice(0, at + 1)` (`error-diagrams.ts:88-89`) drops the
 * real offender off the end entirely.
 *
 * Jar-observed (`test-results/dot-cache/mindmap/{fogari-75-febu345,
 * femiba-70-duvi238}/in.svg`, `-DPLANTUML_DETERMINISTIC_TEXT=true`): the
 * wavy underline and the red message both land on the line that ACTUALLY
 * failed, and the listing includes it.
 *
 * The fix reads `source.linePositions[i]` (`preprocessor.ts
 * #PreprocessorResult.linePositions` doc: "0-indexed source-file line
 * position... parallel to `lines`") when the render pipeline populated it,
 * falling back to `i` for a hand-built fixture with no directive lines to
 * account for (`tests/unit/mindmap/render-plugin.test.ts`'s own
 * `createMindMapDiagram({ lines: [...] })` calls, which carry no
 * `linePositions` and whose `i` already IS the document index).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:135
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:169-175
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();

describe('mindmap refusal line — document-relative, not interior-relative', () => {
  it(
    'attributes "Bad indentation" to the line the modulo check actually refused ' +
      '(child2, level 3 % multiplier 2 != 0), not the accepted line before it (fogari-75-febu345)',
    () => {
      const source = ['@startmindmap', '* root', '  * child1', '   * child2', '@endmindmap'].join('\n');
      const svg = renderSync(source, { measurer });

      expect(svg).toContain('Bad indentation (Assumed diagram type: mindmap)');
      // The line that actually refused is drawn, wavy, not silently dropped.
      expect(svg).toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>\* child2<\/text>/);
      // The line before it (which succeeded) is drawn but NOT wavy.
      expect(svg).toContain('>* child1<');
      expect(svg).not.toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>\* child1<\/text>/);
    },
  );

  it(
    'attributes "Syntax Error?" to the line no command matches (right_1.1), not the ' +
      'accepted single-line command before it (femiba-70-duvi238)',
    () => {
      const source = ['@startmindmap', '+ root', '++ """', 'right_1.1', '@endmindmap'].join('\n');
      const svg = renderSync(source, { measurer });

      expect(svg).toContain('Syntax Error? (Assumed diagram type: mindmap)');
      // `++ """` is a VALID single-line command (CommandMindMapPlus: LABEL is
      // the literal `"""`, no multiline `"""..."""` block exists for +/-
      // syntax) -- it is drawn but NOT wavy.
      expect(svg).toContain('>++ """<');
      expect(svg).not.toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>\+\+ """<\/text>/);
      // `right_1.1` matches no mindmap command at all and is what refused.
      expect(svg).toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>right_1\.1<\/text>/);
    },
  );
});
