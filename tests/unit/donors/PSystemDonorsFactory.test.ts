/**
 * `PSystemDonorsFactory#executeLine`: `line.matches("(?i)^(donors)\\s*$")` on the
 * UNtrimmed line (decisions.md D2; PSystemSingleLineFactory.java:95).
 */
import { describe, expect, it } from 'vitest';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { acceptsDonorsLine, executeLine, donorsPlugin } from '../../../src/diagrams/donors/PSystemDonorsFactory.js';
import { PSystemDonors } from '../../../src/diagrams/donors/PSystemDonors.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { sourceOf } from '../../helpers/utility-single-line.js';

const KEYWORD = 'donors';

describe('Donors factory accept test', () => {
  it.each([KEYWORD, KEYWORD.toUpperCase(), `${KEYWORD}  `, `${KEYWORD}\t`])('accepts %j', (line) => {
    expect(acceptsDonorsLine(line)).toBe(true);
  });

  it.each([` ${KEYWORD}`, `${KEYWORD}x`, KEYWORD.slice(0, -1), '', `${KEYWORD} ${KEYWORD}`])('refuses %j', (line) => {
    expect(acceptsDonorsLine(line)).toBe(false);
  });

  it('executeLine returns the diagram or undefined', () => {
    const source = { lines: [], type: 'sequence' as const };
    expect(executeLine(source, KEYWORD, new PreprocessingArtifact())).toBeInstanceOf(PSystemDonors);
    expect(executeLine(source, 'other', new PreprocessingArtifact())).toBeUndefined();
  });
});

describe('Donors plugin', () => {
  it('parses a 3-line source into the diagram', () => {
    expect(donorsPlugin.parse(sourceOf(`@startuml\n${KEYWORD}\n@enduml`))).toBeInstanceOf(PSystemDonors);
  });

  it('refuses a line it does not accept as Syntax Error?', () => {
    expect(parseRefusalOf(donorsPlugin.parse(sourceOf('@startuml\nfoo\n@enduml')))?.message).toBe('Syntax Error?');
  });

  it('refuses a 4-line source before looking at any line', () => {
    const refusal = parseRefusalOf(donorsPlugin.parse(sourceOf(`@startuml\n${KEYWORD}\n${KEYWORD}\n@enduml`)));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
