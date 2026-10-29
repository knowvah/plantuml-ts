/**
 * Test helpers for the json family's style slice (jse batch 2 interface): a real
 * `JsonSkinParam` built through the parse path (`createJsonSkinParam`), and the
 * `JsonStyleSet` a hand-built `JsonGeometry` carries.
 */
import { buildBlockUmls } from '../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../src/core/block-extractor.js';
import {
  createJsonSkinParam,
  type JsonFamilyType,
  type JsonSkinParam,
} from '../../src/diagrams/json/json-skin-param.js';
import { resolveJsonStyles, type JsonStyleSet } from '../../src/diagrams/json/json-style-resolve.js';

const BODY: Record<JsonFamilyType, string> = { json: '{}', yaml: 'a: 1', hcl: 'a {\n  b = 1\n}' };

/** One `@start<type>` block with `directives` (`<style>`, `skin`, `skinparam`, `!theme`) ahead of a minimal body. */
export function jsonFamilySourceOf(type: JsonFamilyType, directives = ''): UmlSource {
  const block = buildBlockUmls(`@start${type}\n${directives}\n${BODY[type]}\n@end${type}`)[0];
  if (block === undefined || !block.ok) throw new Error(`no ${type} block`);
  return {
    ...block.source,
    rawStyles: block.preprocessed.styles,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
    seedSourceLines: block.seedSource,
  };
}

/** The family's skin param as the parser builds it. */
export function jsonSkinParamOf(type: JsonFamilyType = 'json', directives = ''): JsonSkinParam {
  return createJsonSkinParam(jsonFamilySourceOf(type, directives), type);
}

/** The styles `layoutJson` would attach to a geometry for that source. */
export function jsonStylesOf(type: JsonFamilyType = 'json', directives = ''): JsonStyleSet {
  return resolveJsonStyles(jsonSkinParamOf(type, directives));
}
