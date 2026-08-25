/**
 * `plugin.parse()`'s AST arm, for tests that drive a plugin directly.
 *
 * T1/T3 widened the plugin contract to `AST | ParseRefusal` (D1,
 * `plans/dispatch-by-parse-attempt/decisions.md`): upstream's
 * `PSystemFactory#createSystem` likewise returns an `AbstractDiagram` that may
 * itself be a `PSystemError`, so the refusal arm belongs on the interface, not
 * beside it. Tests that call a concrete plugin's `parse()` and then hand the
 * result to `layoutSync` need the AST arm, and a bare cast at each site would
 * turn a real refusal into an unreadable "cannot read property of undefined"
 * three frames later.
 *
 * This throws instead, naming the engine, the line and the message — the same
 * information the error diagram would have carried. It is a TEST seam only:
 * production narrows in `src/index.ts`, where a refusal renders an error page
 * rather than throwing.
 */
import type { UmlSource } from '../../src/core/block-extractor.js';
import type { ParseRefusal } from '../../src/core/parse-refusal.js';
import { parseRefusalOf } from '../../src/core/dispatcher.js';
import type { AsyncPlugin, ParseOptions, SyncPlugin } from '../../src/core/dispatcher.js';

export function parseAst<AST>(
  plugin: SyncPlugin<AST, unknown> | AsyncPlugin<AST, unknown>,
  source: UmlSource,
  options?: ParseOptions,
): AST {
  const parsed = plugin.parse(source, options);
  const refusal = parseRefusalOf(parsed);
  if (refusal !== undefined) {
    throw new Error(
      `${plugin.type} refused this source at line ${String(refusal.line)} ` +
        `(${refusal.kind}): ${refusal.message}`,
    );
  }
  // `parsed` is `AST | ParseRefusal` and the refusal arm is excluded above;
  // TypeScript cannot carry that narrowing out of a helper over a generic.
  return parsed as AST;
}

/**
 * The same narrowing for tests that call an ENGINE'S PARSER FUNCTION directly
 * rather than through a plugin object — several of them are shared across
 * engines (`tests/unit/sprite-parsers.test.ts`,
 * `tests/unit/annotations-parsers-a.test.ts`), so they cannot use any one
 * engine's local helper.
 *
 * `engine` is only for the message: an unexpected refusal in a shared file
 * must name which engine produced it, or the failure reads as a missing
 * property on whichever AST the assertion happened to touch first.
 */
export function astOrThrow<T>(parsed: T | ParseRefusal, engine: string): T {
  const refusal = parseRefusalOf(parsed);
  if (refusal !== undefined) {
    throw new Error(
      `${engine} parser refused this source at line ${String(refusal.line)} ` +
        `(${refusal.kind}): ${refusal.message}`,
    );
  }
  return parsed as T;
}
