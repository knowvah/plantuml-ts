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

  // Its one residual (cloud glyph path token 64: ours 20.5, jar 20.005) was
  // svg-format's javaFixedN dropping the carried fraction's zero padding,
  // fixed in 82e861efc (ufp journal row 31).
  it('deployment-frame: equals the jar', () => {
    expect(pathsOf('deployment-frame')).toEqual([]);
  });

  // codd-T3 closed the note entity order residual: the note leaf takes its
  // `getUniqueSequence("GMN")` value first (CommandFactoryNoteOnEntity.java:327)
  // and draws polygon, fold and text inside one entity group
  // (EntityImageNote.java:154-157, :272-286).
  it('usecase-frame-note: equals the jar', () => {
    expect(pathsOf('usecase-frame-note')).toEqual([]);
  });
});

describe('lgm-T1c: state chrome equals the jar', () => {
  // gtc-T7a closed the transition label textLength residual both rows carried
  // (`SvgGraphics.java:700-706` emits it on every multi-char <text>).
  it.each(['state-title-only', 'state-frame-chrome'])('%s', (name) => {
    expect(pathsOf(name)).toEqual([]);
  });

  it('state-frame-notes: frame, canvas and positions exact; note draw order differs', () => {
    const paths = pathsOf('state-frame-notes');
    expect(paths.filter((p) => /^svg\/@|^svg\/g\[1\]\/(rect|path|text)\[1\]\//.test(p))).toEqual([]);
    expect(paths.filter((p) => /@(x|y|cx|cy|x1|x2|y1|y2|width|height|d\[|points)/.test(p))).toEqual([]);
  });

  // `state-composite-geo.ts#layoutComposite` carries the top-level pass's
  // `DotLayoutResult.originShift`, so the composite body sits in the raw frame.
  it('state-frame-composite: frame and body equal the jar', () => {
    expect(pathsOf('state-frame-composite')).toEqual([]);
  });
});
