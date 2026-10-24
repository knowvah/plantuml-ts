/**
 * sdd1 T4a: `skinparam sequenceGroupBodyBackgroundColor`, a LEGACY
 * `ColorParam` (`ColorParam.java:60`) read at the group command, not a
 * Style property: `SequenceDiagram#grouping` gives a command with no general
 * colour `getSkinParam().getHtmlColor(ColorParam.sequenceGroupBodyBackground,
 * null, false)` (`SequenceDiagram.java:418-419`), for the opener
 * (`GroupingStart`, `:427-428`) and every `else`/`end` leaf (`GroupingLeaf`,
 * `:431-432`). `SkinParam#getValue` caches a key's first answer for good
 * (`SkinParam.java:323-340`).
 *
 * The parse-level expectations are jar-verified probes (oracle-render.sh);
 * the band expectations quote the jar goldens of the nine corpus fixtures.
 */
import { tagsOf } from '../../helpers/svg-tags.js';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { FrameEvent } from '../../../src/diagrams/sequence/ast.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSync } from '../../../src/index.js';
import { astOrThrow } from '../../helpers/parse-ast.js';

const YELLOW = 'skinparam sequenceGroupBodyBackgroundColor yellow';

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

function framesOf(body: readonly string[]): FrameEvent[] {
  const ast = astOrThrow(parseSequence(sourceOf(body)), 'sequence');
  return ast.events.filter((e): e is FrameEvent => e.kind === 'frame');
}

describe('the group command takes the legacy colour when it has none (SequenceDiagram.java:418-419)', () => {
  it('a skinparam after a message, before the first group, reaches the group (probe p3)', () => {
    const [frame] = framesOf(['A -> B : zero', YELLOW, 'alt a1', 'A -> B : one', 'else e1', 'A -> B : two', 'end']);
    expect(frame!.backColorGeneral).toBe('yellow');
    expect(frame!.branchColors).toEqual(['yellow', 'yellow']);
  });

  it('a skinparam after the first group reaches no later group: the first read cached null (probe p1)', () => {
    const frames = framesOf(['group g1', 'A -> B : one', 'end', YELLOW, 'group g2', 'A -> B : two', 'end']);
    expect(frames.map((f) => f.backColorGeneral)).toEqual([undefined, undefined]);
  });

  it('a second skinparam does not replace the cached first value (probe p2)', () => {
    const frames = framesOf([
      YELLOW,
      'group g1',
      'A -> B : one',
      'end',
      'skinparam sequenceGroupBodyBackgroundColor 40112233',
      'group g2',
      'A -> B : two',
      'end',
    ]);
    expect(frames.map((f) => f.backColorGeneral)).toEqual(['yellow', 'yellow']);
  });

  it('an else reads the cached value; its own colour wins (probe p4)', () => {
    const [frame] = framesOf([
      YELLOW,
      'alt a1',
      'A -> B : one',
      'skinparam sequenceGroupBodyBackgroundColor red',
      'else e1',
      'A -> B : two',
      'else #blue e2',
      'A -> B : three',
      'end',
    ]);
    expect(frame!.branchColors).toEqual(['yellow', 'yellow', '#blue']);
  });

  it("the command's own colour wins, and a colourless else takes the legacy colour, not the opener's (probe p6)", () => {
    const frames = framesOf([
      YELLOW,
      'group #pink g1',
      'A -> B : one',
      'end',
      'alt #aqua a',
      'A -> B : one',
      'else e',
      'A -> B : two',
      'end',
    ]);
    expect(frames.map((f) => f.backColorGeneral)).toEqual(['#pink', '#aqua']);
    expect(frames[1]!.branchColors).toEqual(['#aqua', 'yellow']);
  });

  it('an unparsable value is white, getColorOrWhite (HColorSet.java:58-63; probe p5 fill="#FFF")', () => {
    const [frame] = framesOf(['skinparam sequenceGroupBodyBackgroundColor notacolour', 'group g1', 'A -> B', 'end']);
    expect(frame!.backColorGeneral).toBe('#FFFFFF');
  });

  it('no skinparam leaves the colour unset', () => {
    const [frame] = framesOf(['group g1', 'A -> B', 'end']);
    expect(frame!.backColorGeneral).toBeUndefined();
  });
});

/** One drawn band, as this renderer emits it. */
interface Band {
  readonly fill: string;
  readonly fillOpacity: string | undefined;
  readonly stroke: string;
}

/**
 * The bands `Blotter#drawU` draws: a `URectangle` with the band colour as
 * both fill and stroke (`Blotter.java:82`), `stroke-width` 1. No other rect
 * in these fixtures has a stroke-width of exactly 1.
 */
function bands(svg: string): Band[] {
  return tagsOf(svg, 'rect')
    .filter((t) => t['stroke-width'] === '1' && t.stroke !== undefined)
    .map((t) => ({ fill: t.fill!, fillOpacity: t['fill-opacity'], stroke: t.stroke! }));
}

function koleji(color: string): string {
  return [
    '@startuml',
    'skinparam BackgroundColor transparent',
    'skinparam shadowing false',
    `skinparam SequenceGroupBodyBackgroundColor ${color}`,
    'participant client',
    'box',
    '  participant server',
    'end box',
    'opt',
    'client -> server : first hello //opt//',
    '  opt',
    '    client -> server : second hello //opt//\\nwith more green',
    '  end opt',
    'end opt',
    'opt',
    '  client <- server : hello //opt//',
    'end opt',
    '@enduml',
  ].join('\n');
}

function darupa(color: string): string {
  return [
    '@startuml',
    'skinparam shadowing false',
    `skinparam SequenceGroupBodyBackgroundColor ${color}`,
    'participant client',
    'box',
    '  participant server',
    'end box',
    'opt',
    'client -> server : hello',
    '  opt',
    '    client -> server : hello',
    '  end opt',
    'end opt',
    '@enduml',
  ].join('\n');
}

function cabeve(lifelineSolid: boolean): string {
  return [
    '@startuml',
    ...(lifelineSolid ? ['skinparam lifelineStrategy solid'] : []),
    'skinparam SequenceGroupHeaderFontColor red',
    'skinparam SequenceGroupFontColor green',
    'skinparam SequenceGroupBodyBackgroundColor yellow',
    'loop forever',
    '  A -> B: ping',
    '  B -> A: pong',
    'end',
    '@enduml',
  ].join('\n');
}

function times<T>(n: number, band: T): T[] {
  return Array.from({ length: n }, () => band);
}

/**
 * Each fixture's bands as its jar golden draws them: `[stroke, fill,
 * fill-opacity]`, quoted from `style="stroke:…"` and `SvgGraphics#fillMe`'s
 * split of an 8-digit fill (SvgGraphics.java:879-887).
 */
type JarBand = readonly [stroke: string, fill: string, fillOpacity?: string];

const FIXTURES: readonly (readonly [string, string, readonly JarBand[]])[] = [
  ['cabeve-16-raci213', cabeve(false), [['#FF0', '#FF0']]],
  ['padomu-10-nati972', cabeve(true), [['#FF0', '#FF0']]],
  ['darupa-17-dujo243', darupa('40112233'), times(2, ['#40112233', '#401122', '0.2'])],
  ['xebixi-82-duji787', darupa('55555555'), times(2, ['#55555555', '#555', '0.333'])],
  ['koleji-09-doni016', koleji('00FF0040'), times(3, ['#00FF0040', '#0F0', '0.251'])],
  ['nofegi-58-kilo738', koleji('00FF0067'), times(3, ['#00FF0067', '#0F0', '0.404'])],
  ['xeneru-44-kuma826', koleji('66000099'), times(3, ['#66000099', '#600', '0.6'])],
  // Alpha 00: transparent, so no band (`Blotter.java:80`).
  ['xuzedu-97-femo595', koleji('6700FF00'), []],
];

/** The rows whose colour has an alpha below FF. */
const ALPHA = FIXTURES.filter(([, , jar]) => jar.some((band) => band[2] !== undefined));
const OPAQUE = FIXTURES.filter((row) => !ALPHA.includes(row));

describe('the nine corpus fixtures draw the jar golden bands', () => {
  it.each(FIXTURES)('%s: one band per jar band, in the jar stroke', (_slug, source, jar) => {
    expect(bands(renderSync(source)).map((band) => band.stroke)).toEqual(jar.map(([stroke]) => stroke));
  });

  it.each(OPAQUE)('%s: the jar fill', (_slug, source, jar) => {
    expect(bands(renderSync(source))).toEqual(jar.map(([stroke, fill]) => ({ fill, fillOpacity: undefined, stroke })));
  });

  // sdd3 T2a (`5898bfecb`): `core/svg-shapes.ts#fillAttrsOf` now splits an
  // 8-digit fill into `fill` + `fill-opacity` as `SvgGraphics#fillMe` does
  // (SvgGraphics.java:880-887), so these five rows match the jar golden;
  // they were `it.fails` while the string emitter wrote the fill as given.
  it.each(ALPHA)('%s: the jar fill, split by fillMe', (_slug, source, jar) => {
    expect(bands(renderSync(source))).toEqual(
      jar.map(([stroke, fill, fillOpacity]) => ({ fill, fillOpacity, stroke })),
    );
  });

  it('murori-42-pabo946: `transparent` draws no band', () => {
    const svg = renderSync(
      [
        '@startuml',
        'skinparam SequenceGroupBodyBackGroundColor transparent',
        'skinparam roundCorner 10',
        'box "A" #DD55DD',
        'participant user',
        'end box',
        'box "B" #55CCDD',
        'participant device',
        'end box',
        'user->device: do something',
        'group if condition 1 ',
        'device->user: done',
        'end',
        '@enduml',
      ].join('\n'),
    );
    expect(bands(svg)).toEqual([]);
  });
});

describe('reads at else and end fill the cache too (SequenceDiagram.java:418-419)', () => {
  it('an end before the skinparam caches null, so a later group stays uncoloured (probe p7)', () => {
    const frames = framesOf(['group #pink g1', 'A -> B : one', 'end', YELLOW, 'group g2', 'A -> B : two', 'end']);
    expect(frames.map((f) => f.backColorGeneral)).toEqual(['#pink', undefined]);
  });

  it('`end #c` has its own colour and reads nothing (probe p8)', () => {
    const frames = framesOf(['group #pink g1', 'A -> B : one', 'end #red', YELLOW, 'group g2', 'A -> B : two', 'end']);
    expect(frames.map((f) => f.backColorGeneral)).toEqual(['#pink', 'yellow']);
  });

  it('an else after a coloured opener is the first read (probe p9)', () => {
    const [frame] = framesOf(['alt #pink a', 'A -> B : one', YELLOW, 'else e', 'A -> B : two', 'end']);
    expect(frame!.branchColors).toEqual(['#pink', 'yellow']);
  });
});
