/**
 * B3 — a participant head and foot are wrapped in the jar's `<a>`.
 *
 * ```java
 * final Url url = getParticipant().getUrl();
 * if (url != null) ug.startUrl(url);
 * comp.drawU(ug, area, context);
 * if (url != null) ug.closeUrl();
 * ```
 * @see ~/git/plantuml/.../sequencediagram/teoz/LivingSpace.java:205-212
 *
 * Two things in that snippet are asserted here that the cached oracle alone
 * would not have shown:
 *
 *   1. `drawHeadOrTail` is the shared body of `drawHead` AND `drawTail`
 *      (`:181-189`), so both rows are wrapped — two `<a>` per participant.
 *   2. It wraps `comp.drawU`, the whole component, so the glyph is inside the
 *      anchor with the label, not beside it.
 *
 * The NON-GOAL is pinned too: a message-level `A -> B [[url]] : label` emits
 * no `<a>` in the jar, and must not start emitting one here.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/sequence');
const render = (slug: string): string =>
  renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), new DeterministicMeasurer());
const anchors = (svg: string): string[] => [...svg.matchAll(/<a [^>]*>/g)].map((m) => m[0]);

describe('participant hyperlinks', () => {
  it("matches the jar's <a> byte for byte on boparo-11-pema294", () => {
    const ours = anchors(render('boparo-11-pema294'));
    const jar = anchors(readFileSync(join(CACHE, 'boparo-11-pema294', 'in.svg'), 'utf8'));
    expect(ours).toEqual(jar);
  });

  it('wraps BOTH the head row and the footer row', () => {
    // Four anchors for two participants. `drawHeadOrTail` is shared, so a
    // head-only implementation would emit two and still look right on a
    // screenshot.
    expect(anchors(render('boparo-11-pema294'))).toHaveLength(4);
  });

  it('encloses the glyph as well as the label', () => {
    // `User` is an actor: its stickman is a `<path>` and an `<ellipse>`, drawn
    // by the same `comp.drawU` the anchor wraps.
    const svg = render('boparo-11-pema294');
    const first = svg.slice(svg.indexOf('<a '), svg.indexOf('</a>'));
    expect(first).toContain('<text');
    expect(first).toContain('<ellipse');
  });

  it('emits no <a> for a participant without a url', () => {
    expect(anchors(render('jobadi-87-jegi648'))).toHaveLength(0);
  });

  it('emits no <a> for a MESSAGE-level url — the non-goal holds', () => {
    // `A -> B [[url]] : label`. The jar emits none for this, and
    // `renderer-message.ts` records why; B3 must not have changed it.
    expect(anchors(render('fajixi-56-dete708'))).toHaveLength(0);
  });

  it('parses the url off the multi-line participant form too', () => {
    // `CommandParticipantMultilines.java:163-168` is the same block as
    // `CommandParticipant.java:187-192`. No cached oracle covers this pairing
    // — `boparo-11-pema294` uses the single-line form — so it is asserted
    // against the Java rather than against a golden.
    const parsed = parseSequence([
      'participant Alice [[/head]] [',
      '  body line',
      ']',
    ]);
    if ('refused' in parsed) throw new Error(parsed.message);
    expect(parsed.participants[0]?.url).toEqual({ url: '/head', tooltip: '/head' });
  });

  it('keeps a written tooltip, and falls back to the url without one', () => {
    // `Url.java:54-57` — the tooltip defaults to the url itself. The jar shows
    // both arms side by side in `sefako-72-jono850`'s own anchors.
    const parsed = parseSequence(['participant Bob [[/u{hover me}]]', 'participant Eve [[/v]]']);
    if ('refused' in parsed) throw new Error(parsed.message);
    expect(parsed.participants[0]?.url).toEqual({ url: '/u', tooltip: 'hover me' });
    expect(parsed.participants[1]?.url).toEqual({ url: '/v', tooltip: '/v' });
  });
});
