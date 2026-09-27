/**
 * T11 (docs/graphviz-issues/25-edge-label-published-when-unplaced.md).
 *
 * `attachEdgeLabel` (`class-edge-label-attach.ts:150-168`) is the ACTUAL
 * "draw the edge's plain-text label" consumer -- it reads
 * `edgeResult.labelX`/`.labelY` (`core/graph-layout.ts#toEdgeEntry`'s
 * `ge.label`, itself `graph-layout-svek-read.ts#svekEdge`'s mapping of
 * `getLayout()`'s `EdgeGeometry.label`) and returns with NOTHING attached
 * to `edgeGeo` when either is `undefined` (`:168`).
 *
 * Real graphviz can leave a REQUESTED centre label unplaced (force-search
 * failure, `ED_label(e)->set` stays false) -- `emit.c#emit_edge_label`
 * then skips the `<text>` draw, and upstream's own consumer,
 * `SvekEdge.java:741-748`'s `getXY(fullSvg, noteLabelColor)` (`:808-815`),
 * finds no `<text>` tagged with this edge's debug color in ITS rendered
 * `-Tsvg`, returns `null`, leaves `this.labelXY` `null`, and skips the draw
 * at `:951` (`if (hasNoteLabelText() && this.labelXY != null ...)`) the
 * same way. `@knowvah/dot-engine` 1.6.1 gates `EdgeGeometry.label` on the
 * identical condition directly (`docs/graphviz-issues/25-edge-label-
 * published-when-unplaced.md`; confirmed real via
 * `tests/unit/core/graph-layout-svek-read.test.ts`'s T11 describe block,
 * reading `class/delasa-80-jusu462`'s cached DOT with real dot-engine).
 *
 * `attachEdgeLabel` cannot be driven into this state through a small
 * synthetic `layoutClass()` diagram -- a trivial 2-node graph never
 * exhausts graphviz's label-placement search, so `edgeResult.labelX` is
 * always defined for any `rel.label`-carrying edge that small. This test
 * therefore calls `attachEdgeLabel` directly with the exact absent shape
 * `toEdgeEntry` produces for a genuinely unplaced label (no `labelX`/
 * `labelY` KEYS at all, matching `assignLabelPos`'s early return on
 * `pos === undefined` -- `core/graph-layout.ts:116-125`) while `rel.label`
 * IS set, pinning that "requested but unplaced" draws nothing, the same
 * as "never requested".
 */
import { describe, it, expect } from 'vitest';
import { attachEdgeLabel, type EdgeGeoTextContext } from '../../../src/diagrams/class/class-edge-label-attach.js';
import type { Relationship } from '../../../src/diagrams/class/ast.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { resolveArrowLabelFont } from '../../../src/core/arrow-label-font.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const labelFont = resolveArrowLabelFont(defaultTheme);
const text: EdgeGeoTextContext = { measurer, labelFont, fontFamily: defaultTheme.fontFamily };

function makeEdgeGeo(): EdgeGeo {
  return { id: 'e0', points: [], sourceDecor: 'none', targetDecor: 'none', dashed: false, from: 'A', to: 'B' };
}

const rel: Relationship = { from: 'A', to: 'B', type: 'association', label: 'demo' };

describe('attachEdgeLabel — an unplaced label attaches nothing (T11, issue 25)', () => {
  it('draws nothing when labelX/labelY are absent, even though rel.label is set', () => {
    // The exact `toEdgeEntry` output shape for a genuinely unplaced label:
    // no `labelX`/`labelY` keys (never a sentinel `{x: 0, y: ...}`).
    const edgeResult: DotLayoutResult['edges'][number] = { id: 'e0', points: [{ x: 0, y: 0 }, { x: 20, y: 0 }] };
    const edgeGeo = makeEdgeGeo();

    attachEdgeLabel(edgeGeo, rel, edgeResult, text, edgeResult.points);

    expect(edgeGeo.label).toBeUndefined();
    expect(edgeGeo.labelLines).toBeUndefined();
    expect(edgeGeo.arrowGlyph).toBeUndefined();
    expect(edgeGeo.visibilityIcon).toBeUndefined();
  });

  it('contrast: the SAME rel.label attaches a label once labelX/labelY are placed', () => {
    const edgeResult: DotLayoutResult['edges'][number] = {
      id: 'e0',
      points: [{ x: 0, y: 0 }, { x: 20, y: 0 }],
      labelX: 10,
      labelY: 5,
    };
    const edgeGeo = makeEdgeGeo();

    attachEdgeLabel(edgeGeo, rel, edgeResult, text, edgeResult.points);

    expect(edgeGeo.label).toBeDefined();
    expect(edgeGeo.label?.text).toBe('demo');
  });

  it('draws nothing when rel.label is undefined, regardless of labelX/labelY (pre-existing guard)', () => {
    const edgeResult: DotLayoutResult['edges'][number] = {
      id: 'e0',
      points: [{ x: 0, y: 0 }, { x: 20, y: 0 }],
      labelX: 10,
      labelY: 5,
    };
    const edgeGeo = makeEdgeGeo();
    const noLabelRel: Relationship = { from: 'A', to: 'B', type: 'association' };

    attachEdgeLabel(edgeGeo, noLabelRel, edgeResult, text, edgeResult.points);

    expect(edgeGeo.label).toBeUndefined();
  });
});
