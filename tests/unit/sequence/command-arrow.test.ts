/**
 * `CommandArrow` rebuilt from composed named groups (T7).
 *
 * Three kinds of assertion live here:
 *
 *  1. The nine forms retired from `sequence-arrowhead.test.ts`'s
 *     `LEGACY_TOKEN_ORACLE`. That table pinned what the DELETED enumerated
 *     regexes produced, and its own header says T7 must CHOOSE whether to
 *     keep each quirk. These nine are the ones the Java disproves, so each
 *     row below carries the `executeArg` line that decides it AND the jar
 *     rendering that confirms it (`scripts/oracle-render.sh`, never a
 *     hand-typed `java -jar`, which omits `-DPLANTUML_DETERMINISTIC_TEXT`).
 *  2. The groups the enumerated form could not express at all: PART1/PART2's
 *     four alternatives, MULTICAST, ANCHOR, PARALLEL, ARROW_STYLE1/2, and the
 *     STEREOTYPE and URL fragments `sequence-arrow-regex.ts` deliberately
 *     leaves out of its skeleton.
 *  3. The two-branch dispatch split, which must stay disjoint and must not
 *     change the frozen registry order (D2).
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:87-133,296-430
 */

import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { MessageEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import {
  ARROW_SOURCE,
  DRESSED_ARROW_SOURCE,
  UNDRESSED_ARROW_SOURCE,
  arrowCommand,
  decoratedArrowCommand,
  getInclination,
  returnCommand,
} from '../../../src/diagrams/sequence/command-arrow.js';
import { SEQUENCE_COMMANDS } from '../../../src/diagrams/sequence/sequence-command-registry.js';
import { LIFECOLOR } from '../../../src/diagrams/sequence/sequence-arrow-regex.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsed(...lines: readonly string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`refused (${result.kind}): ${result.message}`);
  }
  return result;
}

function firstMessage(...lines: readonly string[]): MessageEvent {
  const msg = parsed(...lines).events.find((e) => e.kind === 'message');
  if (msg === undefined) throw new Error(`no message in ${lines.join(' / ')}`);
  return msg;
}

function refused(line: string): boolean {
  return 'refused' in parseSequence([line]);
}

/** The five drawing facts `executeArg` decides, flattened for comparison. */
function shape(msg: MessageEvent): Record<string, unknown> {
  return {
    from: msg.from,
    to: msg.to,
    head1: msg.arrow.dressing1.head,
    head2: msg.arrow.dressing2.head,
    decoration1: msg.arrow.decoration1,
    decoration2: msg.arrow.decoration2,
    dashed: msg.arrow.dashed,
  };
}

// ---------------------------------------------------------------------------
// 1. The nine rows retired from LEGACY_TOKEN_ORACLE
// ---------------------------------------------------------------------------

/**
 * Each row is jar-verified. `head1: 'NORMAL'` on a form with a dressing at
 * BOTH ends is `withDirectionBoth()` (`CommandArrow.java:351`,
 * `ArrowConfiguration.java:94-98`); `ASYNC` on either side is `sync1`/`sync2`
 * (`:329-330,336-337`); and `from`/`to` never swap when the RIGHT dressing
 * carries a direction, because `hasDressing2butx` forces `reverseDefine`
 * false before the left dressing is even consulted (`:306-307`).
 */
const REBUILT_FORMS: readonly {
  readonly src: string;
  readonly why: string;
  readonly expected: Record<string, unknown>;
}[] = [
  {
    src: 'Alice o->> Bob',
    // sync2 = contains(dressing2, ">>", ...) -- the deleted table read the
    // shaft length instead and produced a NORMAL head. `:337`
    why: 'sync2 comes from dressing2, not from the shaft length',
    expected: { from: 'Alice', to: 'Bob', head1: 'NONE', head2: 'ASYNC', decoration1: 'CIRCLE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice ->>o Bob',
    why: 'circleAtEnd is dressing2 `o`, and `>>` still gives ASYNC (`:328,337`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NONE', head2: 'ASYNC', decoration1: 'NONE', decoration2: 'CIRCLE', dashed: false },
  },
  {
    src: 'Alice o-->> Bob',
    why: 'getLength() > 1 dots the body independently of the head (`:340,352`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NONE', head2: 'ASYNC', decoration1: 'CIRCLE', decoration2: 'NONE', dashed: true },
  },
  {
    src: 'Alice <-> Bob',
    why: 'both dressings carry a direction: withDirectionBoth, NOT a reverse (`:306,351`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NORMAL', head2: 'NORMAL', decoration1: 'NONE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice <<-> Bob',
    why: 'sync1 from `<<` overwrites the NORMAL head withDirectionBoth gave dressing1 (`:336,355`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'ASYNC', head2: 'NORMAL', decoration1: 'NONE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice <->> Bob',
    why: 'the mirror of the row above, on dressing2 (`:337,357`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NORMAL', head2: 'ASYNC', decoration1: 'NONE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice o<->x Bob',
    why: 'circleAtStart is the LEFT `o` and CROSSX the RIGHT `x`, un-swapped (`:327-328,373-387`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NORMAL', head2: 'CROSSX', decoration1: 'CIRCLE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice \\\\-> Bob',
    why: 'a doubled backslash is one of the three sync1 tokens (`:336`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'ASYNC', head2: 'NORMAL', decoration1: 'NONE', decoration2: 'NONE', dashed: false },
  },
  {
    src: 'Alice /-> Bob',
    why: 'a single `/` is a direction but not an async token, so withDirectionBoth alone (`:302,306,351`)',
    expected: { from: 'Alice', to: 'Bob', head1: 'NORMAL', head2: 'NORMAL', decoration1: 'NONE', decoration2: 'NONE', dashed: false },
  },
];

describe('CommandArrow — the forms the deleted enumerated table got wrong', () => {
  it.each(REBUILT_FORMS)('$src — $why', ({ src, expected }) => {
    expect(shape(firstMessage(`${src} : hi`))).toEqual(expected);
  });

  // `ArrowPart` (`:361-365`) and `withInclination` (`:393`) are matched and
  // not carried yet -- T12 wires them. Pinned so the gap is visible rather
  // than silent: the jar draws `/->`'s right head as a THREE-point half
  // polygon, this port draws the full four-point one.
  it('leaves the half-head ArrowPart at FULL until T12 wires it', () => {
    expect(firstMessage('Alice /-> Bob : hi').arrow.dressing2.part).toBe('FULL');
    expect(firstMessage('Alice ->(40) Bob : hi').arrow.inclination).toBeUndefined();
  });
});

describe('CommandArrow — forms upstream itself refuses', () => {
  // All four are `Error line 2` from the pinned oracle jar. `?` belongs to
  // CommandExoArrowLeft/Right's ARROW_SUPPCIRCLE (`CommandExoArrowLeft.java:60`)
  // and neither `>\\` nor `>/` is an ARROW_DRESSING2 alternative (`:112-116`).
  it.each(['Alice ->? Bob : hi', 'Alice ?-> Bob : hi', 'Alice ->\\\\ Bob : hi', 'Alice ->/ Bob : hi'])(
    'refuses %s',
    (line) => {
      expect(refused(line)).toBe(true);
    },
  );

  // The THIRD reverseDefine branch (`:311`): neither dressing carries a
  // `<`/`>`/`\\`/`/` direction, but one carries an `x`, so the arrow is
  // defined left-to-right after all. Jar-verified: `A -x B` draws a saltire
  // at the RIGHT end and no head at the left, `A x- B` a saltire at the left
  // and a full NORMAL polygon at the right.
  it.each([
    ['A -x B : hi', { from: 'A', to: 'B', head1: 'NONE', head2: 'CROSSX' }],
    ['A x- B : hi', { from: 'A', to: 'B', head1: 'CROSSX', head2: 'NORMAL' }],
  ])('reads %s as a forward arrow decided by the x alone', (line, expected) => {
    expect(shape(firstMessage(line))).toMatchObject(expected);
  });

  // `CommandExecutionResult.error("Illegal sequence arrow")` (`:314`): a body
  // with no direction on either end. This port has no execution-refusal
  // channel, so the line is consumed and emits nothing -- leaving the
  // diagram with no participants at all here.
  it('emits nothing for a body with no direction on either dressing', () => {
    const result = parseSequence(['Alice - Bob : hi']);
    expect('refused' in result && result.kind).toBe('incomplete');
  });
});

// ---------------------------------------------------------------------------
// 2. Groups the enumerated form could not express
// ---------------------------------------------------------------------------

describe('CommandArrow — PART1/PART2 alternatives', () => {
  it('PART1CODE/PART2CODE never absorb the dash of the arrow itself', () => {
    const ast = parsed('C-->B');
    expect(ast.participants.map((p) => p.id)).toEqual(['C', 'B']);
  });

  it('PART2LONG takes both code and display from the quoted run', () => {
    const ast = parsed('A -> "Bob Smith" : hi');
    expect(ast.participants[1]).toMatchObject({ id: 'Bob Smith', display: 'Bob Smith' });
  });

  it('PART2LONGCODE declares "Long" as Code inline', () => {
    const ast = parsed('A -> "Castor doo()" as Castor : hello');
    expect(ast.participants[1]).toMatchObject({ id: 'Castor', display: 'Castor doo()' });
    expect(firstMessage('A -> "Castor doo()" as Castor : hello').to).toBe('Castor');
  });

  it('PART1CODELONG declares Code as "Long" inline', () => {
    const ast = parsed('A as "Alpha" -> B : hi');
    expect(ast.participants[0]).toMatchObject({ id: 'A', display: 'Alpha' });
  });

  it('PART1LONGCODE declares the tail endpoint too', () => {
    const ast = parsed('"Long name" as L -> B : hi');
    expect(ast.participants[0]).toMatchObject({ id: 'L', display: 'Long name' });
  });

  // Upstream assigns `p2 = getOrCreateParticipant(... "PART1")` FIRST in the
  // reverse branch (`:322-323`), so a right-to-left arrow still declares its
  // left-hand participant first -- and therefore draws it leftmost.
  it('declares PART1 before PART2 even when the arrow is written backwards', () => {
    const ast = parsed('Aaa <- Bbb : hi');
    expect(ast.participants.map((p) => p.id)).toEqual(['Aaa', 'Bbb']);
    expect(shape(firstMessage('Aaa <- Bbb : hi'))).toMatchObject({ from: 'Bbb', to: 'Aaa' });
  });
});

describe('CommandArrow — MULTICAST, ANCHOR, PARALLEL', () => {
  it('splits MULTICAST on & and declares every extra target (:139-155)', () => {
    const ast = parsed('A -> B & C & D : multi');
    expect(ast.participants.map((p) => p.id)).toEqual(['A', 'B', 'C', 'D']);
    const msg = ast.events.find((e) => e.kind === 'message')!;
    expect(msg.multicast).toEqual(['C', 'D']);
  });

  it('omits multicast entirely when no & follows PART2', () => {
    expect(firstMessage('A -> B : hi').multicast).toBeUndefined();
  });

  // D4: stored, never drawn -- every upstream consumer of getAnchor()/
  // isParallel() lives under sequencediagram/teoz/.
  it('stores ANCHOR group 1 and the PARALLEL marker without emitting anything else', () => {
    const msg = firstMessage('& {anc} A -> B : both');
    expect(msg.anchor).toBe('anc');
    expect(msg.parallel).toBe(true);
    expect(parsed('& {anc} A -> B : both').events).toHaveLength(1);
  });

  it('leaves anchor and parallel absent on a plain arrow', () => {
    const msg = firstMessage('A -> B : hi');
    expect(msg.anchor).toBeUndefined();
    expect(msg.parallel).toBeUndefined();
  });

  // PART2ANCHOR sits immediately after MULTICAST with no space before it
  // (`:124`), which is why `B{p2a}` parses and `B {p2a}` does not.
  it('accepts PART2ANCHOR hard against the endpoint, and carries no AST field for it', () => {
    expect(firstMessage('A -> B{p2a} : hi').to).toBe('B');
    expect(firstMessage('A -> B{p2a} : hi').anchor).toBeUndefined();
    expect(refused('A -> B {p2a} : hi')).toBe(true);
  });
});

describe('CommandArrow — ARROW_STYLE1/2 and getLength', () => {
  // `-[#red]->` carries TWO dashes, so `getLength(arg) > 1` dots it
  // (`:340,352`). Jar-confirmed: the oracle emits stroke-dasharray:2,2 for
  // `A -[#red]-> B` and no dasharray for `A -[#red]> B`.
  it('counts the dashes on BOTH sides of a bracketed style', () => {
    expect(firstMessage('A -[#red]-> B : red').arrow.dashed).toBe(true);
    expect(firstMessage('A -[#red]> B : red').arrow.dashed).toBe(false);
  });

  it('applies `dashed` and `dotted` from applyStyle, and neither for `bold` (:485-497)', () => {
    expect(firstMessage('A -[dashed]> B : x').arrow.dashed).toBe(true);
    expect(firstMessage('A -[dotted]> B : x').arrow.dashed).toBe(true);
    expect(firstMessage('A -[bold]> B : x').arrow.dashed).toBe(false);
  });

  // `hidden` -> ArrowBody.HIDDEN and the colour fallback -> withColor have no
  // field on this port's ArrowConfiguration, so both are parsed and dropped.
  it('accepts `hidden` and a colour without inventing a field for either', () => {
    expect(firstMessage('A -[hidden]> B : x').arrow.dashed).toBe(false);
    expect(shape(firstMessage('user -[#navy]> som : sel'))).toMatchObject({
      from: 'user', to: 'som', head2: 'NORMAL', dashed: false,
    });
  });

  it('reads ARROW_STYLE2 when the style sits before the only dash run', () => {
    expect(firstMessage('A <[#red]- B : x').arrow.dashed).toBe(false);
  });
});

describe('CommandArrow — the trailing modifiers T3 left out of the skeleton', () => {
  it('splices STEREOTYPE and URL in after LIFECOLOR, in upstream order (:128-132)', () => {
    const afterLifecolor = ARROW_SOURCE.slice(
      ARROW_SOURCE.indexOf(LIFECOLOR) + LIFECOLOR.length,
    );
    expect(afterLifecolor.indexOf('?<STEREOTYPE>')).toBeGreaterThanOrEqual(0);
    expect(afterLifecolor.indexOf('?<URL>')).toBeGreaterThan(
      afterLifecolor.indexOf('?<STEREOTYPE>'),
    );
    expect(afterLifecolor.indexOf('?<MESSAGE>')).toBeGreaterThan(
      afterLifecolor.indexOf('?<URL>'),
    );
  });

  it('matches a `<<stereo>>` run without swallowing the message', () => {
    expect(firstMessage('A -> B <<stereo>> : st').label).toBe('st');
  });

  it.each([
    'Alice -> Bob [[http://www.google.fr]] : ok',
    'Alice -> Bob [[http://www.yahoo.com{Jason: {"a":"b"}}]] : hello',
    'Alice -> Bob [[http://x.example {tip} the label]] : hi',
  ])('matches the UrlBuilder alternatives: %s', (line) => {
    const msg = firstMessage(line);
    expect(msg.from).toBe('Alice');
    expect(msg.to).toBe('Bob');
  });

  it('keeps ACTIVATION and LIFECOLOR on the same line (:126,128)', () => {
    const msg = firstMessage('bill -> bob ++ #005500 : hello');
    expect(msg.activates).toBe('bob');
    expect(msg.label).toBe('hello');
  });

  it('deactivates the SOURCE on `--`, which is not the mirror of `++` (:447,450)', () => {
    expect(firstMessage('b -> a --++ #red : hello').deactivates).toBe('b');
  });

  it('strips the `_` no-rank marker out of the dressing (:187)', () => {
    expect(shape(firstMessage('Bob --_> Alice : hi'))).toMatchObject({
      from: 'Bob', to: 'Alice', head2: 'NORMAL', dashed: true,
    });
  });
});

describe('getInclination', () => {
  it.each([
    [undefined, 0],
    ['>', 0],
    ['>(40)', 40],
    ['>(40', 0],
    ['>40)', 0],
  ])('reads %s as %i (:192-203)', (key, expected) => {
    expect(getInclination(key)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3. The two-branch dispatch split
// ---------------------------------------------------------------------------

describe('CommandArrow — one grammar behind two frozen registry entries', () => {
  it('is the two branches of RegexOptional(ARROW_DRESSING1), nothing else', () => {
    expect(UNDRESSED_ARROW_SOURCE).not.toContain('?<ARROW_DRESSING1>');
    expect(DRESSED_ARROW_SOURCE).toContain('?<ARROW_DRESSING1>');
    // Both are ARROW_SOURCE with exactly that one fragment rewritten.
    expect(UNDRESSED_ARROW_SOURCE.length).toBeLessThan(ARROW_SOURCE.length);
    expect(DRESSED_ARROW_SOURCE.length).toBe(ARROW_SOURCE.length - 1);
  });

  it.each([
    'A -> B : hi',
    'A ->o B : hi',
    'A -[#red]-> B : hi',
    'A <- B : hi',
    'A x-> B : hi',
    'A <-> B : hi',
    'A o<- B : hi',
  ])('has exactly one of the two patterns claim %s', (line) => {
    const claims = [arrowCommand, decoratedArrowCommand].filter((c) => c.pattern.test(line));
    expect(claims).toHaveLength(1);
  });

  it('keeps both entries in the frozen registry, undressed first (D2)', () => {
    const iUndressed = SEQUENCE_COMMANDS.indexOf(arrowCommand);
    const iDressed = SEQUENCE_COMMANDS.indexOf(decoratedArrowCommand);
    expect(iUndressed).toBeGreaterThanOrEqual(0);
    expect(iDressed).toBeGreaterThan(iUndressed);
    expect(iDressed).toBe(SEQUENCE_COMMANDS.length - 1);
  });

  // Behavioural, not by identity: every group `executeArg` reads has to come
  // out the same whichever of the two entries claimed the line, or the split
  // has quietly become two commands.
  it('runs the same executor behind both entries', () => {
    const undressed = firstMessage('& {a} A -> B & C : hi');
    const dressed = firstMessage('& {a} A <- B & C : hi');
    expect(undressed.anchor).toBe('a');
    expect(dressed.anchor).toBe('a');
    expect(undressed.parallel).toBe(true);
    expect(dressed.parallel).toBe(true);
    expect(undressed.multicast).toEqual(['C']);
    expect(dressed.multicast).toEqual(['C']);
    expect(undressed.label).toBe('hi');
    expect(dressed.label).toBe('hi');
  });
});

// ---------------------------------------------------------------------------
// CommandReturn, which is filed in this module
// ---------------------------------------------------------------------------

describe('returnCommand', () => {
  it('replies to the most recent sender with a dotted arrow', () => {
    const ast = parsed('Alice -> Bob : ask', 'return answer');
    const msgs = ast.events.filter((e) => e.kind === 'message');
    expect(msgs).toHaveLength(2);
    expect(shape(msgs[1]!)).toMatchObject({ from: 'Bob', to: 'Alice', dashed: true });
    expect(msgs[1]!.label).toBe('answer');
  });

  it('is registered and matches a bare `return`', () => {
    expect(SEQUENCE_COMMANDS).toContain(returnCommand);
    expect(returnCommand.pattern.test('return')).toBe(true);
  });
});
