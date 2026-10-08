/**
 * lgm-T1c: chrome (mainframe, title, legend, footer) around the state and
 * description engines, equal to jar renders (`scripts/oracle-render.sh`) in
 * `tests/fixtures/lgm-T1c/`.
 *
 * `UgDiagram#getExporter` (`UgDiagram.java:124-128`) composes chrome around
 * the margin-less `SvekResult` block and applies the document margin after;
 * under a `mainframe`, `decorateWithFrame` never calls the block's
 * `calculateDimension` (`DiagramChromeFactory.java:278-337`), so the body is
 * drawn in the raw svek frame. Residual diffs listed per fixture are BODY
 * diffs present without any chrome; every root attribute and the frame
 * rect / tab / title must be exact.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, type Diff } from './compare.js';

const DIR = 'tests/fixtures/lgm-T1c';
const LABEL_TEXT_LENGTH = 'svg/g[1]/g[6]/text[1]/@textLength';

function diffsOf(name: string): readonly Diff[] {
  const read = (ext: string) => readFileSync(join(DIR, `${name}.${ext}`), 'utf8');
  const ours = renderSync(read('puml'), { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, read('svg'), 'deterministic').diffs;
}

const pathsOf = (name: string): string[] => diffsOf(name).map((d) => d.path);

describe('lgm-T1c: description chrome equals the jar', () => {
  it.each(['component-frame-chrome', 'component-title-only'])('%s', (name) => {
    expect(diffsOf(name)).toEqual([]);
  });

  it('deployment-frame: only a cloud glyph path coordinate differs', () => {
    expect(pathsOf('deployment-frame')).toEqual(['svg/g[1]/g[3]/path[1]/@d[64]']);
  });

  it('usecase-frame-note: only the note entity order differs', () => {
    expect(pathsOf('usecase-frame-note')).toEqual([
      'svg/g[1]/g[4]/@id',
      'svg/g[1]/g[4][childCount]',
      'svg/g[1]/g[5]/@id',
      'svg/g[1]/g[6]/@id',
      'svg/g[1][childCount]',
    ]);
  });
});

describe('lgm-T1c: state chrome equals the jar', () => {
  it.each([
    ['state-title-only', LABEL_TEXT_LENGTH],
    ['state-frame-chrome', 'svg/g[1]/g[7]/text[1]/@textLength'],
  ])('%s', (name, residual) => {
    expect(pathsOf(name)).toEqual([residual]);
  });

  it('state-frame-notes: frame, canvas and positions exact; note draw order differs', () => {
    const paths = pathsOf('state-frame-notes');
    expect(paths.filter((p) => /^svg\/@|^svg\/g\[1\]\/(rect|path|text)\[1\]\//.test(p))).toEqual([]);
    expect(paths.filter((p) => /@(x|y|cx|cy|x1|x2|y1|y2|width|height|d\[|points)/.test(p))).toEqual([]);
  });

  // `DotLayoutResult.originShift` of the top-level pass is not carried out of
  // `state-composite-geo.ts#layoutComposite` yet (T1b's file): the frame is
  // right, the body sits `originShift.y` too high. Flip to `[]` when it is.
  it('state-frame-composite: open -- composite top pass has no originShift', () => {
    const paths = pathsOf('state-frame-composite');
    expect(paths).toContain('svg/@height');
    expect(paths.every((p) => /@(height|y|y1|y2|cy|d\[|points)|viewBox\[3\]/.test(p))).toBe(true);
  });
});
