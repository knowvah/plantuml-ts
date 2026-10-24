/**
 * sdd3-T2d -- `TextBlockExporter.Builder#calculateMargin` for sequence
 * (`core/TextBlockExporter.java:510-516`): the merged `{root, document}`
 * style's `Margin` when it has one, else `getDefaultMargins()` (`same(5)`,
 * `SequenceDiagram.java:629-633`).
 *
 * The sequence layout bakes the default exporter margin (5) plus the teoz
 * block's own translate (5, `teoz/SequenceDiagramFileMakerTeoz.java:134-168`)
 * into the body; {@link withExporterMargin} moves the body by the DIFFERENCE
 * to the style margin and re-derives the canvas. Expected values are jar
 * output (`scripts/oracle-render.sh`) of `Bob -> Alice : hello` under
 * `<style> document { Margin ... } </style>`:
 *
 *   none          114 x 124, lifeline rect x 77.663 y 39
 *   Margin 10     124 x 134, lifeline rect x 82.663 y 44   (+5, +5)
 *   Margin 2 7 11 3 (top right bottom left)
 *                 114 x 127, lifeline rect x 75.663 y 36   (-2, -3)
 *   scale 2       228 x 248, lifeline rect x 155.325 y 78
 *   scale 2 + Margin 10
 *                 248 x 268, lifeline rect x 165.325 y 88  (+10, +10)
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { withExporterMargin } from '../../../src/diagrams/sequence/renderer-document.js';
import { SEQUENCE_DOCUMENT_MARGIN } from '../../../src/core/document-margin.js';
import { sequenceSource } from '../../helpers/sequence-source.js';
import type { SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';

const MEASURER = new DeterministicMeasurer();
const HELLO = 'Bob -> Alice : hello';
const LIFELINE_RECT_RE =
  /<rect x="([0-9.]+)" y="([0-9.]+)" width="[0-9.]+" height="[0-9.]+" fill="#000" fill-opacity="0"\/>/;

function geometry(...lines: string[]): SequenceGeometry {
  const parsed = parseSequence(sequenceSource([...lines, HELLO]));
  if ('refused' in parsed) throw new Error(`sequence parse refused at line ${String(parsed.line)}`);
  return layoutSequence(parsed, defaultTheme, MEASURER);
}

function themed(margin: Theme['diagramMargin']): Theme {
  return margin === undefined ? defaultTheme : { ...defaultTheme, diagramMargin: margin };
}

/** The unscaled page the renderer hands over, then the exporter margin. */
function exported(margin: Theme['diagramMargin'], k = 1, ...lines: string[]): RenderFragment {
  const geo = geometry(...lines);
  return withExporterMargin(renderSequence(geo, defaultTheme, MEASURER), geo, themed(margin), k);
}

function lifelineRect(fragment: RenderFragment): { x: number; y: number } {
  const m = LIFELINE_RECT_RE.exec(fragment.body);
  if (m === null) throw new Error('no lifeline hit-rect in the body');
  return { x: Number(m[1]), y: Number(m[2]) };
}

describe('withExporterMargin -- no style Margin (TextBlockExporter.java:515)', () => {
  it('returns the fragment unchanged, so output without a style margin is byte-identical', () => {
    const geo = geometry();
    const fragment = renderSequence(geo, defaultTheme, MEASURER);
    expect(withExporterMargin(fragment, geo, defaultTheme, 1)).toBe(fragment);
  });

  it('returns the fragment unchanged when the style margin equals the default same(5)', () => {
    const geo = geometry();
    const fragment = renderSequence(geo, defaultTheme, MEASURER);
    expect(withExporterMargin(fragment, geo, themed(SEQUENCE_DOCUMENT_MARGIN), 1)).toBe(fragment);
  });
});

describe('withExporterMargin -- style Margin (TextBlockExporter.java:510-516,159-176,199-203)', () => {
  const same10 = { top: 10, right: 10, bottom: 10, left: 10 };

  it('Margin 10 grows the canvas by 5 per side and moves the body by (5, 5)', () => {
    const base = exported(undefined);
    const f = exported(same10);
    expect(f.width - base.width).toBeCloseTo(10, 6);
    expect(f.height - base.height).toBeCloseTo(10, 6);
    expect(lifelineRect(f).x - lifelineRect(base).x).toBe(5);
    expect(lifelineRect(f).y - lifelineRect(base).y).toBe(5);
  });

  it('Margin 10 keeps the margin-less block the chrome composes around', () => {
    const base = exported(undefined);
    const f = exported(same10);
    expect(f.preChromeWidth).toBe(base.preChromeWidth);
    expect(f.preChromeHeight).toBe(base.preChromeHeight);
    expect(f.documentMargin).toEqual(same10);
  });

  it('Margin "2 7 11 3" is clockwise top/right/bottom/left: body (-3, -2), canvas (+2, +3)', () => {
    const asym = { top: 2, right: 7, bottom: 11, left: 3 };
    const base = exported(undefined);
    const f = exported(asym);
    expect(lifelineRect(f).x - lifelineRect(base).x).toBe(-2); // left 3 - 5
    expect(lifelineRect(f).y - lifelineRect(base).y).toBe(-3); // top 2 - 5
    expect(f.width - base.width).toBeCloseTo(0, 6); // (3 + 7) - 10
    expect(f.height - base.height).toBeCloseTo(3, 6); // (2 + 11) - 10
    expect(f.preChromeWidth).toBe(base.preChromeWidth);
  });

  it('a scaled page moves the body and canvas by the margin delta times the scale', () => {
    const base = exported(undefined, 2, 'scale 2');
    const f = exported(same10, 2, 'scale 2');
    expect(lifelineRect(f).x - lifelineRect(base).x).toBe(10);
    expect(lifelineRect(f).y - lifelineRect(base).y).toBe(10);
    expect(f.width - base.width).toBe(20); // jar 228 -> 248
    expect(f.height - base.height).toBe(20); // jar 248 -> 268
    expect(f.scaledCanvas).toBe(true);
    expect(f.preChromeWidth).toBeUndefined();
  });
});
