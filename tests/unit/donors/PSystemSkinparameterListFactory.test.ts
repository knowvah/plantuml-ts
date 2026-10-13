/**
 * `PSystemSkinparameterListFactory#executeLine`: `line.matches("(?i)^(skinparameters)\\s*$")` on the
 * UNtrimmed line (decisions.md D2; PSystemSingleLineFactory.java:95).
 */
import { describe, expect, it } from 'vitest';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import {
  acceptsSkinparametersLine,
  executeLine,
  skinparameterListPlugin,
} from '../../../src/diagrams/donors/PSystemSkinparameterListFactory.js';
import { PSystemSkinparameterList } from '../../../src/diagrams/donors/PSystemSkinparameterList.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { sourceOf } from '../../helpers/utility-single-line.js';

const KEYWORD = 'skinparameters';

describe('SkinparameterList factory accept test', () => {
  it.each([KEYWORD, KEYWORD.toUpperCase(), `${KEYWORD}  `, `${KEYWORD}\t`])('accepts %j', (line) => {
    expect(acceptsSkinparametersLine(line)).toBe(true);
  });

  it.each([` ${KEYWORD}`, `${KEYWORD}x`, KEYWORD.slice(0, -1), '', `${KEYWORD} ${KEYWORD}`])('refuses %j', (line) => {
    expect(acceptsSkinparametersLine(line)).toBe(false);
  });

  it('executeLine returns the diagram or undefined', () => {
    const source = { lines: [], type: 'sequence' as const };
    expect(executeLine(source, KEYWORD, new PreprocessingArtifact())).toBeInstanceOf(PSystemSkinparameterList);
    expect(executeLine(source, 'other', new PreprocessingArtifact())).toBeUndefined();
  });
});

describe('SkinparameterList plugin', () => {
  it('parses a 3-line source into the diagram', () => {
    expect(skinparameterListPlugin.parse(sourceOf(`@startuml\n${KEYWORD}\n@enduml`))).toBeInstanceOf(
      PSystemSkinparameterList,
    );
  });

  it('refuses a line it does not accept as Syntax Error?', () => {
    expect(parseRefusalOf(skinparameterListPlugin.parse(sourceOf('@startuml\nfoo\n@enduml')))?.message).toBe(
      'Syntax Error?',
    );
  });

  it('refuses a 4-line source before looking at any line', () => {
    const refusal = parseRefusalOf(
      skinparameterListPlugin.parse(sourceOf(`@startuml\n${KEYWORD}\n${KEYWORD}\n@enduml`)),
    );
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
