import { describe, it, expect } from 'vitest';
import { skinParamWarnings, uniqueWarnings } from '../../../src/core/skinparam-warnings.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { Warning } from '../../../src/core/warning/Warning.js';

const PARTICIPANT_PADDING = 'Please use CSS style instead of skinparam ParticipantPadding';
const HANDWRITTEN = "Please use '!option handwritten true' to enable handwritten ";
const PADDING = 'Please use CSS style instead of skinparam padding';

describe('skinParamWarnings (CommandSkinParam.java:92-99)', () => {
  it('warns for the three deprecated names, case-insensitively, in map order', () => {
    const map = new Map([
      ['ParticipantPadding', '10'],
      ['ArrowColor', 'red'],
      ['PADDING', '3'],
    ]);
    expect(skinParamWarnings(map).map((w) => w.asSingleLine())).toEqual([PARTICIPANT_PADDING, PADDING]);
  });

  it('is empty without a map or a deprecated name', () => {
    expect(skinParamWarnings(undefined)).toEqual([]);
    expect(skinParamWarnings(new Map([['ArrowColor', 'red']]))).toEqual([]);
  });
});

const warnTexts = (puml: string): string[] => skinParamWarnings(preprocess(puml)).map((w) => w.asSingleLine());

describe('skinParamWarnings form (CommandSkinParam.java:92-99 vs CommandSkinParamMultilines.java:90-102)', () => {
  it('warns for each deprecated name in line form', () => {
    const puml = '@startuml\nskinparam handwritten true\nskinparam ParticipantPadding 5\nskinparam padding 2\n@enduml';
    expect(warnTexts(puml)).toEqual([HANDWRITTEN, PARTICIPANT_PADDING, PADDING]);
  });

  it('does not warn for entries of skinparam { and skinparam sequence {, yet keeps the parameter', () => {
    const puml = '@startuml\nskinparam {\nhandwritten true\n}\nskinparam sequence {\nParticipantPadding 5\n}\n@enduml';
    const result = preprocess(puml);
    expect(skinParamWarnings(result)).toEqual([]);
    expect(result.skinparam.get('handwritten')).toBe('true');
    expect(result.skinparam.get('sequenceparticipantpadding')).toBe('5');
  });

  it('warns once for a line plus a block entry of the same name', () => {
    const puml = '@startuml\nskinparam {\nhandwritten true\n}\nskinparam handwritten true\n@enduml';
    expect(warnTexts(puml)).toEqual([HANDWRITTEN]);
  });

  it('falls back to the map for a hand-built source without assignments', () => {
    const skinparam = new Map([['handwritten', 'true']]);
    expect(skinParamWarnings({ skinparam }).map((w) => w.asSingleLine())).toEqual([HANDWRITTEN]);
  });
});

describe('uniqueWarnings (TitledDiagram.java:326-334)', () => {
  it('concatenates in order and drops value-equal repeats', () => {
    const out = uniqueWarnings([new Warning('a'), new Warning('b')], [new Warning('a'), new Warning('c')]);
    expect(out.map((w) => w.asSingleLine())).toEqual(['a', 'b', 'c']);
  });
});
