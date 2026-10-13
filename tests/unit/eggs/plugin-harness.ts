/**
 * Shared by the eggs tests: the pipeline's `UmlSource` for one block and a
 * full single-line plugin round trip (parse, layoutSync, render) under
 * `DeterministicMeasurer`, before T2a registers anything (the T0c recipe).
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ParseOptions, SyncPlugin } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { defaultTheme } from '../../../src/core/theme.js';

/** `src/index.ts#umlSourceOfBlock`'s shape, seed lines included. */
export function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

/** The SVG `plugin` renders for `text`; throws on a refusal. */
export function renderWith<D, G>(plugin: SyncPlugin<D, G>, text: string, options?: ParseOptions): string {
  const measurer = new DeterministicMeasurer();
  const ast = plugin.parse(sourceOf(text), options);
  const refusal = parseRefusalOf(ast);
  if (refusal !== undefined) throw new Error(`refused: ${refusal.message}`);
  const assembled = plugin.render(plugin.layoutSync(ast as D, defaultTheme, measurer), defaultTheme, measurer);
  if (!('completeSvg' in assembled)) throw new Error('expected a complete SVG');
  return assembled.completeSvg;
}
