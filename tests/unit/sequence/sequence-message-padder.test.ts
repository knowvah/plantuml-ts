import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { PAINT_NONE } from '../../../src/core/svg.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { renderMessage } from '../../../src/diagrams/sequence/renderer-message.js';
import { scaleSequenceTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import { layoutPadder, sequenceDiagramPadder } from '../../../src/diagrams/sequence/sequence-message-padder.js';
import { SequenceLegacyParams } from '../../../src/diagrams/sequence/sequence-skin-param.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { messagePaintOf } from '../../../src/diagrams/sequence/sequence-arrow-paint.js';
import { LineBreakStrategy } from '../../../src/core/klimt/LineBreakStrategy.js';
import {
  messageLabelHeight,
  messageLabelWidth,
  placeMessageLabel,
} from '../../../src/diagrams/sequence/text-block-geo.js';
import type { MessageGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

function paramsOf(entries: Record<string, string>): SequenceLegacyParams {
  const params = new SequenceLegacyParams();
  for (const [key, value] of Object.entries(entries)) params.setParam(key, value);
  return params;
}

describe('sequenceDiagramPadder (SkinParam.java:1216-1229)', () => {
  it('is Padder.NONE (undefined) when nothing is set', () => {
    expect(sequenceDiagramPadder(paramsOf({}))).toBeUndefined();
  });

  it('is Padder.NONE for non-numeric padding and no colours (getAsDouble -> 0, :1158-1164)', () => {
    expect(sequenceDiagramPadder(paramsOf({ SequenceMessagePadding: 'big' }))).toBeUndefined();
  });

  it('reads bakire-18-peku988: margin 35, padding 5, Green fill, Blue border', () => {
    const padder = sequenceDiagramPadder(
      paramsOf({
        SequenceMessageMargin: '35',
        SequenceMessagePadding: '5',
        SequenceMessageBackgroundColor: 'Green',
        SequenceMessageBorderColor: 'Blue',
      }),
    );
    expect(padder?.margin.getLeft()).toBe(35);
    expect(padder?.padding.getTop()).toBe(5);
    expect(padder?.fill).toBe('#008000');
    expect(padder?.stroke).toBe('#0000FF');
    expect(padder?.roundCorner).toBe(0);
  });

  it('a colour alone makes a padder, the other colour is none (gijamu-35-vale058)', () => {
    const padder = sequenceDiagramPadder(paramsOf({ SequenceMessageBackgroundColor: 'WHITE' }));
    expect(padder?.fill).toBe('#FFFFFF');
    expect(padder?.stroke).toBe(PAINT_NONE);
  });

  it('takes RoundCorner when digits (suvodo-70-rogi494)', () => {
    expect(sequenceDiagramPadder(paramsOf({ SequenceMessagePadding: '5', RoundCorner: '15' }))?.roundCorner).toBe(15);
  });
});

describe('layoutPadder (Padder.java:107-131)', () => {
  it('bakire golden: label 27.544x13 -> box 37.544x23, label 5 inside, 35 margin around', () => {
    const padder = sequenceDiagramPadder(
      paramsOf({ SequenceMessageMargin: '35', SequenceMessagePadding: '5', SequenceMessageBorderColor: 'Blue' }),
    )!;
    const laid = layoutPadder(padder, { x: 39.225, y: 51 }, { width: 27.544, height: 13 });
    expect(laid.box).toEqual({ x: 74.225, y: 86, width: 37.544, height: 23 });
    expect(laid.labelX).toBeCloseTo(79.225, 6);
    expect(laid.labelY).toBe(91);
    expect(laid.width).toBeCloseTo(107.544, 6);
    expect(laid.height).toBe(93);
  });
});

const base: MessageGeo = {
  kind: 'message',
  fromX: 10,
  toX: 100,
  y: 50,
  label: '',
  arrow: arrowConfigurationOf({ dashed: false, async2: false }),
  arrowDirection: 'right',
  labelLines: [],
};

describe('renderMessage draws the padder box before the label', () => {
  const theme = scaleSequenceTheme(defaultTheme, 1, new FormulaMeasurer());
  it('gijamu golden: filled, no stroke', () => {
    const svg = renderMessage(
      {
        ...base,
        labelPadder: {
          x: 183.053,
          y: 200,
          width: 95.469,
          height: 13,
          fill: '#FFF',
          stroke: PAINT_NONE,
          roundCorner: 0,
        },
      },
      theme,
    );
    expect(svg).toContain('<rect x="183.053" y="200" width="95.469" height="13" fill="#FFF" stroke="none"/>');
  });

  it('suvodo golden: unfilled, blue stroke, rx = RoundCorner / 2', () => {
    const svg = renderMessage(
      {
        ...base,
        labelPadder: {
          x: 138.925,
          y: 86,
          width: 37.544,
          height: 23,
          fill: PAINT_NONE,
          stroke: '#00F',
          roundCorner: 15,
        },
      },
      theme,
    );
    expect(svg).toContain(
      '<rect x="138.925" y="86" width="37.544" height="23" fill="none" stroke="#00F" stroke-width="1" rx="7.5" ry="7.5"/>',
    );
  });

  it('draws nothing extra without a padder', () => {
    expect(renderMessage(base, theme)).not.toContain('<rect');
  });
});

describe('the padder reaches the label block sizes (Padder.java:109-111)', () => {
  const measurer = new FormulaMeasurer();
  const font = messagePaintOf(base).font;
  const padder = sequenceDiagramPadder(paramsOf({ SequenceMessageMargin: '35', SequenceMessagePadding: '5' }));

  it('adds 2*(margin+padding) to both dimensions', () => {
    const plain = { measurer, theme: defaultTheme };
    const wrapped = { ...plain, padder };
    expect(messageLabelWidth('hello', undefined, font, wrapped)).toBeCloseTo(
      messageLabelWidth('hello', undefined, font, plain) + 80,
      6,
    );
    expect(messageLabelHeight('hello', undefined, font, wrapped)).toBeCloseTo(
      messageLabelHeight('hello', undefined, font, plain) + 80,
      6,
    );
  });

  it('places the box margin in from the label origin and the label padding further in', () => {
    const env = { measurer, theme: defaultTheme, padder };
    const block = placeMessageLabel({ label: 'hello', numberText: undefined, leftX: 100, arrowY: 200, font }, env);
    const height = messageLabelHeight('hello', undefined, font, env);
    expect(block.padder?.x).toBe(135);
    expect(block.padder?.y).toBe(200 - (height + 2) + 35);
    expect(block.lines[0]?.x).toBe(140);
  });
});

describe('arrow style MaximumWidth wins over maxMessageSize (Rose.java:289-292)', () => {
  it('wraps at the style width where the theme has none', () => {
    const env = { measurer: new FormulaMeasurer(), theme: defaultTheme };
    const font = messagePaintOf(base).font;
    const long = 'one two three four five six seven eight';
    const single = messageLabelHeight(long, undefined, font, env);
    const wrapped = messageLabelHeight(long, undefined, font, env, new LineBreakStrategy('60'));
    expect(wrapped).toBeGreaterThan(single);
  });
});

describe('parseSequence stamps the padder at parse end', () => {
  const parsed = (lines: readonly string[]): SequenceDiagramAST => {
    const block = buildBlockUmls(`@startuml\n${lines.join('\n')}\n@enduml`)[0]!;
    if (!block.ok) throw new Error('preprocessor failure');
    const result = parseSequence({
      ...block.source,
      stylePositions: block.preprocessed.stylePositions,
      skinparamAssignments: block.preprocessed.skinparamAssignments,
      styleSource: block.preprocessed,
    });
    if ('refused' in result) throw new Error('refused');
    return result;
  };

  it('bakire-18-peku988: SequenceMessage { Margin 35 Padding 5 ... }', () => {
    const ast = parsed([
      'skinparam SequenceMessage {',
      '  Margin 35',
      '  Padding 5',
      '  BorderColor Blue',
      '}',
      'Alice->Bob : hello',
    ]);
    expect(ast.messagePadder?.margin.getTop()).toBe(35);
    expect(ast.messagePadder?.stroke).toBe('#0000FF');
  });

  it('is absent without the skinparams', () => {
    expect(parsed(['Alice->Bob : hello']).messagePadder).toBeUndefined();
  });
});
