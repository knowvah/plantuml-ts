/**
 * add4-T3gates (D9): every action/note label is drawn by upstream's Sheet
 * structure -- `FtileBox.java:178-181` (`SheetBlock2(SheetBlock1, MyStencil,
 * UStroke.withThickness(1))`) and its `drawU` alignment translate
 * (`FtileBox.java:224-233`) -- with no syntactic eligibility gate. Each
 * fixture under `tests/fixtures/activity/add4-T3gates/` carries its jar
 * oracle (`scripts/oracle-render.sh`, deterministic text) as `<name>.svg`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { drawActivityText } from '../../../src/diagrams/activity/activity-renderer-text.js';
import { activityHyperlinkColor } from '../../../src/diagrams/activity/activity-text-style.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/activity/add4-T3gates');

function diffPaths(name: string): string[] {
  const markup = readFileSync(join(DIR, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(DIR, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('activity labels through the FtileBox Sheet (jar oracles)', () => {
  it('CENTER: separator stencil + creole table grid match the jar', () => {
    expect(diffPaths('center-separator-table')).toEqual([]);
  });

  it('RIGHT: per-line Sheet alignment + `====` double rule match the jar', () => {
    expect(diffPaths('right-separator')).toEqual([]);
  });

  // `-- t --`/`== t ==` are LITERAL-classified stripes holding a titled
  // `UHorizontalLine` (`UHorizontalLine.java:87-96,111-152`): drawn only
  // through `UGraphicStencil#drawHline` (`UGraphicStencil.java:83-84`) via
  // `FtileBox`'s `MyStencil` (`FtileBox.java:125-135,180-181`).
  it('titled and plain separators draw through the MyStencil like the jar', () => {
    expect(diffPaths('titled-separators')).toEqual([]);
  });

  it('multi-line action and note bodies lose only their shared indentation', () => {
    expect(diffPaths('multiline-columns')).toEqual([]);
  });

  it('partition and package titles take the hyperlink colour (Style.java:265)', () => {
    expect(diffPaths('composite-title-url')).toEqual([]);
  });

  it('hyperlinkColor/hyperlinkUnderline/svgLinkTarget reach action AND note links', () => {
    expect(diffPaths('hyperlink-skin')).toEqual([]);
  });

  it('a default `[[url{tooltip} label]]` action stays byte-equivalent', () => {
    expect(diffPaths('hyperlink-default')).toEqual([]);
  });

  it('a `[[url label]]` lane title keeps its <a> in the root hyperlink colour', () => {
    expect(diffPaths('lane-title-url')).toEqual([]);
  });
});

describe('drawActivityText url-run colour (Style.java:265)', () => {
  const STYLE = { fontFamily: 'SansSerif', fontSize: 12, fill: '#000' };

  it('replaces the default hyperlink blue with the caller-resolved colour', () => {
    const svg = drawActivityText(10, 20, '[[http://x.com label]]', { ...STYLE, hyperlinkColor: '#008000' });
    expect(svg).toContain('fill="#008000"');
    expect(svg).not.toContain('fill="#00F"');
  });

  it('keeps an inner <color:x> override inside the link label', () => {
    const svg = drawActivityText(10, 20, '[[http://x.com <color:red>label</color>]]', {
      ...STYLE,
      hyperlinkColor: '#008000',
    });
    expect(svg).toContain('fill="#F00"');
  });
});

describe('activityHyperlinkColor (Style.java:265 over FtileBox.java:97-99)', () => {
  function themeWith(elements: Record<string, { hyperlinkColor: string }>): Theme {
    return { ...defaultTheme, colors: { ...defaultTheme.colors, elements } };
  }

  it('is undefined (plantuml.skin:7 blue, applied downstream) when nothing is set', () => {
    expect(activityHyperlinkColor(defaultTheme, 'activity')).toBeUndefined();
  });

  it('reads the root tier for every sname, and for an omitted sname', () => {
    const theme = themeWith({ root: { hyperlinkColor: 'red' } });
    expect(activityHyperlinkColor(theme, 'note')).toBe('red');
    expect(activityHyperlinkColor(theme)).toBe('red');
  });

  it('prefers the sname bucket over the root tier', () => {
    const theme = themeWith({ root: { hyperlinkColor: 'red' }, activity: { hyperlinkColor: 'green' } });
    expect(activityHyperlinkColor(theme, 'activity')).toBe('green');
    expect(activityHyperlinkColor(theme, 'note')).toBe('red');
  });
});
