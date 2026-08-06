/**
 * SI1/T11 — the shared `-[single]->` add-time dedup hook (ADR-3).
 * Semantics under test are the EXACT upstream trio:
 * - `CucaDiagram.addLink` guard          @see net/atmp/CucaDiagram.java:896-901
 * - `CucaDiagram.containsSimilarLink`    @see net/atmp/CucaDiagram.java:903-909
 * - `Link.sameConnections`               @see abel/Link.java:462-470
 * plus the `single` ARROW_STYLE gate (`WithLinkType.applyStyle`/
 * `applyOneStyle`/`goSingle`, decoration/WithLinkType.java:110-166).
 */
import { describe, it, expect } from 'vitest';
import {
  arrowStyleHasSingle,
  containsSimilarLink,
  dropsAsSingleDuplicate,
} from '../../../../src/core/cucadiagram/linkDedup.js';

interface FakeLink {
  from: string;
  to: string;
}

const connection = (l: FakeLink): readonly [string, string] => [l.from, l.to];

describe('containsSimilarLink (CucaDiagram.java:903-909 + Link.sameConnections :462-470)', () => {
  it('matches the same pair in declaration order', () => {
    const links: FakeLink[] = [{ from: 'a', to: 'b' }];
    expect(containsSimilarLink(links, { from: 'a', to: 'b' }, connection)).toBe(true);
  });

  it('matches the same pair in REVERSED order (either direction)', () => {
    const links: FakeLink[] = [{ from: 'a', to: 'b' }];
    expect(containsSimilarLink(links, { from: 'b', to: 'a' }, connection)).toBe(true);
  });

  it('does not match a different pair sharing one endpoint', () => {
    const links: FakeLink[] = [{ from: 'a', to: 'b' }];
    expect(containsSimilarLink(links, { from: 'a', to: 'c' }, connection)).toBe(false);
    expect(containsSimilarLink(links, { from: 'c', to: 'b' }, connection)).toBe(false);
  });

  it('is false over an empty list', () => {
    expect(containsSimilarLink([], { from: 'a', to: 'b' }, connection)).toBe(false);
  });

  it('compares by IDENTITY, not structure — a self-loop matches only itself', () => {
    const links: FakeLink[] = [{ from: 'a', to: 'a' }];
    expect(containsSimilarLink(links, { from: 'a', to: 'a' }, connection)).toBe(true);
    expect(containsSimilarLink(links, { from: 'a', to: 'b' }, connection)).toBe(false);
  });
});

describe('dropsAsSingleDuplicate (the addLink guard, CucaDiagram.java:896-901)', () => {
  const existing: FakeLink[] = [{ from: 'a', to: 'b' }];

  it('drops a single link whose pair already exists', () => {
    expect(dropsAsSingleDuplicate(true, existing, { from: 'a', to: 'b' }, connection)).toBe(true);
  });

  it('single dedups against a prior NON-single link too (the guard reads only the INCOMING link)', () => {
    // Upstream gates on link.isSingle() of the incoming link only; the
    // scanned links carry no single requirement.
    expect(dropsAsSingleDuplicate(true, existing, { from: 'b', to: 'a' }, connection)).toBe(true);
  });

  it('never drops a non-single link, even an exact duplicate', () => {
    expect(dropsAsSingleDuplicate(false, existing, { from: 'a', to: 'b' }, connection)).toBe(false);
  });

  it('keeps a single link whose pair is new', () => {
    expect(dropsAsSingleDuplicate(true, existing, { from: 'a', to: 'c' }, connection)).toBe(false);
  });
});

describe('arrowStyleHasSingle (WithLinkType.applyStyle tokenization, :126-166)', () => {
  it('matches the bare token, case-insensitively (equalsIgnoreCase)', () => {
    expect(arrowStyleHasSingle('single')).toBe(true);
    expect(arrowStyleHasSingle('SINGLE')).toBe(true);
    expect(arrowStyleHasSingle('Single')).toBe(true);
  });

  it('matches inside comma- and semicolon-separated token lists', () => {
    expect(arrowStyleHasSingle('dotted,single')).toBe(true);
    expect(arrowStyleHasSingle('bold;single')).toBe(true);
    expect(arrowStyleHasSingle('#red,single,norank')).toBe(true);
  });

  it('does not match substrings or other tokens', () => {
    expect(arrowStyleHasSingle('singleton')).toBe(false);
    expect(arrowStyleHasSingle('dotted')).toBe(false);
    expect(arrowStyleHasSingle('#single0')).toBe(false);
  });

  it('is false for undefined (no ARROW_STYLE bracket at all)', () => {
    expect(arrowStyleHasSingle(undefined)).toBe(false);
  });
});
