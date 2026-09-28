/**
 * cdd5-T4b (class-redeclare-mute-guard-missing): re-declaring an existing
 * entity with a different TYPE goes through `Entity#muteToType`, which only
 * mutes between ANNOTATION/ABSTRACT_CLASS/CLASS/ENUM/INTERFACE/RECORD/
 * DATACLASS (to that set plus OBJECT). Anything else is an execution error:
 * "Bad name" from the single-line command, "Cannot create X because it
 * already exists" from the multi-line one (`petiku-70-fogu777`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:205-230
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClass.java:195-197
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClassMultilines.java:245-246
 */
import { describe, it, expect } from 'vitest';
import { parseClass as parseClassRaw } from '../../../src/diagrams/class/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import { parseClass } from './parse-helper.js';

function refusal(...lines: string[]) {
  return parseRefusalOf(parseClassRaw({ lines, type: 'class', linePositions: lines.map((_, i) => i) }));
}

function kindOf(id: string, ...lines: string[]) {
  return parseClass({ lines, type: 'class' }).classifiers.find((c) => c.id === id)?.kind;
}

describe('classifier redeclaration: muteToType guard', () => {
  it('refuses CLASS -> STRUCT from the multi-line command (petiku-70-fogu777)', () => {
    // cdd5-T5e: attributed to the block's CLOSING `}` (index 2), not the
    // opener (index 1) -- PSystemError#getLineLocation's getLastLine()
    // (error/PSystemError.java:102-104).
    const r = refusal('foo <-- bar', 'struct bar {', '}');
    expect(r).toMatchObject({ kind: 'execution', line: 2, message: 'Cannot create bar because it already exists' });
  });

  it('refuses CLASS -> STRUCT from the single-line command with "Bad name"', () => {
    expect(refusal('class bar', 'struct bar')).toMatchObject({ kind: 'execution', line: 1, message: 'Bad name' });
  });

  it('refuses a mute FROM a type outside the mutable set (STRUCT -> CLASS)', () => {
    expect(refusal('struct bar', 'class bar {}')?.message).toBe('Bad name');
  });

  it('mutes freely inside the set: CLASS -> INTERFACE -> ENUM -> ABSTRACT', () => {
    expect(kindOf('bar', 'foo <-- bar', 'interface bar', 'enum bar {', '}', 'abstract class bar')).toBe('abstract');
  });

  it('a same-type redeclaration of a non-mutable type is accepted', () => {
    expect(kindOf('bar', 'struct bar', 'struct bar {', '}')).toBe('struct');
  });

  it('cdd5-T5e: discards every interior body line, attributing to the closer', () => {
    const r = refusal('foo <-- bar', 'struct bar {', '+ int x', '+ int y', '}');
    expect(r).toMatchObject({ kind: 'execution', line: 4, message: 'Cannot create bar because it already exists' });
  });

  it('cdd5-T5e: the deferred refusal fires even with a blank interior line', () => {
    const r = refusal('foo <-- bar', 'struct bar {', '', '}');
    expect(r).toMatchObject({ kind: 'execution', line: 3, message: 'Cannot create bar because it already exists' });
  });
});
