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
