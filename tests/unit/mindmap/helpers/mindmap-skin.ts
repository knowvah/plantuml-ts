/**
 * Test-only mindmap wiring: a source parsed by the production
 * `createMindMapDiagram` (its style builder built by
 * `buildMindmapStyleBuilder`, SkinParam.java:155-265), and a `UGraphicSvg`
 * over the deterministic measurer the jar probes were run against
 * (`-DPLANTUML_DETERMINISTIC_TEXT=true`), as in
 * `tests/unit/activity/ftile/FtileBoxOld.test.ts`.
 */
import { preprocess } from '../../../../src/core/preprocessor.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { Rankdir } from '../../../../src/core/klimt/geom/Rankdir.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import type { MindMapDiagram } from '../../../../src/diagrams/mindmap/MindMapDiagram.js';
import { createMindMapDiagram } from '../../../../src/diagrams/mindmap/MindMapDiagramFactory.js';

const measurer = new DeterministicMeasurer();

/** A fresh `UGraphicSvg` over the deterministic measurer. */
export function svgGraphic(): UGraphicSvg {
  const driver = {
    calculateDimension: (font: { family: string; size: number }, text: string) => measurer.measure(text, font),
  };
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driver, measurer);
}

export function stringBounder(): StringBounder {
  return svgGraphic().getStringBounder();
}

/**
 * `source` (with `@startmindmap`/`@endmindmap`) parsed through the
 * production factory, its skin param built from the source's own
 * skin/skinparam/`<style>` (`MindMapDiagramFactory.ts#buildSkinParam`).
 * `rankdir` is what the caller expects the source to resolve to (the
 * default LEFT_TO_RIGHT, or `top to bottom direction`); a mismatch fails
 * loudly rather than drawing in a direction the source never asked for.
 */
export function parseMindMap(source: string, rankdir: Rankdir): MindMapDiagram {
  const pre = preprocess(source);
  const result = createMindMapDiagram({ lines: [...pre.lines], type: 'mindmap', styleSource: pre });
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  const resolved = result.getSkinParam().getRankdir();
  if (resolved !== rankdir) throw new Error(`the source resolves to ${resolved}, the test expects ${rankdir}`);
  return result;
}
