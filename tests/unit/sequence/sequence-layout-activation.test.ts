/**
 * `sequence-layout-activation.ts` (sdd1 T2b): each activation bar's paint is
 * its merged `activationBox` style, from the builder of the step that OPENS
 * the bar (`teoz/LiveBoxes.java:323-331,405-407`,
 * `LiveBoxesDrawer.java:137-146`), its `BackGroundColor` overridden by the
 * activating event's colour.
 *
 * Expected default values cite
 * `~/git/plantuml/src/main/resources/skin/plantuml.skin`; the builder-choice
 * cases are oracle-verified (jar `<rect ... width="10">` fills quoted inline).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { ActivationGeo } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { newActivationStack, pushActivation } from '../../../src/diagrams/sequence/sequence-layout-activation.js';
import { astOrThrow } from '../../helpers/parse-ast.js';

/** `plantuml.skin:146` `activationBox { BackGroundColor white }`. */
const ACTIVATION_WHITE = '#FFFFFF';
/** `plantuml.skin:16` `root { LineColor #181818 }`. */
const ROOT_LINE = '#181818';
const RED = '#FF0000';
const RED_STYLE = ['<style>', `activationBox { BackGroundColor ${RED} }`, '</style>'];

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

function activations(body: readonly string[]): ActivationGeo[] {
  const ast = astOrThrow(parseSequence(sourceOf(body)), 'sequence');
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  return geo.events.filter((e): e is ActivationGeo => e.kind === 'activation').sort((a, b) => a.y - b.y);
}

function fills(body: readonly string[]): unknown[] {
  return activations(body).map((a) => a.paint?.fill);
}

describe('activation paint (LiveBoxesDrawer.java:137-146)', () => {
  it('defaults to the activationBox style: fill white, line #181818 (plantuml.skin:16,145-147)', () => {
    const [bar] = activations(['A -> B ++ : hi', 'B --> A -- : back']);
    expect(bar?.paint).toMatchObject({ fill: ACTIVATION_WHITE, stroke: ROOT_LINE, shadowing: 0 });
  });

  it('a bar a message opens takes that message builder (jar: #FFF then #F00)', () => {
    expect(fills(['A -> B ++ : first', ...RED_STYLE, 'B -> A -- : back', 'A -> B ++ : second', 'B -> A --'])).toEqual([
      ACTIVATION_WHITE,
      RED,
    ]);
  });

  it('a bound activate takes the message builder, a standalone one its own (jar: #FFF, then #F00)', () => {
    // LiveBoxes.java:146-170: the message's level already counts the bound
    // `activate B`, so the message's step opens that bar. `== d ==` closes
    // the message off (Divider.java:72-82), so `activate A` binds to nothing
    // and opens at its own step.
    const body = [
      'A -> B : hi',
      ...RED_STYLE,
      'activate B',
      'B -> A : back',
      'deactivate B',
      '== d ==',
      'activate A',
      'A -> B : x',
      'deactivate A',
    ];
    expect(fills(body)).toEqual([ACTIVATION_WHITE, RED]);
  });

  it('the activating colour overrides BackGroundColor (Style.java:214-223)', () => {
    expect(fills(['A -> B : hi', 'activate B #00FF00', 'B -> A', 'deactivate B'])).toEqual(['#00FF00']);
    expect(fills(['A -> B ++ #red : hi', 'B -> A --'])).toEqual([RED]);
  });

  it('skinparam sequenceLifeLineBackgroundColor reaches the box (FromSkinparamToStyle.java:113)', () => {
    expect(fills(['skinparam sequenceLifeLineBackgroundColor #FFFF00', 'A -> B ++ : hi', 'B -> A --'])).toEqual([
      '#FFFF00',
    ]);
  });

  it('merges the participant stereotype (LiveBoxesDrawer.java:140; jar: fill="#0F0" on B only)', () => {
    const body = [
      '<style>',
      '.foo { activationBox { BackGroundColor #00FF00 } }',
      '</style>',
      'participant A',
      'participant B <<foo>>',
      'A -> B ++ : hello',
      'B -> A -- : back',
      'A -> A ++ : self',
    ];
    const bars = activations(body);
    expect(bars.map((b) => [b.participantId, b.paint?.fill])).toEqual([
      ['B', '#00FF00'],
      ['A', ACTIVATION_WHITE],
    ]);
  });

  it('merges the decorated stereotype, without its (C, #color) spot (CommandParticipant.java:176-181; jar: fill="#F00")', () => {
    // `participant.getStereotype()` is the four-argument build, whose label --
    // hence its style name -- is `foo`, not `(C,#ADD1B2) foo`.
    const body = [
      '<style>',
      '.foo {',
      '  BackGroundColor red',
      '}',
      '</style>',
      'participant Alice',
      'participant Bob << (C,#ADD1B2) foo >>',
      'Alice -> Bob ++ : hi',
      'Bob --> Alice -- : ok',
    ];
    expect(fills(body)).toEqual([RED]);
  });

  it('a bar left open is flushed with its opening builder', () => {
    const [bar] = activations(['A -> B ++ : hi']);
    expect(bar?.paint?.fill).toBe(ACTIVATION_WHITE);
  });
});

describe('pushActivation', () => {
  it('refuses a bar with no builder of its own outside any message', () => {
    const stack = newActivationStack([]);
    expect(() => pushActivation(stack, 'A', { y: 0 })).toThrow('activation of A opened outside any message');
  });
});
