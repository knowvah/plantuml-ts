/**
 * Shared harness for the single-line utility pages (ufp): build the pipeline's
 * `UmlSource` for a block, run a plugin over it with `DeterministicMeasurer`,
 * and compare against a jar oracle committed under `tests/fixtures/utility/`.
 */
import { readFileSync } from 'node:fs';
import { buildBlockUmls } from '../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../src/core/block-extractor.js';
import type { SyncPlugin } from '../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import { parseRefusalOf } from '../../src/core/parse-refusal.js';
import { defaultTheme } from '../../src/core/theme.js';

const FIXTURES = new URL('../fixtures/utility/', import.meta.url);

/** The pipeline's `UmlSource` for the first block of `text`. */
export function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

/** A committed fixture file (`<slug>.puml` / `<slug>.svg`). */
export function fixture(name: string): string {
  return readFileSync(new URL(name, FIXTURES), 'utf8');
}

/** Parse, lay out and render `text` with `plugin`; throws on a refusal. */
export function renderWith<D, G>(plugin: SyncPlugin<D, G>, text: string): string {
  const measurer = new DeterministicMeasurer();
  const parsed = plugin.parse(sourceOf(text));
  const refusal = parseRefusalOf(parsed);
  if (refusal !== undefined) throw new Error(`refused: ${refusal.message}`);
  const out = plugin.render(plugin.layoutSync(parsed as D, defaultTheme, measurer), defaultTheme);
  if (!('completeSvg' in out)) throw new Error('no completeSvg');
  return out.completeSvg;
}
