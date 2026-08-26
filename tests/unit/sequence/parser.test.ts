import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type {
  MessageEvent,
  NoteEvent,
  FrameEvent,
  ActivationEvent,
  DividerEvent,
  DelayEvent,
  SpaceEvent,
  SequenceEvent,
  SequenceDiagramAST,
} from '../../../src/diagrams/sequence/ast.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// T4: `parseSequence` now returns `SequenceDiagramAST | ParseRefusal` (D1).
// Every fixture in this file is a complete, valid sequence diagram, so a
// refusal here is always a test defect, not an expected outcome -- throw
// with the refusal's own `kind`/`line`/`message` rather than silently
// narrowing, so a wrongly-refused fixture fails loudly at the right line.
function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function isMessage(e: SequenceEvent): e is MessageEvent {
  return e.kind === 'message';
}

function firstMessage(lines: string[]): MessageEvent {
  const ast = parse(lines);
  const ev = ast.events[0];
  if (!ev || ev.kind !== 'message') throw new Error('Expected message event');
  return ev;
}

// ---------------------------------------------------------------------------
// Participant declarations
// ---------------------------------------------------------------------------

describe('participant declarations', () => {
  it('parses a plain participant', () => {
    const ast = parse(['participant Alice']);
    expect(ast.participants).toHaveLength(1);
    expect(ast.participants[0]).toMatchObject({
      id: 'Alice',
      display: 'Alice',
      type: 'participant',
      order: 0,
    });
  });

  it('parses an actor', () => {
    const ast = parse(['actor Bob']);
    expect(ast.participants[0]).toMatchObject({ id: 'Bob', type: 'actor' });
  });

  it('parses boundary, control, entity, database, collections, queue types', () => {
    const types = [
      'boundary',
      'control',
      'entity',
      'database',
      'collections',
      'queue',
    ] as const;
    for (const t of types) {
      const ast = parse([`${t} X`]);
      expect(ast.participants[0]?.type).toBe(t);
    }
  });

  it('parses quoted display name with alias', () => {
    const ast = parse(['participant "Alice Smith" as A', 'A -> Bob: hi']);
    const p = ast.participants[0];
    expect(p?.id).toBe('A');
    expect(p?.display).toBe('Alice Smith');
  });

  it('parses participant with color', () => {
    const ast = parse(['participant Alice #pink']);
    expect(ast.participants[0]?.color).toBe('#pink');
  });

  it('assigns order based on first-appearance index', () => {
    const ast = parse(['participant A', 'participant B', 'participant C']);
    expect(ast.participants[0]?.order).toBe(0);
    expect(ast.participants[1]?.order).toBe(1);
    expect(ast.participants[2]?.order).toBe(2);
  });

  it('auto-creates participants from message senders/receivers', () => {
    const ast = parse(['Alice -> Bob: hello']);
    expect(ast.participants).toHaveLength(2);
    expect(ast.participants[0]?.id).toBe('Alice');
    expect(ast.participants[1]?.id).toBe('Bob');
  });

  it('auto-created participants have type participant and matching display', () => {
    const ast = parse(['Alice -> Bob: hello']);
    expect(ast.participants[0]).toMatchObject({
      type: 'participant',
      display: 'Alice',
    });
  });

  it('does not duplicate participants already declared', () => {
    const ast = parse(['participant Alice', 'Alice -> Bob: hi']);
    const aliceEntries = ast.participants.filter((p) => p.id === 'Alice');
    expect(aliceEntries).toHaveLength(1);
  });

  // Every participant form ends with the same tail --
  // `StereotypePattern.optional("STEREO")`, `getOrderRegex()`,
  // `UrlBuilder.OPTIONAL`, `ColorParser.exp1()`
  // (`CommandParticipantA.java:63-69`). The stereotype belongs on the
  // Participant (`CommandParticipant.java:174-181`), NOT in its code: baking
  // it in made `Alice <<alice>>` and `Alice` two different participants.
  it('keeps a stereotype out of the participant identity', () => {
    const ast = parse(['participant Alice <<alice>>', 'Alice -> Bob: hi']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Alice', 'Bob']);
    expect(ast.participants[0]?.stereotype).toBe('<<alice>>');
  });

  it('strips order, url and color from the identity too', () => {
    const ast = parse(['participant Alice <<a>> order 30 [[http://x]] #pink']);
    expect(ast.participants[0]?.id).toBe('Alice');
    expect(ast.participants[0]?.color).toBe('#pink');
    expect(ast.participants[0]?.stereotype).toBe('<<a>>');
  });

  // The four registered name forms: `["FULL" as] CODE`
  // (`CommandParticipantA`), `CODE as "FULL"` (`A2`), `FULL as CODE` (`A3`)
  // and `"CODE"` (`A4`). A2 was previously unhandled and fell through to the
  // bare-name branch, taking `A as "Big A"` as one id.
  it('parses all four upstream name forms', () => {
    expect(parse(['participant "Big A" as A']).participants[0]).toMatchObject({ id: 'A', display: 'Big A' });
    expect(parse(['participant A as "Big A"']).participants[0]).toMatchObject({ id: 'A', display: 'Big A' });
    expect(parse(['participant Big as A']).participants[0]).toMatchObject({ id: 'A', display: 'Big' });
    expect(parse(['participant "Big A"']).participants[0]).toMatchObject({ id: 'Big A', display: 'Big A' });
  });

  // `hide stereotype` reaches sequence diagrams via
  // `SequenceDiagramFactory:100` -> `CommonCommands#addCommonCommands1` ->
  // `addCommonHides` (`CommonCommands.java:103-106`). T13 recorded it as an
  // unmodelled no-op; the registration is one level down.
  it('hide stereotype drops the stereotype', () => {
    const ast = parse(['hide stereotype', 'participant Alice <<alice>>']);
    expect(ast.participants[0]?.stereotype).toBeUndefined();
    expect(ast.participants[0]?.id).toBe('Alice');
  });

  // The activation suffix is not part of a participant name: upstream's
  // PART2CODE is `([%pLN_.@]+)` and `--` is taken by ACTIVATION
  // (`CommandArrow.java:119,126`).
  it('does not admit an activation suffix into a participant name', () => {
    const ast = parse(['participant Alice', 'participant Bob', 'Alice <- Bob--: 500']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Alice', 'Bob']);
  });
});

// ---------------------------------------------------------------------------
// Message events — arrow styles
// ---------------------------------------------------------------------------

// T6: `MessageEvent.style` is gone; the parser builds an
// `ArrowConfiguration` (D1). These pin the shape each token produces; the
// EXHAUSTIVE parity proof against the deleted adapter is in
// `sequence-arrowhead.test.ts`.
describe('message arrow styles', () => {
  it('-> produces a solid NORMAL head on dressing2', () => {
    const ev = firstMessage(['Alice -> Bob: hello']);
    expect(ev.arrow.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(ev.arrow.dressing1).toEqual({ head: 'NONE', part: 'FULL' });
    expect(ev.arrow.dashed).toBe(false);
    expect(ev.from).toBe('Alice');
    expect(ev.to).toBe('Bob');
    expect(ev.label).toBe('hello');
  });

  it('->> produces an ASYNC head, still solid', () => {
    const ev = firstMessage(['Alice ->> Bob: go']);
    expect(ev.arrow.dressing2).toEqual({ head: 'ASYNC', part: 'FULL' });
    expect(ev.arrow.dashed).toBe(false);
  });

  it('--> produces a dashed body with a NORMAL head', () => {
    const ev = firstMessage(['Alice --> Bob: ok']);
    expect(ev.arrow.dashed).toBe(true);
    expect(ev.arrow.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
  });

  it('-->> produces a dashed body with an ASYNC head', () => {
    const ev = firstMessage(['Alice -->> Bob: ok']);
    expect(ev.arrow.dashed).toBe(true);
    expect(ev.arrow.dressing2).toEqual({ head: 'ASYNC', part: 'FULL' });
  });

  // `->?`/`?->` were the spike's lost/found shorthand. Neither is a dressing
  // upstream recognises: `?` is `CommandExoArrowLeft`'s ARROW_SUPPCIRCLE2
  // marker `([?\[\]][ox]?)?` (`CommandExoArrowLeft.java:60`) for an arrow
  // whose other end is OFF-DIAGRAM, and `PART1CODE`/`PART2CODE`
  // (`CommandArrow.java:93,119`) cannot absorb it. The jar answers `Error
  // line 2` for both (measured with `scripts/oracle-render.sh`, T7), so once
  // T7 rebuilt this command from upstream's own groups they became refusals
  // -- and the exo family that owns them is still unported.
  it.each(['Alice ->? Bob: lost', 'Alice ?-> Bob: found'])(
    'refuses %s, which is the exo family, not an arrow dressing',
    (line) => {
      const result = parseSequence([line]);
      expect('refused' in result).toBe(true);
    },
  );

  it('self-message: from === to', () => {
    const ev = firstMessage(['Alice -> Alice: think']);
    expect(ev.from).toBe('Alice');
    expect(ev.to).toBe('Alice');
  });

  it('message without label gets empty label', () => {
    const ev = firstMessage(['Alice -> Bob']);
    expect(ev.label).toBe('');
  });

  it('++ shorthand sets activates field', () => {
    const ev = firstMessage(['Alice -> Bob ++: call']);
    expect(ev.activates).toBe('Bob');
  });

  // `manageActivations` is NOT symmetric: `+` activates p2, the message
  // TARGET, but `-` deactivates p1, the message SOURCE
  // (`CommandArrow.java:447,450`). This used to assert the target.
  it('-- shorthand deactivates the message SOURCE, not the target', () => {
    const ev = firstMessage(['Alice -> Bob --: done']);
    expect(ev.deactivates).toBe('Alice');
    expect(ev.activates).toBeUndefined();
  });

  it('++ shorthand activates the message TARGET', () => {
    const ev = firstMessage(['Alice -> Bob ++: go']);
    expect(ev.activates).toBe('Bob');
    expect(ev.deactivates).toBeUndefined();
  });

  // `spec.charAt(0)` -- only the FIRST character is read
  // (`CommandArrow.java:445`), so a combined suffix is one life event, not two.
  it('reads only the first character of a combined suffix', () => {
    const minusPlus = firstMessage(['Alice -> Bob --++: x']);
    expect(minusPlus.deactivates).toBe('Alice');
    expect(minusPlus.activates).toBeUndefined();
    const plusMinus = firstMessage(['Alice -> Bob ++--: x']);
    expect(plusMinus.activates).toBe('Bob');
    expect(plusMinus.deactivates).toBeUndefined();
  });

  // Upstream has ONE `CommandArrow` for both directions, so the suffix
  // applies to a reversed arrow too -- and against the RESOLVED source/target
  // (`CommandArrow.java:315-338,443-456`). `Alice <- Bob --` is a message
  // FROM Bob, so Bob is the one deactivated. Before T20 this path had no
  // ACTIVATION group at all and declared a participant named `Bob--`.
  it('applies the suffix on a reversed arrow, against the resolved source', () => {
    const ev = firstMessage(['Alice <- Bob --: ok']);
    expect(ev.deactivates).toBe('Bob');
  });

  it('produces kind: message', () => {
    const ev = firstMessage(['Alice -> Bob: hi']);
    expect(ev.kind).toBe('message');
  });
});

// ---------------------------------------------------------------------------
// Autonumber
// ---------------------------------------------------------------------------

describe('autonumber', () => {
  it('off by default', () => {
    const ast = parse(['Alice -> Bob: hi']);
    expect(ast.autonumber.enabled).toBe(false);
  });

  it('autonumber enables sequenceNumber on messages', () => {
    const ast = parse(['autonumber', 'Alice -> Bob: hi', 'Bob --> Alice: ok']);
    const msgs = ast.events.filter(isMessage);
    expect(msgs[0]?.sequenceNumber).toBe(1);
    expect(msgs[1]?.sequenceNumber).toBe(2);
  });

  it('autonumber with start value begins at that number', () => {
    const ast = parse(['autonumber 5', 'Alice -> Bob: hi']);
    const msg = ast.events.find(isMessage);
    expect(msg?.sequenceNumber).toBe(5);
  });

  it('stores autonumber state in ast.autonumber', () => {
    const ast = parse(['autonumber 10', 'Alice -> Bob: hi']);
    expect(ast.autonumber.enabled).toBe(true);
    expect(ast.autonumber.start).toBe(10);
  });

  it('messages without autonumber have no sequenceNumber', () => {
    const ast = parse(['Alice -> Bob: hi']);
    const msg = ast.events.find(isMessage);
    expect(msg?.sequenceNumber).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Activation events
// ---------------------------------------------------------------------------

// T4: every fixture below is prefixed with an explicit `participant`
// declaration. Upstream's `CommandActivate#executeArg` auto-creates the
// participant via `getOrCreateParticipant` (`CommandActivate.java:107-108`),
// so a bare `activate Alice` is a COMPLETE document upstream. This port's
// `activate`/`deactivate`/`destroy` commands do not yet call
// `ensureParticipant` (a pre-existing gap in `command-participant.ts`, out of
// T4's additive-only scope -- fixing it would change successful-parse AST
// shape, which acceptance criterion 2 forbids); without the prefix these
// fixtures have zero registered participants and trip the new `isIncomplete`
// refusal (`SequenceDiagram.java:585-587`) that upstream itself would not
// hit. `participant` never emits an event, so `ast.events[0]` assertions
// below are unaffected.
describe('activation events', () => {
  it('activate produces activate event', () => {
    const ast = parse(['participant Alice', 'activate Alice']);
    const ev = ast.events[0] as ActivationEvent | undefined;
    expect(ev?.kind).toBe('activate');
    expect(ev?.participantId).toBe('Alice');
  });

  it('deactivate produces deactivate event', () => {
    const ast = parse(['participant Alice', 'deactivate Alice']);
    const ev = ast.events[0] as ActivationEvent | undefined;
    expect(ev?.kind).toBe('deactivate');
    expect(ev?.participantId).toBe('Alice');
  });

  it('destroy also produces deactivate event', () => {
    const ast = parse(['participant Alice', 'destroy Alice']);
    const ev = ast.events[0] as ActivationEvent | undefined;
    expect(ev?.kind).toBe('deactivate');
  });

  it('activate with color stores color', () => {
    const ast = parse(['participant Alice', 'activate Alice #red']);
    const ev = ast.events[0] as ActivationEvent | undefined;
    expect(ev?.color).toBe('#red');
  });

  it('activate then deactivate produces two events in order', () => {
    const ast = parse(['participant Alice', 'activate Alice', 'deactivate Alice']);
    expect(ast.events[0]?.kind).toBe('activate');
    expect(ast.events[1]?.kind).toBe('deactivate');
  });
});

// ---------------------------------------------------------------------------
// Note events
// ---------------------------------------------------------------------------

// T4: every fixture below is prefixed with `participant` declarations for
// every name the note references. Upstream's note commands auto-create the
// participant via `getOrCreateParticipant`
// (`FactorySequenceNoteCommand.java:224`,
// `FactorySequenceNoteOverSeveralCommand.java:230-232`), so a bare
// `note left of Alice` is a COMPLETE document upstream. This port's note
// command does not yet call `ensureParticipant` (same pre-existing,
// out-of-scope gap noted on the activation-events block above); the prefix
// keeps these fixtures complete under the new `isIncomplete` refusal without
// changing what each test exercises. `participant` never emits an event, so
// `ast.events[0]` assertions below are unaffected.
describe('note events', () => {
  it('note left of produces NoteEvent with position left', () => {
    const ast = parse(['participant Alice', 'note left of Alice', 'some text', 'end note']);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.position).toBe('left');
    expect(ev?.participants).toEqual(['Alice']);
    expect(ev?.text).toBe('some text');
  });

  it('note right of produces NoteEvent with position right', () => {
    const ast = parse(['participant Bob', 'note right of Bob', 'text', 'end note']);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.position).toBe('right');
    expect(ev?.participants).toEqual(['Bob']);
  });

  it('note over produces NoteEvent with position over', () => {
    const ast = parse(['participant Alice', 'note over Alice', 'text', 'end note']);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.position).toBe('over');
  });

  it('note over with multiple participants', () => {
    const ast = parse([
      'participant Alice',
      'participant Bob',
      'note over Alice, Bob',
      'shared note',
      'end note',
    ]);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.participants).toEqual(['Alice', 'Bob']);
  });

  it('multi-line note accumulates all lines', () => {
    const ast = parse([
      'participant Alice',
      'note left of Alice',
      'line one',
      'line two',
      'end note',
    ]);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.text).toBe('line one\nline two');
  });

  it('note with color stores color', () => {
    const ast = parse(['participant Alice', 'note left of Alice #yellow', 'text', 'end note']);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.color).toBe('#yellow');
  });

  // --- single-line (inline) note forms ---

  it('note right of Bob: processing — single-line, position right', () => {
    const ast = parse(['participant Bob', 'note right of Bob: processing']);
    expect(ast.events).toHaveLength(1);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.position).toBe('right');
    expect(ev?.participants).toEqual(['Bob']);
    expect(ev?.text).toBe('processing');
  });

  it('note over Alice, Bob: done — single-line, multiple participants', () => {
    const ast = parse(['participant Alice', 'participant Bob', 'note over Alice, Bob: done']);
    expect(ast.events).toHaveLength(1);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.position).toBe('over');
    expect(ev?.participants).toEqual(['Alice', 'Bob']);
    expect(ev?.text).toBe('done');
  });

  it('inline note with literal \\n escape becomes actual newline', () => {
    const ast = parse([
      'participant Auth',
      'participant DB',
      'note over Auth, DB: credentials never leave\\nthe auth service',
    ]);
    expect(ast.events).toHaveLength(1);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.participants).toEqual(['Auth', 'DB']);
    expect(ev?.text).toBe('credentials never leave\nthe auth service');
  });

  it('multi-line note (no colon on header) still works — no regression', () => {
    const ast = parse(['participant Alice', 'note over Alice', 'multi line', 'end note']);
    expect(ast.events).toHaveLength(1);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.position).toBe('over');
    expect(ev?.participants).toEqual(['Alice']);
    expect(ev?.text).toBe('multi line');
  });

  it('note over Bob #yellow: hello — color + inline text', () => {
    const ast = parse(['participant Bob', 'note over Bob #yellow: hello']);
    expect(ast.events).toHaveLength(1);
    const ev = ast.events[0] as NoteEvent | undefined;
    expect(ev?.kind).toBe('note');
    expect(ev?.color).toBe('#yellow');
    expect(ev?.text).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// Frame events (loop, alt, opt, par, break, critical, group)
// ---------------------------------------------------------------------------

describe('frame events', () => {
  it('loop creates FrameEvent with frameType loop', () => {
    const ast = parse(['loop 3 times', 'Alice -> Bob: ping', 'end']);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.kind).toBe('frame');
    expect(ev?.frameType).toBe('loop');
    expect(ev?.label).toBe('3 times');
    expect(ev?.branches[0]).toHaveLength(1);
  });

  it('opt creates FrameEvent with frameType opt', () => {
    const ast = parse(['opt condition', 'Alice -> Bob: msg', 'end']);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.frameType).toBe('opt');
  });

  it('alt with else creates two branches', () => {
    const ast = parse([
      'alt success',
      'Alice -> Bob: ok',
      'else failure',
      'Alice -> Bob: fail',
      'end',
    ]);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.frameType).toBe('alt');
    expect(ev?.branches).toHaveLength(2);
    expect(ev?.branches[0]).toHaveLength(1);
    expect(ev?.branches[1]).toHaveLength(1);
  });

  it('else label is used as frame label for that branch', () => {
    const ast = parse([
      'alt success',
      'Alice -> Bob: ok',
      'else failure',
      'Alice -> Bob: fail',
      'end',
    ]);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.label).toBe('success');
  });

  it('par creates FrameEvent with frameType par', () => {
    const ast = parse(['par thread', 'Alice -> Bob: msg', 'end']);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.frameType).toBe('par');
  });

  it('group creates FrameEvent with frameType group', () => {
    const ast = parse(['group My Group', 'Alice -> Bob: msg', 'end']);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.frameType).toBe('group');
    expect(ev?.label).toBe('My Group');
  });

  it('nested frames: inner frame appears inside outer branch', () => {
    const ast = parse([
      'loop outer',
      'opt inner',
      'Alice -> Bob: msg',
      'end',
      'end',
    ]);
    const outerFrame = ast.events[0] as FrameEvent | undefined;
    expect(outerFrame?.frameType).toBe('loop');
    const innerEvent = outerFrame?.branches[0]?.[0] as FrameEvent | undefined;
    expect(innerEvent?.frameType).toBe('opt');
  });

  it('frame with no label gets empty string label', () => {
    const ast = parse(['loop', 'Alice -> Bob: ping', 'end']);
    const ev = ast.events[0] as FrameEvent | undefined;
    expect(ev?.label).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Divider events
// ---------------------------------------------------------------------------

// T4: prefixed with `participant Alice` -- a divider never references a
// participant, so a bare divider-only document has zero registered
// participants and IS incomplete upstream too
// (`SequenceDiagram.java:585-587`); the prefix makes each fixture a
// complete document without adding an event (`ast.events[0]` unaffected).
describe('divider events', () => {
  it('== Section == produces DividerEvent', () => {
    const ast = parse(['participant Alice', '== Section ==']);
    const ev = ast.events[0] as DividerEvent | undefined;
    expect(ev?.kind).toBe('divider');
    expect(ev?.text).toBe('Section');
  });

  it('divider text is trimmed', () => {
    const ast = parse(['participant Alice', '==  My Section  ==']);
    const ev = ast.events[0] as DividerEvent | undefined;
    expect(ev?.text).toBe('My Section');
  });
});

// ---------------------------------------------------------------------------
// Delay events
// ---------------------------------------------------------------------------

// T4: prefixed with `participant Alice` -- same rationale as the divider
// block above (`ast.events[0]` unaffected, since `participant` emits no
// event).
describe('delay events', () => {
  it('... alone produces DelayEvent with no text', () => {
    const ast = parse(['participant Alice', '...']);
    const ev = ast.events[0] as DelayEvent | undefined;
    expect(ev?.kind).toBe('delay');
    expect(ev?.text).toBeUndefined();
  });

  it('...text... produces DelayEvent with text', () => {
    const ast = parse(['participant Alice', '...5 minutes later...']);
    const ev = ast.events[0] as DelayEvent | undefined;
    expect(ev?.kind).toBe('delay');
    expect(ev?.text).toBe('5 minutes later');
  });
});

// ---------------------------------------------------------------------------
// Space events
// ---------------------------------------------------------------------------

// T4: prefixed with `participant Alice` -- same rationale as the divider
// block above.
describe('space events', () => {
  it('|||  produces SpaceEvent with default 5 pixels', () => {
    const ast = parse(['participant Alice', '|||']);
    const ev = ast.events[0] as SpaceEvent | undefined;
    expect(ev?.kind).toBe('space');
    expect(ev?.pixels).toBe(5);
  });

  it('||25| produces SpaceEvent with 25 pixels', () => {
    const ast = parse(['participant Alice', '||25|']);
    const ev = ast.events[0] as SpaceEvent | undefined;
    expect(ev?.kind).toBe('space');
    expect(ev?.pixels).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

// T4: `parse([])` (zero lines, zero participants) now hits the new
// `isIncomplete` refusal -- a genuinely empty document is special-cased
// upstream too (`finalizeDiagram`'s earlier `getTotalLineCount() == 2`
// check, `PSystemCommandFactory.java:143-146`), just via a different path
// than this one. `['participant Alice']` is the minimal complete document
// that still leaves every field under test at its default.
describe('options', () => {
  it('hide footbox sets hideFootbox to true', () => {
    const ast = parse(['participant Alice', 'hide footbox']);
    expect(ast.options.hideFootbox).toBe(true);
  });

  it('hideFootbox is false by default', () => {
    const ast = parse(['participant Alice']);
    expect(ast.options.hideFootbox).toBe(false);
  });

  it('skinparam sequenceMessageAlign sets messageAlign', () => {
    const ast = parse(['participant Alice', 'skinparam sequenceMessageAlign center']);
    expect(ast.options.messageAlign).toBe('center');
  });

  it('messageAlign defaults to left', () => {
    const ast = parse(['participant Alice']);
    expect(ast.options.messageAlign).toBe('left');
  });
});

// ---------------------------------------------------------------------------
// Return command
// ---------------------------------------------------------------------------

describe('return command', () => {
  it('return creates a reply message to the most recent sender', () => {
    const ast = parse(['Alice -> Bob: call', 'return result']);
    const returnMsg = ast.events[1] as MessageEvent | undefined;
    expect(returnMsg?.kind).toBe('message');
    expect(returnMsg?.from).toBe('Bob');
    expect(returnMsg?.to).toBe('Alice');
    expect(returnMsg?.arrow.dashed).toBe(true);
    expect(returnMsg?.arrow.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(returnMsg?.label).toBe('result');
  });

  it('return with no label produces empty label', () => {
    const ast = parse(['Alice -> Bob: call', 'return']);
    const returnMsg = ast.events[1] as MessageEvent | undefined;
    expect(returnMsg?.label).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Default AST shape
// ---------------------------------------------------------------------------

describe('default AST shape', () => {
  // T4: empty input is now a whole-document `isIncomplete` refusal
  // (`SequenceDiagram.java:585-587` -- zero participants), not a successful
  // parse of an empty AST; a genuinely empty document is special-cased
  // upstream too (`finalizeDiagram`'s `getTotalLineCount() == 2` check,
  // `PSystemCommandFactory.java:143-146`), just via a different path. This
  // replaces the old "successful parse of []" assertion with the new
  // contract directly, using `parseSequence` (not the throwing `parse`
  // helper, which exists precisely to make an unexpected refusal loud).
  it('refuses empty input as incomplete (no participants)', () => {
    const result = parseSequence([]);
    if (!('refused' in result)) throw new Error('expected a refusal for empty input');
    expect(result.kind).toBe('incomplete');
    expect(result.line).toBe(0);
    expect(result.consumed).toBe(0);
  });

  it('autonumber defaults to disabled with start 1', () => {
    const ast = parse(['participant Alice']);
    expect(ast.autonumber).toEqual({
      enabled: false,
      start: 1,
      current: 1,
      step: 1,
      prefix: '',
    });
  });
});

// ---------------------------------------------------------------------------
// box / end box
// ---------------------------------------------------------------------------

describe('box / end box parsing', () => {
  // T4: `['participant Alice']` is the minimal complete document -- see the
  // "default AST shape" block's comment for why `parse([])` no longer
  // succeeds.
  it('boxes defaults to empty array', () => {
    const ast = parse(['participant Alice']);
    expect(ast.boxes).toEqual([]);
  });

  it('box with label and color creates a BoxGroup', () => {
    const ast = parse([
      'box "Frontend" #LightBlue',
      'participant Alice',
      'end box',
    ]);
    expect(ast.boxes).toHaveLength(1);
    expect(ast.boxes[0]?.label).toBe('Frontend');
    expect(ast.boxes[0]?.color).toBe('#LightBlue');
  });

  it('box with color only has empty label', () => {
    const ast = parse([
      'box #pink',
      'participant Alice',
      'end box',
    ]);
    expect(ast.boxes).toHaveLength(1);
    expect(ast.boxes[0]?.label).toBe('');
    expect(ast.boxes[0]?.color).toBe('#pink');
  });

  it('box with label only has empty color', () => {
    const ast = parse([
      'box "Backend"',
      'participant Bob',
      'end box',
    ]);
    expect(ast.boxes).toHaveLength(1);
    expect(ast.boxes[0]?.label).toBe('Backend');
    expect(ast.boxes[0]?.color).toBe('');
  });

  it('bare box (no label, no color) creates a BoxGroup with empty strings', () => {
    const ast = parse([
      'box',
      'participant Alice',
      'end box',
    ]);
    expect(ast.boxes).toHaveLength(1);
    expect(ast.boxes[0]?.label).toBe('');
    expect(ast.boxes[0]?.color).toBe('');
  });

  it('participant declared inside box has boxId matching the box id', () => {
    const ast = parse([
      'box "Group" #yellow',
      'participant Alice',
      'end box',
    ]);
    const alice = ast.participants.find((p) => p.id === 'Alice');
    expect(alice?.boxId).toBe(ast.boxes[0]?.id);
  });

  it('participant declared outside box has no boxId', () => {
    const ast = parse([
      'box "Group" #yellow',
      'participant Alice',
      'end box',
      'participant Bob',
    ]);
    const bob = ast.participants.find((p) => p.id === 'Bob');
    expect(bob?.boxId).toBeUndefined();
  });

  it('multiple participants in a box are all in participantIds', () => {
    const ast = parse([
      'box "Team" #blue',
      'participant Alice',
      'participant Bob',
      'end box',
    ]);
    expect(ast.boxes[0]?.participantIds).toEqual(['Alice', 'Bob']);
  });

  it('multiple boxes are collected in order', () => {
    const ast = parse([
      'box "A" #red',
      'participant Alice',
      'end box',
      'box "B" #blue',
      'participant Bob',
      'end box',
    ]);
    expect(ast.boxes).toHaveLength(2);
    expect(ast.boxes[0]?.label).toBe('A');
    expect(ast.boxes[1]?.label).toBe('B');
  });

  it('each box gets a unique id', () => {
    const ast = parse([
      'box "A" #red',
      'participant Alice',
      'end box',
      'box "B" #blue',
      'participant Bob',
      'end box',
    ]);
    expect(ast.boxes[0]?.id).not.toBe(ast.boxes[1]?.id);
  });

  it('end box with no open box is a no-op', () => {
    const ast = parse(['participant Alice', 'end box']);
    expect(ast.boxes).toHaveLength(0);
  });

  it('implicit participants inside box also get boxId (via message)', () => {
    const ast = parse([
      'box "X" #green',
      'Alice -> Bob: hello',
      'end box',
    ]);
    // Both Alice and Bob are created implicitly while box is open
    const alice = ast.participants.find((p) => p.id === 'Alice');
    const bob = ast.participants.find((p) => p.id === 'Bob');
    expect(alice?.boxId).toBe(ast.boxes[0]?.id);
    expect(bob?.boxId).toBe(ast.boxes[0]?.id);
  });
});
