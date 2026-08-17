/**
 * `json` declaration commands for the class diagram parser — thin adapter
 * over the shared port in `core/command/CommandCreateJson.ts` (mission
 * shared-seam-extraction T9; formerly a 74%-line-identical clone of
 * `state/state-json-commands.ts`, D7).
 *
 * Upstream has no separate json-diagram engine for this form (the SEPARATE
 * `@startjson` engine — src/diagrams/json/ — is a different upstream package,
 * jsondiagram/, and is NOT touched here): `ClassDiagramFactory` registers
 * `CommandCreateJson` (118) and `CommandCreateJsonSingleLine` (119) directly
 * alongside `CommandCreateMap` (117), so a `json Name { ... }` / `json Name
 * value` line inside `@startuml` is a class-diagram leaf, exactly like `map`.
 *
 * Multiline body lines are collected via `parser.ts#pendingBodyId` (the same
 * mechanism `map`/`object` bodies use) into `state.pendingJsonLines`, then
 * parsed as ONE JSON blob when the closing `}` line is reached
 * (parser.ts#handlePendingBodyLine calls `finalizeJsonBody`) — unlike a
 * map/object body, a json body line is not independently parseable (a bare
 * `"name": "component c1",` is not valid JSON on its own), so it cannot be
 * folded in line-by-line the way `applyMapBodyLine`/`parseObjectField` are.
 *
 * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJson.java
 * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJsonSingleLine.java
 * @see ~/git/plantuml/.../cucadiagram/BodierJSon.java
 * @see ~/git/plantuml/.../objectdiagram/ClassDiagramFactory.java (registration)
 * @see ../../core/command/CommandCreateJson.ts (the shared port)
 */

import type { Classifier } from './ast.js';
import { resolveReference } from './class-namespace.js';
import { ensureClassifier, type ParseState } from './parser.js';
import type { Command } from './class-command-types.js';
import { jsonCommands, type JsonCommandHost } from '../../core/command/CommandCreateJson.js';

/**
 * Class-diagram host: resolve-or-create the leaf via the SAME
 * `resolveReference` duplicate check + `ensureClassifier` chokepoint every
 * other class declaration command uses. `resolveReference`'s OWN result is
 * used only to test for a pre-existing id (`quark.getData() != null` in
 * `CommandCreateJson#executeArg0`, `CommandCreateJson.java:199-203`); the
 * actual creation/reuse — including its own internal `resolveReference` call
 * WITH `counter` — happens inside `ensureClassifier` (parser.ts), matching
 * every other declaration command's two-call shape (not a redundancy
 * introduced here).
 */
function adapt(state: ParseState): JsonCommandHost<Classifier> {
  return {
    resolve(rawId, rawDisplay, stereotype, color, reuseExisting) {
      const { id } = resolveReference({
        namespaces: state.ast.namespaces,
        sep: state.namespaceSeparator,
        activeNamespace: state.activeNamespace,
        name: rawId,
        display: rawDisplay,
        intermediatePackages: state.intermediatePackages,
        classifiers: state.ast.classifiers,
        reuseExistingChild: reuseExisting,
      });
      if (state.classifierIndex.has(id)) return undefined; // "JSON already exists"

      const classifier = ensureClassifier(state, rawId, 'json', rawDisplay, reuseExisting);
      if (stereotype !== undefined) classifier.stereotype = stereotype;
      if (color !== undefined) classifier.color = color;
      return classifier;
    },
    beginBody(entity) {
      // A duplicate still consumes its body so its lines don't leak to
      // `dispatchCommand` as bogus top-level commands — the same `''`
      // sentinel `applyMapOpen` uses, so `parser.ts#handlePendingBodyLine`'s
      // classifier-index lookup always misses.
      state.pendingBodyId = entity !== undefined ? entity.id : '';
    },
    setJsonValue(entity, value) {
      entity.jsonValue = value;
    },
  };
}

/**
 * JSON commands, spread into `COMMANDS` (class-commands.ts) immediately after
 * `MAP_COMMANDS` — mirrors upstream `ClassDiagramFactory.initCommandsList`'s
 * registration order.
 */
export const JSON_COMMANDS: readonly Command[] = jsonCommands<ParseState, Classifier>(adapt);
