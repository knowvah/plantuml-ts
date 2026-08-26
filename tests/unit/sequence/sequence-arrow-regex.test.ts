import { describe, it, expect } from 'vitest';
import {
  ACTIVATION,
  ANCHOR,
  ARROW_BODY_OR,
  ARROW_DRESSING1,
  ARROW_DRESSING2,
  ARROW_SKELETON_RE,
  ARROW_SKELETON_SOURCE,
  ARROW_SUPPCIRCLE1_LEFT,
  ARROW_SUPPCIRCLE1_RIGHT,
  ARROW_SUPPCIRCLE2_LEFT,
  ARROW_SUPPCIRCLE2_RIGHT,
  COLOR_OR_STYLE_PATTERN,
  LIFECOLOR,
  MULTICAST,
  PART1,
  PART2,
  anchor,
  colorOrStylePattern,
} from '../../../src/diagrams/sequence/sequence-arrow-regex.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Compile a fragment on its own, anchored, with the flags upstream compiles
 * every command pattern with (`Pattern2.java:114` -> CASE_INSENSITIVE, plus
 * `u` for the `\p{L}`/`\p{N}` expansion of `%pLN`).
 */
const anchored = (source: string): RegExp => new RegExp(`^${source}$`, 'iu');

/** The named groups that actually participated in a match. */
function groupsOf(re: RegExp, input: string): Record<string, string> {
  const m = re.exec(input);
  expect(m, `expected ${JSON.stringify(input)} to match`).not.toBeNull();
  return Object.fromEntries(
    Object.entries(m!.groups ?? {}).filter(([, v]) => v !== undefined),
  );
}

const skeleton = (input: string): Record<string, string> =>
  groupsOf(ARROW_SKELETON_RE, input);

// ---------------------------------------------------------------------------
// ANCHOR -- CommandArrow.java:78
// ---------------------------------------------------------------------------

describe('ANCHOR', () => {
  it('captures the anchor name in the inner unnamed group', () => {
    const m = anchored(ANCHOR).exec('{start} ');
    expect(m?.[1]).toBe('{start} ');
    expect(m?.[2]).toBe('start');
  });

  it('is optional -- the empty string matches with no groups', () => {
    const m = anchored(ANCHOR).exec('');
    expect(m?.[1]).toBeUndefined();
    expect(m?.[2]).toBeUndefined();
  });

  it('requires trailing whitespace after the closing brace', () => {
    expect(anchored(ANCHOR).test('{start}')).toBe(false);
  });

  it('rejects punctuation inside the braces -- [%pLN_] has no dot or at', () => {
    expect(anchored(ANCHOR).test('{a.b} ')).toBe(false);
  });

  it('accepts Unicode letters and digits', () => {
    expect(anchored(ANCHOR).exec('{Ärger_9} ')?.[2]).toBe('Ärger_9');
  });
});

describe('anchor(name)', () => {
  it('names group 0 for the whole token and group 1 for the name', () => {
    expect(groupsOf(anchored(anchor('PART1ANCHOR')), '{x} ')).toEqual({
      PART1ANCHOR: '{x} ',
      PART1ANCHOR1: 'x',
    });
  });

  it('produces the same language as the unnamed ANCHOR constant', () => {
    for (const s of ['{a} ', '', '{a}', '{a.b} ']) {
      expect(anchored(anchor('ANCHOR')).test(s)).toBe(anchored(ANCHOR).test(s));
    }
  });
});

// ---------------------------------------------------------------------------
// Colour / line style -- CommandArrow.java:84-86
// ---------------------------------------------------------------------------

describe('COLOR_OR_STYLE_PATTERN', () => {
  it.each([
    ['[#red]', '#red'],
    ['[#AABBCC]', '#AABBCC'],
    ['[dotted]', 'dotted'],
    ['[bold]', 'bold'],
    ['[thickness=3]', 'thickness=3'],
    ['[#red,bold]', '#red,bold'],
    ['[#red,#blue]', '#red,#blue'],
  ])('captures %s', (input, expected) => {
    expect(anchored(COLOR_OR_STYLE_PATTERN).exec(input)?.[1]).toBe(expected);
  });

  it('is optional', () => {
    expect(anchored(COLOR_OR_STYLE_PATTERN).exec('')?.[1]).toBeUndefined();
  });

  it('rejects an unknown bare keyword', () => {
    expect(anchored(COLOR_OR_STYLE_PATTERN).test('[wobbly]')).toBe(false);
  });
});

describe('colorOrStylePattern(name)', () => {
  it('names the single group', () => {
    expect(groupsOf(anchored(colorOrStylePattern('ARROW_STYLE1')), '[#red]')).toEqual({
      ARROW_STYLE1: '#red',
    });
  });

  it('matches uppercase keywords -- the i flag of Pattern2.java:114', () => {
    expect(groupsOf(anchored(colorOrStylePattern('ARROW_STYLE2')), '[DOTTED]')).toEqual({
      ARROW_STYLE2: 'DOTTED',
    });
  });
});

// ---------------------------------------------------------------------------
// Dressings -- CommandArrow.java:99-103 and :112-116
// ---------------------------------------------------------------------------

describe('ARROW_DRESSING1', () => {
  it.each([' o', ' x', '<', '<<', '<_', ' o<', ' x<', '(5)<', '/', '//', '\\', '\\\\'])(
    'captures %j',
    (input) => {
      expect(groupsOf(anchored(ARROW_DRESSING1), input)).toEqual({
        ARROW_DRESSING1: input,
      });
    },
  );

  it('is optional', () => {
    expect(anchored(ARROW_DRESSING1).exec('')?.groups?.ARROW_DRESSING1).toBeUndefined();
  });

  it('rejects a head-side token', () => {
    expect(anchored(ARROW_DRESSING1).test('>')).toBe(false);
  });

  it('requires the space before a bare o/x decoration', () => {
    expect(anchored(ARROW_DRESSING1).test('o')).toBe(false);
  });
});

describe('ARROW_DRESSING2', () => {
  it.each(['>', '>>', '_>', '>o ', '>x ', '>(5)', '/', '//', '\\', '\\\\', 'o ', 'x '])(
    'captures %j',
    (input) => {
      expect(groupsOf(anchored(ARROW_DRESSING2), input)).toEqual({
        ARROW_DRESSING2: input,
      });
    },
  );

  it('is optional', () => {
    expect(anchored(ARROW_DRESSING2).exec('')?.groups?.ARROW_DRESSING2).toBeUndefined();
  });

  it('requires the space after a trailing o/x decoration', () => {
    expect(anchored(ARROW_DRESSING2).test('>o')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Body -- CommandArrow.java:104-111
// ---------------------------------------------------------------------------

describe('ARROW_BODY_OR', () => {
  it('takes the first branch for bare dashes', () => {
    expect(groupsOf(anchored(ARROW_BODY_OR), '--')).toEqual({
      ARROW_BODYA1: '--',
      ARROW_BODYB1: '',
    });
  });

  it('splits the dashes around a leading style', () => {
    expect(groupsOf(anchored(ARROW_BODY_OR), '-[#red]--')).toEqual({
      ARROW_BODYA1: '-',
      ARROW_STYLE1: '#red',
      ARROW_BODYB1: '--',
    });
  });

  it('falls to the second branch when the style precedes every dash', () => {
    expect(groupsOf(anchored(ARROW_BODY_OR), '[dotted]--')).toEqual({
      ARROW_BODYA2: '',
      ARROW_STYLE2: 'dotted',
      ARROW_BODYB2: '--',
    });
  });

  it('requires at least one dash', () => {
    expect(anchored(ARROW_BODY_OR).test('')).toBe(false);
    expect(anchored(ARROW_BODY_OR).test('[#red]')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Endpoints -- CommandArrow.java:92-96 and :118-122
// ---------------------------------------------------------------------------

describe('PART1 / PART2', () => {
  it('captures a bare code', () => {
    expect(groupsOf(anchored(PART1), 'Alice')).toEqual({
      PART1: 'Alice',
      PART1CODE: 'Alice',
    });
  });

  it('accepts dot and at inside a code, and Unicode letters', () => {
    expect(groupsOf(anchored(PART2), 'a.b@Ünïcode9')).toEqual({
      PART2: 'a.b@Ünïcode9',
      PART2CODE: 'a.b@Ünïcode9',
    });
  });

  it('captures a quoted display', () => {
    expect(groupsOf(anchored(PART1), '"Long name"')).toEqual({
      PART1: '"Long name"',
      PART1LONG: 'Long name',
    });
  });

  it('captures quoted display + as + code, exposing index 1 as NAME1', () => {
    expect(groupsOf(anchored(PART2), '"Long name" as ln')).toEqual({
      PART2: '"Long name" as ln',
      PART2LONGCODE: 'Long name',
      PART2LONGCODE1: 'ln',
    });
  });

  it('captures code + as + quoted display', () => {
    expect(groupsOf(anchored(PART1), 'ln as "Long name"')).toEqual({
      PART1: 'ln as "Long name"',
      PART1CODELONG: 'ln',
      PART1CODELONG1: 'Long name',
    });
  });

  it('matches AS case-insensitively', () => {
    expect(groupsOf(anchored(PART1), 'ln AS "Long name"').PART1CODELONG).toBe('ln');
  });

  it('accepts the curly quotes %g expands to', () => {
    expect(groupsOf(anchored(PART2), '“Long name”').PART2LONG).toBe('Long name');
  });

  it('rejects a dash -- the class is [%pLN_.@], never \\S', () => {
    expect(anchored(PART1).test('C-')).toBe(false);
    expect(anchored(PART2).test('[')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Exo supplementary circles
// ---------------------------------------------------------------------------

describe('ARROW_SUPPCIRCLE fragments', () => {
  it.each(['[', ']', '?', '[o', ']x', '?o'])(
    'ARROW_SUPPCIRCLE2_LEFT captures the leading %j',
    (input) => {
      expect(groupsOf(anchored(ARROW_SUPPCIRCLE2_LEFT), input)).toEqual({
        ARROW_SUPPCIRCLE2: input,
      });
    },
  );

  it.each(['o[', 'x]', 'o?', '[', ']', '?'])(
    'ARROW_SUPPCIRCLE2_RIGHT captures the trailing %j',
    (input) => {
      expect(groupsOf(anchored(ARROW_SUPPCIRCLE2_RIGHT), input)).toEqual({
        ARROW_SUPPCIRCLE2: input,
      });
    },
  );

  it('ARROW_SUPPCIRCLE1_LEFT puts the decoration before the space', () => {
    expect(groupsOf(anchored(ARROW_SUPPCIRCLE1_LEFT), 'o ')).toEqual({
      ARROW_SUPPCIRCLE1: 'o ',
    });
    expect(anchored(ARROW_SUPPCIRCLE1_LEFT).test(' o')).toBe(false);
  });

  it('ARROW_SUPPCIRCLE1_RIGHT puts the decoration after the space', () => {
    expect(groupsOf(anchored(ARROW_SUPPCIRCLE1_RIGHT), ' x')).toEqual({
      ARROW_SUPPCIRCLE1: ' x',
    });
    expect(anchored(ARROW_SUPPCIRCLE1_RIGHT).test('x ')).toBe(false);
  });

  it('all four are optional', () => {
    for (const frag of [
      ARROW_SUPPCIRCLE1_LEFT,
      ARROW_SUPPCIRCLE2_LEFT,
      ARROW_SUPPCIRCLE1_RIGHT,
      ARROW_SUPPCIRCLE2_RIGHT,
    ]) {
      expect(groupsOf(anchored(frag), '')).toEqual({});
    }
  });
});

// ---------------------------------------------------------------------------
// Trailing modifiers -- CommandArrow.java:123, :126, :128
// ---------------------------------------------------------------------------

describe('MULTICAST / ACTIVATION / LIFECOLOR', () => {
  it('MULTICAST captures every " & code" recipient', () => {
    expect(groupsOf(anchored(MULTICAST), ' & B & C')).toEqual({ MULTICAST: ' & B & C' });
  });

  it('MULTICAST participates as the empty string when absent', () => {
    expect(groupsOf(anchored(MULTICAST), '')).toEqual({ MULTICAST: '' });
  });

  it('MULTICAST needs the spaces around the ampersand', () => {
    expect(anchored(MULTICAST).test('&B')).toBe(false);
  });

  it.each(['++', '**', '!!', '--', '--++', '++--'])('ACTIVATION captures %s', (input) => {
    expect(groupsOf(anchored(ACTIVATION), input)).toEqual({ ACTIVATION: input });
  });

  it('ACTIVATION is optional and rejects an unknown token', () => {
    expect(groupsOf(anchored(ACTIVATION), '')).toEqual({});
    expect(anchored(ACTIVATION).test('+-')).toBe(false);
  });

  it('LIFECOLOR captures a #word colour and is optional', () => {
    expect(groupsOf(anchored(LIFECOLOR), '#gold')).toEqual({ LIFECOLOR: '#gold' });
    expect(groupsOf(anchored(LIFECOLOR), '')).toEqual({});
    expect(anchored(LIFECOLOR).test('gold')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Composed skeleton -- the acceptance cases
// ---------------------------------------------------------------------------

describe('ARROW_SKELETON', () => {
  it('is built from the exported fragments', () => {
    expect(ARROW_SKELETON_SOURCE).toContain(PART1);
    expect(ARROW_SKELETON_SOURCE).toContain(PART2);
    expect(ARROW_SKELETON_SOURCE).toContain(ARROW_BODY_OR);
    expect(ARROW_SKELETON_SOURCE).toContain(ARROW_DRESSING1);
    expect(ARROW_SKELETON_SOURCE).toContain(ARROW_DRESSING2);
    expect(ARROW_SKELETON_SOURCE).toContain(MULTICAST);
    expect(ARROW_SKELETON_SOURCE).toContain(ACTIVATION);
    expect(ARROW_SKELETON_SOURCE).toContain(LIFECOLOR);
    expect(ARROW_SKELETON_RE.flags).toBe('iu');
  });

  it('parses C-->B as C and B -- never C-', () => {
    const g = skeleton('C-->B');
    expect(g.PART1CODE).toBe('C');
    expect(g.PART2CODE).toBe('B');
    expect(g.ARROW_BODYA1).toBe('--');
    expect(g.ARROW_DRESSING2).toBe('>');
  });

  it('treats "A ->o B" as a circle decoration on the arrow head', () => {
    const g = skeleton('A ->o B');
    expect(g.ARROW_DRESSING2).toBe('>o ');
    expect(g.PART2CODE).toBe('B');
  });

  it('treats "A->oB" as a participant named oB -- the decoration needs a space', () => {
    const g = skeleton('A->oB');
    expect(g.ARROW_DRESSING2).toBe('>');
    expect(g.PART2CODE).toBe('oB');
  });

  it('matches an uppercase style -- the i flag of Pattern2.java:114', () => {
    const g = skeleton('A -[#RED]-> B');
    expect(g.ARROW_STYLE1).toBe('#RED');
    expect(g.PART1CODE).toBe('A');
    expect(g.PART2CODE).toBe('B');
  });

  it('matches an uppercase style keyword too', () => {
    expect(skeleton('A -[DOTTED]-> B').ARROW_STYLE1).toBe('DOTTED');
  });

  // No spaceZeroOrMore sits between an endpoint and its anchor upstream
  // (CommandArrow.java:96-97 and :122-124), so the brace is adjacent to the
  // participant code; only the LEADING ANCHOR carries its own trailing space.
  it('captures the parallel marker, both anchors and the message', () => {
    const g = skeleton('& {a} A{b} -> B{c} : hello');
    expect(g.PARALLEL).toBe('& ');
    expect(g.ANCHOR1).toBe('a');
    expect(g.PART1ANCHOR1).toBe('b');
    expect(g.PART2ANCHOR1).toBe('c');
    expect(g.MESSAGE).toBe('hello');
  });

  it('captures multicast, activation and lifeline colour together', () => {
    const g = skeleton('A -> B & C ++ #gold : go');
    expect(g.PART2CODE).toBe('B');
    expect(g.MULTICAST).toBe(' & C');
    expect(g.ACTIVATION).toBe('++');
    expect(g.LIFECOLOR).toBe('#gold');
    expect(g.MESSAGE).toBe('go');
  });

  it('captures a reversed arrow through ARROW_DRESSING1', () => {
    const g = skeleton('A <<-- B');
    expect(g.ARROW_DRESSING1).toBe('<<');
    expect(g.ARROW_BODYA1).toBe('--');
    expect(g.ARROW_DRESSING2).toBeUndefined();
  });

  it('captures the (n) inclination on either dressing', () => {
    expect(skeleton('A ->(5) B').ARROW_DRESSING2).toBe('>(5)');
    expect(skeleton('A (5)<- B').ARROW_DRESSING1).toBe('(5)<');
  });

  it('captures quoted endpoints', () => {
    const g = skeleton('"Long name" -> "B b" as bb');
    expect(g.PART1LONG).toBe('Long name');
    expect(g.PART2LONGCODE).toBe('B b');
    expect(g.PART2LONGCODE1).toBe('bb');
  });

  it('refuses the exo forms, which belong to the exo commands', () => {
    for (const s of ['A ->]', '[-> B', 'A ->? B']) {
      expect(ARROW_SKELETON_RE.test(s)).toBe(false);
    }
  });
});
