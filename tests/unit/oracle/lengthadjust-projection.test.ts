import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  listAuthoredLengthAdjustSlugs,
  measureAuthoredLengthAdjust,
  presenceVectorsEqual,
  projectLengthAdjust,
  rootGroupAttributes,
  textLengthPresence,
} from '../../oracle/svg-conformance/render-fixture-lengthadjust.js';

const wrap = (root: string, body: string, defs = '<defs/>'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg">${defs}${root}${body}</g></svg>`;

const TEXT_WITH = '<text x="1" textLength="20" lengthAdjust="spacing">ab</text>';
const TEXT_WITHOUT = '<text x="1">ab</text>';

describe('rootGroupAttributes', () => {
  it('reads the first <g> after <defs/>, ignoring nested groups', () => {
    const svg = wrap('<g font-family="sans-serif" lengthAdjust="spacing">', '<g class="entity"></g>');
    expect([...rootGroupAttributes(svg)]).toEqual([
      ['font-family', 'sans-serif'],
      ['lengthAdjust', 'spacing'],
    ]);
  });

  it('skips a <g> inside a non-empty <defs>', () => {
    const svg = wrap('<g font-family="x">', '', '<defs><g id="inner"/></defs>');
    expect(rootGroupAttributes(svg).get('font-family')).toBe('x');
    expect(rootGroupAttributes(svg).has('id')).toBe(false);
  });

  it('returns an empty map when there is no <g> or it has no attributes', () => {
    expect(rootGroupAttributes('<svg><defs/></svg>').size).toBe(0);
    expect(rootGroupAttributes('<svg><defs/><g></g></svg>').size).toBe(0);
  });

  it('falls back to the first <g> when there is no <defs>', () => {
    expect(rootGroupAttributes('<svg><g a="1"></g></svg>').get('a')).toBe('1');
  });
});

describe('textLengthPresence', () => {
  it('returns one entry per <text> in document order', () => {
    const svg = wrap('<g>', `${TEXT_WITH}${TEXT_WITHOUT}<text>x</text>`);
    expect(textLengthPresence(svg)).toEqual([true, false, false]);
  });
});

describe('presenceVectorsEqual', () => {
  it('never matches vectors of different length', () => {
    expect(presenceVectorsEqual([true], [true, true])).toBe(false);
    expect(presenceVectorsEqual([true, false], [true, false])).toBe(true);
  });
});

describe('projectLengthAdjust', () => {
  it('reports textLengthMatch false when one textLength is removed', () => {
    const golden = wrap('<g font-family="sans-serif" lengthAdjust="spacing">', TEXT_WITH + TEXT_WITH);
    const ours = wrap('<g font-family="sans-serif" lengthAdjust="spacing">', TEXT_WITH + TEXT_WITHOUT);
    expect(projectLengthAdjust(ours, golden)).toEqual({ rootExact: true, textLengthMatch: false });
  });

  it('reports rootExact true for a pair differing only in attribute order', () => {
    const golden = wrap('<g font-family="sans-serif" lengthAdjust="spacing">', TEXT_WITH);
    const ours = wrap('<g lengthAdjust="spacing" font-family="sans-serif">', TEXT_WITH);
    expect(projectLengthAdjust(ours, golden)).toEqual({ rootExact: true, textLengthMatch: true });
  });

  it('reports rootExact false when an attribute value or presence differs', () => {
    const golden = wrap('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">', '');
    expect(projectLengthAdjust(wrap('<g font-family="sans-serif" lengthAdjust="spacing">', ''), golden).rootExact).toBe(
      false,
    );
    expect(projectLengthAdjust(wrap('<g font-family="sans-serif">', ''), golden).rootExact).toBe(false);
  });

  it('reports textLengthMatch false when the <text> counts differ', () => {
    const golden = wrap('<g>', TEXT_WITH + TEXT_WITH);
    const ours = wrap('<g>', TEXT_WITH);
    expect(projectLengthAdjust(ours, golden).textLengthMatch).toBe(false);
  });
});

describe('measureAuthoredLengthAdjust', () => {
  it('measures a row against its jar oracle (class-default: score 0, root and textLength exact)', () => {
    const m = measureAuthoredLengthAdjust('class-default');
    expect(m).toMatchObject({
      errored: false,
      score: 0,
      diffCount: 0,
      rootExact: true,
      textLengthMatch: true,
      weErrored: false,
    });
  });

  it('reports a missing oracle svg as errored', () => {
    const root = mkdtempSync(join(tmpdir(), 'lad-'));
    writeFileSync(join(root, 'solo.puml'), '@startuml\nclass A\n@enduml\n');
    expect(measureAuthoredLengthAdjust('solo', root)).toEqual({ errored: true, reason: 'solo.svg is missing' });
  });

  it('lists the 64 authored slugs', () => {
    expect(listAuthoredLengthAdjustSlugs()).toHaveLength(64);
  });
});
