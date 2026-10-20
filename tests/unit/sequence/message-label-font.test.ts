/**
 * sdd1 T3d — a message label is a text block in the ARROW style's font.
 *
 * Upstream the arrow component builds its label with
 * `getFontConfiguration()` = `style.getFontConfiguration(set)`
 * (`skin/AbstractTextualComponent.java:80-92`, `skin/AbstractComponent.java:
 * 129-131`) over the message's merged style (`AbstractMessage.java:67-73`),
 * and draws it on a `ug` with no back colour (`ComponentRoseArrow.java:179`),
 * so a context-dependent colour resolves against the document background
 * (`FontConfiguration.java:349-356`). Default-skin values cite
 * `~/git/plantuml/src/main/resources/skin/plantuml.skin`; every rendered
 * expectation was read off the oracle jar (`scripts/oracle-render.sh`,
 * 2026-10-20) on the same source.
 */
import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { atomFontSpec } from '../../../src/diagrams/sequence/sequence-creole-text-atom.js';
import { defaultMessageFont, messagePaint } from '../../../src/diagrams/sequence/sequence-arrow-paint.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { messageLabelBlock } from '../../../src/diagrams/sequence/text-block-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';

/** `plantuml.skin:317` `arrow { FontSize 13 }`. */
const ARROW_FONT_SIZE = '13';
/** `plantuml.skin:9` `root { FontColor black }`, as `SvgGraphics` writes it. */
const BLACK = '#000';

interface Text {
  readonly text: string;
  readonly attrs: Readonly<Record<string, string>>;
}

/** Every `<text>` the jar-path render draws, in order. */
function textsOf(source: string): Text[] {
  const svg = renderFixtureSequence(`@startuml\n${source}\n@enduml`, new DeterministicMeasurer());
  return [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map((m) => ({
    text: m[2]!,
    attrs: Object.fromEntries([...m[1]!.matchAll(/([a-zA-Z0-9-]+)="([^"]*)"/g)].map((a) => [a[1]!, a[2]!])),
  }));
}

/** The `<text>` whose content is `label`. */
function labelOf(source: string, label: string): Text {
  const found = textsOf(source).find((t) => t.text === label);
  if (found === undefined) throw new Error(`no <text> "${label}"`);
  return found;
}

const FONT_SIZE_20 = '<style>\narrow {\n  FontSize 20\n}\n</style>\n';

describe('message label — default skin', () => {
  it('is drawn at arrow FontSize 13 in root FontColor black (plantuml.skin:9,317)', () => {
    const { attrs } = labelOf('Alice -> Bob : hello world', 'hello world');
    expect([attrs['font-size'], attrs['fill'], attrs['textLength']]).toEqual([ARROW_FONT_SIZE, BLACK, '62.237']);
  });

  it('defaultMessageFont is the default arrow style font', () => {
    const font = defaultMessageFont();
    expect([font.size, font.color, font.styles.size]).toEqual([13, '#000000', 0]);
  });
});

describe('message label — <style> arrow { FontSize 20 }', () => {
  const SRC = `${FONT_SIZE_20}Alice -> Bob : hello world\nBob -> Bob : self\n[-> Alice : exo`;

  it('measures and draws a flat label at 20', () => {
    const { attrs } = labelOf(SRC, 'hello world');
    expect([attrs['font-size'], attrs['textLength'], attrs['y']]).toEqual(['20', '95.75', '66.556']);
  });

  it('measures and draws a self label at 20', () => {
    const { attrs } = labelOf(SRC, 'self');
    expect([attrs['font-size'], attrs['textLength'], attrs['y']]).toEqual(['20', '31.125', '100.556']);
  });

  it('measures and draws an exo label at 20', () => {
    const { attrs } = labelOf(SRC, 'exo');
    expect([attrs['font-size'], attrs['textLength'], attrs['y']]).toEqual(['20', '32.25', '147.556']);
  });

  it('reserves the taller line in the block: the arrow sits getTextHeight below the block top', () => {
    const block = messageLabelBlock(
      'hi',
      undefined,
      0,
      100,
      { theme: defaultTheme, measurer: new DeterministicMeasurer() },
      {
        ...defaultMessageFont(),
        size: 20,
      },
    );
    const measurer = new DeterministicMeasurer();
    const spec = atomFontSpec({ ...defaultMessageFont(), size: 20 });
    expect(block.lines[0]?.textWidth).toBe(measurer.measure('hi', spec).width);
    expect(block.lines[0]?.fontSize).toBe(20);
  });
});

describe('message label — skinparam sequenceArrowFont* (FromSkinparamToStyle)', () => {
  const SRC = 'skinparam sequenceArrowFontColor red\nskinparam sequenceArrowFontStyle bold\nAlice -> Bob : hello world';

  it('colours the label from sequenceArrowFontColor', () => {
    expect(labelOf(SRC, 'hello world').attrs['fill']).toBe('#F00');
  });

  it('bolds the label from sequenceArrowFontStyle', () => {
    expect(labelOf(SRC, 'hello world').attrs['font-weight']).toBe('700');
  });

  it('sizes the label from sequenceArrowFontSize', () => {
    expect(labelOf('skinparam sequenceArrowFontSize 20\nAlice -> Bob : hi', 'hi').attrs['font-size']).toBe('20');
  });
});

describe('message label — <style> arrow { FontColor }', () => {
  it('colours every label (bovuda-87)', () => {
    const src = '<style>\narrow {\n  FontColor red\n}\n</style>\nAlice -> Bob : one\nAlice -> Bob : two';
    expect(
      textsOf(src)
        .filter((t) => t.text === 'one' || t.text === 'two')
        .map((t) => t.attrs['fill']),
    ).toEqual(['#F00', '#F00']);
  });

  it('reaches only the messages after it (jutexi-93, D2)', () => {
    const src = 'Alice -> Bob : one\n<style>\narrow {\n  FontColor red\n}\n</style>\nAlice -> Bob : two';
    expect([labelOf(src, 'one').attrs['fill'], labelOf(src, 'two').attrs['fill']]).toEqual([BLACK, '#F00']);
  });

  it('follows a message stereotype (AbstractMessage.java:75-78)', () => {
    const src = '<style>\n.loud {\n  FontColor blue\n}\n</style>\nAlice -> Bob <<loud>> : one\nAlice -> Bob : two';
    expect([labelOf(src, 'one').attrs['fill'], labelOf(src, 'two').attrs['fill']]).toEqual(['#00F', BLACK]);
  });
});

describe('message label — a #?light:dark FontColor against the document back', () => {
  const scheme = (back: string): string =>
    `<style>\ndocument {\n  BackGroundColor ${back}\n}\nroot {\n  FontColor #?black:white\n}\n</style>\nalice -> bob : hello`;

  it('draws white on a dark document (duzico-51)', () => {
    expect(labelOf(scheme('darkblue'), 'hello').attrs['fill']).toBe('#FFF');
  });

  it('draws black on a light document (gazave-48)', () => {
    expect(labelOf(scheme('white'), 'hello').attrs['fill']).toBe(BLACK);
  });

  it('reads a gradient document back by its first colour (HColorGradient.java:108-110)', () => {
    expect(labelOf(scheme('navy-white'), 'hello').attrs['fill']).toBe('#FFF');
  });

  it('draws the opposite of the document back for an automatic FontColor (HColorAutomagic.java:38-41)', () => {
    const src =
      '<style>\ndocument {\n  BackGroundColor black\n}\narrow {\n  FontColor automatic\n}\n</style>\na -> b : hi';
    expect(labelOf(src, 'hi').attrs['fill']).toBe('#FFF');
  });
});

describe('messagePaint font', () => {
  it('keeps the arrow colour off the label (LineColor only, AbstractMessage.java:69-70)', () => {
    const arrow = { ...arrowConfigurationOf(SPEC), color: HColorSet.instance().getColor('red') };
    const paint = messagePaint(DEFAULT_SEQUENCE_STYLE_BUILDER, undefined, arrow, false);
    expect([paint.stroke, paint.font.color]).toEqual(['#FF0000', '#000000']);
  });
});

const SPEC = {
  dashed: false,
  both: false,
  circle1: false,
  circle2: false,
  async1: false,
  async2: false,
  cross1: false,
  cross2: false,
};

describe('autonumber — the MessageNumber block (Display.java:703-712)', () => {
  const SRC = [
    'autonumber',
    'A -> B : one',
    'autonumber 1.1 1 "[000]"',
    'A -> B : two',
    'autonumber 5 "[000]"',
    'A -> B : three',
    '[-> A : exo',
  ].join('\n');
  const weightOf = (text: string): string | undefined => labelOf(SRC, text).attrs['font-weight'];

  it('draws the default <b>0</b> number bold (CommandAutonumber.java:119)', () => {
    expect(weightOf('1')).toBe('700');
  });

  it('draws a dotted number bold whatever the format (DottedNumber.java:106-111)', () => {
    expect(weightOf('1.1')).toBe('700');
  });

  it('draws a plain number in a bold-free format unbolded, on a flat and an exo arrow', () => {
    expect([weightOf('[005]'), weightOf('[006]')]).toEqual([undefined, undefined]);
  });

  it('keeps the label beside a bold number in the label font', () => {
    expect(weightOf('one')).toBeUndefined();
  });

  it('measures an exo number as its creole block, not its markup (Display.java:706)', () => {
    const src = 'autonumber\n[-> A : exo';
    const [num, label] = [labelOf(src, '1'), labelOf(src, 'exo')];
    const measurer = new DeterministicMeasurer();
    const spec = { ...atomFontSpec(defaultMessageFont()), weight: 'bold' as const };
    expect(Number(label.attrs['x']) - Number(num.attrs['x'])).toBeCloseTo(measurer.measure('1', spec).width + 4, 3);
  });
});

describe('message label — arrow { FontColor } beside other styled elements (T3d item 3b rows)', () => {
  // Layer interactions the eight `arrow { FontColor }` corpus rows exercise;
  // every value is the row's own golden.
  const fillsOf = (src: string): (string | undefined)[] => textsOf(src).map((t) => t.attrs['fill']);

  it('keeps a nested sequenceDiagram arrow colour off the participants (fojagu-59)', () => {
    const src =
      '<style>\nsequenceDiagram {\n  participant {\n    FontColor: green;\n  }\n  arrow {\n    FontColor red\n  }\n}\n</style>\n' +
      'participant Alice\nparticipant Bob\nAlice -> Bob : hello1';
    expect(fillsOf(src)).toEqual(['#008000', '#008000', '#008000', '#008000', '#F00']);
  });

  it('keeps a mid-diagram participant style off the labels and the arrow style off earlier labels (xarifa-42)', () => {
    const src =
      'participant Alice\n<style>\nparticipant {\n  FontColor green\n}\n</style>\nparticipant Bob\n' +
      'Alice -> Bob : hello1\n<style>\narrow {\n  FontColor red\n}\n</style>\nAlice -> Bob : hello2';
    expect(fillsOf(src)).toEqual(['#000', '#008000', '#000', '#008000', '#000', '#F00']);
  });

  it('colours the label and not the shaft from FontColor beside a LineColor (dicizi-85)', () => {
    const src = '<style>\narrow {\n  LineColor red\n  FontColor blue\n}\n</style>\nalice -> bob : msg';
    expect(labelOf(src, 'msg').attrs['fill']).toBe('#00F');
  });
});
