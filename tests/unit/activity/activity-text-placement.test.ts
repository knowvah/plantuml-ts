/**
 * Direct unit tests for `src/diagrams/activity/activity-text-placement.ts`
 * (mission `activity-min-box-width`, T5, D2).
 */
import { describe, it, expect } from 'vitest';
import {
  measureLineWidth,
  centeredLineX,
  activityTextLineX,
  isTableRowLine,
  tableRowCellsOf,
} from '../../../src/diagrams/activity/activity-text-placement.js';
import { resolveTheme } from '../../../src/core/theme.js';

const theme = resolveTheme('default');

describe('measureLineWidth', () => {
  it('matches WidthTableMeasurer directly (the deterministic conformance metric)', () => {
    // "Component" at size 14 -> 72.3625, per DeterministicMeasurer's own
    // jar-verified table (core/measurer-deterministic.ts doc comment).
    expect(measureLineWidth(theme, 14, 'Component')).toBeCloseTo(72.3625, 4);
  });

  it('scales with font size', () => {
    const at14 = measureLineWidth(theme, 14, 'hello');
    const at28 = measureLineWidth(theme, 28, 'hello');
    expect(at28).toBeCloseTo(at14 * 2, 6);
  });
});

describe('centeredLineX', () => {
  it('centres a line under cx by half its own width (FtileDiamondInside.java:94-96)', () => {
    expect(centeredLineX(100, 20)).toBe(90);
  });
});

describe('activityTextLineX', () => {
  it('diamond sname centres geometrically, ignoring width entirely', () => {
    expect(activityTextLineX(theme, 100, 20, { sname: 'diamond' })).toBe(90);
  });

  it('activity sname, LEFT (root default): boxX + padding, regardless of line width', () => {
    // cx=110, width=120 -> boxX=50; activityPadding('activity') is 10
    // (plantuml.skin:360, Padding 10) -- matches the jar's
    // cizixu-00-koro700 fixture (x = rect.x + 10).
    const x = activityTextLineX(theme, 110, 999, { sname: 'activity', width: 120 });
    expect(x).toBe(60);
  });

  it('activity sname without width throws (broken caller contract)', () => {
    expect(() => activityTextLineX(theme, 100, 20, { sname: 'activity' })).toThrow(/width is required/);
  });
});

// T3e: shared creole-table-row helpers (`CreoleParser.java:117`,
// `StripeTable.java:137-159`) -- both `tiles/gtile-action.ts` (sizing) and
// `activity-renderer-text.ts` (drawing) consume these two functions, so the
// two stages can never drift apart on what a `|cell|` line resolves to.
describe('isTableRowLine', () => {
  it('matches a bracket-free `|cell|` line (activity-creole-table fixture)', () => {
    expect(isTableRowLine('|Creole Table Line1|')).toBe(true);
  });

  it('rejects a line with no leading/trailing pipe', () => {
    expect(isTableRowLine('foo1')).toBe(false);
    expect(isTableRowLine('|unterminated')).toBe(false);
  });
});

describe('tableRowCellsOf', () => {
  it('strips the outer pipes and trims (single column, StripeTable.java:137-159)', () => {
    expect(tableRowCellsOf('|Creole Table Line1|')).toEqual(['Creole Table Line1']);
  });

  it('strips a leading `=` header marker (StripeTable.java:140-143)', () => {
    expect(tableRowCellsOf('|=Header|')).toEqual(['Header']);
  });

  it('splits multiple cells on `|`', () => {
    expect(tableRowCellsOf('|a|b|c|')).toEqual(['a', 'b', 'c']);
  });
});
