import { describe, it, expect } from 'vitest';
import { skinParamWarnings, uniqueWarnings } from '../../../src/core/skinparam-warnings.js';
import { Warning } from '../../../src/core/warning/Warning.js';

const PARTICIPANT_PADDING = 'Please use CSS style instead of skinparam ParticipantPadding';
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

describe('uniqueWarnings (TitledDiagram.java:326-334)', () => {
  it('concatenates in order and drops value-equal repeats', () => {
    const out = uniqueWarnings([new Warning('a'), new Warning('b')], [new Warning('a'), new Warning('c')]);
    expect(out.map((w) => w.asSingleLine())).toEqual(['a', 'b', 'c']);
  });
});
