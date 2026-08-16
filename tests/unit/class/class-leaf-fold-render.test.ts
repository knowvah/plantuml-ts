/**
 * Mission `leaf-draw-order` T3 acceptance: a hand-built `ClassGeometry`
 * with ONE classifier leaf and ONE note leaf (`leaves: [classifier, note]`)
 * renders to the SAME SVG a pre-fold two-array geometry would have -- this
 * pins the fold's byte-identity claim directly, independent of the corpus
 * reports (`note-order-report.ts`/`shape-match-report.ts`/
 * `dot-sync-report.ts`).
 *
 * The expected string below was CAPTURED from an actual `renderClass` run
 * against this exact geometry (`assembleSvg(renderClass(geo, defaultTheme))`),
 * not derived from the old `classifiers`/`notes` two-array code path, which
 * no longer exists post-fold -- see `plans/leaf-draw-order/batch-1/T3-fold.md`
 * acceptance criteria.
 */
import { describe, it, expect } from 'vitest';
import { renderClass } from '../../../src/diagrams/class/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { ClassGeometry, ClassifierGeo } from '../../../src/diagrams/class/layout.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';

describe('ClassGeometry.leaves fold — byte-identical render (T3)', () => {
  it('renders a classifier leaf + a note leaf to the pinned SVG string', () => {
    const classifier: ClassifierGeo = {
      id: 'A',
      kind: 'class',
      x: 10,
      y: 10,
      width: 120,
      height: 60,
      dividerYs: [28],
      rows: [{ text: 'A', y: 14, indent: 0 }],
    };
    const note: NoteGeo = {
      id: 'n0',
      kind: 'note',
      x: 150,
      y: 10,
      width: 80,
      height: 40,
      lines: ['hello'],
      lineWidths: [30],
      connector: [],
    };
    // T3: `leaves` REPLACES `classifiers`/`notes` -- concatenation order,
    // unchanged (order semantics land in T4).
    const geo: ClassGeometry = {
      totalWidth: 260,
      totalHeight: 100,
      leaves: [classifier, note],
      edges: [],
      namespaces: [],
    };

    const svg = assembleSvg(renderClass(geo, defaultTheme));

    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type="CLASS" style="width:260px;height:100px;background:#FFFFFF;" width="260px" height="100px" viewBox="0 0 260 100" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><!--class A--><g class="entity" data-qualified-name="A" id="ent0001"><rect x="10" y="10" width="120" height="60" fill="#F1F1F1" stroke="#181818" stroke-width="0.5" rx="2.5" ry="2.5"/><ellipse cx="25" cy="24" rx="11" ry="11" fill="#ADD1B2" stroke="#181818" stroke-width="1"/><path d="M27.473,30.143 Q26.892,30.442 26.253,30.591 Q25.614,30.741 24.908,30.741 Q22.401,30.741 21.082,29.089 Q19.762,27.437 19.762,24.316 Q19.762,21.187 21.082,19.535 Q22.401,17.883 24.908,17.883 Q25.614,17.883 26.261,18.032 Q26.909,18.182 27.473,18.481 L27.473,21.203 Q26.842,20.622 26.249,20.352 Q25.655,20.083 25.024,20.083 Q23.68,20.083 22.995,21.149 Q22.31,22.216 22.31,24.316 Q22.31,26.408 22.995,27.474 Q23.68,28.541 25.024,28.541 Q25.655,28.541 26.249,28.271 Q26.842,28.002 27.473,27.42 Z" fill="#000"/><text x="10" y="24" font-size="14" fill="#000">A</text><line x1="11" y1="38" x2="129" y2="38" stroke="#181818" stroke-width="0.5"/></g><g class="entity" data-qualified-name="n0" id="ent0002"><polygon points="150,10,220,10,230,20,230,50,150,50" fill="#FEFFDD" stroke="#181818" stroke-width="0.5" stroke-linejoin="miter" stroke-miterlimit="10"/><path d="M220,10 L220,20 L230,20" fill="none" stroke="#181818" stroke-width="0.5"/><text x="156" y="25.111" font-size="13" fill="#000" textLength="30">hello</text></g></g></svg>',
    );
  });
});
