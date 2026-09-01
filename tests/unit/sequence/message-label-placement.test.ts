/**
 * A2 — a message label's LEFT EDGE against the jar's own numbers.
 *
 * `messageLabelBlock` is unit-tested for the block's internal arithmetic; what
 * it cannot see is where the caller anchors that block. That is
 * `sequence-layout-message.ts#labelLeftOf`, and it is the whole of A2's `x`
 * improvement, so it is pinned here against the cached oracle rather than
 * against a value this port computed.
 *
 * The oracle is `bosedo-77-loge384`, whose three messages happen to cover both
 * arms of upstream's clearance rule:
 *
 * ```
 * bob -> alice : 12345        JAR x=35.681   line starts 28.681   +7
 * bob -> alice : こんにちわ     JAR x=35.681   line starts 28.681   +7
 * bob <- alice : さようなら     JAR x=45.681   origin      28.681   +7+10
 * ```
 *
 * The third is the discriminating one. This port normalises `<-` by swapping
 * `fromX`/`toX` and leaving the head on `dressing2`, where upstream leaves the
 * arrow left-to-right and moves the head to `dressing1`. Asking `dressing1`
 * directly — the literal transcription of `ComponentRoseArrow.java:174-177` —
 * compiles, runs, and never fires. Only a leftward message catches it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const ORACLE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/sequence/bosedo-77-loge384/in.puml',
);

/** Every 13pt `<text>` — the arrow font, so message labels and nothing else. */
function messageLabels(svg: string): Array<{ x: string; textLength?: string; text: string }> {
  const out: Array<{ x: string; textLength?: string; text: string }> = [];
  for (const m of svg.matchAll(/<text([^>]*font-size="13"[^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[1]!;
    const x = /\bx="([^"]*)"/.exec(attrs)![1]!;
    const len = /\btextLength="([^"]*)"/.exec(attrs);
    out.push({ x, ...(len === null ? {} : { textLength: len[1]! }), text: m[2]! });
  }
  return out;
}

describe('message label placement against the jar', () => {
  const svg = renderFixtureSequence(readFileSync(ORACLE, 'utf8'), new DeterministicMeasurer());
  const labels = messageLabels(svg);

  it('places a rightward message label at the arrow origin + 7', () => {
    // `getOldPaddingX1()` = `padding.getLeft()` of
    // `topRightBottomLeft(1, 7, 1, 7)` (`AbstractComponentRoseArrow.java:62`).
    expect(labels[0]!.x).toBe('35.681');
    expect(labels[1]!.x).toBe('35.681');
  });

  it('adds getArrowDeltaX() when a head sits at the arrow’s LEFT end', () => {
    // `ComponentRoseArrow.java:174-177`. 28.681 + 7 + 10.
    expect(labels[2]!.x).toBe('45.681');
  });

  it('emits the jar’s own textLength for each', () => {
    expect(labels[0]!.textLength).toBe('36.156');
    expect(labels[1]!.textLength).toBe('65');
    expect(labels[2]!.textLength).toBe('65');
  });

  it('emits no anchor and no dominant-baseline anywhere', () => {
    // Participant labels still anchor until A3; this asserts the ARROW-font
    // runs only, which is what A2 owns.
    for (const m of svg.matchAll(/<text[^>]*font-size="13"[^>]*>/g)) {
      expect(m[0]).not.toContain('text-anchor');
      expect(m[0]).not.toContain('dominant-baseline');
    }
  });
});
