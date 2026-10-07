/**
 * add4-T2g (COMPOSITE-NOTE): a note parsed right after a closed group is
 * forwarded by `InstructionList#addNote` (`InstructionList.java:190-196`) to
 * the group, which keeps it as its own note while its list is empty and
 * otherwise hands it to its last instruction (`InstructionGroup.java:
 * 125-131`). The note is therefore drawn INSIDE the frame, not stacked after
 * it. The goldens were rendered through `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2g');

function countOf(svg: string, tag: string): number {
  return [...svg.matchAll(new RegExp(`<${tag}\\b`, 'g'))].length;
}

describe('note after a closed group', () => {
  it.each([
    ['group-note-after', 'a spiked note on the partition last action'],
    ['group-note-nested', 'a floating note reaches the innermost last action'],
    ['group-note-empty', 'an empty group keeps the note as its own'],
  ])('%s: %s, equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(countOf(ours, 'line')).toBe(countOf(golden, 'line'));
    expect(countOf(ours, 'polygon')).toBe(countOf(golden, 'polygon'));
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
