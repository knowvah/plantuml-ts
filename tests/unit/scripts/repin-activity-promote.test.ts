/**
 * Unit tests for `scripts/repin-activity-promote.ts` (mission
 * `unknown-bucket-routing-repair`). Pure functions only; the render path is
 * exercised by the orchestrator's `--write` run, as for the sibling tool.
 */
import { describe, it, expect, vi } from 'vitest';
import { promoteRow, promoteErrorRows, measureOrUndefined } from '../../../scripts/repin-activity-promote.js';

const DATES = { today: '2026-09-20', commit: 'abcdef12', perFixture: true } as const;

describe('promoteRow', () => {
  it('drops the reason, sets status baseline, adds the measured fields and per-fixture dates', () => {
    const row = { type: 'activity', slug: 'a', status: 'error', diffCount: null, reason: 'refused at line 5' };
    expect(promoteRow(row, { weightedScore: 42, diffCount: 3 }, DATES)).toEqual({
      type: 'activity',
      slug: 'a',
      status: 'baseline',
      weightedScore: 42,
      diffCount: 3,
      measuredAt: '2026-09-20',
      measuredAgainstCommit: 'abcdef12',
    });
  });

  it('omits the dates when the file pins them at file level only (swimlane)', () => {
    const row = { type: 'activity', slug: 'b', status: 'error', reason: 'x' };
    const out = promoteRow(
      row,
      { ours: { lanes: 2 }, jar: { lanes: 2 }, laneCount: 2 },
      { ...DATES, perFixture: false },
    );
    expect(out).toEqual({
      type: 'activity',
      slug: 'b',
      status: 'baseline',
      ours: { lanes: 2 },
      jar: { lanes: 2 },
      laneCount: 2,
    });
    expect(out).not.toHaveProperty('measuredAt');
  });
});

describe('promoteErrorRows', () => {
  const rows = () => [
    { slug: 'still-errors', status: 'error', reason: 'r1' },
    { slug: 'now-renders', status: 'error', reason: 'r2' },
    { slug: 'already', status: 'baseline', weightedScore: 7 },
  ];
  const measure = (slug: string) => (slug === 'now-renders' ? { weightedScore: 9, diffCount: 1 } : undefined);

  it('promotes only the error row that now measures, and only when write is true', () => {
    const fixtures = rows();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const promoted = promoteErrorRows(fixtures, measure, DATES, { label: 'diff-baseline', write: true });
    log.mockRestore();
    expect(promoted).toEqual(['now-renders']);
    expect(fixtures[0]).toEqual({ slug: 'still-errors', status: 'error', reason: 'r1' });
    expect(fixtures[1]).toEqual({
      slug: 'now-renders',
      status: 'baseline',
      weightedScore: 9,
      diffCount: 1,
      measuredAt: '2026-09-20',
      measuredAgainstCommit: 'abcdef12',
    });
    expect(fixtures[2]).toEqual({ slug: 'already', status: 'baseline', weightedScore: 7 });
  });

  it('reports but does not mutate without write, printing PROMOTED <file> <slug>', () => {
    const fixtures = rows();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const promoted = promoteErrorRows(fixtures, measure, DATES, { label: 'text-baseline', write: false });
    expect(log).toHaveBeenCalledWith('PROMOTED text-baseline now-renders');
    log.mockRestore();
    expect(promoted).toEqual(['now-renders']);
    expect(fixtures[1]!.status).toBe('error');
  });
});

describe('measureOrUndefined', () => {
  it('returns the value when the measurer succeeds and undefined when it throws', () => {
    expect(measureOrUndefined(() => 5)).toBe(5);
    expect(
      measureOrUndefined(() => {
        throw new Error('parser refused');
      }),
    ).toBeUndefined();
  });
});
