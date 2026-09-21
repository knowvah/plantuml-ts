/**
 * Style census for `repin-activity-baselines.ts` -- duplicated from
 * `activity.style-baseline.test.ts` (see that tool's file doc comment for why
 * it cannot be imported: importing a `.test.ts` runs its top-level
 * `describe(...)` outside a vitest worker and throws). Kept byte-identical
 * in logic to that file's `censusOf`. Split out of the tool for the
 * 500-line cap when the promotion path landed (mission
 * `unknown-bucket-routing-repair`).
 */
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';
import type { NormalizedNode } from '../tests/oracle/svg-conformance/normalize.js';

export interface StyleCensus {
  readonly fontSize: Record<string, number>;
  readonly strokeWidth: Record<string, number>;
  readonly rx: Record<string, number>;
  readonly textCount: number;
  readonly width: string;
  readonly height: string;
}

function bumpHistogram(h: Record<string, number>, v: string | undefined): void {
  const key = v ?? '(absent)';
  h[key] = (h[key] ?? 0) + 1;
}

function walkStyleCensus(n: NormalizedNode, census: StyleCensus): number {
  let textCount = 0;
  if (n.type === 'element') {
    if (n.tag === 'text') {
      textCount += 1;
      bumpHistogram(census.fontSize, n.attrs?.['font-size']);
    } else if (n.tag === 'line') {
      bumpHistogram(census.strokeWidth, n.attrs?.['stroke-width']);
    } else if (n.tag === 'rect') {
      bumpHistogram(census.rx, n.attrs?.['rx']);
    }
  }
  for (const child of n.children ?? []) textCount += walkStyleCensus(child, census);
  return textCount;
}

export function styleCensusOf(svg: string): StyleCensus {
  const root = normalizeSvg(svg);
  const census: StyleCensus = { fontSize: {}, strokeWidth: {}, rx: {}, textCount: 0, width: '', height: '' };
  const textCount = walkStyleCensus(root, census);
  return { ...census, textCount, width: root.attrs?.['width'] ?? '', height: root.attrs?.['height'] ?? '' };
}
