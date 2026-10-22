import { describe, expect, it } from 'vitest';
import { rawBlocksOf } from '../../../src/core/BlockUmlBuilder.js';

const linesOf = (src: string): string[] => rawBlocksOf(src)[0]!.lines.map((l) => l.getString());

describe('BlockUmlBuilder -- YAML header removal', () => {
  // ReadLineWithYamlHeader.java:98-109 (removeYamlHeader), called at BlockUml.java:142.
  it('removes a --- ... --- block that follows the @start line', () => {
    expect(linesOf('@startuml\n---\ntitle: x\n---\nA -> B\n@enduml')).toEqual(['@startuml', 'A -> B', '@enduml']);
  });

  it('keeps the block when the header is never closed (:99-108 falls through to return input)', () => {
    expect(linesOf('@startuml\n---\ntitle: x\nA -> B\n@enduml')).toEqual([
      '@startuml',
      '---',
      'title: x',
      'A -> B',
      '@enduml',
    ]);
  });

  it('keeps a --- that is not the second line (:99 tests input.get(1) only)', () => {
    expect(linesOf('@startuml\nA -> B\n---\nC -> D\n---\n@enduml')).toEqual([
      '@startuml',
      'A -> B',
      '---',
      'C -> D',
      '---',
      '@enduml',
    ]);
  });

  it('requires an exact --- line (:92 uses equals)', () => {
    expect(linesOf('@startuml\n--- \nx\n---\n@enduml')).toEqual(['@startuml', '--- ', 'x', '---', '@enduml']);
  });

  it('keeps only content after the FIRST closing separator', () => {
    expect(linesOf('@startuml\n---\na: b\n---\nA -> B\n---\n@enduml')).toEqual([
      '@startuml',
      'A -> B',
      '---',
      '@enduml',
    ]);
  });
});
