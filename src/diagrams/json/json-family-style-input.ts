/**
 * The style sources a json-family diagram's theme is built from -- the
 * `SyncPlugin.styleInput` of `@startjson` / `@startyaml` / `@starthcl`.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { PreprocessorResult } from '../../core/preprocessor.js';
import { extractStyle, upstreamSourceLines } from './StyleExtractor.js';

/** The `skinparam` key upstream's `StyleExtractor` honours (`:89-90`). */
const HANDWRITTEN = 'handwritten';

/**
 * The sources whose render is jar-compatible. `SyncPlugin.styleInput` runs only then, after the parse, on the
 * very source the parse took; the mark is how the family's style slice (`json-skin-param.ts`, built lazily)
 * learns the mode. Keyed weakly: it dies with the source. Port-only, as `files-extensions.ts#JAR_COMPATIBLE`.
 */
const JAR_COMPATIBLE = new WeakSet<UmlSource>();

/** True unless a {@link jsonFamilyStyleInput} / {@link hclStyleInput} ran on `source`: the default mode honours the extensions. */
export function isExtended(source: UmlSource): boolean {
  return !JAR_COMPATIBLE.has(source);
}

/**
 * The style sources a json-family diagram's theme is built from.
 *
 * Upstream these diagrams have no command table, so no `skinparam` ever
 * reaches their `ISkinParam`: `StyleExtractor` reads a `skinparam` line for
 * `handwritten true` alone (`StyleExtractor.java:88-97`) and the `JsonDiagram`
 * constructor keeps only that flag (`JsonDiagram.java:79`). What does reach
 * styling is `applyStyles` -- the `<style>` blocks and `skin`
 * (`StyleExtractor.java:114-138`). So the preprocessor's skinparam map is
 * cut to that one key.
 *
 * `!theme` needs nothing more: upstream it is a preprocessor include
 * (`TContext.java:726-755`), so its `skinparam` lines are in that map and are
 * cut with it, while its `<style>` blocks sit in `preprocessed.styles`. The
 * named theme's base layer is KEPT because it is only the residue of
 * `<style>`-derived fields the executed theme does not yet reach
 * (`scripts/compile-themes.py`) -- e.g. amiga's json node colours. Jar:
 * `tests/fixtures/unwind-U1/json-theme-awsorange` (skinparam font and
 * background gone) and `json-theme-amiga` (`<style>` colours and font kept).
 *
 * Runs only for a jar-compatible render, after the parse: it also marks `source` so the family's style slice
 * leaves the extensions of `json-skin-param.ts` out ({@link isExtended}).
 */
export function jsonFamilyStyleInput(preprocessed: PreprocessorResult, source: UmlSource): PreprocessorResult {
  JAR_COMPATIBLE.add(source);
  const { handwritten } = extractStyle(upstreamSourceLines(source, source.type));
  const skinparam = new Map<string, string>(handwritten ? [[HANDWRITTEN, 'true']] : []);
  const order = preprocessed.declarationOrder;
  const declarationOrder =
    order === undefined
      ? undefined
      : { ...order, skinparam: new Map([...order.skinparam].filter(([key]) => skinparam.has(key))) };
  return { ...preprocessed, skinparam, ...(declarationOrder === undefined ? {} : { declarationOrder }) };
}

/**
 * {@link jsonFamilyStyleInput} for `@starthcl`, which also drops every input
 * of `StyleExtractor#applyStyles` (`StyleExtractor.java:114-138`): the
 * `<style>` blocks, `skin`, and a `!theme`'s base layer (its `<style>`
 * residue). `JsonDiagramFactory.java:99-101` and `YamlDiagramFactory.java:
 * 96-98` call `applyStyles`; `HclDiagramFactory.java:86-92` has the call
 * commented out, so an HCL diagram always renders the default style. Jar:
 * `tests/fixtures/unwind2-S2/hcl-style-*`, `hcl-theme-amiga`.
 */
export function hclStyleInput(preprocessed: PreprocessorResult, source: UmlSource): PreprocessorResult {
  const familyInput = jsonFamilyStyleInput(preprocessed, source);
  const order = familyInput.declarationOrder;
  return {
    ...familyInput,
    theme: null,
    skin: undefined,
    styles: [],
    stylePositions: [],
    ...(order === undefined ? {} : { declarationOrder: { ...order, styles: [] } }),
  };
}
