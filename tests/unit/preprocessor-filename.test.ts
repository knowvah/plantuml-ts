import { describe, it, expect } from 'vitest';
import { preprocess } from '../../src/core/preprocessor.js';

const SOURCE = '@startuml\nA -> B : %filename() %filename_no_extension()\n@enduml';

function body(filename?: string): string {
  const lines = preprocess(SOURCE, undefined, filename === undefined ? undefined : { filename }).lines;
  return lines[1] ?? '';
}

describe('preprocessor filename environment (Defines.java:89-94,149-155)', () => {
  it('strips up to the LAST dot for filenameNoExtension', () => {
    expect(body('a.b.puml')).toBe('A -> B : a.b.puml a.b');
  });

  it('leaves a dotless name unchanged', () => {
    expect(body('README')).toBe('A -> B : README README');
  });

  it('is empty when no filename is given', () => {
    expect(body()).toBe('A -> B :  ');
  });
});
