/**
 * DUR T2: `drawWithAtomUrl` brackets one atom's draw in `startUrl`/`closeUrl`
 * (`AtomText.java:197-198,235-236`; `AtomSprite.java:75,79`), once per atom,
 * and degrades to a plain draw for a graphic with no link support.
 */
import { describe, expect, test } from 'vitest';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { drawWithAtomUrl } from '../../../../../src/core/svek/image/EntityImageDescriptionTextBlock.js';

const URL_INFO = { url: 'http://x.example', tooltip: 'tip' };

function recordingGraphic(log: string[]): UGraphic {
  return {
    startUrl: (u: { url: string; tooltip: string }) => log.push(`start:${u.url}:${u.tooltip}`),
    closeUrl: () => log.push('close'),
  } as unknown as UGraphic;
}

describe('drawWithAtomUrl', () => {
  test('brackets the draw with startUrl / closeUrl, in that order', () => {
    const log: string[] = [];
    drawWithAtomUrl(recordingGraphic(log), URL_INFO, () => log.push('draw'));
    expect(log).toEqual(['start:http://x.example:tip', 'draw', 'close']);
  });

  test('draws without any bracket when the atom has no url', () => {
    const log: string[] = [];
    drawWithAtomUrl(recordingGraphic(log), undefined, () => log.push('draw'));
    expect(log).toEqual(['draw']);
  });

  test('draws plainly on a graphic that cannot open links', () => {
    const log: string[] = [];
    drawWithAtomUrl({} as unknown as UGraphic, URL_INFO, () => log.push('draw'));
    expect(log).toEqual(['draw']);
  });
});
