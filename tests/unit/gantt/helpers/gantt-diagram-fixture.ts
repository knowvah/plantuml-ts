/**
 * Test wiring for `GanttDiagram`: a diagram over the production default skin (`createMindmapSkinParam`, the style
 * half the wbs/mindmap engines share) with the gantt `SkinParam`, a `UGraphicSvg` over the deterministic measurer the
 * jar oracles were rendered with (`-DPLANTUML_DETERMINISTIC_TEXT=true`), and the oracle SVG reader.
 */
import { readFileSync } from 'node:fs';
import { DEFAULT_CLOCK, type Clock } from '../../../../src/core/clock.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../../src/core/style/mindmap-style-builder.js';
import { PreprocessingArtifact } from '../../../../src/core/tim/PreprocessingArtifact.js';
import { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { SkinParam } from '../../../../src/diagrams/gantt/gantt-skin-param.js';

const measurer = new DeterministicMeasurer();

/** A fresh `UGraphicSvg` over the deterministic measurer. */
export function svgGraphic(): UGraphicSvg {
  const driver = {
    calculateDimension: (font: { family: string; size: number }, text: string) => measurer.measure(text, font),
  };
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driver, measurer);
}

/** The gantt skin param over the default skin, no skinparam, no sprites. */
export function ganttSkinParam(): SkinParam {
  return new SkinParam({
    style: createMindmapSkinParam({}),
    skinparam: new Map(),
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
}

/** An empty gantt diagram (`GanttDiagram(UmlSource, PreprocessingArtifact)`, GanttDiagram.java:154-157). */
export function newGantt(clock: Clock = DEFAULT_CLOCK): GanttDiagram {
  return new GanttDiagram({ lines: [] }, new PreprocessingArtifact(), ganttSkinParam(), clock);
}

/** `getTextBlock(0, bounder).drawU` on a fresh `UGraphicSvg`; the SVG body it produced. */
export function drawSvg(diagram: GanttDiagram): string {
  const ug = svgGraphic();
  diagram.getTextBlock(0, ug.getStringBounder()).drawU(ug);
  return ug.getSvgString();
}

/** A jar oracle under `tests/fixtures/gantt/`. */
export function oracleSvg(name: string): string {
  return readFileSync(new URL(`../../../fixtures/gantt/${name}.svg`, import.meta.url), 'utf8');
}

const ELEMENT = /<(?:line|text|rect|polygon|path|ellipse)\b[^>]*>(?:[^<]*<\/text>)?/g;

/** The drawn elements of an SVG, in document order. */
export function elementsOf(svg: string): string[] {
  return svg.match(ELEMENT) ?? [];
}
