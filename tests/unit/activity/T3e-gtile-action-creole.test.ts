/**
 * T3e — creole-aware sizing in `tiles/gtile-action.ts`: a `[[url]]` or
 * `|cell|` physical line is measured at its RESOLVED width, not its
 * literal (bracket/pipe-including) source text (`FtileBox
 * #calculateDimensionFtile`, `ftile/vertical/FtileBox.java:237-243`, sizes
 * the box from the `Display#create8`-built `TextBlock`). See
 * `plans/activity-divergence-drive/batch-3/T3e-creole-text.md`.
 *
 * `recordingBounder` (10px/char, matching `tile-sizing.test.ts`'s own
 * precedent) makes every width assertion pure arithmetic over the
 * RESOLVED text's character count -- no real font-metrics table needed to
 * pin that the right STRING reached the bounder.
 */
import { describe, it, expect } from 'vitest';

import { resolveTheme } from '../../../src/core/theme.js';
import type { StringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import { GtileAction } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import type { ActivityAction } from '../../../src/diagrams/activity/ast.js';

const THEME = resolveTheme('default');
const PAD = 10;

function recordingBounder(): { bounder: StringBounder; texts: string[] } {
  const texts: string[] = [];
  const bounder: StringBounder = {
    getDimension: (text: string, size: number) => {
      texts.push(text);
      return { width: text.length * 10, height: size };
    },
  };
  return { bounder, texts };
}

function action(label: string): ActivityAction {
  return { kind: 'action', label };
}

describe('GtileAction — `[[url]]` sizes at the resolved label, not the literal bracket text', () => {
  it('a bare `[[url]]` (no separate label) resolves to the url itself', () => {
    // CommandCreoleUrl.ts#resolveLabel: no space inside the brackets -> the
    // url IS the label. "http://example.com" is 18 chars.
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('[[http://example.com]]'), bounder, THEME);
    expect(tile.width).toBe(18 * 10 + 2 * PAD);
  });

  it('plain text surrounding the url is kept, brackets are not', () => {
    // "foo1 " (5) + "http://x.com" (12) + " end" (4) = 21 visible chars,
    // vs. the 31-char literal (incl. "[[", "]]").
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('foo1 [[http://x.com]] end'), bounder, THEME);
    expect(tile.width).toBe(21 * 10 + 2 * PAD);
  });

  it('a literal line with no `[[` is unaffected (regression guard)', () => {
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('plain text'), bounder, THEME);
    expect(tile.width).toBe('plain text'.length * 10 + 2 * PAD);
  });
});

describe('GtileAction — a `|cell|` physical line sizes at the stripped cell text', () => {
  it('one pipe-delimited line measures its inner content only', () => {
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('|Creole Table Line1|'), bounder, THEME);
    // "Creole Table Line1" is 18 chars; the literal line (incl. pipes) is 20.
    expect(tile.width).toBe(18 * 10 + 2 * PAD);
  });

  it('every physical line being a table row adds the StripeTable AtomWithMargin(2,2) height', () => {
    // AtomWithMargin.java:49, StripeTable.java:82 -- +2 top +2 bottom ONCE
    // for the whole merged table, on top of the normal 1x-per-line advance.
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('|Creole Table Line1|\n|Line2|'), bounder, THEME);
    expect(tile.height).toBe(2 * 12 + 4 + 2 * PAD);
  });

  it('a non-table multi-line label does NOT get the table margin (regression guard)', () => {
    const { bounder } = recordingBounder();
    const tile = new GtileAction(action('a\nb'), bounder, THEME);
    expect(tile.height).toBe(2 * 12 + 2 * PAD);
  });
});
