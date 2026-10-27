/**
 * `GanttDiagramFactory` (gantt/GanttDiagramFactory.java:73-130): the command order (common commands, then the
 * gantt commands in `initCommandsList` order), the standard refusals, `checkFinalError` -> the `final` refusal
 * (PSystemCommandFactory.java:150-153), and the common-command targets (`annotations`, `scale`) the parse hands back.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { parseGantt, type ParsedGantt } from '../../../src/diagrams/gantt/GanttDiagramFactory.js';

const SYNTAX = 'Syntax Error?';
const NO_VERB = 'No matching verb phrase';
const TOO_LONG = 'Gantt diagrams cannot last more than 20 years';

/** The render pipeline's `UmlSource` for a `.puml` text (`index.ts#umlSourceOfBlock`). */
function parse(body: string): ParsedGantt | ParseRefusal {
  const block = buildBlockUmls(`@startgantt\n${body}\n@endgantt`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return parseGantt(
    {
      ...block.source,
      rawStyles: block.preprocessed.styles,
      stylePositions: block.preprocessed.stylePositions,
      styleSource: block.preprocessed,
    },
    new PreprocessingArtifact(),
  );
}

function parsed(body: string): ParsedGantt {
  const result = parse(body);
  if ('refused' in result) throw new Error(`refused: ${result.message} @${result.line}`);
  return result;
}

function refusedWith(body: string): ParseRefusal {
  const result = parse(body);
  if (!('refused' in result)) throw new Error('expected a refusal');
  return result;
}

describe('parseGantt: accepted sources', () => {
  it('parses one natural-language task sentence (GanttDiagramFactory.java:110 SubjectTask)', () => {
    const result = parsed('[A] lasts 5 days');
    expect(result.scale).toBeUndefined();
    expect(isEmpty(result.annotations)).toBe(true);
  });

  it.each([
    'language de',
    'printscale weekly',
    'today is colored in #ff8080',
    '[A] -> [B]',
    '[A] is colored in Fuchsia/FireBrick',
    '-- sep --',
    'group [G]',
    'hide ressources names',
    'hide ressources footbox',
    'hide column duration',
    'hide closed',
    'labels on first column and right aligned',
    'hide footbox',
    'task default completion to 50',
    'print between 2020-01-01 and 2020-01-10',
    'week starts on monday 1',
  ])('accepts the gantt command line %j (initCommandsList, java:91-107)', (line) => {
    const result = parse(`[A] lasts 5 days\n[B] lasts 2 days\n${line}`);
    expect('refused' in result ? `${result.message} @${result.line}` : 'ok').toBe('ok');
  });

  it('accepts `Project starts` first, then a closed group (CommandGroupStart/CommandGroupEnd)', () => {
    const result = parse('Project starts 2020-01-01\ngroup [G]\n[A] lasts 2 days\nend group');
    expect('refused' in result ? `${result.message} @${result.line}` : 'ok').toBe('ok');
  });

  it('dispatches CommandNoteBottom as a multiline block (CommandMultilines2.java:79-111)', () => {
    const result = parse('[A] lasts 5 days\nnote bottom\nsome text\nend note');
    expect('refused' in result ? result.message : 'ok').toBe('ok');
  });

  it('hands a title to the annotations, not to a gantt command (CommonCommands.java:112-128)', () => {
    const result = parsed('title My Gantt\n[A] lasts 5 days');
    expect(isEmpty(result.annotations)).toBe(false);
  });

  it('stores a scale command on the parse result (CommonCommands.addCommonScaleCommands)', () => {
    expect(parsed('scale 2\n[A] lasts 5 days').scale).toEqual({ kind: 'simple', factor: 2 });
  });

  it('consumes the no-op common commands (nope, rotate, minwidth, page, namespace separator)', () => {
    const result = parse('rotate\nminwidth 10\npage 1x2\nset separator ::\n\n[A] lasts 5 days');
    expect('refused' in result ? result.message : 'ok').toBe('ok');
  });

  it('adds the CommandSkinParam deprecation warning (CommandSkinParam.java:88-99)', () => {
    const result = parsed('skinparam padding 2\n[A] lasts 5 days');
    expect(result.diagram.getWarnings().map((w) => w.asSingleLine())).toContain(
      'Please use CSS style instead of skinparam padding',
    );
  });
});

describe('parseGantt: refusals', () => {
  it('refuses a line no command matches with "Syntax Error?" at its document line', () => {
    const refusal = refusedWith('[A] lasts 5 days\nthis is nothing');
    expect(refusal.kind).toBe('syntax');
    expect(refusal.message).toBe(SYNTAX);
    expect(refusal.line).toBe(2);
    expect(refusal.consumed).toBe(1);
  });

  it('refuses a failing command as an execution error carrying its message (NaturalGanttCommand.java:121)', () => {
    const refusal = refusedWith("[A] lasts 5 days\n[A] lasts 3 days and starts 2 days before [A]'s start and foo");
    expect(refusal.kind).toBe('execution');
    expect(refusal.message).toBe(NO_VERB);
    expect(refusal.line).toBe(2);
  });

  it('refuses a note block with no `end note` as a syntax error (an unterminated multiline is no match)', () => {
    const refusal = refusedWith('note bottom\nsome text');
    expect(refusal.kind).toBe('syntax');
    expect(refusal.line).toBe(1);
  });

  it('refuses a Gantt over 20 years with the final kind at the first body line (java:171-181)', () => {
    const refusal = refusedWith('Project starts 2020-01-01\n[A] lasts 8000 days');
    expect(refusal.kind).toBe('final');
    expect(refusal.message).toBe(TOO_LONG);
    expect(refusal.line).toBe(1);
    expect(refusal.consumed).toBe(0);
  });

  it('lets a throwing command propagate: a bare `footbox` is the crash path (CommandFootboxGantt.java:55)', () => {
    expect(() => parse('footbox')).toThrow(TypeError);
  });
});

describe('parseGantt: command order', () => {
  it('lets the common commands claim a line before the gantt commands (java:87-89)', () => {
    // `hide footbox` is a gantt command; `hide empty description` is not -> syntax error.
    expect(refusedWith('hide empty description').kind).toBe('syntax');
    expect('refused' in parse('hide footbox')).toBe(false);
  });
});
