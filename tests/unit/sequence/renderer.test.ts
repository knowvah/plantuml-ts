import { shortenColor } from '../../../src/core/svg-format.js';
import { ROOT_GROUP_OPEN } from '../../../src/core/svg.js';
import { describe, it, expect } from 'vitest';
import type {
  SequenceGeometry,
  MessageGeo,
  ActivationGeo,
  NoteGeo,
  FrameGeo,
  DividerGeo,
} from '../../../src/diagrams/sequence/ast.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { defaultTheme, darkTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer, FixedMeasurer } from '../../../src/core/measurer.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { messageLabelBlock } from '../../../src/diagrams/sequence/text-block-geo.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { ArrowConfiguration } from '../../../src/diagrams/sequence/sequence-arrowhead.js';
import { inflateSync } from 'node:zlib';

/** Decode an 8-bit RGBA PNG's pixels. `zlib` is a TEST oracle only -- the
 *  encoder itself stays browser-safe. */
function decodeRgba(png: Buffer): Array<[number, number, number, number]> {
  let i = 8;
  let idat = Buffer.alloc(0);
  let width = 0;
  let height = 0;
  while (i < png.length) {
    const len = png.readUInt32BE(i);
    const type = png.toString('ascii', i + 4, i + 8);
    if (type === 'IHDR') { width = png.readUInt32BE(i + 8); height = png.readUInt32BE(i + 12); }
    if (type === 'IDAT') idat = Buffer.concat([idat, png.subarray(i + 8, i + 8 + len)]);
    i += 12 + len;
  }
  const raw = inflateSync(idat);
  const out: Array<[number, number, number, number]> = [];
  const stride = width * 4 + 1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const o = y * stride + 1 + x * 4;
      out.push([raw[o]!, raw[o + 1]!, raw[o + 2]!, raw[o + 3]!]);
    }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGeo(overrides?: Partial<SequenceGeometry>): SequenceGeometry {
  return {
    totalWidth: 400,
    totalHeight: 300,
    showFootbox: true,
    participants: [
      { id: 'Alice', display: 'Alice', type: 'participant', x: 30, y: 0, width: 100, height: 36, centerX: 80, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
      { id: 'Bob', display: 'Bob', type: 'participant', x: 170, y: 0, width: 100, height: 36, centerX: 220, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
    ],
    events: [],
    lifelineEndY: 260,
    footerShapeY: 260,
    boxes: [],
    ...overrides,
  };
}

/** The six shapes the DELETED `MessageStyle` enum named, as the
 *  `ArrowConfiguration` the parser now builds for each. Kept as a naming
 *  convenience for the fixtures below; the exhaustive proof that these ARE
 *  the configurations the deleted adapter produced lives in
 *  `sequence-arrowhead.test.ts`. */
function arrowOf(style: RenderStyle): ArrowConfiguration {
  return arrowConfigurationOf({
    dashed: style === 'reply' || style === 'replyAsync',
    async2: style === 'async' || style === 'replyAsync',
  });
}

type RenderStyle = 'sync' | 'async' | 'reply' | 'replyAsync' | 'lost' | 'found';

function makeSyncMessage(overrides?: Partial<MessageGeo>): MessageGeo {
  const base = {
    kind: 'message' as const,
    fromX: 80,
    toX: 220,
    y: 80,
    label: 'hello',
    arrow: arrowOf('sync'),
    arrowDirection: 'right' as const,
    ...overrides,
  };
  // Place the label the same way layout does, so these tests exercise the
  // real run placement rather than a hand-written stub that renders nothing.
  const number = base.sequenceLabel ?? (base.sequenceNumber === undefined ? undefined : String(base.sequenceNumber));
  const block = messageLabelBlock(
    base.label, number, (base.fromX + base.toX) / 2, base.y - 5,
    defaultTheme, new FormulaMeasurer(),
  );
  return {
    ...base,
    labelLines: block.lines,
    ...(block.number !== undefined ? { labelNumber: block.number } : {}),
  };
}

// ---------------------------------------------------------------------------
// Acceptance criterion 1: Two participants → ≥ 2 <rect elements
// ---------------------------------------------------------------------------

describe('renderSequence — participant boxes', () => {
  it('emits at least 2 rects for two participants', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBeGreaterThanOrEqual(2);
  });

  it('uses theme background color for participant fill', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    expect(svg).toContain(`fill="${shortenColor(defaultTheme.colors.background)}"`);
  });

  it('emits participant display text', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    // Each participant has text with id used as display in makeGeo
    expect(svg).toContain('Alice');
    expect(svg).toContain('Bob');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 2: Sync message → <line or <path + label text
// ---------------------------------------------------------------------------

describe('renderSequence — messages', () => {
  it('sync message produces a line or path element', () => {
    const geo = makeGeo({ events: [makeSyncMessage()] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    const hasLine = svg.includes('<line') || svg.includes('<path');
    expect(hasLine).toBe(true);
  });

  it('sync message includes label text', () => {
    const geo = makeGeo({ events: [makeSyncMessage({ label: 'doThing' })] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('doThing');
  });

  it('reply message uses dashed line style', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ arrow: arrowOf('reply'), arrowDirection: 'left', fromX: 220, toX: 80 })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('stroke-dasharray');
  });

  it('replyAsync message uses dashed line style', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ arrow: arrowOf('replyAsync'), arrowDirection: 'left', fromX: 220, toX: 80 })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('stroke-dasharray');
  });

  it('self message emits a path', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ arrowDirection: 'self', fromX: 80, toX: 110 })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<path');
  });

  // `getLabelNumbered` prepends the number as a `MessageNumber`
  // (`AbstractMessage.java:200-206`) and `Display#createMessageNumber` merges
  // it left-to-right with the label as its OWN text block
  // (`Display.java:703-712`) -- so it is a SEPARATE `<text>`, and there is no
  // `": "` joining the two. This used to assert the joined form.
  it('emits the sequence number as its own text, not joined to the label', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ label: 'greet', sequenceNumber: 3 })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).not.toContain('3: greet');
    expect(svg).toContain('>3</text>');
    expect(svg).toContain('>greet</text>');
  });

  it('separates the number from the label by upstreams 4px margin', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ label: 'greet', sequenceNumber: 3 })],
    });
    const msg = geo.events[0] as MessageGeo;
    const numberRun = msg.labelNumber;
    expect(numberRun).toBeDefined();
    const numberWidth = new FormulaMeasurer().measure('3', {
      family: defaultTheme.fontFamily,
      size: defaultTheme.fontSize,
    }).width;
    // `TextBlockUtils.withMargin(tb1, 0, 4, 0, 0)` -- `Display.java:706`.
    expect(msg.labelLines[0]?.x).toBeCloseTo((numberRun?.x ?? 0) + numberWidth + 4, 6);
    // `VerticalAlignment.CENTER` against a one-line label puts both on one row.
    expect(numberRun?.y).toBe(msg.labelLines[0]?.y);
  });

  it('emits no label text for a message with neither label nor number', () => {
    const geo = makeGeo({ events: [makeSyncMessage({ label: '' })] });
    const msg = geo.events[0] as MessageGeo;
    expect(msg.labelLines).toEqual([]);
    expect(msg.labelNumber).toBeUndefined();
    // `AbstractTextualComponent` maps an empty display to a `TextBlockEmpty`,
    // which draws nothing (`AbstractTextualComponent.java:84-85`).
    expect(assembleSvg(renderSequence(geo, defaultTheme))).not.toContain('></text>');
  });

  it('emits one text per line of a multi-line label, sharing one x', () => {
    const geo = makeGeo({ events: [makeSyncMessage({ label: 'one\ntwo\nthree' })] });
    const msg = geo.events[0] as MessageGeo;
    expect(msg.labelLines.map((l) => l.text)).toEqual(['one', 'two', 'three']);
    // Lines are left-aligned WITHIN the block, exactly as upstream draws them.
    expect(new Set(msg.labelLines.map((l) => l.x)).size).toBe(1);
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('>one</text>');
    expect(svg).toContain('>three</text>');
    expect(svg).not.toContain('one\ntwo');
  });

  it('lost message draws an inline head, never a marker reference', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ arrow: arrowOf('lost') })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // `lost` is a MessageExoType, which governs where the LINE terminates,
    // not what the head looks like -- `CommandExoArrowAny.java:90-91` builds
    // it from the same `withDirectionNormal()` as a plain `->`, so the head
    // is dressing2's NORMAL polygon at pos2 (`ComponentRoseArrow.java:101`:
    // pos2 = width - 2 = 140 - 2 = 138, absolute 80 + 138 = 218).
    expect(svg).toContain('<polygon points="208,76,218,80,208,84,212,80"');
    expect(svg).not.toContain('arrow-lost');
  });

  it('found message draws an inline head, never a marker reference', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ arrow: arrowOf('found') })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<polygon points="208,76,218,80,208,84,212,80"');
    expect(svg).not.toContain('arrow-found');
  });
});

// ---------------------------------------------------------------------------
// T16 (sequence-command-coverage batch 5): lifecolor, url, stereotype
// ---------------------------------------------------------------------------

describe('renderSequence — message lifecolor, url and stereotype', () => {
  it('++ #red wraps a fresh activation bar in the LIFECOLOR fill', () => {
    // `CommandArrow.java:427-439`: `s = arg.get("LIFECOLOR", 0)` resolves to
    // an `HColor` that only reaches `diagram.activate` on the `+` leg. The
    // bar itself is only ever emitted on close (no end-of-diagram sweep for
    // dangling activations in this port), so the fixture must close it.
    const ast = parseSequence(['Alice -> Bob ++ #red: go', 'Bob --> Alice --: done']);
    if ('refused' in ast) throw new Error(`parseSequence refused: ${'message' in ast ? ast.message : ''}`);
    const geo = layoutSequence(ast, defaultTheme, new FixedMeasurer(50, 14));
    const activation = geo.events.find((e): e is ActivationGeo => e.kind === 'activation');
    expect(activation?.color).toBe('#red');
    // `renderActivation` -> `rect()` -> `resolvePaint` -> `HColorSet`
    // resolves the NAMED token to its hex, then `shortenColor` collapses
    // `#FF0000` to `#F00` -- the SAME generic pipeline every other fill
    // goes through (`core/svg.ts:223-232`), reused here for free.
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('fill="#F00"');
  });

  it('-- never carries a LIFECOLOR onto the closing bar', () => {
    // `manageActivations`'s `-`/`!` legs always pass `null`
    // (`CommandArrow.java:445-450`) -- a deactivate is never colored, even
    // when the opening `++` supplied one.
    const ast = parseSequence(['Alice -> Bob ++ #red: go', 'Bob --> Alice --: done']);
    if ('refused' in ast) throw new Error(`parseSequence refused: ${'message' in ast ? ast.message : ''}`);
    const geo = layoutSequence(ast, defaultTheme, new FixedMeasurer(50, 14));
    const activations = geo.events.filter((e): e is ActivationGeo => e.kind === 'activation');
    expect(activations).toHaveLength(1);
    expect(activations[0]?.color).toBe('#red');
  });

  // `[[url]]` is parsed and carried onto `MessageGeo.url` (T12/T16) but
  // deliberately NOT drawn as an `<a>` wrap -- verified against the golden
  // jar, not inferred from `MessageArrow.java`'s `startUrl`/`endUrl` alone:
  // that class is DEAD CODE in the shipped jar (`SequenceDiagram.java`
  // imports only `teoz.SequenceDiagramFileMakerTeoz`, and no
  // `new MessageArrow(`/`new MessageSelfArrow(` call exists anywhere), and
  // `teoz/CommunicationTile.java` -- what actually draws a message -- never
  // reads `AbstractMessage#getUrl()`. Confirmed on `fajixi-56-dete708`
  // (`Alice -> Bob [[http://www.yahoo.com{...}]] : hello` renders `hello`
  // as plain `fill="#000"` text, no `<a>` anywhere) and the self-message
  // case `sefako-72-jono850`.
  it('carries [[url]] onto the geometry but draws no anchor', () => {
    const geo = makeGeo({ events: [makeSyncMessage({ url: 'http://example.com' })] });
    const msg = geo.events[0] as MessageGeo;
    expect(msg.url).toBe('http://example.com');
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).not.toContain('<a ');
    expect(svg).not.toContain('http://example.com');
  });

  // `<<stereotype>>` is, per the Java, ONLY a style-signature lookup key
  // (`AbstractMessage.java:60-65,74-77`) -- never drawn as text by any
  // component. Confirmed on `terapo-81-puzi168`: `<style>.a{Linecolor red}`
  // + `alice -> bob <<a>> : red` turns the ARROW LINE `stroke:#F00` in the
  // golden, but the label stays plain `fill="#000"` -- no guillemet run
  // anywhere. Wiring the stereotype to the arrow's line style is real work
  // (a `<style>`-bucket lookup touching `sequence-arrowhead.ts`/
  // `renderer-arrowhead.ts`) out of this task's write-set this batch (T15).
  it('carries <<stereotype>> onto the geometry but draws no guillemet text', () => {
    const geo = makeGeo({ events: [makeSyncMessage({ stereotype: '<<stereo>>' })] });
    const msg = geo.events[0] as MessageGeo;
    expect(msg.stereotype).toBe('<<stereo>>');
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).not.toContain('&lt;&lt;');
  });

  it('end-to-end: url and stereotype parse and lay out onto MessageGeo', () => {
    const ast = parseSequence(['Alice -> Bob <<stereo>> [[http://example.com]]: hi']);
    if ('refused' in ast) throw new Error(`parseSequence refused: ${'message' in ast ? ast.message : ''}`);
    const geo = layoutSequence(ast, defaultTheme, new FixedMeasurer(50, 14));
    const msg = geo.events.find((e): e is MessageGeo => e.kind === 'message');
    expect(msg?.url).toBe('http://example.com');
    expect(msg?.stereotype).toBe('<<stereo>>');
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).not.toContain('<a ');
    expect(svg).not.toContain('&lt;&lt;');
  });
});

// ---------------------------------------------------------------------------
// T3 (sequence-root-chrome): inline arrowheads + the document shell
// ---------------------------------------------------------------------------

/** Every arrow the spike's enumerated token table could produce, by its
 *  pre-T6 `MessageStyle` name. */
const ALL_MESSAGE_STYLES: readonly RenderStyle[] = [
  'sync', 'async', 'reply', 'replyAsync', 'lost', 'found',
];

describe('renderSequence -- inline arrowheads (T3 AC1)', () => {
  it.each(ALL_MESSAGE_STYLES)(
    'a %s message emits no <marker, markerEnd or markerStart token',
    (style) => {
      const geo = makeGeo({ events: [makeSyncMessage({ arrow: arrowOf(style) })] });
      const svg = assembleSvg(renderSequence(geo, defaultTheme));
      expect(svg).not.toContain('<marker');
      expect(svg).not.toContain('markerEnd');
      expect(svg).not.toContain('markerStart');
      expect(svg).not.toContain('marker-end');
      expect(svg).not.toContain('marker-start');
    },
  );

  it.each(ALL_MESSAGE_STYLES)(
    'a self %s message emits no marker reference either',
    (style) => {
      const geo = makeGeo({
        events: [makeSyncMessage({ arrow: arrowOf(style), arrowDirection: 'self', fromX: 80, toX: 110 })],
      });
      const svg = assembleSvg(renderSequence(geo, defaultTheme));
      expect(svg).not.toContain('<marker');
      expect(svg).not.toContain('markerEnd');
      expect(svg).not.toContain('marker-end');
    },
  );
});

describe('renderSequence -- head placement mirrors drawInternalU (T3 AC2)', () => {
  // The jar's own numbers, byte-for-byte, from
  // `test-results/dot-cache/sequence/mebidu-16-ruve297/in.svg`: Bob's lifeline
  // at 81.538, Alice's at 133.231, `Bob -> Alice` at y = 66.
  const BOB_X = 81.538;
  const ALICE_X = 133.231;
  const MESSAGE_Y = 66;

  function jarGeo(overrides?: Partial<MessageGeo>): SequenceGeometry {
    return makeGeo({
      events: [
        makeSyncMessage({ fromX: BOB_X, toX: ALICE_X, y: MESSAGE_Y, ...overrides }),
      ],
    });
  }

  it('puts a sync head tip at pos2 = width - 2, matching the jar exactly', () => {
    const svg = assembleSvg(renderSequence(jarGeo(), defaultTheme));
    expect(svg).toContain(
      '<polygon points="121.231,62,131.231,66,121.231,70,125.231,66"',
    );
  });

  it('trims the line by arrowDeltaX / 2, matching the jar exactly', () => {
    const svg = assembleSvg(renderSequence(jarGeo(), defaultTheme));
    // start = 0, len = width - 1 - arrowDeltaX / 2 (`ComponentRoseArrow
    // .java:96-97,126-127`) => 81.538 .. 127.231
    expect(svg).toContain('<line x1="81.538" y1="66" x2="127.231" y2="66"');
  });

  it('reverses the configuration for a right-to-left message', () => {
    // `CommunicationTile.java:145-146` reverses when point1 > point2, so the
    // head moves to pos1 = 1 and points left; the line starts at
    // start = arrowDeltaX / 2 (`ComponentRoseArrow.java:129-131`).
    const geo = makeGeo({
      events: [
        makeSyncMessage({ fromX: ALICE_X, toX: BOB_X, y: MESSAGE_Y, arrowDirection: 'left' }),
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain(
      '<polygon points="92.538,62,82.538,66,92.538,70,88.538,66"',
    );
    expect(svg).toContain('<line x1="86.538" y1="66" x2="132.231" y2="66"');
  });

  it('draws an async head as two open strokes, not a polygon', () => {
    const svg = assembleSvg(renderSequence(jarGeo({ arrow: arrowOf('async') }), defaultTheme));
    // `asyncLinesNormal` at pos2 = 131.231: two ULines to (-10, -+4).
    expect(svg).toContain('<line x1="131.231" y1="66" x2="121.231" y2="62"');
    expect(svg).toContain('<line x1="131.231" y1="66" x2="121.231" y2="70"');
    expect(svg).not.toContain('<polygon');
  });

  it('leaves an async line untrimmed -- only FULL+NORMAL trims', () => {
    const svg = assembleSvg(renderSequence(jarGeo({ arrow: arrowOf('async') }), defaultTheme));
    // len = width - 1 only (`ComponentRoseArrow.java:97`; `:126` needs NORMAL)
    expect(svg).toContain('<line x1="81.538" y1="66" x2="132.231" y2="66"');
  });

  it('paints the head with the theme arrow colour, filled and stroked', () => {
    const svg = assembleSvg(renderSequence(jarGeo(), defaultTheme));
    expect(svg).toContain(
      '<polygon points="121.231,62,131.231,66,121.231,70,125.231,66" ' +
        `fill="${shortenColor(defaultTheme.colors.arrow)}" ` +
        `stroke="${shortenColor(defaultTheme.colors.arrow)}" stroke-width="1"`,
    );
  });

  it('drops the nice-arrow notch under skinparam style strictuml', () => {
    // `Rose.java:340` passes `param.strictUmlStyle() == false` as niceArrow.
    const svg = assembleSvg(
      renderSequence(jarGeo(), { ...defaultTheme, strictUml: true }),
    );
    expect(svg).toContain('<polygon points="121.231,62,131.231,66,121.231,70"');
  });
});

describe('renderSequence -- self-message heads (T3 AC3)', () => {
  const SELF_Y = 80;
  const SELF_X = 80;
  // The loop's returning segment ends at fromX, so the head tip sits there
  // (`ComponentRoseSelfArrow.java:126` draws the bottom hline from x2 and
  // `:172` puts the polygon's tip at that same x2).
  const LOOP_BOTTOM_Y = SELF_Y + 20;

  function selfGeo(style: RenderStyle): SequenceGeometry {
    return makeGeo({
      events: [makeSyncMessage({ arrow: arrowOf(style), arrowDirection: 'self', fromX: SELF_X, toX: 110, y: SELF_Y })],
    });
  }

  it('emits the getPolygon() shape at the loop foot for a sync self message', () => {
    const svg = assembleSvg(renderSequence(selfGeo('sync'), defaultTheme));
    // direction = +1 (reverseDefine is unreachable from this parser), so
    // (10,-4) (0,0) (10,4) (6,0) about (80, 100).
    expect(svg).toContain('<polygon points="90,96,80,100,90,104,86,100"');
    expect(svg).not.toContain('arrow-sync');
  });

  it('still draws the loop path itself', () => {
    const svg = assembleSvg(renderSequence(selfGeo('sync'), defaultTheme));
    expect(svg).toContain(`<path d="M ${SELF_X} ${SELF_Y} H 120 V ${LOOP_BOTTOM_Y} H ${SELF_X}" fill="none"`);
  });

  it('draws a self async head as two open strokes', () => {
    const svg = assembleSvg(renderSequence(selfGeo('async'), defaultTheme));
    // `ComponentRoseSelfArrow.java:161-169` -- ULine(+arrowDeltaX, -+arrowDeltaY)
    expect(svg).toContain('<line x1="80" y1="100" x2="90" y2="96"');
    expect(svg).toContain('<line x1="80" y1="100" x2="90" y2="104"');
    expect(svg).not.toContain('<polygon points="90,96,80,100,90,104,86,100"');
  });

  it('dashes a self reply loop', () => {
    const svg = assembleSvg(renderSequence(selfGeo('reply'), defaultTheme));
    expect(svg).toContain(
      `<path d="M ${SELF_X} ${SELF_Y} H 120 V ${LOOP_BOTTOM_Y} H ${SELF_X}" fill="none" ` +
        `stroke="${shortenColor(defaultTheme.colors.arrow)}" stroke-width="1" ` +
        'stroke-dasharray="5,5"',
    );
  });
});

describe('renderSequence -- fragment shape (T3 AC4)', () => {
  it('tags the fragment SEQUENCE and leaves the body unwrapped', () => {
    const fragment = renderSequence(makeGeo({ events: [makeSyncMessage()] }), defaultTheme);
    expect(fragment.diagramType).toBe('SEQUENCE');
    // `assembleSvg` owns the ROOT content group; the fragment must not carry
    // one of its own. Asserted against `ROOT_GROUP_OPEN` itself rather than a
    // bare `<g` prefix -- since T1 the body legitimately STARTS with a group,
    // the participant lifeline's `<g><title>` wrapper
    // (`skin/rose/ComponentRoseLine.java:82`), and a `<g`-prefix check reads
    // that as a root wrap.
    expect(fragment.body.startsWith(ROOT_GROUP_OPEN)).toBe(false);
    expect(fragment.body.startsWith('<g><title>')).toBe(true);
    expect(fragment.bodyWrapped).toBeUndefined();
  });

  it('lets assembleSvg supply the content group and the background rect', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    expect(svg).toContain('data-diagram-type="SEQUENCE"');
  });
});

describe('renderSequence -- the document shell (T3 AC5)', () => {
  const SHELL_FIXTURE = [
    '@startuml',
    'Bob -> Alice : hello',
    '@enduml',
  ].join('\n');

  it('carries every shell root attribute and an empty defs block', () => {
    const svg = renderFixtureSequence(SHELL_FIXTURE, new DeterministicMeasurer());
    for (const attr of [
      'xmlns:xlink="http://www.w3.org/1999/xlink"',
      'version="1.1"',
      'data-diagram-type="SEQUENCE"',
      'zoomAndPan="magnify"',
      'preserveAspectRatio="none"',
      'contentStyleType="text/css"',
    ]) {
      expect(svg).toContain(attr);
    }
    expect(svg).toMatch(/ style="width:\d/);
    expect(svg).toMatch(/ width="\d+px"/);
    expect(svg).toMatch(/ height="\d+px"/);
    expect(svg).toMatch(/ viewBox="0 0 \d+ \d+"/);
    expect(svg).toContain('<defs/>');
  });

  it('renders that fixture with an inline head and no marker', () => {
    const svg = renderFixtureSequence(SHELL_FIXTURE, new DeterministicMeasurer());
    expect(svg).toContain('<polygon points=');
    expect(svg).not.toContain('<marker');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 3: Activation → rect near lifelineX - 5
// ---------------------------------------------------------------------------

describe('renderSequence — activations', () => {
  it('activation geo produces a rect element', () => {
    const activation: ActivationGeo = {
      kind: 'activation',
      participantId: 'Alice',
      lifelineX: 80,
      y: 50,
      height: 60,
    };
    const geo = makeGeo({ events: [activation] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // Should have rects for participants + activation
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBeGreaterThanOrEqual(3);
  });

  it('activation rect x is lifelineX - 5', () => {
    const activation: ActivationGeo = {
      kind: 'activation',
      participantId: 'Alice',
      lifelineX: 80,
      y: 50,
      height: 60,
    };
    const geo = makeGeo({ events: [activation] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // x="75" since 80 - 5 = 75
    expect(svg).toContain('x="75"');
  });

  it('activation uses custom color when provided', () => {
    const activation: ActivationGeo = {
      kind: 'activation',
      participantId: 'Alice',
      lifelineX: 80,
      y: 50,
      height: 60,
      color: '#F00',
    };
    const geo = makeGeo({ events: [activation] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('#F00');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 4: Note geo → rect + text
// ---------------------------------------------------------------------------

describe('renderSequence — notes', () => {
  it('note geo produces a rect and text', () => {
    const note: NoteGeo = {
      kind: 'note',
      x: 50,
      y: 80,
      width: 120,
      height: 40,
      text: 'remember this',
    };
    const geo = makeGeo({ events: [note] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<rect');
    expect(svg).toContain('remember this');
  });

  it('note uses noteBackground color', () => {
    const note: NoteGeo = {
      kind: 'note',
      x: 50,
      y: 80,
      width: 120,
      height: 40,
      text: 'test note',
    };
    const geo = makeGeo({ events: [note] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain(defaultTheme.colors.noteBackground);
  });

  it('multiline note emits multiple text elements', () => {
    const note: NoteGeo = {
      kind: 'note',
      x: 50,
      y: 80,
      width: 120,
      height: 60,
      text: 'line one\nline two',
    };
    const geo = makeGeo({ events: [note] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('line one');
    expect(svg).toContain('line two');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 5: Loop frame → rect + text with "loop"
// ---------------------------------------------------------------------------

describe('renderSequence — frames', () => {
  it('loop frame produces a rect containing "loop"', () => {
    const frame: FrameGeo = {
      kind: 'frame',
      frameType: 'loop',
      label: 'i < 5',
      x: 30,
      y: 60,
      width: 300,
      height: 100,
      branchSeparators: [],
      refBody: [],
    };
    const geo = makeGeo({ events: [frame] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<rect');
    expect(svg).toContain('loop');
  });

  it('frame uses dashed border', () => {
    const frame: FrameGeo = {
      kind: 'frame',
      frameType: 'alt',
      label: 'x > 0',
      x: 30,
      y: 60,
      width: 300,
      height: 100,
      branchSeparators: [],
      refBody: [],
    };
    const geo = makeGeo({ events: [frame] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('stroke-dasharray');
  });

  it('frame label includes frameType + label text', () => {
    const frame: FrameGeo = {
      kind: 'frame',
      frameType: 'opt',
      label: 'condition',
      x: 30,
      y: 60,
      width: 300,
      height: 100,
      branchSeparators: [],
      refBody: [],
    };
    const geo = makeGeo({ events: [frame] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('opt');
    expect(svg).toContain('condition');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 6: defaultTheme vs darkTheme fill values differ
// ---------------------------------------------------------------------------

describe('renderSequence — theme colors', () => {
  it('participant rect fill differs between defaultTheme and darkTheme', () => {
    const geo = makeGeo();
    const svgDefault = assembleSvg(renderSequence(geo, defaultTheme));
    const svgDark = assembleSvg(renderSequence(geo, darkTheme));
    expect(defaultTheme.colors.background).not.toBe(darkTheme.colors.background);
    expect(svgDefault).toContain(shortenColor(defaultTheme.colors.background));
    expect(svgDark).toContain(shortenColor(darkTheme.colors.background));
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 7: SVG starts with <svg and ends with </svg>
// ---------------------------------------------------------------------------

describe('renderSequence — SVG structure', () => {
  it('output starts with <svg and ends with </svg>', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    expect(svg.trimStart()).toMatch(/^<svg/);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });

  it('emits lifeline dashed lines for each participant', () => {
    const svg = assembleSvg(renderSequence(makeGeo(), defaultTheme));
    // Should have dashed lines (stroke-dasharray) from lifelines
    expect(svg).toContain('stroke-dasharray');
  });
});

// ---------------------------------------------------------------------------
// Divider rendering
// ---------------------------------------------------------------------------

describe('renderSequence — dividers', () => {
  it('divider emits a line and centered text', () => {
    const divider: DividerGeo = {
      kind: 'divider',
      text: 'init phase',
      y: 100,
      totalWidth: 400,
    };
    const geo = makeGeo({ events: [divider] });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<line');
    expect(svg).toContain('init phase');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 10: sequencePlugin.parse returns AST with 2 participants
// ---------------------------------------------------------------------------

describe('sequencePlugin.parse', () => {
  it('returns AST with 2 participants for Alice -> Bob', () => {
    const ast = parseAst(sequencePlugin, {
      lines: ['Alice -> Bob: hi'],
      type: 'sequence',
    });
    expect(ast.participants).toHaveLength(2);
    expect(ast.participants[0]?.id).toBe('Alice');
    expect(ast.participants[1]?.id).toBe('Bob');
  });

  it('returns AST with one message event', () => {
    const ast = parseAst(sequencePlugin, {
      lines: ['Alice -> Bob: greet'],
      type: 'sequence',
    });
    expect(ast.events).toHaveLength(1);
    expect(ast.events[0]?.kind).toBe('message');
  });
});

// ---------------------------------------------------------------------------
// Acceptance criterion 11: sequencePlugin layout returns SequenceGeometry
// ---------------------------------------------------------------------------

describe('sequencePlugin layout', () => {
  // Narrow sequencePlugin to SyncPlugin once for this describe block.
  // sequencePlugin implements layoutSync (the sync branch of the union).
  if (!('layoutSync' in sequencePlugin)) {
    throw new Error('sequencePlugin must be a SyncPlugin');
  }
  const syncPlugin = sequencePlugin;

  it('layoutSync returns SequenceGeometry with totalWidth > 0', () => {
    const measurer = new FormulaMeasurer();
    const ast = parseAst(syncPlugin, {
      lines: ['Alice -> Bob: hi'],
      type: 'sequence',
    });
    const geo = syncPlugin.layoutSync(ast, defaultTheme, measurer);
    expect(geo.totalWidth).toBeGreaterThan(0);
  });

  it('layoutSync returns SequenceGeometry with correct participant count', () => {
    const measurer = new FixedMeasurer(8, 16);
    const ast = parseAst(syncPlugin, {
      lines: ['Alice -> Bob: test'],
      type: 'sequence',
    });
    const geo = syncPlugin.layoutSync(ast, defaultTheme, measurer);
    expect(geo.participants).toHaveLength(2);
  });

  it('layout async resolves to same result as layoutSync', async () => {
    // layoutSequence is what both layout() and layoutSync() delegate to.
    // Verify they produce identical geometry by calling layoutSequence directly.
    const measurer = new FormulaMeasurer();
    const ast = parseAst(syncPlugin, {
      lines: ['Alice -> Bob: hello'],
      type: 'sequence',
    });
    const sync = syncPlugin.layoutSync(ast, defaultTheme, measurer);
    const async_ = await Promise.resolve(
      layoutSequence(ast, defaultTheme, measurer),
    );
    expect(sync).toEqual(async_);
  });
});

// ---------------------------------------------------------------------------
// Plugin type and render integration
// ---------------------------------------------------------------------------

describe('sequencePlugin integration', () => {
  if (!('layoutSync' in sequencePlugin)) {
    throw new Error('sequencePlugin must be a SyncPlugin');
  }
  const syncPlugin = sequencePlugin;

  it('plugin type is "sequence"', () => {
    expect(syncPlugin.type).toBe('sequence');
  });

  it('render delegates to renderSequence and returns valid SVG', () => {
    const measurer = new FormulaMeasurer();
    const ast = parseAst(syncPlugin, {
      lines: ['Alice -> Bob: hello'],
      type: 'sequence',
    });
    const geo = syncPlugin.layoutSync(ast, defaultTheme, measurer);
    const svg = assembleSvg(syncPlugin.render(geo, defaultTheme));
    expect(svg.trimStart()).toMatch(/^<svg/);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });
});

// ---------------------------------------------------------------------------
// Actor and database participant shapes
// ---------------------------------------------------------------------------

describe('renderSequence — actor participant shape', () => {
  it('renders an ellipse head and a single four-segment path for actor participants', () => {
    const geo = makeGeo({
      participants: [
        { id: 'U', display: 'User', type: 'actor', x: 30, y: 0, width: 80, height: 70, centerX: 70, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // The jar draws an actor head as an `<ellipse>` and its four strokes as
    // ONE `<path>` (`ActorStickMan.java:73,77-85`), not a `<circle>` and four
    // `<line>`s. Asserted on the element AND the path shape, since it is the
    // primitive COUNT that this pins -- five top-level children where the jar
    // has two is what made 14 corpus fixtures over-emit.
    expect(svg).toContain('<ellipse');
    expect(svg).not.toContain('<circle');
    const d = /<path d="([^"]*)"/.exec(svg)?.[1] ?? '';
    expect(d.match(/M/g) ?? [], 'body, arms, left leg, right leg').toHaveLength(4);
  });

  it('renders display name below the stick figure', () => {
    const geo = makeGeo({
      participants: [
        { id: 'U', display: 'User', type: 'actor', x: 30, y: 0, width: 80, height: 70, centerX: 70, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('User');
  });
});

describe('renderSequence — database participant shape', () => {
  it('renders an ellipse (cylinder cap) for database participants', () => {
    const geo = makeGeo({
      participants: [
        { id: 'DB', display: 'PostgreSQL', type: 'database', x: 30, y: 0, width: 100, height: 50, centerX: 80, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<ellipse');
  });

  it('renders display name for database participant', () => {
    const geo = makeGeo({
      participants: [
        { id: 'DB', display: 'PostgreSQL', type: 'database', x: 30, y: 0, width: 100, height: 50, centerX: 80, background: defaultTheme.colors.background, border: defaultTheme.colors.border },
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('PostgreSQL');
  });
});

// ---------------------------------------------------------------------------
// Box background rendering — renderBoxBackground coverage
// ---------------------------------------------------------------------------

describe('renderSequence — box backgrounds', () => {
  it('box with color renders a rect with that fill color', () => {
    const geo = makeGeo({
      boxes: [{ x: 10, y: 0, width: 200, height: 300, label: '', color: '#LightBlue' }],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // G1c: named colors resolve to their canonical jar hex (LightBlue -> #ADD8E6).
    expect(svg).toContain('#ADD8E6');
    expect(svg).toContain('<rect');
  });

  it('box with empty color falls back to #EEE', () => {
    const geo = makeGeo({
      boxes: [{ x: 10, y: 0, width: 200, height: 300, label: '', color: '' }],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('#EEE');
  });

  it('box with label renders a text element', () => {
    const geo = makeGeo({
      boxes: [{ x: 10, y: 0, width: 200, height: 300, label: 'Services', color: '#pink' }],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('Services');
    expect(svg).toContain('<text');
  });

  it('box with empty label renders no text element beyond participant labels', () => {
    // A box with no label should produce only a rect, no extra text
    const geo = makeGeo({
      participants: [],
      boxes: [{ x: 10, y: 0, width: 200, height: 300, label: '', color: '#yellow' }],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).not.toContain('<text');
  });

  it('box background rect appears before participant header rects (z-order)', () => {
    const geo = makeGeo({
      boxes: [{ x: 22, y: 0, width: 216, height: 300, label: '', color: '#LightBlue' }],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // After the defs block, box background must precede participant rects.
    // Anchored on `<defs/>`, not `</defs>`: the SEQUENCE fragment now routes
    // through `assembleDocumentShell`, whose empty defs block is
    // self-closing (T3 AC5), so the closing-tag form no longer occurs.
    const bodyStart = svg.indexOf('<defs/>');
    expect(bodyStart).toBeGreaterThanOrEqual(0);
    const body = svg.slice(bodyStart);
    // G1c: named colors resolve to their canonical jar hex (LightBlue -> #ADD8E6).
    const boxIdx = body.indexOf('#ADD8E6');
    expect(boxIdx).toBeGreaterThanOrEqual(0);
    // The box rect leads the content group; every participant header rect
    // follows it, so the box colour belongs to the FIRST rect.
    const firstRectPos = body.indexOf('<rect');
    const secondRectPos = body.indexOf('<rect', firstRectPos + 1);
    expect(firstRectPos).toBeLessThan(secondRectPos);
    expect(boxIdx).toBeGreaterThan(firstRectPos);
    expect(boxIdx).toBeLessThan(secondRectPos);
  });
});

// ---------------------------------------------------------------------------
// Box integration — parse + layout + render
// ---------------------------------------------------------------------------

describe('renderSequence — box integration', () => {
  it('box with label and color renders correctly end-to-end', () => {
    const ast = parseSequence([
      'box "Frontend" #LightBlue',
      'participant Alice',
      'end box',
      'Alice -> Alice: self',
    ]);
    // T4: `parseSequence` now returns `SequenceDiagramAST | ParseRefusal`
    // (D1); this fixture is a complete, valid diagram, so refusal is a
    // test defect.
    if ('refused' in ast) throw new Error(`parseSequence refused (${ast.kind}): ${ast.message}`);
    expect(ast.boxes).toHaveLength(1);
    expect(ast.boxes[0]?.label).toBe('Frontend');
    expect(ast.boxes[0]?.color).toBe('#LightBlue');
    const geo = layoutSequence(ast, defaultTheme, new FixedMeasurer(50, 14));
    expect(geo.boxes).toHaveLength(1);
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    // G1c: named colors resolve to their canonical jar hex (LightBlue -> #ADD8E6).
    expect(svg).toContain('#ADD8E6');
    expect(svg).toContain('Frontend');
  });
});

// ---------------------------------------------------------------------------
// Participant stereotype: PName.ShowStereotype
// ---------------------------------------------------------------------------

describe('renderSequence — participant stereotype', () => {
  const render = (src: string): string =>
    renderFixtureSequence(src, new DeterministicMeasurer());

  // `CommandParticipant` stores the stereotype on the Participant rather than
  // in its code (`:174-181`), and the jar draws it on its own line -- the
  // golden for `birocu-87-xubi808` carries `«APIGateway»` and `OnlyLabel` as
  // separate elements.
  it('draws the stereotype as its own guillemeted run', () => {
    const svg = render('@startuml\nparticipant Bob <<dummy1>>\nBob -> Alice: hi\n@enduml');
    expect(svg).toContain('>«dummy1»</text>');
    expect(svg).toContain('>Bob</text>');
  });

  // `Display#withoutStereotypeIfNeeded` strips it ONLY on an explicit false
  // (`Display.java:131-133`).
  it('hides it when a style tag sets ShowStereotype false', () => {
    const svg = render(
      '@startuml\n<style>\n.dummy1 {\n  ShowStereotype false\n}\n</style>\n' +
        'participant Bob <<dummy1>>\nBob -> Alice: hi\n@enduml',
    );
    expect(svg).not.toContain('«dummy1»');
    expect(svg).toContain('>Bob</text>');
  });

  it('still draws it when the style says true, or says nothing about it', () => {
    const shown = render(
      '@startuml\n<style>\n.dummy1 {\n  ShowStereotype true\n}\n</style>\n' +
        'participant Bob <<dummy1>>\nBob -> Alice: hi\n@enduml',
    );
    expect(shown).toContain('«dummy1»');
    const silent = render(
      '@startuml\n<style>\n.dummy1 {\n  FontColor red\n}\n</style>\n' +
        'participant Bob <<dummy1>>\nBob -> Alice: hi\n@enduml',
    );
    expect(silent).toContain('«dummy1»');
  });

  // `StereotypeDecoration#buildComplex` rewrites each chunk to its LABEL
  // group alone, dropping the `($sprite[,COLOR])` / `(CHAR[,COLOR])` badge
  // spec that introduced it (`:143-182`). birocu-87-xubi808's golden shows
  // `«APIGateway»` for `<< ($APIGateway, #CC2264) APIGateway >>`.
  it('drops a sprite badge spec from the displayed label', () => {
    const svg = render(
      '@startuml\nparticipant P as p << ($APIGateway, #CC2264) APIGateway >>\np -> B: hi\n@enduml',
    );
    expect(svg).toContain('>«APIGateway»</text>');
    expect(svg).not.toContain('CC2264');
  });

  // The COLOR group is `(#[0-9a-fA-F]{6}|\w+)` (`StereotypeDecoration.java:68`)
  // -- a bare name or a SIX-digit hex. `#red` is neither, so upstream does not
  // recognise it as a badge at all and the whole run stays visible text.
  it('drops a circled-character badge spec too', () => {
    const named = render('@startuml\nparticipant P << (C,red) Thing >>\nP -> B: hi\n@enduml');
    expect(named).toContain('>«Thing»</text>');
    const hex = render('@startuml\nparticipant P << (C,#CC2264) Thing >>\nP -> B: hi\n@enduml');
    expect(hex).toContain('>«Thing»</text>');
    const notAColor = render('@startuml\nparticipant P << (C,#red) Thing >>\nP -> B: hi\n@enduml');
    expect(notAColor).toContain('>«(C,#red) Thing»</text>');
  });

  // One row per chunk, and a 3-bracket chunk is invisible -- both come from
  // `cutLabels` + the 2-vs-3 bracket test in `splitStereotypeTokens`.
  it('draws one row per stacked chunk, skipping invisible ones', () => {
    const svg = render('@startuml\nparticipant P <<A>><<B>>\nP -> Q: hi\n@enduml');
    expect(svg).toContain('>«A»</text>');
    expect(svg).toContain('>«B»</text>');
    const hidden = render('@startuml\nparticipant P <<<Zz>>>\nP -> Q: hi\n@enduml');
    expect(hidden).not.toContain('«Zz»');
  });

  // `Display#createStereotype` wraps the label block in a `TextBlockSprited`
  // carrying `stereotype.getSprite(...)` (`Display.java:671-689`), and
  // `TextBlockSprited#drawU` draws it at the block origin with the label
  // translated right by `sprite.width + 6` (`:65-77`).
  it('draws a declared sprite badge as an <image> beside the name', () => {
    const svg = render(
      '@startuml\nsprite $s1 [4x4/16] {\n0123\n4567\n89AB\nCDEF\n}\n' +
        'participant P << ($s1) Lbl >>\nP -> Q: hi\n@enduml',
    );
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/png;base64,');
    expect(svg).toContain('>«Lbl»</text>');
  });

  // The gradient runs backColor -> fontColor (`spriteToRgba`), mirroring
  // `toUImage`'s `gradient(backcolor, color)` (`SpriteMonochrome.java:191`).
  // `Stereotype#getSprite` -> `asTextBlock(getHtmlColor(), null, ...)` (`:116`)
  // and `drawU`'s `forcedColor ?? fontColor` (`:215`) make the DECLARED colour
  // the END; the START is the current graphics background.
  //
  // The corpus cannot gate this: the data URI is one attribute that differs
  // from the jar either way, so weightedScore is identical whichever
  // direction the gradient runs. Asserted on the decoded pixels instead.
  it('tints the sprite from the background TOWARD the declared colour', () => {
    const sprite = 'sprite $s1 [2x2/16] {\n0F\nF0\n}';
    const svg = render(`@startuml\n${sprite}\nparticipant P << ($s1,#CC2264) L >>\nP -> Q: hi\n@enduml`);
    const b64 = /xlink:href="data:image\/png;base64,([^"]*)"/.exec(svg)?.[1] ?? '';
    expect(b64).not.toBe('');
    const px = decodeRgba(Buffer.from(b64, 'base64'));
    // gray 0 -> coef 0 -> the gradient's START, i.e. the box background.
    // gray F -> coef 1 -> its END, the declared #CC2264.
    const rgbs = px.map(([r, g, b]) => `${r},${g},${b}`);
    expect(rgbs).toContain('204,34,100');
    expect(rgbs).not.toContain('24,24,24');
  });

  it('draws nothing extra when the sprite name does not resolve', () => {
    const svg = render('@startuml\nparticipant P << ($missing) Lbl >>\nP -> Q: hi\n@enduml');
    expect(svg).not.toContain('<image');
    expect(svg).toContain('>«Lbl»</text>');
  });

  // The other arm of that same `if`: a circled CHARACTER. The jar draws the
  // filled circle and NOT the letter -- no `<text>` in nimoxu-60-xale291,
  // fakova-98-suze610 or xakuro-97-tado489 carries the declared char.
  it('draws a circled-character badge as a filled circle, without the character', () => {
    const svg = render('@startuml\nparticipant P << (U,#ADD1B2) Lbl >>\nP -> Q: hi\n@enduml');
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('#ADD1B2');
    expect(svg).toContain('>«Lbl»</text>');
    expect(svg).not.toContain('>U</text>');
  });

  it('hide stereotype removes it regardless of any style', () => {
    const svg = render('@startuml\nhide stereotype\nparticipant Bob <<dummy1>>\nBob -> Alice: hi\n@enduml');
    expect(svg).not.toContain('«dummy1»');
  });
});

// ---------------------------------------------------------------------------
// Per-element <style> buckets and inline participant colours
// ---------------------------------------------------------------------------

describe('renderSequence — participant colours', () => {
  const render = (src: string): string =>
    renderFixtureSequence(src, new DeterministicMeasurer());

  // `Participant#getUsedStyles` merges the kind's signature -- `root,
  // element, sequenceDiagram, <kind>` (`ParticipantType.java:55-80`) -- and
  // then lets the participant's own colours override it
  // (`eventuallyOverride(getColors())`, `Participant.java:88`).
  it('honours an inline participant colour', () => {
    expect(render('@startuml\nparticipant A #pink\nA -> B: x\n@enduml')).toContain('#FFC0CB');
  });

  it('honours a <style> bucket for background and border', () => {
    const svg = render(
      '@startuml\n<style>\nparticipant {\n BackgroundColor #FFFF00\n LineColor #FF9900\n}\n</style>\n' +
        'participant A\nA -> B: x\n@enduml',
    );
    expect(svg).toContain('fill="#FF0"');
    expect(svg).toContain('stroke="#F90"');
  });

  it('keys the bucket by participant KIND', () => {
    const svg = render(
      '@startuml\n<style>\nactor {\n BackgroundColor #00FF00\n}\n</style>\n' +
        'actor A\nparticipant B\nA -> B: x\n@enduml',
    );
    expect(svg).toContain('#0F0');
    // B is a plain participant and keeps the theme default.
    expect(svg).toContain('fill="#FFF"');
  });

  it('lets the inline colour win over the bucket', () => {
    const svg = render(
      '@startuml\n<style>\nparticipant {\n BackgroundColor #FFFF00\n}\n</style>\n' +
        'participant A #pink\nA -> B: x\n@enduml',
    );
    expect(svg).toContain('#FFC0CB');
  });
});

// ---------------------------------------------------------------------------
// Exogenous arrows — the render path (T17, sequence-command-coverage)
// ---------------------------------------------------------------------------

/** The horizontal `<line>`s that are message bodies: `y1 === y2` (a lifeline
 *  is vertical, `x1 === x2`). Returned as `[x1, x2]` in document order. */
function messageBodies(svg: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const tag of svg.match(/<line[^>]*>/g) ?? []) {
    const n = (a: string): number =>
      Number(new RegExp(`${a}="([-\\d.]+)"`).exec(tag)?.[1]);
    if (n('y1') === n('y2') && n('x1') !== n('x2')) out.push([n('x1'), n('x2')]);
  }
  return out;
}

/** Every arrow-head polygon's TIP — the second point, which upstream always
 *  emits as `(0, 0)` in tip-local coordinates
 *  (`ComponentRoseArrow.java#getPolygonNormal/getPolygonReverse`). */
function headTips(svg: string): number[] {
  return (svg.match(/<polygon[^>]*points="([^"]+)"/g) ?? []).map((tag) => {
    const pts = /points="([^"]+)"/.exec(tag)?.[1] ?? '';
    return Number(pts.split(',')[2]);
  });
}

/** The dashed lifeline x of every participant, in document order. */
function lifelines(svg: string): number[] {
  return (svg.match(/<line[^>]*stroke-dasharray[^>]*>/g) ?? []).map((tag) =>
    Number(/x1="([-\d.]+)"/.exec(tag)?.[1]),
  );
}

function docWidth(svg: string): number {
  return Number(/viewBox="0 0 ([\d.]+) /.exec(svg)?.[1]);
}

describe('renderSequence — exogenous arrows', () => {
  const render = (src: string): string =>
    renderFixtureSequence(src, new DeterministicMeasurer());

  // `CommunicationExoTile#getPoint1Value` returns `tileArguments.getBorder1()`
  // for a non-short left-border message (`:213-217`), and the component then
  // puts its head at `pos2 = width - 2` (`ComponentRoseArrow.java:99-101`),
  // i.e. two pixels short of the participant's lifeline. Verified against the
  // jar on `[-> Bob : hello`: body `x1="10" x2="55.544"`, polygon tip
  // `59.544`, lifeline `61.544` -- the same two relations this asserts.
  it('anchors a FROM_LEFT body at the left edge and ends it on the lifeline', () => {
    const svg = render('@startuml\nparticipant Bob\n[-> Bob : hello\n@enduml');
    const [body] = messageBodies(svg);
    expect(body?.[0]).toBe(0);
    expect(headTips(svg)).toEqual([lifelines(svg)[0]! - 2]);
  });

  // The mirror: `getPoint2Value` reads `getBorder2()` (`:219-226`), which
  // `PlayingSpace` maxes over every tile AND every participant's own box
  // (`PlayingSpace.java:75-96,322-324`). With a second participant to the
  // right, that box wins, so the arrow stops two pixels short of ITS right
  // edge rather than of the document's.
  it('anchors a TO_RIGHT head two pixels short of the right content edge', () => {
    const svg = render('@startuml\nparticipant Bob\nparticipant Carol\nBob ->] : hello\n@enduml');
    const rights = (svg.match(/<rect[^>]*>/g) ?? []).map(
      (t) => Number(/x="([-\d.]+)"/.exec(t)?.[1]) + Number(/width="([-\d.]+)"/.exec(t)?.[1]),
    );
    expect(headTips(svg)).toEqual([Math.max(...rights) - 2]);
  });

  // `CommunicationExoTile#getMaxX` is `getPoint2()` = `posC + preferredWidth`
  // (`:207-212,230-232`), so a right-border exo whose stretch exceeds every
  // box widens the document.
  it('widens the document when a TO_RIGHT exo out-reaches every participant', () => {
    const without = render('@startuml\nparticipant Bob\nparticipant Carol\nBob -> Carol : hello\n@enduml');
    const withExo = render(
      '@startuml\nparticipant Bob\nparticipant Carol\nBob -> Carol : hello\nCarol ->] : bye\n@enduml',
    );
    expect(docWidth(without)).toBe(240);
    expect(docWidth(withExo)).toBe(246);
  });

  // `drawU` insets the BORDER end by `diamCircle / 2 + 2` when the matching
  // decoration is a circle (`CommunicationExoTile.java:137-147`), and each
  // `drawDressing` draws its own (`ComponentRoseArrow.java:199-205,235-242`).
  // Jar on `[o->o Bob : hello`: circles at `cx="15.5"` and `cx="61.044"`
  // against a body of `x1="20" x2="50.044"` and a lifeline of `61.544` --
  // one 4.5 left of the body start, one half a pixel left of the lifeline.
  it('draws both circles when an exo is decorated on both sides', () => {
    const svg = render('@startuml\nparticipant Bob\n[o->o Bob : hello\n@enduml');
    const centres = (svg.match(/<ellipse[^>]*>/g) ?? []).map((t) =>
      Number(/cx="([-\d.]+)"/.exec(t)?.[1]),
    );
    const [body] = messageBodies(svg);
    expect(centres).toEqual([body![0] - 4.5, lifelines(svg)[0]! - 0.5]);
  });

  // Upstream fills the `o` with the ARROW STYLE's `BackGroundColor`, which
  // `plantuml.skin:306-310` pins to `black` -- NOT the document background.
  // All 51 sequence corpus goldens carrying an `rx="4"` decoration circle
  // emit `fill="#000"`, including three whose page background is red or grey.
  it('fills the o decoration black, not with the document background', () => {
    const svg = render('@startuml\nskinparam backgroundColor #FF0000\n[o-> Bob : hello\n@enduml');
    expect(svg).toContain('<ellipse cx="5.5" cy="53.25" rx="4" ry="4" fill="#000"');
    expect(svg).not.toContain('rx="4" ry="4" fill="#F00"');
  });

  // A CROSSX end draws the saltire and no polygon at all
  // (`ComponentRoseArrow.java:216-222,253-259`); the exo path reaches it
  // through the same component, so `[x-> Bob` must emit four stroked lines
  // beyond the body and the lifeline, and zero heads.
  it('draws a CROSSX exo end as a saltire and no polygon', () => {
    const svg = render('@startuml\nparticipant Bob\n[x-> Bob : hello\n@enduml');
    expect(headTips(svg)).toHaveLength(1); // the participant-side head only
    const saltire = svg.match(/<line[^>]*stroke-width="2"[^>]*>/g) ?? [];
    expect(saltire).toHaveLength(2);
    // Two crossing diagonals, `spaceCrossX` right of the border end.
    expect(messageBodies(svg)[0]).toEqual([12, 64]);
    expect(saltire.map((t) => Number(/x1="([-\d.]+)"/.exec(t)?.[1]))).toEqual([7, 7]);
  });

  // `getComponent` reverses the configuration when `getDirection() == -1`
  // (`:96-104`), so a TO_LEFT exo's head lands on the BORDER end. Jar on
  // `[<- Bob : hello`: polygon tip `11`, body `x1="15" x2="60.544"` -- the
  // head is to the LEFT of the body, at `pos1 = 1` off the border.
  it('puts a TO_LEFT head on the border end, left of the body', () => {
    const svg = render('@startuml\nparticipant Bob\n[<- Bob : hello\n@enduml');
    const [body] = messageBodies(svg);
    expect(headTips(svg)).toEqual([1]);
    expect(body).toEqual([5, 69]);
  });

  // `isFromLeftBorderMessage()` is "this border AND not a short arrow"
  // (`:249-255`), so `?-> Bob` keeps `getPoint1()` = `posC - preferredWidth`
  // instead of stretching to the border.
  it('starts a short FROM_LEFT arrow at its own width, not at the border', () => {
    const long = render('@startuml\nparticipant Bob\n[-> Bob : hello\n@enduml');
    const short = render('@startuml\nparticipant Bob\n?-> Bob : hello\n@enduml');
    expect(messageBodies(long)[0]).toEqual([0, 64]);
    expect(messageBodies(short)[0]).toEqual([16.337, 64]);
  });
});
