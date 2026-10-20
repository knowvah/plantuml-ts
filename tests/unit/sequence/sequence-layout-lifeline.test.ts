/**
 * `sequence-layout-lifeline.ts` (sdd1 T2f): every lifeline piece is painted
 * from its `PARTICIPANT_LINE` / `DELAY_LINE` style with the participant's
 * stereotype (`MutingLine.java:102-108`), merged from the builder the tiles
 * read AFTER the parse (`MutingLine.java:70`, `LivingSpace.java:147`).
 *
 * Default values cite `~/git/plantuml/src/main/resources/skin/plantuml.skin`;
 * the builder and stereotype cases are oracle-verified (jar `<line>` styles
 * quoted inline).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { LifelineSegment, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { lifelineOf, renderLifelineSegments } from '../../../src/diagrams/sequence/renderer-lifeline.js';
import type { ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import { endOfParseStyleBuilder } from '../../../src/diagrams/sequence/sequence-layout-lifeline.js';
import { astOrThrow } from '../../helpers/parse-ast.js';

/** `plantuml.skin:16` `root { LineColor #181818 }`. */
const ROOT_LINE = '#181818';
/** `plantuml.skin:91-93` `element { LineThickness 0.5 }`. */
const ELEMENT_THICKNESS = 0.5;
/** `plantuml.skin:141-143` `lifeLine { LineStyle 5 }`. */
const LIFELINE_DASH = [5, 5];
/** `plantuml.skin:300-305` `delay { LineStyle 1-4 }`. */
const DELAY_DASH = [1, 4];
const RED = '#FF0000';
const BLUE = '#0000FF';

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body. */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

function geoOf(body: readonly string[]): SequenceGeometry {
  return layoutSequence(
    astOrThrow(parseSequence(sourceOf(body)), 'sequence'),
    defaultTheme,
    new DeterministicMeasurer(),
  );
}

/** Each piece of `id`'s lifeline as what `ComponentRoseLine` reads. */
function strokes(geo: SequenceGeometry, id: string): unknown[] {
  return (geo.lifelineSegments[id] ?? []).map((s) => [s.delay, s.paint.stroke, s.paint.thickness, s.paint.dash]);
}

describe('lifeline paint (MutingLine.java:102-108)', () => {
  it('defaults to #181818, 0.5, dashed 5,5 (plantuml.skin:16,91-93,141-143)', () => {
    const geo = geoOf(['A -> B : hi']);
    expect(strokes(geo, 'A')).toEqual([[false, ROOT_LINE, ELEMENT_THICKNESS, LIFELINE_DASH]]);
    expect(strokes(geo, 'B')).toEqual([[false, ROOT_LINE, ELEMENT_THICKNESS, LIFELINE_DASH]]);
  });

  it('paints a delay piece from DELAY_LINE: 0.5, dashed 1,4 (plantuml.skin:300-305)', () => {
    expect(strokes(geoOf(['A -> B : hi', '...', 'B -> A : back']), 'A')).toEqual([
      [false, ROOT_LINE, ELEMENT_THICKNESS, LIFELINE_DASH],
      [true, ROOT_LINE, ELEMENT_THICKNESS, DELAY_DASH],
      [false, ROOT_LINE, ELEMENT_THICKNESS, LIFELINE_DASH],
    ]);
  });

  it('a skinparam written after the last message reaches every lifeline (jar: stroke:#F00)', () => {
    // FromSkinparamToStyle.java:112 maps it to `lifeLine { LineColor }`.
    const geo = geoOf(['A -> B : hello', 'B -> A : back', 'skinparam sequenceLifeLineBorderColor red']);
    expect(strokes(geo, 'A')).toEqual([[false, RED, ELEMENT_THICKNESS, LIFELINE_DASH]]);
    expect(strokes(geo, 'B')).toEqual([[false, RED, ELEMENT_THICKNESS, LIFELINE_DASH]]);
  });

  it('a <style> written after the last message reaches every lifeline (jar: stroke-width:2)', () => {
    const geo = geoOf(['A -> B : hello', '<style>', 'lifeLine { LineThickness 2 }', '</style>']);
    expect(strokes(geo, 'A')).toEqual([[false, ROOT_LINE, 2, LIFELINE_DASH]]);
    expect(strokes(geo, 'B')).toEqual([[false, ROOT_LINE, 2, LIFELINE_DASH]]);
  });

  it('merges the participant stereotype into both piece types (jar: #F00 line, #00F delay on B only)', () => {
    const body = [
      '<style>',
      '.foo { lifeLine { LineColor #FF0000 } }',
      '.foo { delay { LineColor #0000FF } }',
      '</style>',
      'participant A',
      'participant B <<foo>>',
      'A -> B : hello',
      '...',
      'B -> A : back',
    ];
    const geo = geoOf(body);
    expect(strokes(geo, 'A').map((s) => (s as unknown[])[1])).toEqual([ROOT_LINE, ROOT_LINE, ROOT_LINE]);
    expect(strokes(geo, 'B').map((s) => (s as unknown[])[1])).toEqual([RED, BLUE, RED]);
  });

  it('refuses an AST that carries no end-of-parse builder', () => {
    const ast = astOrThrow(parseSequence(sourceOf(['A -> B'])), 'sequence');
    const { styleBuilder: _dropped, ...handBuilt } = ast;
    expect(() => endOfParseStyleBuilder(handBuilt)).toThrow(
      'a sequence AST built without parseSequence has no style builder',
    );
  });
});

describe('rendering a painted lifeline (ComponentRoseLine.java:74-88)', () => {
  const theme: ScaledTheme = { ...defaultTheme, scaleK: 1, measurer: new DeterministicMeasurer() };
  const lineOf = (svg: string): string => /<line [^>]*>/.exec(svg)?.[0] ?? '';

  it('strokes LineColor at LineThickness with the style dash (jar: stroke:#181818;stroke-width:0.5;stroke-dasharray:5,5;)', () => {
    const geo = geoOf(['A -> B : hi']);
    const a = geo.participants[0]!;
    expect(lineOf(renderLifelineSegments(a, lifelineOf(geo.lifelineSegments, a), theme))).toContain(
      'stroke="#181818" stroke-width="0.5" stroke-dasharray="5,5"',
    );
  });

  it('scales the width and the dash at emission (SvgGraphics.java:556-561; bocudo-94: 0.441, 4.41,4.41 at 0.882)', () => {
    const geo = geoOf(['A -> B : hi']);
    const a = geo.participants[0]!;
    const seg: LifelineSegment = lifelineOf(geo.lifelineSegments, a)[0]!;
    const svg = renderLifelineSegments(a, [seg], { ...theme, scaleK: 0.882 });
    expect(lineOf(svg)).toContain('stroke-width="0.441" stroke-dasharray="4.41,4.41"');
  });

  it('strokes a gradient LineColor with its first colour (DriverLineSvg.java:76-82; sedule-54: stroke:#FFF)', () => {
    const geo = geoOf(['skinparam sequenceLifeLineBorderColor #white|green', 'A -> B : hi']);
    const a = geo.participants[0]!;
    const svg = renderLifelineSegments(a, lifelineOf(geo.lifelineSegments, a), theme);
    expect(lineOf(svg)).toContain('stroke="#FFF" stroke-width="0.5"');
  });

  it('refuses a participant layout built no lifeline for', () => {
    const geo = geoOf(['A -> B : hi']);
    expect(() => lifelineOf({}, geo.participants[0]!)).toThrow('participant A has no lifeline');
  });
});
