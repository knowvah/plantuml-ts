/**
 * Test-only mindmap wiring: a source preprocessed, its `StyleBuilder` built
 * by `buildMindmapStyleBuilder` (SkinParam.java:155-265), and the tree
 * parsed by `createMindMapDiagram` against a `MindMapSkinParam` — T3c's
 * `ISkinParamWithSimple` double plus the builder and the rankdir. The
 * StringBounder is the deterministic measurer the jar probes were run
 * against (`-DPLANTUML_DETERMINISTIC_TEXT=true`), as in
 * `tests/unit/activity/ftile/FtileBoxOld.test.ts`.
 */
import { preprocess } from '../../../../src/core/preprocessor.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { bridgeFontConfiguration } from '../../../../src/core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { Rankdir } from '../../../../src/core/klimt/geom/Rankdir.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { buildMindmapStyleBuilder } from '../../../../src/core/style/mindmap-style-builder.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import type { AtomOps } from '../../../../src/core/klimt/creole/Sea.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import type { MindMapSkinParam } from '../../../../src/diagrams/mindmap/MindMap.js';
import type { MindMapDiagram } from '../../../../src/diagrams/mindmap/MindMapDiagram.js';
import { createMindMapDiagram } from '../../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import { testAtomOps, testSkinParam } from '../../activity/ftile/helpers/skin-param.js';

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

export interface MindMapWiring {
  readonly skinParam: MindMapSkinParam;
  readonly atomOps: AtomOps;
}

/** The double, answering the given builder and rankdir, and the one `AtomOps` its sheets share. */
export function mindMapWiring(builder: StyleBuilder, rankdir: Rankdir): MindMapWiring {
  const root = StyleSignatureBasic.of('root').getMergedStyle(builder);
  if (root === undefined) throw new Error('builder has no root style');
  const atomOps = testAtomOps(bridgeFontConfiguration(root.getFontConfiguration(HColorSet.instance())));
  const skinParam = { ...testSkinParam(atomOps), getCurrentStyleBuilder: () => builder, getRankdir: () => rankdir };
  return { skinParam, atomOps };
}

/** `source` (with `@startmindmap`/`@endmindmap`) parsed with its own style builder. */
export function parseMindMap(source: string, rankdir: Rankdir): MindMapDiagram {
  const pre = preprocess(source);
  const wiring = mindMapWiring(buildMindmapStyleBuilder(pre), rankdir);
  const result = createMindMapDiagram({ lines: [...pre.lines], type: 'mindmap' }, wiring);
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}
