/**
 * `sequence-skin-param.ts` — the sequence style seam (sdd1 T1a): the
 * per-command style dispatch (`WBSDiagramFactory.ts` precedent), each
 * upstream `getStyleSignature`/`getUsedStyles`, and `paintOf`, the reads
 * the `skin/rose/ComponentRose*` classes make.
 *
 * Every expected default-skin value cites the `plantuml.skin` line it comes
 * from (`~/git/plantuml/src/main/resources/skin/plantuml.skin`). Colours are
 * the strings the klimt SVG driver emits (`HColor#toSvg`, IDENTITY mapper).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { Colors } from '../../../src/core/abel/Colors.js';
import { ColorType } from '../../../src/core/abel/ColorType.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { FontStyle } from '../../../src/core/klimt/shape/UText.js';
import { Stereotype } from '../../../src/core/stereo/Stereotype.js';
import { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { StyleSignatureBasic, type SName } from '../../../src/core/style/StyleSignatureBasic.js';
import { Url } from '../../../src/core/url/Url.js';
import {
  componentStyle,
  componentTypeStyleSignature,
  createSequenceStyleDispatch,
  currentStyleBuilder,
  delayStyle,
  dividerStyle,
  dollStyle,
  executeDeclarationsBefore,
  groupingHeaderStyleSignature,
  groupingStyle,
  groupingStyleSignature,
  messageStyle,
  messageStyleSignature,
  newpageStyle,
  noteStyle,
  noteStyleSignature,
  paintOf,
  participantStyle,
  participantStyleSignature,
  participantTypeStyleSignature,
  referenceHeaderStyleSignature,
  referenceStyle,
  referenceStyleSignature,
  type SequenceComponentType,
  type SequenceNoteStyle,
  type SequenceParticipantSName,
} from '../../../src/diagrams/sequence/sequence-skin-param.js';

const SET = HColorSet.instance();
const SEQ: readonly SName[] = ['root', 'element', 'sequenceDiagram'];
/** `plantuml.skin:16` `root { LineColor #181818 }`. */
const ROOT_LINE = '#181818';
/** `plantuml.skin:93` `element { LineThickness 0.5 }`. */
const ELEMENT_THICKNESS = 0.5;

/** The render pipeline's `UmlSource` for a `@startuml` body (`index.ts#umlSourceOfBlock`). */
function sourceOf(body: string): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return { ...block.source, stylePositions: block.preprocessed.stylePositions, styleSource: block.preprocessed };
}

/** The builder after every declaration of `body`. */
function builderOf(body: string): StyleBuilder {
  const dispatch = createSequenceStyleDispatch(sourceOf(body));
  expect(executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY)).toBeNull();
  return currentStyleBuilder(dispatch);
}

/** The default skin: a hand-built source with no style source at all. */
const DEFAULT = currentStyleBuilder(createSequenceStyleDispatch({ lines: [], type: 'sequence' }));

function of(...names: SName[]): StyleSignatureBasic {
  return StyleSignatureBasic.of(...SEQ, ...names);
}

describe('ComponentType.getStyleSignature (ComponentType.java:75-111)', () => {
  const rows: readonly (readonly [SequenceComponentType, readonly SName[]])[] = [
    ['PARTICIPANT_HEAD', ['participant']],
    ['PARTICIPANT_TAIL', ['participant']],
    ['PARTICIPANT_LINE', ['lifeLine']],
    ['ACTIVATION_BOX', ['activationBox']],
    ['DESTROY', ['lifeLine', 'destroy']], // LifeEventType.java:47-50
    ['DIVIDER', ['separator']],
    ['ENGLOBER', ['box']],
    ['NEWPAGE', ['newpage']],
    ['NOTE', ['note']],
    ['DELAY_TEXT', ['lifeLine', 'delay']],
    ['DELAY_LINE', ['lifeLine', 'delay']],
  ];
  it.each(rows)('%s merges root, element, sequenceDiagram, %j', (type, names) => {
    expect(componentTypeStyleSignature(type).equals(of(...names))).toBe(true);
  });
});

describe('ParticipantType.getStyleSignature (ParticipantType.java:54-82)', () => {
  const kinds: readonly SequenceParticipantSName[] = [
    'participant',
    'actor',
    'boundary',
    'control',
    'entity',
    'queue',
    'database',
    'collections',
  ];
  it.each(kinds)('%s merges its own SName', (kind) => {
    expect(participantTypeStyleSignature(kind).equals(of(kind))).toBe(true);
  });

  it('adds clickable only for a participant with a url (Participant.java:82-84)', () => {
    expect(participantStyleSignature('actor').equals(of('actor'))).toBe(true);
    const url = new Url('http://x', null, null);
    expect(participantStyleSignature('actor', url).equals(of('actor', 'clickable'))).toBe(true);
  });
});

describe('the other event signatures', () => {
  it('a message is arrow, fanned out per stereotype (AbstractMessage.java:75-78)', () => {
    expect(messageStyleSignature().toString()).toBe(of('arrow').toString());
    expect(messageStyleSignature(Stereotype.build('<<a>><<b>>')).toString()).toBe(
      `[${of('arrow').addStereotype('a').toString()}, ${of('arrow').addStereotype('b').toString()}]`,
    );
  });

  const notes: readonly (readonly [SequenceNoteStyle, readonly SName[]])[] = [
    ['note', ['note']],
    ['hnote', ['note', 'hnote']],
    ['rnote', ['note', 'rnote']],
  ];
  it.each(notes)('a %s note (NoteStyle.java:66-74)', (kind, names) => {
    expect(noteStyleSignature(kind).equals(of(...names))).toBe(true);
  });

  it('a grouping is group, a partition partition (Grouping.java:59-69)', () => {
    expect(groupingStyleSignature('START').equals(of('group'))).toBe(true);
    expect(groupingStyleSignature('ELSE').equals(of('group'))).toBe(true);
    expect(groupingStyleSignature('START_PARTITION').equals(of('partition'))).toBe(true);
    expect(groupingHeaderStyleSignature('START').equals(of('groupHeader'))).toBe(true);
    expect(groupingHeaderStyleSignature('START_PARTITION').equals(of('partition', 'header'))).toBe(true);
  });

  it('a reference is reference, its header referenceHeader (Reference.java:66-72)', () => {
    expect(referenceStyleSignature().equals(of('reference'))).toBe(true);
    expect(referenceHeaderStyleSignature().equals(of('referenceHeader'))).toBe(true);
  });
});

describe('default-skin paint', () => {
  it('participant head: plantuml.skin:91-93,193-201', () => {
    const paint = paintOf(componentStyle(DEFAULT, 'PARTICIPANT_HEAD'), SET);
    expect(paint).toMatchObject({
      thickness: ELEMENT_THICKNESS, // :93
      roundCorner: 5, // :194
      diagonalCorner: 0, // :14
      fill: '#E2E2F0', // :4,198
      stroke: ROOT_LINE, // :16
      dash: undefined,
      shadowing: 0, // :92
      align: 'CENTER', // :199
    });
    expect(paint.padding.getTop()).toBe(7); // :200
    expect(paint.padding.getLeft()).toBe(7);
    expect(paint.margin.getTop()).toBe(0);
    expect(paint.font).toMatchObject({ family: 'SansSerif', size: 14, color: '#000000' }); // :6,9-10
  });

  it('participant line: plantuml.skin:93,141-143', () => {
    const paint = paintOf(componentStyle(DEFAULT, 'PARTICIPANT_LINE'), SET);
    expect(paint).toMatchObject({ thickness: ELEMENT_THICKNESS, dash: [5, 5], stroke: ROOT_LINE, roundCorner: 0 });
  });

  it('activation box: plantuml.skin:93,145-147', () => {
    const paint = paintOf(componentStyle(DEFAULT, 'ACTIVATION_BOX'), SET);
    expect(paint).toMatchObject({ thickness: ELEMENT_THICKNESS, fill: '#FFFFFF', stroke: ROOT_LINE });
  });

  it('arrow: plantuml.skin:316-320 over :93', () => {
    const paint = paintOf(messageStyle(DEFAULT), SET);
    expect(paint).toMatchObject({ thickness: 1, fill: '#000000', stroke: ROOT_LINE, dash: undefined });
    expect(paint.font.size).toBe(13); // :317
  });

  it('note: plantuml.skin:3,322-326', () => {
    const paint = paintOf(noteStyle(DEFAULT, 'note'), SET);
    expect(paint).toMatchObject({ thickness: ELEMENT_THICKNESS, fill: '#FEFFDD', stroke: ROOT_LINE });
    expect(paint.font.size).toBe(13); // :323
  });

  it('group: plantuml.skin:102-104,116-121', () => {
    const paint = paintOf(groupingStyle(DEFAULT, 'START', false), SET);
    expect(paint).toMatchObject({ thickness: 1.5, fill: '#00000000', stroke: '#000000' }); // :118,:103,:117
    expect(paint.font.size).toBe(11); // :119
    expect(paint.font.styles.has(FontStyle.BOLD)).toBe(true); // :120
  });

  it('partition header: plantuml.skin:131-138', () => {
    const paint = paintOf(groupingStyle(DEFAULT, 'START_PARTITION', true), SET);
    expect(paint.font.size).toBe(13); // :136
    expect(paint).toMatchObject({ thickness: 1.5, stroke: '#000000' }); // :133-134
  });

  it('separator: plantuml.skin:179-187', () => {
    const paint = paintOf(dividerStyle(DEFAULT), SET);
    expect(paint).toMatchObject({ thickness: 2, fill: '#EEEEEE', stroke: '#000000' }); // :181,:182,:180
    expect(paint.padding.getTop()).toBe(4); // :186
    expect(paint.font.size).toBe(13); // :184
  });

  it('delay: plantuml.skin:300-305 over :141-143', () => {
    const paint = paintOf(delayStyle(DEFAULT), SET);
    expect(paint).toMatchObject({ thickness: ELEMENT_THICKNESS, dash: [1, 4], align: 'CENTER' }); // :304,:303
    expect(paint.font.size).toBe(11); // :301
  });

  it('newpage: plantuml.skin:189-191', () => {
    const paint = paintOf(newpageStyle(DEFAULT), SET);
    expect(paint).toMatchObject({ thickness: ELEMENT_THICKNESS, dash: [2, 2], stroke: ROOT_LINE }); // :190
  });

  it('destroy: plantuml.skin:149-153', () => {
    const paint = paintOf(componentStyle(DEFAULT, 'DESTROY'), SET);
    expect(paint).toMatchObject({ thickness: 2, stroke: '#A80036', dash: undefined }); // :152,:150,:151
  });

  it('box: plantuml.skin:172-177', () => {
    const paint = paintOf(dollStyle(DEFAULT), SET);
    expect(paint).toMatchObject({ fill: '#DDDDDD', thickness: ELEMENT_THICKNESS }); // :173
    expect(paint.font.size).toBe(13); // :175
  });

  it('reference body: plantuml.skin:155-161', () => {
    const paint = paintOf(referenceStyle(DEFAULT, false), SET);
    expect(paint).toMatchObject({ thickness: 1.5, fill: '#00000000', stroke: '#000000', align: 'CENTER' });
    expect(paint.font.size).toBe(12); // :156
  });

  it('newpage, delay and divider read their component type (Newpage.java:48, Delay.java:51, Divider.java:51)', () => {
    expect(newpageStyle(DEFAULT)).toBe(componentStyle(DEFAULT, 'NEWPAGE'));
    expect(delayStyle(DEFAULT)).toBe(componentStyle(DEFAULT, 'DELAY_TEXT'));
    expect(dividerStyle(DEFAULT)).toBe(componentStyle(DEFAULT, 'DIVIDER'));
  });
});

describe('per-command dispatch', () => {
  const BODY = [
    'Alice -> Bob',
    'skinparam participantBorderThickness 2',
    'Bob -> Carol',
    '<style>',
    'participant { RoundCorner 9 }',
    '</style>',
    'Carol -> Dan',
  ].join('\n');

  it('applies a skinparam only once the dispatch reaches it', () => {
    const dispatch = createSequenceStyleDispatch(sourceOf(BODY));
    const before = currentStyleBuilder(dispatch);
    expect(executeDeclarationsBefore(dispatch, 3)).toBeNull();
    const after = currentStyleBuilder(dispatch);
    expect(paintOf(componentStyle(before, 'PARTICIPANT_HEAD'), SET).thickness).toBe(ELEMENT_THICKNESS);
    expect(paintOf(componentStyle(after, 'PARTICIPANT_HEAD'), SET).thickness).toBe(2);
  });

  it('a <style> after an event reaches only a builder captured after it', () => {
    const source = sourceOf(BODY);
    const [, second, third] = source.linePositions!;
    const dispatch = createSequenceStyleDispatch(source);
    expect(executeDeclarationsBefore(dispatch, second!)).toBeNull();
    const atSecond = currentStyleBuilder(dispatch);
    expect(executeDeclarationsBefore(dispatch, third!)).toBeNull();
    const atThird = currentStyleBuilder(dispatch);
    expect(paintOf(componentStyle(atSecond, 'PARTICIPANT_HEAD'), SET).roundCorner).toBe(5); // plantuml.skin:194
    expect(paintOf(componentStyle(atThird, 'PARTICIPANT_HEAD'), SET).roundCorner).toBe(9);
  });

  it('refuses a malformed <style> at line 0 (CommandStyleMultilinesCSS.java:92-93)', () => {
    const dispatch = createSequenceStyleDispatch({
      lines: ['Alice -> Bob'],
      type: 'sequence',
      styleSource: { skinparam: new Map(), styles: ['participant { { }'] },
    });
    const refusal = executeDeclarationsBefore(dispatch, 0);
    expect(refusal).toMatchObject({ refused: true, kind: 'execution', line: 0, consumed: 0 });
    expect(refusal?.message.startsWith('Error in style definition: ')).toBe(true);
  });
});

describe('use-time overrides', () => {
  const STYLED = builderOf(
    ['<style>', '.hot { LineColor red; FontColor blue }', '</style>', 'participant A <<hot>>'].join('\n'),
  );
  const RED = SET.getColorOrWhite('red');
  const backRed = (): Colors => Colors.parse('#red', SET, ColorType.BACK);

  it('a participant merges its stereotype, and its stereo style the stereotype itself (Participant.java:86-96)', () => {
    const { style, stereo } = participantStyle(STYLED, 'participant', Stereotype.build('<<hot>>'));
    expect(paintOf(style, SET).stroke).toBe('#FF0000');
    expect(paintOf(stereo, SET).font.color).toBe('#0000FF');
    expect(paintOf(stereo, SET).font.styles.has(FontStyle.ITALIC)).toBe(true); // plantuml.skin:79-82
    const plain = participantStyle(DEFAULT, 'participant');
    expect(paintOf(plain.stereo, SET).fill).toBe('#E2E2F0'); // plantuml.skin:198
  });

  it('a participant back colour overrides BackGroundColor of the style only (Participant.java:89-94)', () => {
    const { style, stereo } = participantStyle(DEFAULT, 'actor', undefined, undefined, backRed());
    expect(paintOf(style, SET).fill).toBe('#FF0000');
    // the override keeps the skin value's priority, and ValueImpl#mergeWith
    // keeps itself on a tie (Style.java:121-134, ValueImpl.java:67-71)
    expect(paintOf(stereo, SET).fill).toBe('#E2E2F0'); // plantuml.skin:198
  });

  it('a note merges its stereotype styles and its colours (Note.java:75-82)', () => {
    expect(paintOf(noteStyle(STYLED, 'hnote', Stereotype.build('<<hot>>')), SET).stroke).toBe('#FF0000');
    expect(paintOf(noteStyle(DEFAULT, 'rnote', undefined, backRed()), SET).fill).toBe('#FF0000');
  });

  it('a message arrow colour overrides LineColor (AbstractMessage.java:67-72)', () => {
    expect(paintOf(messageStyle(DEFAULT, undefined, RED), SET).stroke).toBe('#FF0000');
    expect(paintOf(messageStyle(STYLED, Stereotype.build('<<hot>>')), SET).stroke).toBe('#FF0000');
  });

  it('a grouping back colour overrides BackGroundColor (Grouping.java:98-102, GroupingStart.java:63-68)', () => {
    expect(paintOf(groupingStyle(DEFAULT, 'START', false, RED), SET).fill).toBe('#FF0000');
    expect(paintOf(groupingStyle(DEFAULT, 'START_PARTITION', true, RED), SET).fill).toBe('#FF0000');
  });

  it('a box colour overrides BackGroundColor (Doll.java:107-114)', () => {
    expect(paintOf(dollStyle(DEFAULT, undefined, RED), SET).fill).toBe('#FF0000');
    expect(paintOf(dollStyle(STYLED, Stereotype.build('<<hot>>')), SET).stroke).toBe('#FF0000');
  });

  it('a group or reference header needs Style#mergeNestedChildOver, which Style.ts lacks (Style.java:158-173)', () => {
    expect(() => groupingStyle(DEFAULT, 'START', true)).toThrow(/unported: Style#mergeNestedChildOver/);
    expect(() => referenceStyle(DEFAULT, true)).toThrow(/unported: Style#mergeNestedChildOver/);
  });
});

describe('paintOf edge cases', () => {
  it('reads on access: a lifeline never reads its dark-only BackGroundColor (plantuml.skin:607-609)', () => {
    const paint = paintOf(componentStyle(DEFAULT, 'PARTICIPANT_LINE'), SET);
    expect(paint.thickness).toBe(ELEMENT_THICKNESS); // plantuml.skin:93
    expect(() => paint.fill).toThrow(/IllegalArgumentException/);
  });

  it('a gradient BackGroundColor stays a gradient paint', () => {
    const builder = builderOf(['<style>', 'participant { BackGroundColor red-blue }', '</style>'].join('\n'));
    expect(paintOf(componentStyle(builder, 'PARTICIPANT_HEAD'), SET).fill).toEqual({
      color1: '#FF0000',
      color2: '#0000FF',
      policy: '-',
    });
  });

  it('an empty builder has no style for any signature (StyleSignatureBasic.java:253-259)', () => {
    expect(() => componentStyle(new StyleBuilder(), 'NOTE')).toThrow(/no style/);
  });
});
