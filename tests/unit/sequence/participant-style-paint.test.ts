/**
 * sdd1 T2a — participant heads/tails and the actor-family glyphs paint from
 * the participant's merged `Style` (`Participant#getUsedStyles`,
 * `Participant.java:86-96`; `Rose#createComponentParticipant`,
 * `Rose.java:127-191`), not from `theme.colors`/`theme.sequence`.
 *
 * Default-skin expectations cite `~/git/plantuml/src/main/resources/skin/
 * plantuml.skin:N`; skinparam expectations cite the `FromSkinparamToStyle`
 * row that converts the key. Rendered through the ratchet path
 * (`renderFixtureSequence`, `DeterministicMeasurer`).
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { paintOfGeo, participantPaintsOf } from '../../../src/diagrams/sequence/sequence-participant-paints.js';
import { participantBoxOf } from '../../../src/diagrams/sequence/sequence-layout-participants.js';
import { participantLabelCy } from '../../../src/diagrams/sequence/sequence-layout-participant-sizing.js';
import type { ParticipantGeo } from '../../../src/diagrams/sequence/ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';

/** `plantuml.skin:4,198`: `--grey-blue: #e2e2f0`, every head's back colour. */
const GREY_BLUE = '#E2E2F0';
/** `plantuml.skin:16`: `root { LineColor #181818 }`. */
const ROOT_LINE = '#181818';

function render(body: string): string {
  return renderFixtureSequence(`@startuml\n${body}\n@enduml\n`, new DeterministicMeasurer(), {});
}

/** Every top-level participant `<rect>` (the lifeline hit rects carry `fill-opacity`). */
function boxes(svg: string): string[] {
  return (svg.match(/<rect [^>]*>/g) ?? []).filter((r) => !r.includes('fill-opacity'));
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function texts(svg: string): string[] {
  return svg.match(/<text [^>]*>[^<]*/g) ?? [];
}

describe('default skin — the participant rectangle (ComponentRoseParticipant.java:101-111)', () => {
  const [head, tail] = boxes(render('participant Bob'));

  it('fills grey-blue and strokes the root line colour at the element thickness', () => {
    // plantuml.skin:4,198 fill; :16 LineColor; :91-93 `element { LineThickness 0.5 }`.
    expect(head).toContain(`fill="${GREY_BLUE}"`);
    expect(head).toContain(`style="stroke:${ROOT_LINE};stroke-width:0.5;"`);
  });

  it('rounds by RoundCorner 5, emitted halved as rx/ry', () => {
    // plantuml.skin:193-195; DriverRectangleSvg.java:79 passes rx / 2,
    // SvgGraphics.java:582-585 writes both when positive.
    expect(attr(head!, 'rx')).toBe('2.5');
    expect(attr(head!, 'ry')).toBe('2.5');
    expect(tail).toBe(head!.replace('y="10"', `y="${attr(tail!, 'y')}"`));
  });

  it('draws in the jar attribute order: geometry, fill, style, corners', () => {
    expect(head).toMatch(/^<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" fill="[^"]+" style="[^"]+" rx/);
  });
});

describe('default skin — the other kinds', () => {
  it('leaves collections square: RoundCorner 5 is the participant bucket only', () => {
    // plantuml.skin:193-195 vs root `RoundCorner 0`, :13.
    const rects = boxes(render('collections Bob'));
    expect(rects).toHaveLength(4);
    for (const r of rects) {
      expect(r).not.toContain('rx=');
      expect(r).toContain('stroke-width:0.5;');
    }
  });

  it('strokes the actor stick man at 0.5 from the actor bucket', () => {
    // ParticipantType.java:56-57 `actor`; plantuml.skin:91-93.
    const svg = render('actor Bob');
    expect(svg).toMatch(/<ellipse [^>]*fill="#E2E2F0" style="stroke:#181818;stroke-width:0.5;"/);
    expect(svg).toMatch(/<path [^>]*style="stroke:#181818;stroke-width:0.5;" fill="none"/);
  });

  it('strokes every glyph kind at the element thickness', () => {
    for (const kind of ['boundary', 'control', 'entity', 'database', 'queue']) {
      expect(render(`${kind} Bob`), kind).toContain('stroke-width:0.5;');
    }
  });
});

describe('skinparams arrive through the Style path', () => {
  it('participantBorderThickness 2 (FromSkinparamToStyle.java:78,274)', () => {
    const [head] = boxes(render('skinparam participantBorderThickness 2\nparticipant Bob'));
    expect(head).toContain('stroke-width:2;');
  });

  it('participantRoundCorner 0 (FromSkinparamToStyle.java:78,275) drops rx/ry', () => {
    const [head] = boxes(render('skinparam participantRoundCorner 0\nparticipant Bob'));
    expect(head).not.toContain('rx=');
  });

  it('participantBackgroundColor<<X>> reaches only the X head (FromSkinparamToStyle.java:272,295-298)', () => {
    const svg = render('skinparam participantBackgroundColor<<X>> red\nparticipant A <<X>>\nparticipant B');
    const [a, b] = boxes(svg);
    expect(a).toContain('fill="#F00"'); // SvgGraphics#shortenColor
    expect(b).toContain(`fill="${GREY_BLUE}"`);
  });

  it('participantBorderColor (FromSkinparamToStyle.java:78,273)', () => {
    const [head] = boxes(render('skinparam participantBorderColor blue\nparticipant Bob'));
    expect(head).toContain('stroke:#00F;');
  });

  it('ActorBorderColor strokes the stick man (FromSkinparamToStyle.java:83,273)', () => {
    const svg = render('skinparam ActorBorderColor red\nactor Bob');
    expect(svg).toMatch(/<ellipse [^>]*style="stroke:#F00;stroke-width:0.5;"/);
    expect(svg).toMatch(/<path [^>]*style="stroke:#F00;stroke-width:0.5;"/);
  });

  it('a skinparam reaches only the participants declared after it (D2, Participant.java:82-91)', () => {
    const svg = render('participant A\nskinparam participantBorderThickness 2\nparticipant B');
    const [a, b] = boxes(svg);
    expect(a).toContain('stroke-width:0.5;');
    expect(b).toContain('stroke-width:2;');
  });

  it('an inline #color overrides BackGroundColor (Participant.java:89-90, CommandParticipant.java:183-185)', () => {
    const [head] = boxes(render('participant Bob #pink'));
    expect(head).toContain('fill="#FFC0CB"');
  });
});

describe('<style> arrives through the Style path', () => {
  it('participant { LineColor; LineThickness; RoundCorner; BackgroundColor }', () => {
    const [head] = boxes(
      render(
        '<style>\nparticipant {\n LineColor blue\n LineThickness 3\n RoundCorner 10\n BackgroundColor yellow\n}\n</style>\nparticipant Bob',
      ),
    );
    expect(head).toContain('fill="#FF0"');
    expect(head).toContain('style="stroke:#00F;stroke-width:3;"');
    expect(attr(head!, 'rx')).toBe('5');
  });

  it('Padding and Margin size and place the box (gepipe-05-rosu313, jar-verified)', () => {
    const svg = render(
      '<style>\n  participant {\n     Padding: 2 20\n     Margin: 0 50\n }\n</style>\nBob -> Alice : hello',
    );
    const [bob] = boxes(svg);
    // Rose.java:134-135; ComponentRoseParticipant.java:92,118,129-137.
    expect(attr(bob!, 'x')).toBe('60');
    expect(attr(bob!, 'width')).toBe('64.938');
    expect(attr(bob!, 'height')).toBe('18');
    expect(texts(svg)[0]).toContain('x="80" y="22.889"');
  });

  it('a stereotype row is italic and a ShowStereotype false style hides it', () => {
    // plantuml.skin:79-82 `stereotype { FontStyle italic }`; Display.java:127-136.
    const shown = texts(render('participant Bob <<Hot>>'));
    expect(shown[0]).toContain('font-style="italic"');
    expect(shown[0]).toContain('«Hot»');
    expect(shown[1]).not.toContain('font-style');
    const hidden = texts(render('<style>\n.Hot {\n ShowStereotype false\n}\n</style>\nparticipant Bob <<Hot>>'));
    expect(hidden.some((t) => t.includes('«Hot»'))).toBe(false);
  });

  it('a stereotype badge spec is not part of the style name (CommandParticipant.java:176-181)', () => {
    const hidden = texts(
      render('<style>\n.Hot {\n ShowStereotype false\n}\n</style>\nparticipant Bob << (H,#FF0000) Hot >>'),
    );
    expect(hidden.some((t) => t.includes('«Hot»'))).toBe(false);
  });

  it('participant FontColor/FontSize/FontStyle set the name runs', () => {
    const [name] = texts(
      render('<style>\nparticipant {\n FontColor red\n FontSize 20\n FontStyle bold\n}\n</style>\nparticipant Bob'),
    );
    expect(name).toContain('fill="#F00"');
    expect(name).toContain('font-size="20"');
    expect(name).toContain('font-weight="700"');
  });

  it('HorizontalAlignment left aligns each row at the block edge (AbstractTextualComponent.java:81)', () => {
    const svg = render(
      '<style>\nparticipant {\n HorizontalAlignment left\n}\n</style>\nparticipant "Longer name\\nab" as Bob',
    );
    const [first, second] = texts(svg);
    expect(attr(first!, 'x')).toBe(attr(second!, 'x'));
  });
});

describe('context-dependent font colours (FontConfiguration.java:349-356)', () => {
  it('automatic picks the opposite of the head fill (HColorAutomagic.java:38-41, jivati-56-pome307)', () => {
    const svg = render('skinparam ParticipantFontColor automatic\nparticipant Dark #indigo\nparticipant Light #ivory');
    const [dark, light] = texts(svg);
    expect(dark).toContain('fill="#FFF"');
    expect(light).toContain('fill="#000"');
  });

  it('automatic over a gradient uses its first colour (HColorGradient.java:108-110, xeroce-52-moso281)', () => {
    const [name] = texts(render('skinparam ParticipantFontColor automatic\nparticipant bob #green|blue'));
    expect(name).toContain('fill="#FFF"');
  });

  it('a #?light:dark scheme resolves against the document back for a stick man (duzico-51-misi485)', () => {
    const svg = render(
      '<style>\ndocument {\n  BackGroundColor darkblue\n}\nroot {\n  FontColor #?black:white\n}\n</style>\nactor alice\nparticipant bob',
    );
    const [alice, bob] = texts(svg);
    expect(alice).toContain('fill="#FFF"');
    expect(bob).toContain('fill="#000"');
  });
});

describe('the collections front box (ComponentRoseParticipant.java:107-118)', () => {
  it('centres the label in the front rectangle, one padding in from its edge', () => {
    const svg = render('collections Bob');
    const front = boxes(svg)[1]!;
    expect(attr(texts(svg)[0]!, 'x')).toBe(String(Number(attr(front, 'x')) + 7));
  });
});

describe('render scale (SvgGraphics.java:468-469)', () => {
  it('scales the style thickness and corner at emission', () => {
    const [head] = boxes(render('scale 2\nparticipant Bob'));
    expect(head).toContain('stroke-width:1;');
    expect(attr(head!, 'rx')).toBe('5');
  });
});

describe('participantPaintsOf / paintOfGeo', () => {
  it('memoises one paints object per participant', () => {
    const ast = parseSequence(sequenceSource(['participant Bob']));
    if ('refused' in ast) throw new Error(ast.message);
    const p = ast.participants[0]!;
    expect(participantPaintsOf(p)).toBe(participantPaintsOf(p));
    expect(participantPaintsOf(p).paint.roundCorner).toBe(5); // plantuml.skin:194
  });

  it('a geo without paint reads the default skin for its kind', () => {
    expect(paintOfGeo({ type: 'participant' }).roundCorner).toBe(5); // plantuml.skin:194
    expect(paintOfGeo({ type: 'collections' }).roundCorner).toBe(0); // plantuml.skin:13
    expect(paintOfGeo({ type: 'actor' }).fill).toBe(GREY_BLUE);
  });
});

describe('participantBoxOf / participantLabelCy', () => {
  const geo = {
    id: 'a',
    display: 'a',
    type: 'participant',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    centerX: 50,
    background: GREY_BLUE,
    border: ROOT_LINE,
    labelRuns: [],
  } satisfies ParticipantGeo;

  it('a glyph kind keeps its block', () => {
    const actor: ParticipantGeo = { ...geo, type: 'actor' };
    expect(participantBoxOf(actor)).toBe(actor);
  });

  it('centres a participant label between its paddings', () => {
    expect(participantLabelCy('participant', 40, 0, true, { fontSize: 14, padTop: 2, padBottom: 6 })).toBe(18);
    expect(participantLabelCy('participant', 40, 0, true, { fontSize: 14 })).toBe(20);
  });

  it('scales the collections delta with the render', () => {
    expect(participantLabelCy('collections', 44, 0, true, { fontSize: 14, scaleK: 2 })).toBe(26);
  });
});
