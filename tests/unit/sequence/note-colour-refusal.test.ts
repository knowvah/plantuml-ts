/**
 * sdd1 T3e item 3: a note colour that names no colour fails in the note
 * COMMAND, as upstream parses it there: `HColorSet.instance().getColor(c)`
 * on an arrow note (`FactorySequenceNoteOnArrowCommand.java:223-225`), the
 * `Colors(data, set, BACK)` constructor everywhere else
 * (`FactorySequenceNoteCommand.java:234`, `Colors.java:95-116`). The
 * `NoSuchColorException` becomes `CommandExecutionResult.badColor()`
 * (`SingleLineCommand2.java:174-177`, `CommandMultilines2.java:119`), so
 * the sequence attempt fails and the jar tries the next diagram type.
 *
 * Jar outcomes (`scripts/oracle-render.sh`, 2026-10-20): `nc-arrow` renders
 * as CLASS, `nc-of` is an error page, `nc-ok` and `nc-noanchor` are
 * SEQUENCE.
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSync } from '../../../src/index.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

function parse(lines: string[]) {
  return parseSequence(sequenceSource(lines));
}

describe('note colour refusal (CommandExecutionResult.badColor, CommandExecutionResult.java:77-79)', () => {
  it('refuses a compound colour on an arrow note: getColor reads the whole string (nc-arrow)', () => {
    expect(parse(['A -> B : hi', 'note left #pink;line:green : x'])).toMatchObject({
      refused: true,
      kind: 'execution',
      line: 1,
      message: 'No such color',
    });
  });

  it('refuses an unknown colour on a multi-line arrow note at its opening line', () => {
    expect(parse(['A -> B : hi', 'note right #nosuchcolour', 'body', 'end note'])).toMatchObject({
      refused: true,
      line: 1,
      message: 'No such color',
    });
  });

  it('refuses an unknown main colour on a participant note (nc-of; Colors.java:101-103)', () => {
    expect(parse(['participant A', 'note left of A #nosuchcolour : x'])).toMatchObject({
      refused: true,
      line: 1,
      message: 'No such color',
    });
    expect(parse(['participant A', 'hnote over A #nosuchcolour : x'])).toMatchObject({ refused: true, line: 1 });
  });

  it('accepts a compound colour on a participant note: keyed parts never throw (nc-ok; Colors.java:111-113)', () => {
    const ast = parse(['participant A', 'note left of A #pink;line:green : x']);
    expect('refused' in ast).toBe(false);
  });

  it('accepts any colour on an arrow note with nothing to attach to (nc-noanchor; :212-213 return first)', () => {
    const ast = parse(['note left #nosuch : x', 'A -> B : hi']);
    expect('refused' in ast).toBe(false);
  });

  it('falls through to the next diagram type, as the jar does for nc-arrow (CLASS)', () => {
    const svg = renderSync('@startuml\nA -> B : hi\nnote left #pink;line:green : x\n@enduml\n');
    expect(/data-diagram-type="([A-Z]+)"/.exec(svg)?.[1]).toBe('CLASS');
  });
});
