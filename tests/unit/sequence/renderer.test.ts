import { shortenColor } from '../../../src/core/svg-format.js';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGeo(overrides?: Partial<SequenceGeometry>): SequenceGeometry {
  return {
    totalWidth: 400,
    totalHeight: 300,
    showFootbox: true,
    participants: [
      { id: 'Alice', display: 'Alice', type: 'participant', x: 30, y: 0, width: 100, height: 36, centerX: 80 },
      { id: 'Bob', display: 'Bob', type: 'participant', x: 170, y: 0, width: 100, height: 36, centerX: 220 },
    ],
    events: [],
    lifelineEndY: 260,
    footerShapeY: 260,
    boxes: [],
    ...overrides,
  };
}

function makeSyncMessage(overrides?: Partial<MessageGeo>): MessageGeo {
  const base = {
    kind: 'message' as const,
    fromX: 80,
    toX: 220,
    y: 80,
    label: 'hello',
    style: 'sync' as const,
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
      events: [makeSyncMessage({ style: 'reply', arrowDirection: 'left', fromX: 220, toX: 80 })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('stroke-dasharray');
  });

  it('replyAsync message uses dashed line style', () => {
    const geo = makeGeo({
      events: [makeSyncMessage({ style: 'replyAsync', arrowDirection: 'left', fromX: 220, toX: 80 })],
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
      events: [makeSyncMessage({ style: 'lost' })],
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
      events: [makeSyncMessage({ style: 'found' })],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<polygon points="208,76,218,80,208,84,212,80"');
    expect(svg).not.toContain('arrow-found');
  });
});

// ---------------------------------------------------------------------------
// T3 (sequence-root-chrome): inline arrowheads + the document shell
// ---------------------------------------------------------------------------

/** Every `MessageStyle` the spike's grammar can produce
 *  (`sequence-parse-helpers.ts#ARROW_STYLE_MAP`). */
const ALL_MESSAGE_STYLES: readonly MessageGeo['style'][] = [
  'sync', 'async', 'reply', 'replyAsync', 'lost', 'found',
];

describe('renderSequence -- inline arrowheads (T3 AC1)', () => {
  it.each(ALL_MESSAGE_STYLES)(
    'a %s message emits no <marker, markerEnd or markerStart token',
    (style) => {
      const geo = makeGeo({ events: [makeSyncMessage({ style })] });
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
        events: [makeSyncMessage({ style, arrowDirection: 'self', fromX: 80, toX: 110 })],
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
    const svg = assembleSvg(renderSequence(jarGeo({ style: 'async' }), defaultTheme));
    // `asyncLinesNormal` at pos2 = 131.231: two ULines to (-10, -+4).
    expect(svg).toContain('<line x1="131.231" y1="66" x2="121.231" y2="62"');
    expect(svg).toContain('<line x1="131.231" y1="66" x2="121.231" y2="70"');
    expect(svg).not.toContain('<polygon');
  });

  it('leaves an async line untrimmed -- only FULL+NORMAL trims', () => {
    const svg = assembleSvg(renderSequence(jarGeo({ style: 'async' }), defaultTheme));
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

  function selfGeo(style: MessageGeo['style']): SequenceGeometry {
    return makeGeo({
      events: [makeSyncMessage({ style, arrowDirection: 'self', fromX: SELF_X, toX: 110, y: SELF_Y })],
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
    expect(fragment.body.startsWith('<g')).toBe(false);
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
        { id: 'U', display: 'User', type: 'actor', x: 30, y: 0, width: 80, height: 70, centerX: 70 },
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
        { id: 'U', display: 'User', type: 'actor', x: 30, y: 0, width: 80, height: 70, centerX: 70 },
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
        { id: 'DB', display: 'PostgreSQL', type: 'database', x: 30, y: 0, width: 100, height: 50, centerX: 80 },
      ],
    });
    const svg = assembleSvg(renderSequence(geo, defaultTheme));
    expect(svg).toContain('<ellipse');
  });

  it('renders display name for database participant', () => {
    const geo = makeGeo({
      participants: [
        { id: 'DB', display: 'PostgreSQL', type: 'database', x: 30, y: 0, width: 100, height: 50, centerX: 80 },
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
