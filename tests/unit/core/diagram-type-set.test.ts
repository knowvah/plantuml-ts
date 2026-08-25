import { describe, it, expect } from 'vitest';
import {
  DiagramType,
  findStartTypes,
} from '../../../src/core/diagram-type-set.js';

// Every case exercises a branch of `DiagramType.findStartTypes`/`getTypes`
// (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/
// DiagramType.java`); line citations below are that file's.

describe('findStartTypes — non-start lines (:69-92)', () => {
  it('returns the empty set for a line with no start directive (:76-77)', () => {
    expect(findStartTypes('class Foo {')).toEqual(new Set());
  });

  it('returns the empty set for an empty line (:91)', () => {
    expect(findStartTypes('')).toEqual(new Set());
  });

  it('returns the empty set for an all-whitespace line (:73-74,91)', () => {
    expect(findStartTypes('   \t  ')).toEqual(new Set());
  });

  it('skips leading whitespace before the @ (:73-74)', () => {
    expect(findStartTypes('   @startjson')).toEqual(
      new Set([DiagramType.JSON]),
    );
  });

  it('accepts the \\start form, not just @start (:76)', () => {
    expect(findStartTypes('\\startjson')).toEqual(
      new Set([DiagramType.JSON]),
    );
  });
});

describe('findStartTypes — truncated / boundary input (:81-86)', () => {
  it('returns the empty set when "start" is truncated (:81-82)', () => {
    expect(findStartTypes('@star')).toEqual(new Set());
    expect(findStartTypes('@sta')).toEqual(new Set());
  });

  it('returns the empty set when the prefix is not "start" (:81-82)', () => {
    expect(findStartTypes('@stopuml')).toEqual(new Set());
  });

  it('returns the empty set when nothing follows "start" (:85-86)', () => {
    expect(findStartTypes('@start')).toEqual(new Set());
  });
});

describe('findStartTypes — case sensitivity (:220-232 check)', () => {
  it('matches "start" and the tag case-insensitively', () => {
    expect(findStartTypes('@STARTJSON')).toEqual(
      new Set([DiagramType.JSON]),
    );
    expect(findStartTypes('@StArTyAmL')).toEqual(
      new Set([DiagramType.YAML]),
    );
  });
});

describe('findStartTypes — unmatched tags (:94-218 default fallthrough)', () => {
  it('returns {UNKNOWN} -- not empty -- for an unmatched tag (:215-216)', () => {
    expect(findStartTypes('@startfoo')).toEqual(
      new Set([DiagramType.UNKNOWN]),
    );
  });

  it('returns {UNKNOWN} for a first character outside every case label', () => {
    // 'x' is not one of b/c/d/e/f/g/h/j/l/m/n/p/r/s/u/w/y (:94-218), so this
    // hits the Java switch's own `default:` branch (:215-216), not a
    // per-letter fallthrough.
    expect(findStartTypes('@startxyz')).toEqual(
      new Set([DiagramType.UNKNOWN]),
    );
  });

  it('returns {UNKNOWN} when the tag is a valid group letter too short to match any key (:97-102)', () => {
    expect(findStartTypes('@startb')).toEqual(
      new Set([DiagramType.UNKNOWN]),
    );
  });

  it('matches with no word-boundary check, per upstream (:198-200 check)', () => {
    // check() only compares a fixed-length prefix; upstream never requires
    // end-of-string or a following separator after the tag.
    expect(findStartTypes('@startumlx')).toEqual(
      new Set([
        DiagramType.SEQUENCE,
        DiagramType.STATE,
        DiagramType.CLASS,
        DiagramType.OBJECT,
        DiagramType.ACTIVITY,
        DiagramType.DESCRIPTION,
        DiagramType.COMPOSITE,
        DiagramType.TIMING,
        DiagramType.HELP,
        DiagramType.SPRITES,
      ]),
    );
  });
});

describe('findStartTypes — @startuml candidate set (:198-201)', () => {
  it('returns exactly the 10 types at DiagramType.java:198-201', () => {
    expect(findStartTypes('@startuml')).toEqual(
      new Set([
        DiagramType.SEQUENCE,
        DiagramType.STATE,
        DiagramType.CLASS,
        DiagramType.OBJECT,
        DiagramType.ACTIVITY,
        DiagramType.DESCRIPTION,
        DiagramType.COMPOSITE,
        DiagramType.TIMING,
        DiagramType.HELP,
        DiagramType.SPRITES,
      ]),
    );
  });
});

describe.each([
  ['@startbpm', DiagramType.BPM],
  ['@startboard', DiagramType.BOARD],
  ['@startchart', DiagramType.CHART],
  ['@startcreole', DiagramType.CREOLE],
  ['@startchronology', DiagramType.CHRONOLOGY],
  ['@startchen', DiagramType.CHEN_EER],
  ['@startcrash', DiagramType.CRASH],
  ['@startdot', DiagramType.DOT],
  ['@startditaa', DiagramType.DITAA],
  ['@startdef', DiagramType.DEFINITION],
  ['@startebnf', DiagramType.EBNF],
  ['@startflow', DiagramType.FLOW],
  ['@startfiles', DiagramType.FILES],
  ['@startgantt', DiagramType.GANTT],
  ['@startgit', DiagramType.GIT],
  ['@starthcl', DiagramType.HCL],
  ['@startjcckit', DiagramType.JCCKIT],
  ['@startjson', DiagramType.JSON],
  ['@startlatex', DiagramType.LATEX],
  ['@startmath', DiagramType.MATH],
  ['@startmindmap', DiagramType.MINDMAP],
  ['@startnwdiag', DiagramType.NWDIAG],
  ['@startproject', DiagramType.GANTT],
  ['@startpacketdiag', DiagramType.PACKET],
  ['@startregex', DiagramType.REGEX],
  ['@startsalt', DiagramType.SALT],
  ['@startsprites', DiagramType.SPRITES],
  ['@startwire', DiagramType.WIRE],
  ['@startwbs', DiagramType.WBS],
  ['@startyaml', DiagramType.YAML],
] as const)('findStartTypes(%s) singleton branch', (line, type) => {
  it(`returns {${type}}`, () => {
    expect(findStartTypes(line)).toEqual(new Set([type]));
  });
});

// ---------------------------------------------------------------------------
// The two places a JS built-in is NOT the Java predicate. Both were written
// with the built-in first and corrected against the Java (fix(T2)); each case
// below fails under the built-in and passes under the port. Code points are
// spelled numerically -- a literal U+2007 in a source file is indistinguishable
// from a space to every reviewer.
// ---------------------------------------------------------------------------

const at = (...codes: number[]): string[] => codes.map((c) => String.fromCharCode(c));

/** Java accepts these four; `/\s/` matches none of them. */
const JAVA_ONLY_WHITESPACE = at(0x1c, 0x1d, 0x1e, 0x1f);
/** Zs but non-breaking, so `isWhitespace` is false; `/\s/` matches all three. */
const NON_BREAKING_SPACES = at(0xa0, 0x2007, 0x202f);
/** Breaking separators both predicates accept. */
const SHARED_SEPARATORS = at(0x1680, 0x2000, 0x2006, 0x2008, 0x200a, 0x2028, 0x2029, 0x205f, 0x3000);
/** U+212A KELVIN SIGN -- `toLowerCase()` folds it to `k`; Java does not. */
const KELVIN = String.fromCharCode(0x212a);

describe('findStartTypes -- Character.isWhitespace, not /\\s/ (:73-74)', () => {
  it('skips the ASCII information separators U+001C-U+001F that /\\s/ misses', () => {
    for (const c of JAVA_ONLY_WHITESPACE)
      expect(findStartTypes(`${c}@startjson`)).toEqual(new Set([DiagramType.JSON]));
  });

  it('skips VT and FF, which the javadoc lists explicitly', () => {
    for (const c of at(0x0b, 0x0c))
      expect(findStartTypes(`${c}@startjson`)).toEqual(new Set([DiagramType.JSON]));
  });

  it('does NOT skip the three non-breaking spaces Java excludes', () => {
    // Non-breaking, so `isWhitespace` is false and the character fails the
    // `@`/`\` test -> EMPTY. `/\s/` would have skipped all three and returned
    // the JSON singleton instead.
    for (const c of NON_BREAKING_SPACES)
      expect(findStartTypes(`${c}@startjson`)).toEqual(new Set());
  });

  it('does NOT skip U+FEFF, which is Cf rather than a separator', () => {
    expect(findStartTypes(`${at(0xfeff)[0]}@startjson`)).toEqual(new Set());
  });

  it('skips the breaking Unicode separators Java does accept', () => {
    for (const c of SHARED_SEPARATORS)
      expect(findStartTypes(`${c}@startjson`)).toEqual(new Set([DiagramType.JSON]));
  });
});

describe('findStartTypes -- check() folds ASCII only (:220-232)', () => {
  it('matches a tag in any ASCII case', () => {
    expect(findStartTypes('@STARTJSON')).toEqual(new Set([DiagramType.JSON]));
    expect(findStartTypes('@StArTjSoN')).toEqual(new Set([DiagramType.JSON]));
  });

  it('does NOT fold U+212A KELVIN SIGN to k, as toLowerCase() would', () => {
    // `c >= 'A' && c <= 'Z'` leaves U+212A alone, so `jcc<K>it` never matches
    // `jcckit`. The tag is still a valid @start form, so the answer is
    // {UNKNOWN} rather than the empty set.
    expect(findStartTypes(`@startjcc${KELVIN}it`)).toEqual(new Set([DiagramType.UNKNOWN]));
    expect(findStartTypes('@startjcckit')).toEqual(new Set([DiagramType.JCCKIT]));
  });

  it('does NOT fold the Kelvin sign inside the "start" keyword either', () => {
    expect(findStartTypes(`@star${KELVIN}json`)).toEqual(new Set());
  });
});
