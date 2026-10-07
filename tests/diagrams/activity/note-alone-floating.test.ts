/**
 * add4-T2c (FLOATING-NOTE): a note on an EMPTY instruction list becomes a
 * `FtileNoteAlone` (`FtileFactoryDelegatorAddNote.java:61-68`) whose out
 * point exists only for `NoteType.NOTE` (`FtileNoteAlone.java:129-132`).
 * `FtileFactoryDelegatorAssembly.java:68-70` adds no connection after a
 * tile without an out point, so a leading `floating note` has no arrow
 * into the next tile, while a leading plain `note` keeps it. Both `in.svg`
 * goldens were rendered through `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2c');

function countOf(svg: string, tag: string): number {
  return [...svg.matchAll(new RegExp(`<${tag}\\b`, 'g'))].length;
}

describe('note alone at the head of a list', () => {
  it('a floating note draws no connector to the next tile, equal to the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'note-alone-floating');
    expect(countOf(golden, 'line')).toBe(1);
    expect(countOf(ours, 'line')).toBe(1);
    expect(countOf(ours, 'polygon')).toBe(1);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });

  it('a plain note keeps its connector to the next tile, equal to the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'note-alone-plain');
    expect(countOf(golden, 'line')).toBe(2);
    expect(countOf(ours, 'line')).toBe(2);
    expect(countOf(ours, 'polygon')).toBe(2);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
