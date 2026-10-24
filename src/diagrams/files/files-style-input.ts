import type { UmlSource } from '../../core/block-extractor.js';
import type { PreprocessorResult } from '../../core/preprocessor.js';

/**
 * The jar-compatible style input of `@startfiles` (lad D9). `FilesDiagram
 * Factory.java:56` builds the json family's `StyleExtractor` and
 * `FilesDiagram.java:67` calls `applyStyles` (the `<style>` blocks and `skin`
 * are kept), but nothing reads the extractor's `handwritten` flag
 * (`FilesDiagram.java:62-80`), so no `skinparam` -- not even `handwritten`,
 * which `StyleExtractor.java:88-96` is the only reader of -- reaches the
 * diagram. The preprocessor's skinparam map is therefore emptied.
 */
export function filesStyleInput(preprocessed: PreprocessorResult, _source: UmlSource): PreprocessorResult {
  const order = preprocessed.declarationOrder;
  return {
    ...preprocessed,
    skinparam: new Map<string, string>(),
    ...(order === undefined ? {} : { declarationOrder: { ...order, skinparam: new Map<string, number>() } }),
  };
}
