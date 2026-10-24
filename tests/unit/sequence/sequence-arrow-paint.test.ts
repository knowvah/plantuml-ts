/**
 * sdd1 T2c — every message arrow strokes from its merged arrow style.
 *
 * Upstream merges the arrow style per message
 * (`sequencediagram/AbstractMessage.java:67-78`, signature `root, element,
 * sequenceDiagram, arrow` + the message's stereotype) and the `Rose` arrow
 * components read it (`skin/rose/AbstractComponentRoseArrow.java:65-68`,
 * `skin/AbstractComponent.java:101-119`). The shaft's stroke is
 * `ArrowConfiguration#applyStroke(ug, style)` for a flat or exo arrow
 * (`skin/ArrowConfiguration.java:244-252`, `ComponentRoseArrow.java:158`)
 * and the deprecated `applyStroke(ug)` for a self arrow (`:254-260`,
 * `ComponentRoseSelfArrow.java:81`).
 *
 * Default-skin values cite `~/git/plantuml/src/main/resources/skin/
 * plantuml.skin`; every rendered expectation was read off the oracle jar
 * (`scripts/oracle-render.sh`, 2026-10-20) on the same source.
 */
import { describe, expect, it } from 'vitest';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { renderSync } from '../../../src/index.js';
import {
  applyStroke,
  applyStrokeDeprecated,
  messagePaint,
  messagePaintOf,
} from '../../../src/diagrams/sequence/sequence-arrow-paint.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { MessageGeo } from '../../../src/diagrams/sequence/ast.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';
import { attrsOf } from '../../helpers/svg-tags.js';

/** `plantuml.skin:16` `root { LineColor #181818 }`, as `SvgGraphics` writes it. */
const ROOT_LINE = '#181818';
/** `plantuml.skin:308` `arrow { LineThickness 1.0 }`. */
const ARROW_THICKNESS = 1;
/** `plantuml.skin:309` `arrow { BackGroundColor black }`. */
const ARROW_BACKGROUND = '#000000';
/** `new UStroke(2, 2, ...)`, the dotted exception. @see ArrowConfiguration.java:248-249,256-257 */
const DOTTED = '2,2';

interface Shape {
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string>>;
}

/** Every `<line>`/`<polygon>`/`<ellipse>` the document draws, in order. */
function shapesOf(source: string): Shape[] {
  const svg = renderSync(`@startuml\n${source}\n@enduml`);
  return [...svg.matchAll(/<(line|polygon|ellipse)\b([^>]*)\/>/g)].map((m) => ({
    tag: m[1]!,
    // `style="stroke:..;.."` expanded: the klimt drivers write the jar's form.
    attrs: attrsOf(m[2]!),
  }));
}

/** `getArrowOnlyHeight()`, the self loop's drop. @see ComponentRoseSelfArrow.java:321-323 */
const SELF_LOOP_DROP = 13;

/** A lifeline: vertical and longer than any self loop's drop. */
function isLifeline(s: Shape): boolean {
  if (s.tag !== 'line' || s.attrs['x1'] !== s.attrs['x2']) return false;
  return Math.abs(Number(s.attrs['y2']) - Number(s.attrs['y1'])) > SELF_LOOP_DROP;
}

/** The message shapes: every shape that is not a lifeline. */
function arrowShapesOf(source: string): Shape[] {
  return shapesOf(source).filter((s) => !isLifeline(s));
}

/** The horizontal shafts (y1 === y2). */
function shaftsOf(source: string): Shape[] {
  return shapesOf(source).filter((s) => s.tag === 'line' && s.attrs['y1'] === s.attrs['y2']);
}

describe('ArrowConfiguration#applyStroke(ug, style) (ArrowConfiguration.java:244-252)', () => {
  it('dots a dotted body with no style dash at 2,2 and the style thickness', () => {
    const stroke = applyStroke(UStroke.withThickness(3), true);
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([2, 2, 3]);
  });

  it('keeps the style dash on a dotted body that has one', () => {
    const stroke = applyStroke(new UStroke(6, 3, 1), true);
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([6, 3, 1]);
  });

  it('keeps a 0-visible style dash with a space on a dotted body (no exception)', () => {
    const stroke = applyStroke(new UStroke(0, 5, 1), true);
    expect(stroke.getDasharraySvg()).toBeUndefined();
    expect(stroke.getDashSpace()).toBe(5);
  });

  it('applies the style stroke unchanged to a plain body', () => {
    const stroke = applyStroke(new UStroke(6, 3, 2), false);
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([6, 3, 2]);
  });
});

describe('ArrowConfiguration#applyStroke(ug), deprecated (ArrowConfiguration.java:254-260)', () => {
  it('dots a dotted self body at 2,2', () => {
    const stroke = applyStrokeDeprecated(2, true);
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([2, 2, 2]);
  });

  it('draws a plain self body solid at the thickness', () => {
    expect(applyStrokeDeprecated(3, false).getDasharraySvg()).toBeUndefined();
    expect(applyStrokeDeprecated(3, false).getThickness()).toBe(3);
  });
});

describe('messagePaint — the default skin arrow style', () => {
  const plain = messagePaint(DEFAULT_SEQUENCE_STYLE_BUILDER, undefined, arrowConfigurationOf({}), false);

  it('strokes in the root line colour (plantuml.skin:16)', () => {
    expect(plain.stroke).toBe(ROOT_LINE);
  });

  it('is arrow LineThickness 1.0 (plantuml.skin:308)', () => {
    expect(plain.thickness).toBe(ARROW_THICKNESS);
  });

  it('fills an o decoration with arrow BackGroundColor black (plantuml.skin:309)', () => {
    expect(plain.fill).toBe(ARROW_BACKGROUND);
  });

  it('has no shaft dash on a plain body', () => {
    expect(plain.dash).toBeUndefined();
  });

  it('carries the dotted exception as the shaft dash', () => {
    const dotted = messagePaint(
      DEFAULT_SEQUENCE_STYLE_BUILDER,
      undefined,
      arrowConfigurationOf({ dashed: true }),
      true,
    );
    expect(dotted.dash).toEqual([2, 2]);
  });

  it('falls back to the default skin for a hand-authored geometry with no paint', () => {
    const geo = { arrow: arrowConfigurationOf({ dashed: true }), arrowDirection: 'right' } as const;
    const paint = messagePaintOf(geo as unknown as MessageGeo);
    expect([paint.stroke, paint.thickness, paint.dash]).toEqual([ROOT_LINE, ARROW_THICKNESS, [2, 2]]);
  });
});

describe('rendered messages — default skin', () => {
  it('dashes A --> B at 2,2 with the arrow thickness (ArrowConfiguration.java:248-249)', () => {
    const [shaft] = shaftsOf('A --> B');
    expect(shaft!.attrs).toMatchObject({ stroke: ROOT_LINE, 'stroke-width': '1', 'stroke-dasharray': DOTTED });
  });

  it('draws A -> B solid', () => {
    const [shaft] = shaftsOf('A -> B');
    expect(shaft!.attrs['stroke-dasharray']).toBeUndefined();
    expect(shaft!.attrs['stroke-width']).toBe('1');
  });

  it('dashes all three strokes of a dotted self loop at 2,2 (ArrowConfiguration.java:256-257)', () => {
    const loop = arrowShapesOf('A --> A').filter((s) => s.tag === 'line');
    expect(loop.map((s) => s.attrs['stroke-dasharray'])).toEqual([DOTTED, DOTTED, DOTTED]);
  });

  it('scales the width and the dash at emission (SvgGraphics.java:555-561)', () => {
    const [shaft] = shaftsOf('scale 2\nA --> B');
    expect(shaft!.attrs).toMatchObject({ 'stroke-width': '2', 'stroke-dasharray': '4,4' });
  });
});

describe('rendered messages — skinparam sequenceArrowThickness 2 (FromSkinparamToStyle.java:150)', () => {
  const SRC = 'skinparam sequenceArrowThickness 2\n';

  it('strokes a flat shaft at 2 and keeps its polygon head at the UGraphic default 1', () => {
    const shapes = arrowShapesOf(`${SRC}A -> B`);
    expect(shapes.map((s) => [s.tag, s.attrs['stroke-width']])).toEqual([
      ['polygon', '1'],
      ['line', '2'],
    ]);
  });

  it('strokes an async head at the style thickness (applyThicknessOnly, ComponentRoseArrow.java:246-253)', () => {
    const lines = arrowShapesOf(`${SRC}A ->> B`).filter((s) => s.tag === 'line');
    expect(lines.map((s) => s.attrs['stroke-width'])).toEqual(['2', '2', '2']);
  });

  it('keeps the crossx saltire at 2 and the dotted shaft at 2,2 (ComponentRoseArrow.java:256)', () => {
    const lines = arrowShapesOf(`${SRC}A -->x B`).filter((s) => s.tag === 'line');
    expect(lines.map((s) => [s.attrs['stroke-width'], s.attrs['stroke-dasharray']])).toEqual([
      ['2', undefined],
      ['2', undefined],
      ['2', DOTTED],
    ]);
  });

  it('strokes a self loop and an exo arrow from the same merged style', () => {
    const self = arrowShapesOf(`${SRC}A -> A`).filter((s) => s.tag === 'line');
    expect(self.map((s) => s.attrs['stroke-width'])).toEqual(['2', '2', '2']);
    const exo = shaftsOf(`${SRC}[-> A`);
    expect(exo.map((s) => s.attrs['stroke-width'])).toEqual(['2']);
  });

  it('applies from its own line onward (T1e; oracle-verified)', () => {
    const shafts = shaftsOf('A -> B\nskinparam sequenceArrowThickness 2\nA -> B');
    expect(shafts.map((s) => s.attrs['stroke-width'])).toEqual(['1', '2']);
  });
});

describe('rendered messages — skinparam sequenceArrowColor (FromSkinparamToStyle.java:151)', () => {
  it('colours the shaft and fills and strokes the head', () => {
    const shapes = arrowShapesOf('skinparam sequenceArrowColor green\nA -> B');
    expect(shapes.map((s) => [s.tag, s.attrs['fill'], s.attrs['stroke']])).toEqual([
      ['polygon', '#008000', '#008000'],
      ['line', undefined, '#008000'],
    ]);
  });

  it('is overridden by a stereotype style (AbstractMessage.java:75-78 withTOBECHANGED)', () => {
    const src = '<style>\n.a {\n  LineColor red\n}\n</style>\nskinparam sequenceArrowColor green\nA -> B <<a>>\nA -> B';
    expect(shaftsOf(src).map((s) => s.attrs['stroke'])).toEqual(['#F00', '#008000']);
  });
});

describe('rendered messages — <style> arrow', () => {
  const STYLE = '<style>\narrow {\n  LineStyle 6-3\n  LineColor blue\n  LineThickness 3\n}\n</style>\n';

  it('dashes a flat shaft, dotted or not, with the style dash', () => {
    const shafts = shaftsOf(`${STYLE}A -> B\nB --> A`);
    expect(shafts.map((s) => [s.attrs['stroke'], s.attrs['stroke-width'], s.attrs['stroke-dasharray']])).toEqual([
      ['#00F', '3', '6,3'],
      ['#00F', '3', '6,3'],
    ]);
  });

  it('ignores the style dash on a self loop: 2,2 when dotted, solid otherwise', () => {
    const dotted = arrowShapesOf(`${STYLE}A --> A`).filter((s) => s.tag === 'line');
    expect(dotted.map((s) => s.attrs['stroke-dasharray'])).toEqual([DOTTED, DOTTED, DOTTED]);
    const plain = arrowShapesOf(`${STYLE}A -> A`).filter((s) => s.tag === 'line');
    expect(plain.map((s) => s.attrs['stroke-dasharray'])).toEqual([undefined, undefined, undefined]);
  });

  it('strokes an o circle in the line colour at thinCircle, filled with the arrow background', () => {
    const [circle] = arrowShapesOf(`${STYLE}A ->o B`).filter((s) => s.tag === 'ellipse');
    expect(circle!.attrs).toMatchObject({ fill: '#000', stroke: '#00F', 'stroke-width': '1.5' });
  });

  it('draws a dotted shaft solid when the style dash has no visible part (ArrowConfiguration.java:248)', () => {
    const shafts = shaftsOf('<style>\narrow {\n  LineStyle 0-5\n}\n</style>\nA --> B');
    expect(shafts.map((s) => s.attrs['stroke-dasharray'])).toEqual([undefined]);
  });
});

describe('rendered messages — per-message colour', () => {
  // `A -[#red]> B` overrides the arrow style's LineColor
  // (`AbstractMessage.java:69-70`) with the colour `applyStyle` stored
  // (`CommandArrow.java:497-498`). Every expectation below was read off the
  // oracle jar (2026-10-20) on the same source.
  it('strokes A -[#red]> B in red', () => {
    expect(shaftsOf('A -[#red]> B').map((s) => s.attrs['stroke'])).toEqual(['#F00']);
  });

  it('fills and strokes the head in the arrow colour', () => {
    expect(arrowShapesOf('A -[#red]> B').map((s) => [s.tag, s.attrs['fill'], s.attrs['stroke']])).toEqual([
      ['polygon', '#F00', '#F00'],
      ['line', undefined, '#F00'],
    ]);
  });

  it('keeps the dotted body beside a colour (-[#blue,dashed]->)', () => {
    expect(shaftsOf('A -[#blue,dashed]-> B').map((s) => [s.attrs['stroke'], s.attrs['stroke-dasharray']])).toEqual([
      ['#00F', DOTTED],
    ]);
  });

  it('lets the last colour token win (the tokenizer loop overwrites withColor)', () => {
    expect(shaftsOf('A -[#red,#blue]-> B').map((s) => s.attrs['stroke'])).toEqual(['#00F']);
  });

  it('colours an exo arrow from either border (CommandExoArrowAny.java:101)', () => {
    expect(shaftsOf('[-[#green]> A\nA -[#00FF00]>]').map((s) => s.attrs['stroke'])).toEqual(['#008000', '#0F0']);
  });

  it('colours a reply with return #colour (CommandReturn.java:121-123)', () => {
    expect(shaftsOf('A -> B ++\nreturn #orange back').map((s) => s.attrs['stroke'])).toEqual([ROOT_LINE, '#FFA500']);
  });

  it('recolours the reply to an exo message, reversed and dotted (CommandReturn.java:127-130)', () => {
    const shafts = shaftsOf('autonumber\n[-[#blue]> A ++ : in\nreturn #red done');
    expect(shafts.map((s) => [s.attrs['stroke'], s.attrs['stroke-dasharray']])).toEqual([
      ['#00F', undefined],
      ['#F00', DOTTED],
    ]);
  });

  it("keeps the activating message's colour on a bare return (CommandReturn.java:120)", () => {
    expect(shaftsOf('A -[#blue]-> B ++\nreturn done').map((s) => s.attrs['stroke'])).toEqual(['#00F', '#00F']);
  });

  it('beats skinparam sequenceArrowColor (eventuallyOverride after the merge)', () => {
    const src = 'skinparam sequenceArrowColor #black\nA -> B\nA <[#green]- B';
    expect(shaftsOf(src).map((s) => s.attrs['stroke'])).toEqual(['#000', '#008000']);
  });
});
