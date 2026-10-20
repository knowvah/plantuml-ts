/**
 * sdd1 T2e: notes and boxes paint from the style their event resolved
 * (`Note.java:75-82`, `Doll.java:107-114`), not from `theme.colors`.
 *
 * Expected strings marked "jar" were rendered with
 * `scripts/oracle-render.sh` (deterministic text) on 2026-10-20; the port
 * emits attributes rather than the jar's `style=` form, which
 * `normalize.ts` treats as equal, so the assertions spell the port's form
 * with the jar's values.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import type { BoxGeo, NoteEvent, NoteGeo, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
} from '../../../src/diagrams/sequence/sequence-skin-param.js';
import { notePaint } from '../../../src/diagrams/sequence/sequence-layout-note.js';
import { boxLabelRuns, boxPaint } from '../../../src/diagrams/sequence/sequence-layout-box.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const DEFAULT_STYLE = currentStyleBuilder(createSequenceStyleDispatch({ lines: [], type: 'sequence' }));

function render(body: string): string {
  return renderFixtureSequence(`@startuml\n${body}\n@enduml\n`, new DeterministicMeasurer());
}

/** Every `<path>` / `<rect>` / `<text>` start tag, in document order. */
function tags(svg: string, name: 'path' | 'rect' | 'text'): string[] {
  return [...svg.matchAll(new RegExp(`<${name} [^>]*>`, 'g'))].map((m) => m[0]);
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function noteEvent(overrides: Partial<NoteEvent> = {}): NoteEvent {
  return {
    kind: 'note',
    position: 'left',
    participants: ['A'],
    text: 'x',
    styleBuilder: DEFAULT_STYLE,
    ...overrides,
  };
}

describe('note paint (Note.java:75-82)', () => {
  it('a default note: note { LineThickness 0.5 } and --note-background (plantuml.skin:3,16,322-326)', () => {
    const svg = render('participant A\nnote left of A : ok');
    // jar (`metano-36-gevu843`'s `ok` note, same box): `Opale.getPolygonNormal`'s
    // vertex order (Opale.java:152-157), then the corner (:134-147).
    const [body, fold] = tags(svg, 'path');
    expect(body).toBe(
      '<path d="M15,52 L15,75 L49,75 L49,62 L39,52 L15,52" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
    );
    expect(fold).toBe('<path d="M39,52 L39,62 L49,62 L39,52" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>');
    // note { FontSize 13 } (plantuml.skin:323), root { FontColor black } (:9).
    const text = tags(svg, 'text').find((t) => t.includes('x="21"'))!;
    expect(attr(text, 'font-size')).toBe('13');
    expect(attr(text, 'fill')).toBe('#000');
  });

  it('a colour overrides BackGroundColor, and line: overrides LineColor (Note.java:79, Style.java:195-212)', () => {
    const svg = render('participant A\nnote left of A #pink;line:blue : ok');
    const [body] = tags(svg, 'path');
    expect(attr(body!, 'fill')).toBe('#FFC0CB');
    expect(attr(body!, 'stroke')).toBe('#00F');
  });

  it('a note on an arrow takes its colour as BACK (FactorySequenceNoteOnArrowCommand.java:223-225)', () => {
    const svg = render('A -> B : hi\nnote left #pink : onarrow');
    expect(attr(tags(svg, 'path')[0]!, 'fill')).toBe('#FFC0CB');
  });

  it('a stereotype merges its style (Note.java:76-78); dash and font colour arrive with it', () => {
    const svg = render(
      [
        '<style>',
        '.X { note { LineColor red; LineThickness 2; LineStyle 4-2; FontColor blue } }',
        '</style>',
        'participant A',
        'note right of A <<X>> : styled',
      ].join('\n'),
    );
    // jar: style="stroke:#F00;stroke-width:2;stroke-dasharray:4,2;" on both paths.
    for (const p of tags(svg, 'path')) {
      expect(attr(p, 'stroke')).toBe('#F00');
      expect(attr(p, 'stroke-width')).toBe('2');
      expect(attr(p, 'stroke-dasharray')).toBe('4,2');
    }
    expect(
      attr(
        tags(svg, 'text').find((t) => t.includes('textLength="33.963"'))!,
        'fill',
      ),
    ).toBe('#00F');
  });

  it('the note skinparams arrive through the style (FromSkinparamToStyle.java:122-125)', () => {
    const svg = render(
      [
        'skinparam noteBackgroundColor #aaffaa',
        'skinparam noteBorderColor blue',
        'skinparam noteBorderThickness 2',
        'skinparam noteFontSize 16',
        'skinparam noteFontColor red',
        'participant A',
        'note right of A : plain',
      ].join('\n'),
    );
    // jar: style="stroke:#00F;stroke-width:2;" fill="#AFA"; text fill="#F00" font-size="16".
    const [body] = tags(svg, 'path');
    expect([attr(body!, 'fill'), attr(body!, 'stroke'), attr(body!, 'stroke-width')]).toEqual(['#AFA', '#00F', '2']);
    const text = tags(svg, 'text').find((t) => t.includes('textLength="33.9"'))!;
    expect([attr(text, 'fill'), attr(text, 'font-size')]).toEqual(['#F00', '16']);
  });

  it('skinparam roundCorner rounds the Opale polygon, the corner and the rnote box (Opale.java:134-171)', () => {
    const svg = render('skinparam roundCorner 10\nparticipant A\nnote left of A : r\nrnote right of A : b');
    // jar, byte for byte (`d` and paint):
    expect(tags(svg, 'path')).toEqual([
      '<path d="M15,57 L15,70 A5,5 0 0 0 20,75 L35,75 A5,5 0 0 0 40,70 L40,62 L30,52 L20,52 A5,5 0 0 0 15,57" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
      '<path d="M30,52 L30,59.5 A2.5,2.5 0 0 0 32.5,62 L40,62 L30,52" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
    ]);
    // `URectangle#rounded(10)` -> rx = ry = 5 (ComponentRoseNoteBox.java:100).
    expect(tags(svg, 'rect')).toContain(
      '<rect x="50.306" y="85" width="15" height="21" fill="#FEFFDD" stroke="#181818" stroke-width="0.5" rx="5" ry="5"/>',
    );
  });

  it('each note reads the builder of its own line: a later <style> reaches only later notes (D2)', () => {
    const svg = render(
      ['note over A : before', '<style>', 'note { BackGroundColor yellow }', '</style>', 'note over A : after'].join(
        '\n',
      ),
    );
    // jar: fill="#FEFFDD" then fill="#FF0".
    expect(tags(svg, 'path').map((p) => attr(p, 'fill'))).toEqual(['#FEFFDD', '#FEFFDD', '#FF0', '#FF0']);
  });

  it('the shadow is the style Shadowing, on the polygon only (ComponentRoseNote.java:118-124)', () => {
    const svg = render('<style>\nnote { Shadowing 3 }\n</style>\nparticipant A\nnote left of A : s');
    // jar: <path d="M15,52 L15,75 L42,75 L42,62 L32,52 L15,52" ... filter="url(#…)"/> -- the
    // tile reserves the 3 (ComponentRoseNote.java:83-91), so the box is the
    // unshadowed one's, and the corner carries no filter.
    const [body, fold] = tags(svg, 'path');
    expect(body).toContain('d="M15,52 L15,75 L42,75 L42,62 L32,52 L15,52"');
    // The id is seeded from the source, as production seeds it (sdd1
    // close-b2, journal row 40): assert the reference, not a literal id.
    const filterId = /<filter[^>]*\bid="([^"]+)"/.exec(svg)?.[1];
    expect(filterId).toMatch(/^f/);
    expect(attr(body!, 'filter')).toBe(`url(#${filterId!})`);
    expect(attr(fold!, 'filter')).toBeUndefined();
  });

  it('scale multiplies the stroke at emission (SvgGraphics.java:555-561)', () => {
    const svg = render('scale 2\nskinparam noteBorderThickness 1.5\nnote over A : sc');
    // jar: style="stroke:#181818;stroke-width:3;" -- and no dash: `noteBorderStyle`
    // has no conversion for `note` (FromSkinparamToStyle.java:122-125).
    expect(tags(svg, 'path').map((p) => attr(p, 'stroke-width'))).toEqual(['3', '3']);
  });

  it('the block keeps its sheet alignment at the style font (SheetBlock1.java:155-193)', () => {
    const svg = render('skinparam noteTextAlignment right\nparticipant A\nnote left of A\nlonger line\nab\nend note');
    // jar: <text x="25" … >longer line</text>, <text x="70.581" y="80.111" … >ab</text>.
    const xy = tags(svg, 'text')
      .filter((t) => attr(t, 'font-size') === '13')
      .map((t) => [attr(t, 'x'), attr(t, 'y')]);
    expect(xy).toEqual([
      ['25', '67.111'],
      ['70.581', '80.111'],
    ]);
  });

  it('notePaint resolves the keyword signature, stereotype and colours', () => {
    expect(notePaint(noteEvent()).thickness).toBe(0.5); // plantuml.skin:325
    expect(notePaint(noteEvent({ color: '#red' })).fill).toBe('#FF0000');
    expect(notePaint(noteEvent({ color: '#red', onMessage: true })).fill).toBe('#FF0000');
    expect(notePaint(noteEvent({ style: 'rnote' })).fill).toBe('#FEFFDD');
  });
});

describe('box paint (Doll.java:107-114, ComponentRoseEnglober.java:64-70)', () => {
  it('a box colour fills it; box { FontSize 13; FontStyle bold } (plantuml.skin:172-177) sets the title', () => {
    const svg = render('box "Box" #LightBlue\nparticipant C\nend box');
    const box = tags(svg, 'rect')[0]!;
    expect([attr(box, 'fill'), attr(box, 'stroke'), attr(box, 'stroke-width')]).toEqual(['#ADD8E6', '#181818', '0.5']);
    const title = tags(svg, 'text').find((t) => t.includes('textLength="22.425"'))!;
    expect([attr(title, 'font-size'), attr(title, 'font-weight')]).toEqual(['13', '700']);
    // Centred: `dx((width - getPureTextWidth) / 2)` -- jar: rect x 61.584
    // width 46.425, text x 73.584 (= x + (46.425 - 22.425) / 2).
    const x = Number(attr(box, 'x'));
    const w = Number(attr(box, 'width'));
    expect(Number(attr(title, 'x'))).toBeCloseTo(x + (w - 22.425) / 2, 2);
  });

  it('a box reads the builder at tile time: a <style> after end box still reaches it (Doll.java:81-83)', () => {
    const svg = render(
      [
        'box "Box" #LightBlue',
        'participant C',
        'end box',
        '<style>',
        'sequenceDiagram { box { LineColor red; FontColor green } }',
        '</style>',
      ].join('\n'),
    );
    // jar: style="stroke:#F00;stroke-width:0.5;" and the title fill="#008000".
    expect(attr(tags(svg, 'rect')[0]!, 'stroke')).toBe('#F00');
    expect(
      attr(
        tags(svg, 'text').find((t) => t.includes('textLength="22.425"'))!,
        'fill',
      ),
    ).toBe('#008000');
  });

  it('no colour: box { BackGroundColor #d } (plantuml.skin:173)', () => {
    const svg = render('box "AB"\nparticipant A\nend box');
    expect(attr(tags(svg, 'rect')[0]!, 'fill')).toBe('#DDD');
  });

  it('a compound colour gives its BACK; an unknown keyed colour overrides nothing (CommandBoxStart.java:126-128)', () => {
    const base = { id: 'b', label: '', participantIds: [], styleBuilder: DEFAULT_STYLE };
    expect(boxPaint({ ...base, color: '#red;line:blue' }).fill).toBe('#FF0000');
    expect(boxPaint({ ...base, color: '#back:nosuchcolour' }).fill).toBe('#DDDDDD');
  });

  it('a box stereotype merges its style before the box colour (CommandBoxStart.java:111-117, Doll.java:107-114)', () => {
    const svg = render(
      [
        '<style>',
        '.S {',
        '  BackGroundColor red',
        '  LineColor blue',
        '}',
        '</style>',
        'box "B" <<S>>',
        'participant A',
        'end box',
        'box "C" <<T>> #yellow',
        'participant D',
        'end box',
      ].join('\n'),
    );
    // jar (`box-stereo.puml`, 2026-10-20): `fill="#F00" style="stroke:#00F;…"`
    // for B; C's unknown `.T` leaves the colour and the default line.
    const [b, c] = tags(svg, 'rect');
    expect([attr(b!, 'fill'), attr(b!, 'stroke')]).toEqual(['#F00', '#00F']);
    expect([attr(c!, 'fill'), attr(c!, 'stroke')]).toEqual(['#FF0', '#181818']);
  });

  it('the box command keeps the stereotype as written, guillemets included (CommandBoxStart.java:74,111-115)', () => {
    const ast = parseSequence(sequenceSource(['box "Tier 1"  <<Client>> #pink', 'participant A', 'end box']));
    if ('refused' in ast) throw new Error(ast.message);
    expect(ast.boxes[0]).toMatchObject({ label: 'Tier 1', stereotype: '<<Client>>', color: '#pink' });
  });

  it('an unquoted title swallows the stereotype: NAME2 is greedy [^#]+ (CommandBoxStart.java:74)', () => {
    // jar (`box-unq.puml`): fill #DDD, title `Foo «S»` (textLength 49.156).
    const svg = render(
      ['<style>', '.S {', '  BackGroundColor red', '}', '</style>', 'box Foo <<S>>', 'participant A', 'end box'].join(
        '\n',
      ),
    );
    expect(attr(tags(svg, 'rect')[0]!, 'fill')).toBe('#DDD');
    const title = tags(svg, 'text').find((t) => t.includes('font-weight="700"'))!;
    expect(attr(title, 'textLength')).toBe('49.156');
    const ast = parseSequence(sequenceSource(['box Foo <<S>> #red', 'participant A', 'end box']));
    if ('refused' in ast) throw new Error(ast.message);
    expect(ast.boxes[0]!.stereotype).toBeUndefined();
    expect([ast.boxes[0]!.label, ast.boxes[0]!.color]).toEqual(['Foo <<S>>', '#red']);
  });

  it('an empty title places no runs', () => {
    const paint = boxPaint({ id: 'b', label: '', color: '', participantIds: [], styleBuilder: DEFAULT_STYLE });
    expect(boxLabelRuns('', { x: 0, y: 0, width: 10 }, paint, new DeterministicMeasurer())).toEqual([]);
  });
});

describe('renderer contract (D1)', () => {
  const geo = (overrides: Partial<SequenceGeometry>): SequenceGeometry => ({
    totalWidth: 100,
    totalHeight: 100,
    showFootbox: false,
    participants: [],
    events: [],
    headHeight: 0,
    lifelineEndY: 0,
    lifelineSegments: {},
    footerShapeY: 0,
    boxes: [],
    ...overrides,
  });

  it('a note geo without paint is a layout defect, not a fallback', () => {
    const note: NoteGeo = {
      kind: 'note',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      text: '',
      textRuns: [],
      minX: 0,
      maxX: 10,
    };
    expect(() => renderSequence(geo({ events: [note] }), defaultTheme, new DeterministicMeasurer())).toThrow(
      'note geo has no paint',
    );
  });

  it('a box geo without paint is a layout defect, not a fallback', () => {
    const box: BoxGeo = { x: 0, y: 0, width: 10, height: 10, label: '', color: '', labelRuns: [] };
    expect(() => renderSequence(geo({ boxes: [box] }), defaultTheme, new DeterministicMeasurer())).toThrow(
      'box geo has no paint',
    );
  });
});
